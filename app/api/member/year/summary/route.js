import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { bookedFor } from '@/lib/mentee/calendly';
import { canEdit, oneToOneId } from '@/lib/mentee/year';
import { setStatus } from '@/lib/mentee/yearstore';
import config from '@/data/mentee.json';

export const dynamic = 'force-dynamic';

// A mentee writes (or edits) the summary for the one-to-one they have booked: { text }. Allowed while they have a booking, until two days before it.
// Saved as a `1to1-YYYY-MM` row on the Mentee Step Status tab; no email goes to Jacob (he sees it in Ops and in his Monday digest).
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const b = await req.json().catch(() => ({}));
  const text = String(b.text ?? '').replace(/\r/g, '').trim();
  if (!text) return reply(req, { error: 'Write a few lines first.' }, 400);
  if (text.length > 2000) return reply(req, { error: 'Keep it under 2,000 characters.' }, 400);
  try {
    const booked = await bookedFor(config.calendly_event_type, me.email);
    if (!booked?.start) return reply(req, { error: 'Book your one-to-one first, then add your summary.' }, 400);
    if (!canEdit(booked.start)) return reply(req, { error: 'It’s too close to your session to change this. Please message Jacob.' }, 400);
    await setStatus({ email: me.email, stepId: oneToOneId(new Date(booked.start).toISOString().slice(0, 7)), status: 'summary', note: text, by: 'mentee' });
    return reply(req, { ok: true, summary: { text, source: 'page' } });
  } catch (e) { console.error('year summary', e.message); return reply(req, { error: 'We couldn’t save that just now. Please try again.' }, 502); }
}
export const OPTIONS = preflight;
