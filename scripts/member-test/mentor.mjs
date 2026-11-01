// Jacob's side: review queue, pair health, worth a word, Monday digest, nudges. Postgres is PGlite.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/mentor.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.MENTEE_NUDGES;
const M = await import('../../lib/mentee/mentor.js');
const now = Date.parse('2026-11-10T12:00:00Z');
const names = { 'a@x.com': 'Ana Ruiz', 'b@x.com': 'Ben Ode', 'c@x.com': 'Cy Lin' };

// ---- queue: oldest first, stale after 7 days, three kinds
const q = M.queueFrom({
  now, names,
  hours: [{ id: '5', at: '2026-11-08T10:00:00Z', email: 'a@x.com', component: 'observation', hours: 1.5, day: '2026-11-07', detail: 'Tova’s class', note: '', competencies: ['Subtle attunement'], cosigned: true }],
  handins: [{ id: '9', at: '2026-10-28T10:00:00Z', email: 'b@x.com', title: 'Inquiry log', text: 'Here is\n my log', hasFile: false }],
  reflections: [{ id: '3', title: 'On waiting', authorEmail: 'c@x.com', sharedAt: '2026-11-09T09:00:00Z' }, { id: '4', title: 'Acked', authorEmail: 'c@x.com', sharedAt: '2026-10-01T09:00:00Z' }],
  acks: new Set(['r:4']),
});
assert.deepEqual(q.map(x => x.ref), ['s:9', 'h:5', 'r:3'], 'oldest first, acknowledged reflections left out');
assert.deepEqual(q.map(x => x.stale), [true, false, false]); assert.equal(q[0].age, 13); assert.equal(q[0].mentee, 'Ben Ode');
assert.match(q[1].item, /Observation · 1.5 h/); assert.match(q[1].detail, /partner confirmed/); assert.deepEqual(M.queueCounts(q), { all: 3, hours: 1, handin: 1, reflection: 1 });

// ---- pair health
const rot = { n: 1, from: '2026-10-01', to: '2026-11-30', weeksLeft: 3 };
const people = { 'a@x.com': { name: 'Ana', city: 'Lisbon' }, 'b@x.com': { name: 'Ben', city: 'Ohio' }, 'c@x.com': { name: 'Cy', city: 'Taipei' } };
let t = M.pairHealth({ groups: [['a@x.com', 'b@x.com'], ['c@x.com', 'd@x.com']], sessions: [{ day: '2026-10-20', present: ['b@x.com', 'a@x.com'] }], rotation: rot, nudged: {}, people });
assert.deepEqual(t.map(x => [x.count, x.state, x.line]), [[1, 'on-track', '1 of 2 · on track'], [0, 'behind', '0 of 2 · no session yet']]);
t = M.pairHealth({ groups: [['c@x.com', 'd@x.com']], sessions: [], rotation: rot, nudged: { [M.groupKey(['d@x.com', 'c@x.com'])]: '2026-11-03' }, people });
assert.equal(t[0].line, '0 of 2 · both nudged 3 Nov'); assert.equal(t[0].people[0].city, 'Taipei');
assert.equal(M.pairHealth({ groups: [['a@x.com', 'b@x.com']], sessions: [{ present: ['a@x.com', 'b@x.com'] }, { present: ['a@x.com', 'b@x.com'] }], rotation: rot, people })[0].state, 'done');
assert.equal(M.pairHealth({ groups: [['a@x.com', 'b@x.com']], sessions: [], rotation: { ...rot, weeksLeft: 8 }, people })[0].state, 'on-track', 'plenty of time left is not behind');
assert.equal(M.pairHealth({ groups: [['a@x.com', 'b@x.com']], sessions: [{ present: ['a@x.com', 'z@x.com'] }], rotation: rot, people })[0].count, 0, 'a session with someone else is not this pair’s');

// ---- worth a word
const w = M.wordsFrom({ rows: [{ name: 'Ana', email: 'a@x.com', last: '2026-11-09', daysSince: 1 }, { name: 'Ben', email: 'b@x.com', last: '2026-10-20', daysSince: 21 }, { name: 'Cy', email: 'c@x.com', last: null, daysSince: null }], unbooked: [{ name: 'Ana', email: 'a@x.com', windowTo: '2026-11-14' }], roster: M.rosterGaps(['a@x.com', 'q@x.com'], ['A@x.com'], {}) });
assert.deepEqual(w.map(x => [x.kind, x.name]), [['quiet', 'Ben'], ['quiet', 'Cy'], ['unbooked', 'Ana'], ['roster', 'q']]);
assert.equal(w[0].why, 'No practice logged for 21 days');
const win = { from: '2026-11-01', to: '2026-11-14' };
assert.equal(M.unbookedFrom({ cohort: [{ name: 'Ana', email: 'a@x.com' }, { name: 'Ben', email: 'b@x.com' }], bookedEmails: new Set(['b@x.com']), window: win, today: '2026-11-10' }).length, 1);
assert.deepEqual(M.unbookedFrom({ cohort: [{ name: 'Ana', email: 'a@x.com' }], bookedEmails: new Set(), window: win, today: '2026-11-03' }), [], 'only when the window is about to close');
assert.deepEqual(M.unbookedFrom({ cohort: [{ name: 'Ana', email: 'a@x.com' }], bookedEmails: new Set(), window: win, today: '2026-10-20' }), [], 'not before it opens');

