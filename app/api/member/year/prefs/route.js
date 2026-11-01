import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { setStatus } from '@/lib/mentee/yearstore';
import { PREFS_ID } from '@/lib/mentee/year';

export const dynamic = 'force-dynamic';

// The mentee's reminders switch: { reminders: true | false }. A `prefs:reminders` row on Mentee Step Status.
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const b = await req.json().catch(() => ({}));
  try { await setStatus({ email: me.email, stepId: PREFS_ID, status: b.reminders ? 'on' : 'off', by: 'mentee' }); return reply(req, { ok: true, reminders: !!b.reminders }); }
  catch (e) { console.error('year prefs', e.message); return reply(req, { error: 'That didn’t save. Please try again.' }, 502); }
}
export const OPTIONS = preflight;
