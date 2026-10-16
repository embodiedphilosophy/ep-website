import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { rsvp } from '@/lib/school/circle';

export const dynamic = 'force-dynamic';

// "Remind me": RSVP to a Circle event for the signed-in mentee: { eventId }
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const { eventId } = await req.json().catch(() => ({}));
  if (!/^\d+$/.test(String(eventId || ''))) return reply(req, { error: 'Unknown session' }, 400);
  try { await rsvp(me.email, eventId); return reply(req, { ok: true }); }
  catch (e) { return reply(req, { error: e.status === 429 ? 'Circle is busy. Try again in a minute.' : 'We could not save your RSVP. Please try again.' }, 502); }
}
export const OPTIONS = preflight;
