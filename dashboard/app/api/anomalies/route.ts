import { NextResponse } from 'next/server';

// This tells Next.js to always run this dynamically
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // This API route runs on the server and can talk to our Python API
    const res = await fetch('http://analyzer:8000/anomalies');
    if (!res.ok) {
      throw new Error(`Failed to fetch from analyzer: ${res.statusText}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy Error fetching anomalies:", error);
    return NextResponse.json({ error: "Failed to fetch anomalies" }, { status: 500 });
  }
}
