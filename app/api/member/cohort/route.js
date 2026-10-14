import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { practiceAvailable, practiceByEmail, cohortSummary, cleanToday } from '@/lib/member/practice';
import { mentees } from '@/lib/member/cohort';

// Mentor view for the Circle Today page: each Sahṛdaya Upāya mentee's practice signals (streak, this week,
// last practice, eight-week grid). Circle admins only. GET ?today=YYYY-MM-DD
export async function GET(req) {
  const h = cors(req, 'GET, OPTIONS');
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  if (!s.admin) return NextResponse.json({ error: 'Only mentors can see the cohort' }, { status: 403, headers: h });
  if (!practiceAvailable()) return NextResponse.json({ error: 'The practice log isn’t connected yet' }, { status: 503, headers: h });
  try {
    const today = cleanToday(new URL(req.url).searchParams.get('today'));
    const list = await mentees();
    const logs = await practiceByEmail(list.map(m => m.email), today);
    return NextResponse.json(cohortSummary(list, logs, today), { headers: h });
  } catch (e) {
    return NextResponse.json({ error: 'Couldn’t load the cohort just now' }, { status: 502, headers: h });
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req, 'GET, OPTIONS') });
}
