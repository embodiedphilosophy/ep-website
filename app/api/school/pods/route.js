import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/school/session';
import { podMember } from '@/lib/pods/auth';
import { podsFor, cleanEdit, cleanNote, cleanJoinNote, joinMessage, podsEnabled, MIN, MAX, LIVE_ROOMS_URL } from '@/lib/pods/logic';
import { findMember } from '@/lib/circle';
import { startDirectChat, sendChatMessage } from '@/lib/school/circle';
import { podsAvailable, leaderOf, listPods, apply, createPod, join, leave, cancelPod, setRoomUrl, autoRoom, updatePod } from '@/lib/pods/store';
import { changeMessage } from '@/lib/pods/meetup';
import { tellMembers } from '@/lib/pods/notify';
import { meetConfigured } from '@/lib/meet';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

async function payload(me, extra = {}) {
  const { pods, membersBy } = await listPods();
  const l = await leaderOf(me.uid);
  return { pods: podsFor(pods, membersBy, me), leader: { status: l?.status || '' }, min: MIN, max: MAX, liveRoomsUrl: LIVE_ROOMS_URL, autoRooms: meetConfigured(), ...extra };
}
// The student's note goes to the leader as a Circle direct message, sent as the student (students may message each other).
// The note is also saved with the membership, so the leader sees it on their pod even if Circle refuses the message. → true when sent.
async function messageLeader(me, j, note) {
  if (!note || !j.leaderEmail || j.leaderUid === me.uid) return false;
  try {
    const leader = await findMember(j.leaderEmail);
    if (!leader?.id) throw new Error('no Circle member for the leader');
    const room = await startDirectChat(me.email, leader.id);
    if (!room) throw new Error('Circle did not return a chat room');
    await sendChatMessage(me.email, room, joinMessage(me.name, j.topic, note));
    return true;
  } catch (e) { console.error('pods join message', e.message); return false; }
}
// After an edit: message the members when the title or the meetup changed (and the leader left "Let my pod know" ticked)
const sameWhen = (a, b) => String(a.meet_at ? new Date(a.meet_at).toISOString() : '') === String(b.meet_at ? new Date(b.meet_at).toISOString() : '') && a.meet_repeat === b.meet_repeat && Number(a.meet_minutes) === Number(b.meet_minutes);
async function announce(me, { before, after, members }, notify) {
  const changed = before.topic !== after.topic || !sameWhen(before, after);
  if (!notify || !changed) return { told: 0, changed };
  const text = changeMessage({ oldTopic: before.topic, topic: after.topic, meetAt: after.meet_at ? new Date(after.meet_at).toISOString() : null, repeat: after.meet_repeat, minutes: after.meet_minutes, tz: after.meet_tz, from: me.name });
  return { told: await tellMembers(me.email, members, text, { skipUid: me.uid }), changed };
}
const gate = async () => {
  if (!podsEnabled()) return { res: NextResponse.json({ error: 'Study pods are opening soon.' }, { status: 404, headers: NO_STORE }) };
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

// POST { action: 'apply', note } | { action: 'create' | 'edit' (+ id, notify), topic, description, schedule, meetAt, meetRepeat, meetMinutes, meetTz } | { action: 'join', id, message? } | { action: 'leave' | 'cancel', id } | { action: 'room', id, url } | { action: 'autoroom', id }
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const { me, res } = await gate();
  if (!me) return res;
  if (!podsAvailable()) return NextResponse.json({ error: 'Study pods aren’t connected yet.' }, { status: 503, headers: NO_STORE });
  const b = await req.json().catch(() => ({}));
  try {
    let extra = {};
    if (b.action === 'apply') await apply(me, cleanNote(b));
    else if (b.action === 'create') extra = { created: await createPod(me, cleanEdit(b)) };
    else if (b.action === 'edit') extra = await announce(me, await updatePod(me, b.id, cleanEdit(b), { staff: me.admin }), b.notify !== false);
    else if (b.action === 'join') { const note = cleanJoinNote(b); const j = await join(me, b.id, note); extra = { started: j.started, leader: j.leaderName || '', noted: !!note, messaged: await messageLeader(me, j, note) }; }
    else if (b.action === 'leave') await leave(me, b.id);
    else if (b.action === 'cancel') await cancelPod(me, b.id);
    else if (b.action === 'room') await setRoomUrl(me, b.id, b.url);
    else if (b.action === 'autoroom') await autoRoom(me, b.id);
    else return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: NO_STORE });
    return NextResponse.json(await payload(me, extra), { headers: NO_STORE });
  } catch (e) {
    const known = /^(Give your|Say a little|Tell us|You are|Your request|Only |You can lead|This pod|That pod|As the leader|A full link|We couldn’t make|Choose)/.test(e.message);
    if (!known) console.error('pods POST', b.action, e.message);
    return NextResponse.json({ error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, { status: known ? 400 : 502, headers: NO_STORE });
  }
}
