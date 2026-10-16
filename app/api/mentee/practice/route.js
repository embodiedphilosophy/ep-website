import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/school/session';
import { menteeFromCookie, loadWeek } from '@/lib/mentee/load';
import { practiceAvailable, logPractice, cleanToday } from '@/lib/member/practice';

export const dynamic = 'force-dynamic';

// Log today's practice from the "This week" page: { today, minutes, tz }. Uses the same practice log as the Today
// strip, so the streak is one streak. Returns the refreshed page.
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const { me, error } = await menteeFromCookie();
  if (!me) return NextResponse.json({ error: 'Please sign in again from Circle.', code: error }, { status: error === 'tier' ? 403 : 401 });
  if (!practiceAvailable()) return NextResponse.json({ error: 'The practice log isn’t connected yet.' }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  try {
    const day = cleanToday(b.today);
    await logPractice({ uid: me.uid, email: me.email, day, minutes: Math.max(1, parseInt(b.minutes, 10) || 1), quality: '', extras: [] });
    return NextResponse.json(await loadWeek(me, { today: day, tz: b.tz }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { console.error('mentee practice', e.message); return NextResponse.json({ error: 'We couldn’t save that just now. Please try again.' }, { status: 502 }); }
}
