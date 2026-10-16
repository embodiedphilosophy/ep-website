import { NextResponse } from 'next/server';
import { menteeFromCookie, loadWeek } from '@/lib/mentee/load';

export const dynamic = 'force-dynamic';

// Everything the "This week" page shows, in one response. GET ?today=YYYY-MM-DD&tz=Europe/London
export async function GET(req) {
  const { me, error } = await menteeFromCookie();
  if (!me) return NextResponse.json({ error: error === 'tier' ? 'This page is for Sahṛdaya Upāya mentees.' : 'Please sign in again from Circle.', code: error }, { status: error === 'tier' ? 403 : 401, headers: { 'Cache-Control': 'no-store' } });
  const q = new URL(req.url).searchParams;
  const w = await loadWeek(me, { today: q.get('today'), tz: q.get('tz') });
  return NextResponse.json(w, { status: w.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
