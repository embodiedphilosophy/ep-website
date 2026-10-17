import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { practiceAvailable, practiceSummary, logPractice, cleanToday, QUALITIES, EXTRAS } from '@/lib/member/practice';

// The member's practice log. GET ?today=YYYY-MM-DD → summary. POST { today, minutes, quality, extras } → logs
// today and returns the new summary. Needs the session from /api/member/session.
export async function GET(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  if (!practiceAvailable()) return NextResponse.json({ error: 'The practice log isn’t connected yet' }, { status: 503, headers: h });
  const today = cleanToday(new URL(req.url).searchParams.get('today'));
  const summary = await practiceSummary(s.uid, today);
  return NextResponse.json({ ...summary, qualities: QUALITIES, extras: EXTRAS }, { headers: h });
}

export async function POST(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  if (!practiceAvailable()) return NextResponse.json({ error: 'The practice log isn’t connected yet' }, { status: 503, headers: h });
  const body = await req.json().catch(() => ({}));
  const today = cleanToday(body.today);
  await logPractice({ uid: s.uid, email: s.email, day: today, minutes: body.minutes, quality: body.quality, extras: body.extras, add: body.add === true });
  const summary = await practiceSummary(s.uid, today);
  return NextResponse.json({ ...summary, qualities: QUALITIES, extras: EXTRAS }, { headers: h });
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
