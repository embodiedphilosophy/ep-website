import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { menteeAvailable, saveBookingNote } from '@/lib/mentee/store';
import { bookedFor } from '@/lib/mentee/calendly';
import { loadWeek } from '@/lib/mentee/load';
import config from '@/data/mentee.json';

export const dynamic = 'force-dynamic';

// A mentee adds the summary of what they want to work on to the one-to-one they have booked, when the booking has none (Calendly's question left empty
// or not yet set up): { note, today, tz }. Saved against the booking and shown to Jacob on the Ops dashboard like the Calendly answer.
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!menteeAvailable()) return reply(req, { error: 'This isn’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  try {
    const booked = await bookedFor(config.calendly_event_type, me.email);
    if (!booked?.uuid) return reply(req, { error: 'Book your one-to-one first, then add your summary.' }, 400);
    await saveBookingNote(me.email, booked.uuid, b.note);
    return reply(req, await loadWeek(me, { today: b.today, tz: b.tz }));
  } catch (e) {
    const known = /^(Write|Keep|Couldn)/.test(e.message);
    if (!known) console.error('booking note', e.message);
    return reply(req, { error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, known ? 400 : 502);
  }
}
export const OPTIONS = preflight;
