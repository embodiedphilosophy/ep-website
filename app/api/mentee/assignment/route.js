import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/school/session';
import { menteeFromCookie, loadWeek } from '@/lib/mentee/load';
import { setDone, menteeAvailable } from '@/lib/mentee/store';

export const dynamic = 'force-dynamic';

// Tick or untick an assignment: { id, done, today, tz }. Only this week's assignments can be ticked.
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const { me, error } = await menteeFromCookie();
  if (!me) return NextResponse.json({ error: 'Please sign in again from Circle.', code: error }, { status: error === 'tier' ? 403 : 401 });
  if (!menteeAvailable()) return NextResponse.json({ error: 'Ticking isn’t connected yet.' }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  try {
    const current = await loadWeek(me, { today: b.today, tz: b.tz });
    if (!current.due.items.some(a => a.id === b.id)) return NextResponse.json({ error: 'That assignment isn’t on this week’s list.' }, { status: 400 });
    await setDone(me.uid, b.id, !!b.done);
    return NextResponse.json(await loadWeek(me, { today: b.today, tz: b.tz }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { console.error('mentee assignment', e.message); return NextResponse.json({ error: 'We couldn’t save that just now. Please try again.' }, { status: 502 }); }
}
