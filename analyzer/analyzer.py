import os
from sys import version
import requests
import threading
import redis
import time
from fastapi import FastAPI
import pandas as pd
from datetime import datetime,timedelta,timezone
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
DISCORD_WEBHOOK_URL=os.getenv("DISCORD_WEBHOOK_URL")

Alert_COOLDOWN_MINUTES=5
last_alert_time=None

def send_discord_alert(anomaly_type:str,details:str):
    global last_alert_time
    now=datetime.now(timezone.utc)

    if not DISCORD_WEBHOOK_URL:
        print("WARN: DISCORD_WEBHOOK_URL not set.Skipping alert.")
        return
    if last_alert_time and (now-last_alert_time)<timedelta(minutes=Alert_COOLDOWN_MINUTES):
        print("INFO: Alert cooldown active. Skipping notification.")
        return
    embed={
        "title":f"Anomaly Detected:{anomaly_type}",
        "description":details,
        "color":15158332,
        "timestamp":datetime.now().isoformat()
    }
    data={"embeds":[embed]}

    try:
        response=requests.post(DISCORD_WEBHOOK_URL,json=data)
        response.raise_for_status()
        print("SUCCESS: Discord alert send.")
        last_alert_time=now
    except requests.exceptions.RequestException as e:
        print(f"Error sending discord alert:{e}")

MONGO_URI="mongodb://mongo:27017/"
REDIS_HOST="redis"
ERROR_THRESHOLD=3
TIME_WINDOW_SECONDS=10
error_timestamps=[]
#we will try to keep track of the log counts


client=MongoClient(MONGO_URI)
db=client.log_db
logs_collection=db.logs
anomalies_collection=db.anomalies

app=FastAPI(
    title="Log Anomaly Detection API",
    description="API for processing and retrieving log data and anomalies.",
    version="1.0.0")

def statistical_anomaly_detector():
    """Runs every 60 seconds to check for statistical anomalies in error rates."""
    while True:
        try:
            end_time = datetime.now()
            start_time = end_time - timedelta(minutes=60)
            query = {"level": "ERROR", "timestamp": {"$gte": start_time, "$lt": end_time}}
            error_logs = list(logs_collection.find(query))

            if len(error_logs) < 10:
                time.sleep(60)
                continue

            df = pd.DataFrame(error_logs)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            errors_per_minute = df.set_index('timestamp').resample('min').size()

            mean_errors = errors_per_minute.mean()
            std_errors = errors_per_minute.std()
            current_minute_errors = errors_per_minute.iloc[-1] if not errors_per_minute.empty else 0
            threshold = mean_errors + (2 * std_errors)

            if current_minute_errors > threshold and current_minute_errors > 5:
                anomaly_msg = f"Statistical Anomaly: {current_minute_errors} errors in the last minute exceeds threshold of {threshold:.2f}."
                print(f"ANOMALY DETECTED: {anomaly_msg}")
                anomalies_collection.insert_one({
                    "timestamp": datetime.now(),
                    "type": "Statistical Anomaly",
                    "details": anomaly_msg
                })
                send_discord_alert("Statistical Anomaly",anomaly_msg)
        except Exception as e:
            print(f"Error in statistical detector: {e}")
        
        time.sleep(60)


def redis_log_listener():
     r = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)
     pubsub = r.pubsub()
     pubsub.subscribe("logs")
     print("Background worker subscribed to 'logs' channel.")

     for message in pubsub.listen():
         if message['type'] == 'message':
            # This is the same logic as before
            parse_log_messages(message['data'])

def parse_log_messages(raw_log:str):
    try:
        parts=raw_log.split(" ",3)
        timestamp=parts[0]
        timestamp_obj=datetime.fromisoformat(timestamp)
        hostname=parts[1]
        message=parts[3]
        level_and_colon=parts[2]
        
        level=level_and_colon.replace(":","") 
        parsed_log={
                "timestamp":timestamp_obj,
                "hostname":hostname,
                "level":level,
                "message":message.strip()
            }
        logs_collection.insert_one(parsed_log)

        if level=="ERROR":
            now=datetime.now()
            error_timestamps.append(now)
            time_window_start = now - timedelta(seconds=TIME_WINDOW_SECONDS)
            recent_errors = [ts for ts in error_timestamps if ts > time_window_start]
            error_timestamps[:] = recent_errors

            if len(error_timestamps) >= ERROR_THRESHOLD:
                anomaly_msg = f"{len(error_timestamps)} errors in the last {TIME_WINDOW_SECONDS} seconds."
                anomalies_collection.insert_one({
                    "timestamp": now,
                    "type": "Error Burst",
                    "details": anomaly_msg
                })
                send_discord_alert("Error burst",anomaly_msg)

    except Exception as e:
        print(f"Error processing log: {raw_log}. Reason: {e}")

@app.get("/")
def read_root():
    return {"message":"Log Anomaly Detection API is running."}

@app.get("/anomalies")
def get_anomalies():
    """Retrieve the 20 most recent anomalies."""
    recent_anomalies = anomalies_collection.find({}).sort("timestamp", -1).limit(20)
    
    results = []
    for doc in recent_anomalies:
        # Manually convert ObjectId and datetime to JSON-friendly strings
        doc["_id"] = str(doc["_id"])
        doc["timestamp"] = doc["timestamp"].isoformat()
        results.append(doc)
    
    return results
@app.get("/logs/stats")
def get_log_stats():
    pipeline=[{"$group":{"_id":"$level","count":{"$sum":1}}}]
    stats=list(logs_collection.aggregate(pipeline))
    return stats
@app.on_event("startup")
def startup_event():
    print("API starting up...")
    redis_thread=threading.Thread(target=redis_log_listener,daemon=True)
    redis_thread.start()
    print("Redis listener thread started.")

    # Start Statistical Anomaly Detector
    stats_thread = threading.Thread(target=statistical_anomaly_detector, daemon=True)
    stats_thread.start()
    print("Statistical anomaly detector thread started.")
