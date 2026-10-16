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