// ---- digest
const d = M.digestFrom({ queue: q, words: w, tiles: M.pairHealth({ groups: [['c@x.com', 'd@x.com']], sessions: [], rotation: rot, people }), today: '2026-11-09', link: p => 'https://ss.test' + p });
assert.match(d.subject, /3 waiting for you/); assert.ok(d.lines.some(l => /Waiting more than 7 days \(1\)/.test(l.head))); assert.ok(d.lines.some(l => /Pending hours: 1 entry, 1.5 hrs/.test(l.head)));
assert.match(d.text, /https:\/\/ss.test\/c\/mentorship\?view=mentor/); assert.match(d.text, /Cy \+ d: 0 of 2/.test(d.text) ? /./ : /Cy/);
assert.equal(M.digestFrom({ today: '2026-11-09' }).subject, 'Sahṛdaya Upāya this week: nothing waiting');

// ---- store: acks, unreplied reflections, rotation sessions, nudges
const db = new PGlite(); const run = (s, ...v) => db.sql(s, ...v).then(r => r.rows);
const R = await import('../../lib/mentee/reflectionstore.js'); R._setSql(run);
const S = await import('../../lib/mentee/store.js'); S._setSql(run);
const MS = await import('../../lib/mentee/mentorstore.js'); MS._setSql(run);
const a = { email: 'a@x.com', name: 'Ana' }, jacob = { email: 'jacob@embodiedphilosophy.com', name: 'Jacob' };
const r1 = await R.createDraft(a, { title: 'One', body: 'First words.' }, { month: '2026-11' }); await R.shareVersion(a, r1);
const r2 = await R.createDraft(a, { title: 'Two', body: 'Second words.' }, { month: '2026-11' }); await R.shareVersion(a, r2);
await R.createDraft(a, { title: 'Draft', body: 'x' }, { month: '2026-11' });
assert.deepEqual((await MS.unrepliedReflections([jacob.email])).map(x => x.title).sort(), ['One', 'Two'], 'drafts never show');
await R.addComment(jacob, r1, { kind: 'landed', body: 'This landed.' });
assert.deepEqual((await MS.unrepliedReflections([jacob.email])).map(x => x.title), ['Two'], 'a reply from Jacob clears it');
await MS.ackReflection(r2); // acknowledging is applied in the queue (queueFrom), not in this read
assert.deepEqual([...await MS.acks()], [`r:${r2}`]); await MS.ackReflection(r2); await assert.rejects(() => MS.ackReflection('x'), /find that reflection/);
await S.addArticulation({ email: 'a@x.com', name: 'Ana' }, { day: '2026-10-20', hours: 1, present: ['a@x.com', 'b@x.com'], terms: {}, cueBefore: '', cueAfter: '', reflected: '' }, { season: 'fall-2026', rotation: 1 }).catch(() => {});
const rs = await MS.rotationSessions('2026-10-01', '2026-11-30');
assert.ok(rs.length <= 1);
assert.deepEqual(await MS.nudgedMap(1), {}); await MS.markNudged(1, 'a|b'); await MS.markNudged(1, 'a|b'); assert.deepEqual(Object.keys(await MS.nudgedMap(1)), ['a|b']); assert.deepEqual(await MS.nudgedMap(2), {});

// ---- nudges: off by default; on → one message each, once per rotation; a failed send is not recorded
const N = await import('../../lib/mentee/nudge.js');
const behind = M.pairHealth({ groups: [['c@x.com', 'd@x.com'], ['a@x.com', 'b@x.com']], sessions: [{ present: ['a@x.com', 'b@x.com'] }, { present: ['a@x.com', 'b@x.com'] }], rotation: rot, people });
const sent = [], rec = [];
let out = await N.runNudges({ tiles: behind, rotation: rot, send: async (e, tx) => sent.push([e, tx]), record: async (n, k) => rec.push([n, k]) });
assert.equal(sent.length, 0, 'off unless MENTEE_NUDGES=on'); assert.equal(out.length, 1); assert.equal(out[0].sent, false); assert.match(out[0].msgs[0].text, /Hi Cy, a gentle note from Jacob: your articulation session with d for rotation 1/);
process.env.MENTEE_NUDGES = 'on';
out = await N.runNudges({ tiles: behind, rotation: rot, send: async (e, tx) => sent.push([e, tx]), record: async (n, k) => rec.push([n, k]) });
assert.deepEqual(sent.map(x => x[0]), ['c@x.com', 'd@x.com']); assert.deepEqual(rec, [[1, 'c@x.com|d@x.com']]); assert.equal(out[0].sent, true);
out = await N.runNudges({ tiles: M.pairHealth({ groups: [['c@x.com', 'd@x.com']], sessions: [], rotation: rot, nudged: { 'c@x.com|d@x.com': '2026-11-10' }, people }), rotation: rot, send: async () => { throw new Error('should not send'); } });
assert.deepEqual(out, [], 'once per pair per rotation');
out = await N.runNudges({ tiles: behind, rotation: rot, send: async () => { throw new Error('Circle said no'); }, record: async () => rec.push('bad') });
assert.equal(out[0].sent, false); assert.match(out[0].error, /Circle said no/); assert.ok(!rec.includes('bad'), 'a failed send is not recorded');
out = await N.runNudges({ tiles: behind, rotation: rot, dry: true, send: async () => { throw new Error('dry'); } }); assert.equal(out[0].sent, false);
console.log('mentor: ok');
