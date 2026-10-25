import { NextResponse } from 'next/server';
// No public aggregate/feed contract exists yet. Never synthesize live locations,
// order timestamps or counters, or read a separately configured database.
export async function GET() {
  return NextResponse.json({ success: true, data: { activities: [], metrics: null } }, { headers: { 'Cache-Control': 'no-store' } });
}
