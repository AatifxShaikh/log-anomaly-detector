
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://mongo:27017/';
const DB_NAME = 'log_db';

// Define the Log type here so we can reuse it
export interface Log {
  _id: string;
  timestamp: string;
  hostname: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
}
export interface Anomaly {
  _id: string;
  timestamp: string;
  type: string;
  details: string;
}
export async function getAnomalies(): Promise<Anomaly[]> {
  const res = await fetch('http://analyzer:8000/anomalies', {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch anomalies');
  }
  return res.json();
}
export async function getLogs(): Promise<Log[]> {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection('logs');

    // Fetch the last 50 logs, sorted by timestamp descending
    const logs = await collection.find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    // We need to explicitly cast the result to our Log type
    return logs as unknown as Log[];

  } catch (error) {
    console.error('Database Error: Failed to fetch logs.', error);
    // In case of error, return an empty array or throw the error
    return [];
  } finally {
    await client.close();
  }
}
export async function getLogStats(){
  const res=await fetch("http://analyzer:8000/logs/stats",{
    cache:'no-store',
  });
  if(!res.ok){
    throw new Error("Failed to fetch log stats")
  }
  const stats=await res.json();
  return stats.map((stat:any)=>({name:stat._id,count:stat.count}))
}
