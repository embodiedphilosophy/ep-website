import { NextResponse } from 'next/server';
import { eventRows, recurringRules } from '@/lib/events';
import { findTagged, getMeeting, addRegistrant } from '@/lib/zoom';
import { zoomMode, meetingKey } from '@/lib/zoomplan';

// Free sign-up for an event (e.g. a Living Room Lecture): registers the person in that event's
// Zoom meeting, and Zoom emails their personal link. Only works for free events with zoom = TRUE.
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { event_id, email, first_name = '' } = await req.json().catch(() => ({}));
  if (!event_id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) {
    return NextResponse.json({ error: 'event_id and a valid email are required' }, { status: 400 });
  }
  const event = (await eventRows()).find(e => e.id === event_id)
    || (await recurringRules()).find(r => (r.series || r.title) === event_id);
  if (!event || !zoomMode(event.zoom) || String(event.price).toLowerCase() !== 'free') {
    return NextResponse.json({ error: 'This event does not take free Zoom sign-ups' }, { status: 400 });
  }
  try {
    const found = await findTagged(event.weekday ? (event.series || event_id) : (meetingKey(event) || event_id));
    if (!found) throw new Error('The Zoom meeting for this event has not been created yet');
    const m = await getMeeting(found.id);
    if (m.settings?.approval_type === 2) throw new Error('This meeting does not use registration');
    // Meetings set to register per session: sign up for the next session only. Otherwise: every session.
    const occ = (m.occurrences || []).find(o => o.status !== 'deleted' && new Date(o.start_time).getTime() + (o.duration || 60) * 60000 > Date.now());
    await addRegistrant(found.id, { email, first_name }, m.type === 8 && m.settings?.registration_type === 2 && occ ? occ.occurrence_id : undefined);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Register failed', event_id, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
