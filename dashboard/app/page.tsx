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
import { getLogs } from "@/lib/data"
export const dynamic='force-dynamic';

export default async function HomePage() {
  // Call the function directly! No more fetch.
  const logs = await getLogs();

  return (
    <main className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">Log Analysis Dashboard</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Live Log Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
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
