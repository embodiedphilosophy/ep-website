// Practicum pods: anyone organises one, no approval; time rules; joining; who sees the links. PGlite stands in for Neon.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/practicum.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const P = await import('../../lib/pods/practicum.js');
const db = new PGlite(); P._setSql((s, ...v) => db.sql(s, ...v).then(r => r.rows));
const user = n => ({ uid: 'u' + n, email: `m${n}@x.com`, name: 'M' + n });
const now = Date.parse('2026-11-10T12:00:00Z'), at = h => new Date(now + h * 3600e3).toISOString();

assert.equal(P.eligible('mentee', false), true); assert.equal(P.eligible('ss_season', false), false); assert.equal(P.eligible('none', true), true, 'Circle admins can see it');
// the rules for a new pod
assert.throws(() => P.cleanPod({ topic: 'x', startsAt: at(5) }, now), /focus/); assert.throws(() => P.cleanPod({ topic: 'Teaching Session 1', startsAt: 'nope' }, now), /day and time/);
assert.throws(() => P.cleanPod({ topic: 'Teaching Session 1', startsAt: at(-2) }, now), /future/); assert.throws(() => P.cleanPod({ topic: 'Teaching Session 1', startsAt: at(24 * 120) }, now), /90 days/);
assert.equal(P.cleanPod({ topic: ' Teaching  Session 1 ', startsAt: at(48), minutes: 75 }, now).minutes, 60, 'an odd length becomes an hour'); assert.equal(P.cleanPod({ topic: 'Teaching Session 1', startsAt: at(48), minutes: 90 }, now).minutes, 90);

// anyone organises; the organiser is the first member; no approval anywhere
const org = user(1);
const id = await P.createPod(org, { topic: 'Practise the five-minute practice', description: 'Each of us teaches it once.', startsAt: at(48), minutes: 60 }, now);
let { pods, membersBy } = await P.listPods(now); assert.equal(pods.length, 1); assert.equal(membersBy[id].length, 1);
await P.createPod(org, { topic: 'Second pod here', startsAt: at(72) }, now); await P.createPod(org, { topic: 'Third pod here', startsAt: at(96) }, now);
await assert.rejects(() => P.createPod(org, { topic: 'Fourth pod here', startsAt: at(120) }, now), /up to 3/);
// joining
for (const n of [2, 3]) await P.join(user(n), id, now);
await assert.rejects(() => P.join(user(2), id, now), /already in this pod/); await assert.rejects(() => P.join(user(9), '999', now), /isn’t open/);
for (const n of [4, 5, 6]) await P.join(user(n), id, now);
await assert.rejects(() => P.join(user(7), id, now), /full \(6 people\)/);
await assert.rejects(() => P.leave(org, id), /cancel the pod instead/); await P.leave(user(6), id); await P.join(user(7), id, now);
// who sees what: links and names only for members; the organiser can set the room
await assert.rejects(() => P.setLinks(user(2), id, { roomUrl: 'https://room.example/x' }), /Only the organiser/); await assert.rejects(() => P.setLinks(org, id, { roomUrl: 'javascript:1' }), /full link/);
await P.setLinks(org, id, { roomUrl: 'https://ss.embodiedphilosophy.com/c/live-rooms/p1', chatUrl: '' });
({ pods, membersBy } = await P.listPods(now));
const m = P.podsFor(pods, membersBy, user(2), now).find(x => x.id === id), o = P.podsFor(pods, membersBy, user(20), now).find(x => x.id === id), l = P.podsFor(pods, membersBy, org, now).find(x => x.id === id);
assert.equal(m.roomUrl, 'https://ss.embodiedphilosophy.com/c/live-rooms/p1'); assert.equal(o.roomUrl, '', 'outsiders do not see the room'); assert.deepEqual(o.names, []); assert.equal(o.canJoin, false, 'full'); assert.equal(m.canLeave, true); assert.equal(l.canCancel, true); assert.equal(l.canSetRoom, true); assert.equal(m.canSetRoom, false);
// finished pods drop out; a cancelled pod is gone
assert.equal((await P.listPods(now + 5 * 864e5)).pods.length, 0, 'five days on, every pod is over');
await P.cancelPod(org, id); assert.equal((await P.listPods(now)).pods.some(p => String(p.id) === id), false); await assert.rejects(() => P.cancelPod(user(2), id), /Only the organiser/);
// the organiser can change the focus, time and length (still within the window); nobody else can
{ const pid = await P.createPod(org, { topic: 'Edit me pod', startsAt: at(24 * 20), minutes: 45 }, now); await P.join(user(2), pid, now);
  await assert.rejects(() => P.updatePod(user(2), pid, { topic: 'Mine now', startsAt: at(50) }, now), /Only the organiser/);
  await assert.rejects(() => P.updatePod(org, pid, { topic: 'Edit me pod', startsAt: at(-1) }, now), /future/);
  const r = await P.updatePod(org, pid, { topic: 'Teaching the breath count', description: 'Bring five minutes.', startsAt: at(30), minutes: 90 }, now);
  assert.equal(r.before.topic, 'Edit me pod'); assert.equal(r.members.length, 2);
  const v = P.podsFor((await P.listPods(now)).pods, (await P.listPods(now)).membersBy, org, now).find(x => x.id === pid);
  assert.equal(v.topic, 'Teaching the breath count'); assert.equal(v.startsAt, at(30)); assert.equal(v.minutes, 90); assert.equal(v.canEdit, true);
  assert.equal(P.podsFor((await P.listPods(now)).pods, (await P.listPods(now)).membersBy, user(2), now).find(x => x.id === pid).canEdit, false);
  await P.cancelPod(org, pid); await assert.rejects(() => P.updatePod(org, pid, { topic: 'Teaching again', startsAt: at(30) }, now), /isn’t open/); }
console.log('practicum: ok');
