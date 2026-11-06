// Study pods against an in-memory Postgres (PGlite) with the real code: leaders, pods, joining, the 4-to-begin and 10-to-fill rules.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/pods.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';

delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite();
const S = await import('../../lib/pods/store.js');
const L = await import('../../lib/pods/logic.js');
S._setSql((strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows));
const user = (n, extra = {}) => ({ uid: 'u' + n, email: `s${n}@x.com`, name: 'Student' + n, ...extra });

// Rules
assert.equal(L.MIN, 4); assert.equal(L.MAX, 10);
assert.ok(L.eligible('ss_season') && L.eligible('ss_year') && L.eligible('mentee') && L.eligible('none', true), 'a season, the full year, mentees and admins');
assert.ok(!L.eligible('wisdom') && !L.eligible('none') && !L.eligible(undefined), 'not other programmes');
assert.throws(() => L.cleanPod({ topic: 'hi', description: 'x'.repeat(30) }), /topic/); assert.throws(() => L.cleanPod({ topic: 'Reading the Śiva Sūtras', description: 'short' }), /sentence/);
assert.deepEqual(L.cleanPod({ topic: ' Śiva Sūtras  group ', description: 'We read one sūtra a week and talk it through.', schedule: 'Thursdays,\n7pm UK' }), { topic: 'Śiva Sūtras group', description: 'We read one sūtra a week and talk it through.', schedule: 'Thursdays, 7pm UK' });
assert.throws(() => L.cleanNote({ note: 'hi' }), /why/);

// Leaders: apply → approve
const lead = user(1);
await assert.rejects(() => S.createPod(lead, { topic: 'T', description: 'D' }), /approved pod leaders/);
await S.apply(lead, 'I have led study groups for years.');
await assert.rejects(() => S.apply(lead, 'again'), /with us already/);
assert.equal((await S.leaderOf('u1')).status, 'applied');
await assert.rejects(() => S.createPod(lead, { topic: 'T', description: 'D' }), /approved pod leaders/, 'not before approval');
await S.decideLeader('u1', true, 'Jacob'); assert.equal((await S.leaderOf('u1')).status, 'approved');
await assert.rejects(() => S.apply(lead, 'more'), /already a pod leader/);
await S.apply(user(9), 'Please let me lead one.'); await S.decideLeader('u9', false, 'Jacob'); assert.equal((await S.leaderOf('u9')).status, 'declined');
await S.apply(user(9), 'I would still love to, I have more experience now.'); assert.equal((await S.leaderOf('u9')).status, 'applied', 'a declined student can ask again');
assert.deepEqual((await S.leaders()).map(l => l.uid), ['u9', 'u1'], 'requests waiting come first');

// A pod: the leader is the first member; it begins at 4 (leader included) and holds 10
const id = await S.createPod(lead, { topic: 'Śiva Sūtras group', description: 'We read one sūtra a week and talk it through.', schedule: 'Thursdays 7pm UK' });
let { pods, membersBy } = await S.listPods();
assert.equal(pods[0].status, 'open'); assert.equal(membersBy[id].length, 1);
await S.createPod(lead, { topic: 'Second pod', description: 'A second group for the same leader.' });
await assert.rejects(() => S.createPod(lead, { topic: 'Third pod', description: 'One too many for one leader.' }), /up to 2 pods/);
for (const n of [2, 3]) assert.equal((await S.join(user(n), id)).started, false, `${n + 0} joined: not yet`);
await assert.rejects(() => S.join(user(2), id), /already in this pod/);
assert.equal((await S.join(user(4), id)).started, true, 'the fourth person begins the pod');
({ pods, membersBy } = await S.listPods());
const p = pods.find(x => String(x.id) === id); assert.equal(p.status, 'active'); assert.ok(p.started_at);
assert.equal((await S.join(user(5), id)).started, false, 'later joiners just join');
for (const n of [6, 7, 8, 9, 10]) await S.join(user(n), id);
({ membersBy } = await S.listPods()); assert.equal(membersBy[id].length, 10);
await assert.rejects(() => S.join(user(11), id), /full \(10 people\)/);
await assert.rejects(() => S.join(user(11), '9999'), /isn’t open/);

// The pod's own live room: the leader (or staff) sets it; only members see it
await assert.rejects(() => S.setRoomUrl(user(3), id, 'https://room.example/x'), /As the leader/);
await assert.rejects(() => S.setRoomUrl(lead, id, 'javascript:1'), /full link/);
await S.setRoomUrl(lead, id, 'https://ss.embodiedphilosophy.com/c/live-rooms/pod-1');
{ const t = await S.listPods(); const m = L.podsFor(t.pods, t.membersBy, user(3)).find(x => x.id === id), o = L.podsFor(t.pods, t.membersBy, user(20)).find(x => x.id === id), l = L.podsFor(t.pods, t.membersBy, lead).find(x => x.id === id);
  assert.equal(m.roomUrl, 'https://ss.embodiedphilosophy.com/c/live-rooms/pod-1'); assert.equal(o.roomUrl, '', 'not for outsiders'); assert.equal(l.canSetRoom, true); assert.equal(m.canSetRoom, false); }

