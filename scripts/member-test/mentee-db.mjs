// Mentee store (ticks and Travelogue) against an in-memory Postgres (PGlite), with the real code.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee-db.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';

delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite();
const S = await import('../../lib/mentee/store.js');
const P = await import('../../lib/member/practice.js');
const run = (strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows);
S._setSql(run); P._setSql(run);

const id = 'a0123456789ab';
assert.equal((await S.doneIds('u1')).size, 0);
await S.setDone('u1', id, true); await S.setDone('u1', id, true);
assert.deepEqual([...await S.doneIds('u1')], [id], 'ticking twice is one tick');
assert.equal((await S.doneIds('u2')).size, 0, 'ticks belong to one member');
await S.setDone('u1', id, false); assert.equal((await S.doneIds('u1')).size, 0);
await assert.rejects(() => S.setDone('u1', 'nope', true), /Unknown assignment/);

await assert.rejects(() => S.addLine('u1', '2026-10-21', '   '), /Write a line/);
await assert.rejects(() => S.addLine('u1', '2026-10-21', 'x'.repeat(1001)), /Keep it/);
await assert.rejects(() => S.addLine('u1', 'today', 'hi'), /Unknown date/);
await S.addLine('u1', '2026-10-21', '  Soft   morning ');
await S.addLine('u1', '2026-10-22', 'Second'); await S.addLine('u2', '2026-10-22', 'Someone else’s');
const lines = await S.recentLines('u1');
assert.deepEqual(lines.map(l => l.text), ['Second', 'Soft morning']); assert.ok(!JSON.stringify(lines).includes('Someone else'), 'a member only ever gets their own lines');

// Practice days drive the mālā
assert.equal(await P.practiceDayCount('u1'), 0);
await P.logPractice({ uid: 'u1', email: 'a@x.com', day: '2026-10-20', minutes: 20 }); await P.logPractice({ uid: 'u1', email: 'a@x.com', day: '2026-10-21', minutes: 10 });
await P.logPractice({ uid: 'u1', email: 'a@x.com', day: '2026-10-21', minutes: 30 });
assert.equal(await P.practiceDayCount('u1'), 2, 'logging twice in a day is still one day');
assert.equal((await P.practiceSummary('u1', '2026-10-21')).streak, 2);
console.log('mentee db: ok');

// ---- P1: hand-ins and self-logged hours ----
const F = await import('../../lib/member/formation.js'); F._setSql(run);
const me = { uid: 'u1', email: 'Maya@x.com' };
await assert.rejects(() => S.saveSubmission(me, { assignmentId: 'bad', text: 'x', status: 'submitted' }), /Unknown assignment/);
await assert.rejects(() => S.saveSubmission(me, { assignmentId: id, text: '  ', status: 'submitted' }), /Write a response/);
await assert.rejects(() => S.saveSubmission(me, { assignmentId: id, text: 'x', fileUrl: 'submissions/u2/a.pdf', status: 'draft' }), /Unknown file/);
await S.saveSubmission(me, { assignmentId: id, title: 'Reflection', text: 'draft', status: 'draft' });
assert.equal((await S.submissionsFor('u1'))[id].status, 'draft'); assert.equal((await S.openSubmissions()).length, 0, 'drafts are private');
await S.saveSubmission(me, { assignmentId: id, title: 'Reflection', text: 'final', fileUrl: 'submissions/u1/a-xyz.pdf', fileName: 'a.pdf', status: 'submitted' });
let open = await S.openSubmissions();
assert.equal(open.length, 1); assert.equal(open[0].email, 'maya@x.com'); assert.equal(open[0].hasFile, true);
assert.ok(!JSON.stringify(await S.submissionsFor('u1')).includes('submissions/'), 'the file path never goes back to the browser');
assert.equal((await S.submissionsFor('u2'))[id], undefined, 'a member only sees their own hand-ins');
assert.deepEqual(await S.fileOf(open[0].id), { uid: 'u1', path: 'submissions/u1/a-xyz.pdf', name: 'a.pdf' });
await S.returnSubmission(open[0].id); assert.equal((await S.submissionsFor('u1'))[id].status, 'returned'); assert.equal((await S.openSubmissions()).length, 0);
await S.saveSubmission(me, { assignmentId: id, text: 'again', status: 'submitted' }); assert.equal((await S.submissionsFor('u1'))[id].status, 'submitted', 'resubmitting after a return is allowed');

await F.addEntry('jacob@x.com', { email: 'maya@x.com', component: 'immersions', hours: 6, day: '2026-11-15' });
await assert.rejects(() => F.addPending('maya@x.com', { component: 'immersions', hours: 1, day: '2026-11-15' }), /Choose observation/);
let rec = await F.addPending('maya@x.com', { component: 'observation', hours: 2.5, day: '2026-11-16', detail: 'Wednesday session', note: 'notes' });
assert.equal(rec.total, 6, 'pending hours do not count yet'); assert.equal(rec.entries[0].status, 'pending');
const pend = await F.pendingEntries(); assert.equal(pend.length, 1); assert.equal(pend[0].detail, 'Wednesday session');
await F.resolveEntry(pend[0].id, true);
rec = await F.formationFor('maya@x.com'); assert.equal(rec.total, 8.5); assert.equal(rec.entries[0].status, 'credited');
await F.addPending('maya@x.com', { component: 'peer', hours: 1, day: '2026-11-17' });
await F.resolveEntry((await F.pendingEntries())[0].id, false); assert.equal((await F.pendingEntries()).length, 0); assert.equal((await F.formationFor('maya@x.com')).entries.length, 2, 'declined entries are removed');
assert.equal((await F.formationTotals(['maya@x.com']))['maya@x.com'], 8.5);
console.log('mentee P1 db: ok');
const id2 = 'a1111111111aa';
await S.saveSubmission(me, { assignmentId: id2, text: '', fileUrl: 'submissions/u1/talk.mp4', fileName: 'talk.mp4', status: 'draft' });
await S.saveSubmission(me, { assignmentId: id2, text: 'with my recording', status: 'submitted' });
const kept = await S.submissionsFor('u1'); assert.equal(kept[id2].hasFile, true, 'saving again without a new file keeps the earlier one'); assert.equal(kept[id2].fileName, 'talk.mp4');
await S.saveSubmission(me, { assignmentId: 'a2222222222bb', text: '', status: 'submitted' }).then(() => assert.fail('empty'), e => assert.match(e.message, /Write a response/));
console.log('mentee P1b db: ok');
