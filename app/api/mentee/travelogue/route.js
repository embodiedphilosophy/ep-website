import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/school/session';
import { menteeFromCookie } from '@/lib/mentee/load';
import { cleanToday } from '@/lib/member/practice';
import { addLine, recentLines, menteeAvailable } from '@/lib/mentee/store';

export const dynamic = 'force-dynamic';

// Add one private Travelogue line: { text, today }. Returns the member's own latest lines, no one else's.
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const { me, error } = await menteeFromCookie();
  if (!me) return NextResponse.json({ error: 'Please sign in again from Circle.', code: error }, { status: error === 'tier' ? 403 : 401 });
  if (!menteeAvailable()) return NextResponse.json({ error: 'The Travelogue isn’t connected yet.' }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  try {
    await addLine(me.uid, cleanToday(b.today), b.text);
    return NextResponse.json({ travelogue: await recentLines(me.uid) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const known = /^(Write a line|Keep it|Unknown date)/.test(e.message);
    if (!known) console.error('mentee travelogue', e.message);
    return NextResponse.json({ error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, { status: known ? 400 : 502 });
  }
}
