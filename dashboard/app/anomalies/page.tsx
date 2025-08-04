"use client"
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


interface Anomaly{
  _id:string;
  timestamp:string;
  type:string;
  details:string;
}
export default function AnomaliesPage() {
const [anomalies,setAnomalies]=useState<Anomaly[]>([])
  useEffect(()=>{
    const fetchAnomalies=async()=>{
      const res=await fetch('/api/anomalies');
      const data=await res.json();
      setAnomalies(data);
    }

    fetchAnomalies();
    const interval=setInterval(fetchAnomalies,5000);
    return ()=>clearInterval(interval);
  },[])
  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">Detected Anomalies</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Anomaly History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Timestamp</TableHead>
                <TableHead className="w-[200px]">Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalies.map((anomaly) => (
                <TableRow key={anomaly._id}>
                  <TableCell>{new Date(anomaly.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={anomaly.type === 'Error Burst' ? 'destructive' : 'secondary'}>
                      {anomaly.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{anomaly.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
