import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { loadWeek } from '@/lib/mentee/load';
import { setDone, menteeAvailable } from '@/lib/mentee/store';

export const dynamic = 'force-dynamic';

// Tick or untick one of this week's assignments: { id, done, today, tz }. Returns the refreshed page.
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!menteeAvailable()) return reply(req, { error: 'Ticking isn’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  try {
    const current = await loadWeek(me, { today: b.today, tz: b.tz });
    if (!current.due?.items.some(a => a.id === b.id)) return reply(req, { error: 'That assignment isn’t on this week’s list.' }, 400);
    await setDone(me.uid, b.id, !!b.done);
    return reply(req, await loadWeek(me, { today: b.today, tz: b.tz }));
  } catch (e) { console.error('this-week assignment', e.message); return reply(req, { error: 'We couldn’t save that just now. Please try again.' }, 502); }
}
export const OPTIONS = preflight;
