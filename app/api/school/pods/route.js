import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/school/session';
import { podMember } from '@/lib/pods/auth';
import { podsFor, cleanPod, cleanNote, MIN, MAX, LIVE_ROOMS_URL } from '@/lib/pods/logic';
import { podsAvailable, leaderOf, listPods, apply, createPod, join, leave, cancelPod } from '@/lib/pods/store';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

async function payload(me, extra = {}) {
  const { pods, membersBy } = await listPods();
  const l = await leaderOf(me.uid);
  return { pods: podsFor(pods, membersBy, me), leader: { status: l?.status || '' }, min: MIN, max: MAX, liveRoomsUrl: LIVE_ROOMS_URL, ...extra };
}
const gate = async () => {
  const { me, error } = await podMember();
  if (me) return { me };
  return { res: NextResponse.json({ error: error === 'tier' ? 'Study pods are for Sādhana School students.' : 'Please sign in again from Circle.', code: error }, { status: error === 'tier' ? 403 : 401, headers: NO_STORE }) };
};

// Study pods for the signed-in student: every open or running pod, their own pods (with chat link) and their standing as a leader.
export async function GET() {
  const { me, res } = await gate();
  if (!me) return res;
  if (!podsAvailable()) return NextResponse.json({ error: 'Study pods aren’t connected yet.' }, { status: 503, headers: NO_STORE });
  try { return NextResponse.json(await payload(me), { headers: NO_STORE }); }
  catch (e) { console.error('pods GET', e.message); return NextResponse.json({ error: 'We couldn’t load the pods just now. Please try again.' }, { status: 502, headers: NO_STORE }); }
}

// POST { action: 'apply', note } | { action: 'create', topic, description, schedule } | { action: 'join' | 'leave' | 'cancel', id }
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const { me, res } = await gate();
  if (!me) return res;
  if (!podsAvailable()) return NextResponse.json({ error: 'Study pods aren’t connected yet.' }, { status: 503, headers: NO_STORE });
  const b = await req.json().catch(() => ({}));
  try {
    let extra = {};
    if (b.action === 'apply') await apply(me, cleanNote(b));
    else if (b.action === 'create') extra = { created: await createPod(me, cleanPod(b)) };
    else if (b.action === 'join') extra = { started: (await join(me, b.id)).started };
    else if (b.action === 'leave') await leave(me, b.id);
    else if (b.action === 'cancel') await cancelPod(me, b.id);
    else return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: NO_STORE });
    return NextResponse.json(await payload(me, extra), { headers: NO_STORE });
  } catch (e) {
    const known = /^(Give your|Say a little|Tell us|You are|Your request|Only |You can lead|This pod|That pod|As the leader)/.test(e.message);
    if (!known) console.error('pods POST', b.action, e.message);
    return NextResponse.json({ error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, { status: known ? 400 : 502, headers: NO_STORE });
  }
}