// What each person sees: only members get the chat link and the names
await S.setChatUrl(id, 'https://ss.embodiedphilosophy.com/c/pod-1');
await assert.rejects(() => S.setChatUrl(id, 'javascript:alert(1)'), /full link/);
({ pods, membersBy } = await S.listPods());
const mine = L.podsFor(pods, membersBy, user(3)).find(x => x.id === id), other = L.podsFor(pods, membersBy, user(20)).find(x => x.id === id);
assert.equal(mine.mine, true); assert.equal(mine.chatUrl, 'https://ss.embodiedphilosophy.com/c/pod-1'); assert.equal(mine.names.length, 10); assert.equal(mine.canLeave, true);
assert.equal(other.mine, false); assert.equal(other.chatUrl, '', 'the chat link is only for members'); assert.deepEqual(other.names, [], 'and so are the names'); assert.equal(other.canJoin, false, 'full');
assert.equal(L.podsFor(pods, membersBy, lead).find(x => x.id === id).isLeader, true);
assert.equal(L.podView({ id: 1, status: 'active', chat_url: '', leader_uid: 'u1' }, [{ uid: 'u3', name: 'x' }], user(3)).chatPending, true, 'started but no chat link yet');

// A note to the leader on joining: saved with the membership, shown only to the leader
{ const pid = await S.createPod(user(9, { uid: 'u9' }), { topic: 'Note pod', description: 'A pod to test notes for the leader.' }).catch(async () => { await S.decideLeader('u9', true, 'Jacob'); return S.createPod(user(9), { topic: 'Note pod', description: 'A pod to test notes for the leader.' }); });
  assert.equal(L.cleanJoinNote({ message: '  Hello  there\n\n\n\nfriend ' }), 'Hello there\n\nfriend'); assert.equal(L.cleanJoinNote({}), '');
  const j = await S.join(user(30), pid, 'Hello! I would love to join.'); assert.equal(j.leaderEmail, 's9@x.com'); assert.equal(j.topic, 'Note pod'); assert.equal(j.leaderUid, 'u9');
  await S.join(user(31), pid, '');
  const t = await S.listPods(); const lv = L.podsFor(t.pods, t.membersBy, user(9)).find(x => x.id === pid), mv = L.podsFor(t.pods, t.membersBy, user(31)).find(x => x.id === pid);
  assert.deepEqual(lv.notes, [{ name: 'Student30', note: 'Hello! I would love to join.' }], 'the leader sees the note'); assert.deepEqual(mv.notes, [], 'other members do not');
  assert.match(L.joinMessage('Student30', 'Note pod', 'Hello!'), /joined your study pod “Note pod”[\s\S]*Hello![\s\S]*Student30/);
  await S.cancelPod(null, pid, { staff: true }); }

