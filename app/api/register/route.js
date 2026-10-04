import { NextResponse } from 'next/server';
import { eventRows, recurringRules } from '@/lib/events';
import { findTagged, getMeeting, addRegistrant } from '@/lib/zoom';

// Free sign-up for an event (e.g. a Living Room Lecture): registers the person in that event's
// Zoom meeting, and Zoom emails their personal link. Only works for free events with zoom = TRUE.
export const dynamic = 'force-dynamic';
const yes = v => String(v || '').trim().toUpperCase() === 'TRUE';

export async function POST(req) {
  const { event_id, email, first_name = '' } = await req.json().catch(() => ({}));
  if (!event_id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) {
    return NextResponse.json({ error: 'event_id and a valid email are required' }, { status: 400 });
  }
  const event = (await eventRows()).find(e => e.id === event_id)
    || (await recurringRules()).find(r => (r.series || r.title) === event_id);
  if (!event || !yes(event.zoom) || String(event.price).toLowerCase() !== 'free') {
    return NextResponse.json({ error: 'This event does not take free Zoom sign-ups' }, { status: 400 });
  }
  try {
    const found = await findTagged(event_id);
    if (!found) throw new Error('The Zoom meeting for this event has not been created yet');
    const m = await getMeeting(found.id);
    // For a recurring series, register for the next session only
    const occ = (m.occurrences || []).find(o => new Date(o.start_time).getTime() + (o.duration || 60) * 60000 > Date.now());
    await addRegistrant(found.id, { email, first_name }, m.type === 8 && occ ? occ.occurrence_id : undefined);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Register failed', event_id, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
