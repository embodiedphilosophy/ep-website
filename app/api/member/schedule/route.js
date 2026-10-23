import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { getEvents, todayET } from '@/lib/events';
import { feedToken } from '@/lib/member/schedule';
import { fullSchedule } from '@/lib/member/programmes';

// The Schedule for the Circle page /c/schedule: every programme's events with real start times (locked when the
// membership doesn't open them),
// (mentees) the monthly one-to-one window, and their private calendar-feed link. GET ?today=YYYY-MM-DD
export async function GET(req) {
  const h = cors(req, 'GET, OPTIONS');
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  try {
    const q = new URL(req.url).searchParams.get('today');
    const today = /^\d{4}-\d{2}-\d{2}$/.test(q || '') ? q : todayET();
    const items = fullSchedule(await getEvents(), s.tier, today);
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
