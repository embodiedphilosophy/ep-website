import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { practiceAvailable, practiceSummary, practiceEntry, logPractice, cleanToday, cleanDay, BACKFILL_DAYS, QUALITIES, EXTRAS } from '@/lib/member/practice';

// The member's practice log. GET ?today=YYYY-MM-DD → summary (&day=YYYY-MM-DD adds `entry`, what is logged that day).
// POST { today, day?, minutes, quality, extras } → logs `day` (today, or up to BACKFILL_DAYS earlier; default today)
// and returns the new summary. Needs the session from /api/member/session.
export async function GET(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  if (!practiceAvailable()) return NextResponse.json({ error: 'The practice log isn’t connected yet' }, { status: 503, headers: h });
  const q = new URL(req.url).searchParams;
  const today = cleanToday(q.get('today'));
  const summary = await practiceSummary(s.uid, today);
  const extra = q.get('day') ? { day: cleanDay(q.get('day'), today), entry: await practiceEntry(s.uid, cleanDay(q.get('day'), today)) } : {};
  return NextResponse.json({ ...summary, ...extra, backfillDays: BACKFILL_DAYS, qualities: QUALITIES, extras: EXTRAS }, { headers: h });
}

export async function POST(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  if (!practiceAvailable()) return NextResponse.json({ error: 'The practice log isn’t connected yet' }, { status: 503, headers: h });
  const body = await req.json().catch(() => ({}));
  const today = cleanToday(body.today);
  const day = cleanDay(body.day, today);
  await logPractice({ uid: s.uid, email: s.email, day, minutes: body.minutes, quality: body.quality, extras: body.extras, add: body.add === true });
  const summary = await practiceSummary(s.uid, today);
  return NextResponse.json({ ...summary, day, backfillDays: BACKFILL_DAYS, qualities: QUALITIES, extras: EXTRAS }, { headers: h });
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