// Leaving, cancelling
await S.leave(user(10), id); ({ membersBy } = await S.listPods()); assert.equal(membersBy[id].length, 9);
await assert.rejects(() => S.leave(lead, id), /cancel the pod instead/);
const open2 = (await S.listPods()).pods.find(x => x.topic === 'Second pod');
await assert.rejects(() => S.cancelPod(user(3), open2.id), /Only the leader/); await S.cancelPod(lead, open2.id);
assert.equal((await S.listPods()).pods.some(x => x.topic === 'Second pod'), false, 'a cancelled pod disappears'); assert.equal((await S.listPods({ all: true })).pods.some(x => x.topic === 'Second pod'), true, 'staff still see it');
await assert.rejects(() => S.cancelPod(lead, id), /Only the leader/, 'a running pod can only be cancelled by staff'); await S.cancelPod(null, id, { staff: true });
// The leader changes the pod: title, description, meetup (date, how often, length, time zone)
{ const M = await import('../../lib/pods/meetup.js');
  const now = Date.parse('2026-11-05T12:00:00Z');
  // A weekly 7pm London meetup stays 7pm after the clocks go back (18:00Z in BST, 19:00Z in GMT)
  assert.equal(M.nextMeetup({ meet_at: '2026-10-22T18:00:00Z', meet_repeat: 'weekly', meet_minutes: 60, meet_tz: 'Europe/London' }, now), '2026-11-05T19:00:00.000Z');
  assert.equal(M.nextMeetup({ meet_at: '2026-10-22T18:00:00Z', meet_repeat: 'fortnightly', meet_minutes: 60, meet_tz: 'Europe/London' }, now), '2026-11-05T19:00:00.000Z');
  assert.equal(M.nextMeetup({ meet_at: '2026-10-22T18:00:00Z', meet_repeat: 'monthly', meet_minutes: 60, meet_tz: 'Europe/London' }, now), '2026-11-26T19:00:00.000Z', 'the 4th Thursday');
  assert.equal(M.nextMeetup({ meet_at: '2026-11-05T11:30:00Z', meet_repeat: 'weekly', meet_minutes: 60, meet_tz: 'UTC' }, now), '2026-11-05T11:30:00.000Z', 'a meetup under way is still the next one');
  assert.equal(M.nextMeetup({ meet_at: '2026-10-22T18:00:00Z', meet_repeat: 'once', meet_minutes: 60 }, now), '', 'a one-off that is over');
  assert.equal(M.nextMeetup({}, now), '');
  assert.throws(() => M.cleanMeetup({ meetAt: '2026-11-01T10:00:00Z' }, now), /future/); assert.throws(() => M.cleanMeetup({ meetAt: 'soon' }, now), /day and time/);
  assert.deepEqual(M.cleanMeetup({ meetAt: '', meetRepeat: 'monthly' }, now).meetAt, null, 'an empty date means not set yet');
  assert.deepEqual(M.cleanMeetup({ meetAt: '2026-11-12T19:00:00Z', meetRepeat: 'yearly', meetMinutes: 7, meetTz: 'Not/AZone' }, now), { meetAt: '2026-11-12T19:00:00.000Z', meetRepeat: 'weekly', meetMinutes: 60, meetTz: 'UTC' });
  assert.match(M.calendarUrl({ title: 'Pod', startIso: '2026-11-12T19:00:00Z', minutes: 60, repeat: 'fortnightly', tz: 'Europe/London' }), /recur=RRULE%3AFREQ%3DWEEKLY%3BINTERVAL%3D2/);
  assert.match(M.changeMessage({ oldTopic: 'A', topic: 'B', meetAt: '2026-11-12T19:00:00Z', repeat: 'weekly', minutes: 90, tz: 'Europe/London', from: 'Asha' }), /now called “B”[\s\S]*Thu 12 Nov, 7:00 PM GMT \(every week\), 90 minutes[\s\S]*Asha/);

  const ld = user(40); await S.apply(ld, 'I would like to lead a reading group.'); await S.decideLeader('u40', true, 'Jacob');
  const mins = ms => new Date(Math.round(ms / 60000) * 60000).toISOString(), future = mins(Date.now() + 3 * 864e5);
  const pid = await S.createPod(ld, L.cleanEdit({ topic: 'Spanda Kārikās', description: 'We read a kārikā a week and talk it through.', meetAt: future, meetRepeat: 'weekly', meetMinutes: 90, meetTz: 'Europe/London' }));
  await S.join(user(41), pid);
  let t = await S.listPods(), v = L.podsFor(t.pods, t.membersBy, ld).find(x => x.id === pid);
  assert.equal(v.meetAt, future); assert.equal(v.meetRepeatLabel, 'Every week'); assert.equal(v.meetMinutes, 90); assert.equal(v.canEdit, true);
  const mv = L.podsFor(t.pods, t.membersBy, user(41)).find(x => x.id === pid), ov = L.podsFor(t.pods, t.membersBy, user(60)).find(x => x.id === pid);
  assert.equal(mv.canEdit, false, 'members cannot edit'); assert.match(mv.calendarUrl, /calendar\.google\.com/); assert.equal(ov.calendarUrl, '', 'only members get the calendar link');
  assert.equal(L.podsFor(t.pods, t.membersBy, user(61, { admin: true })).find(x => x.id === pid).canEdit, true, 'admins can edit');

  const later = mins(Date.now() + 10 * 864e5);
  await assert.rejects(() => S.updatePod(user(41), pid, L.cleanEdit({ topic: 'Hijack', description: 'Not the leader trying to change it.' })), /Only the pod’s leader/);
  const r = await S.updatePod(ld, pid, L.cleanEdit({ topic: 'Spanda Kārikās, slowly', description: 'Half a kārikā a week, with a long sit first.', schedule: 'Break over the holidays', meetAt: later, meetRepeat: 'monthly', meetMinutes: 60, meetTz: 'America/New_York' }));
  assert.equal(r.before.topic, 'Spanda Kārikās'); assert.equal(r.after.topic, 'Spanda Kārikās, slowly'); assert.deepEqual(r.members.map(m => m.uid), ['u40', 'u41']);
  t = await S.listPods(); v = L.podsFor(t.pods, t.membersBy, ld).find(x => x.id === pid);
  assert.equal(v.topic, 'Spanda Kārikās, slowly'); assert.equal(v.schedule, 'Break over the holidays'); assert.equal(v.meetAt, later); assert.equal(v.meetRepeat, 'monthly'); assert.equal(v.meetTz, 'America/New_York');
  await S.updatePod(ld, pid, L.cleanEdit({ topic: 'Spanda Kārikās, slowly', description: 'Half a kārikā a week, with a long sit first.', meetAt: '' }));
  t = await S.listPods(); v = L.podsFor(t.pods, t.membersBy, ld).find(x => x.id === pid); assert.equal(v.meetAt, '', 'the date can be cleared'); assert.equal(v.meetRepeat, '');
  await S.updatePod(null, pid, L.cleanEdit({ topic: 'Staff fixed the title', description: 'Half a kārikā a week, with a long sit first.' }), { staff: true });
  await S.cancelPod(null, pid, { staff: true });
  await assert.rejects(() => S.updatePod(ld, pid, L.cleanEdit({ topic: 'Too late now', description: 'This pod has been cancelled already.' })), /isn’t running/); }
console.log('pods: ok');
