import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // This runs on the server and can talk to the analyzer service
    const res = await fetch('http://analyzer:8000/logs/stats');
    if (!res.ok) {
      throw new Error(`Failed to fetch from analyzer: ${res.statusText}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
