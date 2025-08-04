import os
import redis
import time
import json
from pprint import pprint
from datetime import datetime,timedelta
from pymongo import MongoClient

ERROR_THRESHOLD=3
TIME_WINDOW_SECONDS=10

error_timestamps=[]
#we will try to keep track of the log counts

try:
    client=MongoClient('mongodb://mongo:27017/')
    db=client.log_db
    logs_collection=db.logs
    anomalies_collection=db.anomalies
    print("Python Analyzer connected to MongoDb.")
except Exception as e:
    print(f"Could not connect to MongoDb:{e}")
    exit(1)

log_counts={"INFO":0,"WARNING":0,"ERROR":0}

def parse_log_messages(log_data:str)-> dict|None:
    try:
        parts=log_data.split(" ",3)
        timestamp=parts[0]
        timestamp_obj=datetime.fromisoformat(timestamp)
        hostname=parts[1]
        message=parts[3]
        level_and_colon=parts[2]
        
        level=level_and_colon.replace(":","") 
        return{
                "timestamp":timestamp_obj,
                "hostname":hostname,
                "level":level,
                "message":message.strip()
            }
    except(IndexError,ValueError) as e:
        print(f"Could not parse log message: '{log_data}'. Error: {e}")
        return None
def main():
    # Use the service name "redis" from docker-compose
    redis_host = "redis"
    redis_port = 6379

    print("Python Analyzer waiting for Redis...")
    # Add a simple retry loop to wait for Redis to be available
    while True:
        try:
            r = redis.Redis(host=redis_host, port=redis_port, db=0, decode_responses=True)
            r.ping()
            print("Python Analyzer connected to Redis.")
            break
        except redis.exceptions.ConnectionError:
            time.sleep(2)


    # Subscribe to the "logs" channel
    pubsub = r.pubsub()
    pubsub.subscribe("logs")

    print("Subscribed to 'logs' channel. Waiting for messages...")

    for message in pubsub.listen():
        # The first message is a confirmation, so we skip it
        if message['type'] == 'message':
            parsed_log=parse_log_messages(message['data'])



            if parsed_log:
                print(f"Received: [{parsed_log['level']}] {parsed_log['message']}")

                log_to_save=parsed_log.copy()
                log_to_save['timestamp']=log_to_save['timestamp'].isoformat()
                logs_collection.insert_one(log_to_save)

                if parsed_log['level']=="ERROR":
                    now=datetime.now()
                    error_timestamps.append(now)
                    time_window_start=now-timedelta(seconds=TIME_WINDOW_SECONDS)
                    recent_errors=[ts for ts in error_timestamps if ts>time_window_start]
                    error_timestamps[:]=recent_errors

                    if len(error_timestamps)>=ERROR_THRESHOLD:
                        anomaly_msg=f"{len(error_timestamps)} in the last {TIME_WINDOW_SECONDS} seconds"
                        print(f"\n Anomaly Detected! {anomaly_msg }\n")

                        anomalies_collection.insert_one({
                            "timestamp":now.isoformat(),
                            "type":"Error Burst",
                            "details":anomaly_msg
                        })

                


if __name__ == "__main__":
    main()
