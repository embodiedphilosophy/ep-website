import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { formationAvailable, addPending } from '@/lib/member/formation';
import { loadWeek } from '@/lib/mentee/load';

export const dynamic = 'force-dynamic';

// A mentee logs hours for themselves: { component, hours, day, detail, note, today, tz }. It waits as "pending" until Jacob confirms it.
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!formationAvailable()) return reply(req, { error: 'The hours record isn’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  try {
    await addPending(me.email, b);
    return reply(req, await loadWeek(me, { today: b.today, tz: b.tz }));
  } catch (e) {
    const known = /^(Choose|Hours should)/.test(e.message);
    if (!known) console.error('this-week hours', e.message);
    return reply(req, { error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, known ? 400 : 502);
  }
}
export const OPTIONS = preflight;
