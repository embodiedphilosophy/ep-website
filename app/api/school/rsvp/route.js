import { NextResponse } from 'next/server';
import { currentMember, sameOrigin } from '@/lib/school/session';
import { rsvp } from '@/lib/school/circle';

export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'Please sign in again from Circle.' }, { status: 401 });
  const { eventId } = await req.json().catch(() => ({}));
  if (!/^\d+$/.test(String(eventId || ''))) return NextResponse.json({ error: 'Unknown session' }, { status: 400 });
  try { await rsvp(me.email, eventId); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ error: e.status === 429 ? 'Circle is busy. Try again in a minute.' : 'We could not save your RSVP. Please try again.' }, { status: 502 }); }
}
