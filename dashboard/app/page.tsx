"use client";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// Import our new data fetching function and the Log type
import {LogLevelChart} from "@/components/LogLevelChart"

interface Log{
  _id:string;
  timestamp:string;
  level:'INFO'|'WARNING'|'ERROR';
  message:string;
}
interface LogStat{
  name:string;
  count:number;
}

export default function HomePage() {
  // Call the function directly! No more fetch.
  const [logs,setLogs]=useState<Log[]>([]);
  const [logStats,setLogStats]=useState<LogStat[]>([]);
  const fetchData=async()=>{
    const logsRes=await fetch('/api/logs');
    const logsData=await logsRes.json();
    setLogs(logsData);

    const statsRes=await fetch('/api/log-stats-proxy');
    const statsData=await statsRes.json();
    setLogStats(statsData.map((stat:any)=>({name:stat._id,count:stat.count})))
  }
  useEffect(()=>{
    fetchData();
    const interval=setInterval(fetchData,5000);

    return ()=>clearInterval(interval)
  },[])
 
  return (
    <main className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">Log Analysis Dashboard</h1>
        {/* --- NEW CHART CARD --- */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Log Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <LogLevelChart data={logStats} />
          </CardContent>
        </Card>

        {/* --- EXISTING LOGS TABLE CARD --- */}
        <Card>
          <CardHeader>
            <CardTitle>Live Log Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              {/* Table content remains the same... */}
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Level</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        log.level === 'ERROR' ? 'destructive' :
                        log.level === 'WARNING' ? 'secondary' :
                        'default'
                      }>
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{log.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
            </div>
    </main>
  );
}
