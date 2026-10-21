// Study pods against an in-memory Postgres (PGlite) with the real code: leaders, pods, joining, the 5-to-begin and 10-to-fill rules.
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
assert.equal(L.MIN, 5); assert.equal(L.MAX, 10);
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

// A pod: the leader is the first member; it begins at 5 (leader included) and holds 10
const id = await S.createPod(lead, { topic: 'Śiva Sūtras group', description: 'We read one sūtra a week and talk it through.', schedule: 'Thursdays 7pm UK' });
let { pods, membersBy } = await S.listPods();
assert.equal(pods[0].status, 'open'); assert.equal(membersBy[id].length, 1);
await S.createPod(lead, { topic: 'Second pod', description: 'A second group for the same leader.' });
await assert.rejects(() => S.createPod(lead, { topic: 'Third pod', description: 'One too many for one leader.' }), /up to 2 pods/);
for (const n of [2, 3, 4]) assert.equal((await S.join(user(n), id)).started, false, `${n} people: not yet`);
await assert.rejects(() => S.join(user(2), id), /already in this pod/);
assert.equal((await S.join(user(5), id)).started, true, 'the fifth person begins the pod');
({ pods, membersBy } = await S.listPods());
const p = pods.find(x => String(x.id) === id); assert.equal(p.status, 'active'); assert.ok(p.started_at);
assert.equal((await S.join(user(6), id)).started, false, 'later joiners just join');
for (const n of [7, 8, 9, 10]) await S.join(user(n), id);
({ membersBy } = await S.listPods()); assert.equal(membersBy[id].length, 10);
await assert.rejects(() => S.join(user(11), id), /full \(10 people\)/);
await assert.rejects(() => S.join(user(11), '9999'), /isn’t open/);

// What each person sees: only members get the chat link and the names
await S.setChatUrl(id, 'https://ss.embodiedphilosophy.com/c/pod-1');
await assert.rejects(() => S.setChatUrl(id, 'javascript:alert(1)'), /full link/);
({ pods, membersBy } = await S.listPods());
const mine = L.podsFor(pods, membersBy, user(3)).find(x => x.id === id), other = L.podsFor(pods, membersBy, user(20)).find(x => x.id === id);
assert.equal(mine.mine, true); assert.equal(mine.chatUrl, 'https://ss.embodiedphilosophy.com/c/pod-1'); assert.equal(mine.names.length, 10); assert.equal(mine.canLeave, true);
assert.equal(other.mine, false); assert.equal(other.chatUrl, '', 'the chat link is only for members'); assert.deepEqual(other.names, [], 'and so are the names'); assert.equal(other.canJoin, false, 'full');
assert.equal(L.podsFor(pods, membersBy, lead).find(x => x.id === id).isLeader, true);
assert.equal(L.podView({ id: 1, status: 'active', chat_url: '', leader_uid: 'u1' }, [{ uid: 'u3', name: 'x' }], user(3)).chatPending, true, 'started but no chat link yet');

// Leaving, cancelling
await S.leave(user(10), id); ({ membersBy } = await S.listPods()); assert.equal(membersBy[id].length, 9);
await assert.rejects(() => S.leave(lead, id), /cancel the pod instead/);
const open2 = (await S.listPods()).pods.find(x => x.topic === 'Second pod');
await assert.rejects(() => S.cancelPod(user(3), open2.id), /Only the leader/); await S.cancelPod(lead, open2.id);
assert.equal((await S.listPods()).pods.some(x => x.topic === 'Second pod'), false, 'a cancelled pod disappears'); assert.equal((await S.listPods({ all: true })).pods.some(x => x.topic === 'Second pod'), true, 'staff still see it');
await assert.rejects(() => S.cancelPod(lead, id), /Only the leader/, 'a running pod can only be cancelled by staff'); await S.cancelPod(null, id, { staff: true });
console.log('pods: ok');
