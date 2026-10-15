import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { getEvents, todayET } from '@/lib/events';
import { buildSchedule, feedToken } from '@/lib/member/schedule';

// The member's schedule for the Circle page /c/schedule: their membership's events with real start times,
// (mentees) the monthly one-to-one window, and their private calendar-feed link. GET ?today=YYYY-MM-DD
export async function GET(req) {
  const h = cors(req, 'GET, OPTIONS');
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  try {
    const q = new URL(req.url).searchParams.get('today');
    const today = /^\d{4}-\d{2}-\d{2}$/.test(q || '') ? q : todayET();
    const items = buildSchedule(await getEvents(), s.tier, today);
    const feed = `https://www.embodiedphilosophy.com/api/member/schedule/ics?t=${feedToken(s)}`;
    return NextResponse.json({ today, tier: s.tier, items, feed }, { headers: h });
  } catch (e) {
    console.error('schedule', e.message);
    return NextResponse.json({ error: 'Couldn’t load the schedule just now' }, { status: 502, headers: h });
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req, 'GET, OPTIONS') });
}
