// The free layer of Today end to end against an in-memory Postgres (PGlite): practice summary plus the
// "practising with you" count, which stays hidden until five different people have sat.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/today-db.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';

delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite();
const practice = await import('../../lib/member/practice.js');
practice._setSql((strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows));
const { freeToday } = await import('../../lib/member/today.js');

const today = new Date().toISOString().slice(0, 10); // the API only trusts a day within one of the server's
const log = (n, minutes = 20) => practice.logPractice({ uid: 'u' + n, email: `u${n}@example.com`, day: today, minutes, quality: 'Calm', extras: [] });

// Nobody has sat: all parts still come back, count hidden
let r = await freeToday({ uid: 'u1', today });
assert.equal(r.today, today); assert.equal(r.practice.streak, 0); assert.equal(r.practice.loggedToday, false);
assert.equal(r.practisingToday, null); assert.equal(r.moon, undefined, 'the pañcāṅga is worked out in the browser'); assert.equal(r.sacred.length > 0, true);
assert.ok(r.practice.qualities.includes('Calm'));

// Four people: still hidden (nobody should be identifiable). Five: shown.
for (const n of [1, 2, 3, 4]) await log(n);
assert.equal((await freeToday({ uid: 'u1', today })).practisingToday, null);
await log(5);
r = await freeToday({ uid: 'u1', today });
assert.equal(r.practisingToday, 5); assert.equal(r.practice.loggedToday, true); assert.equal(r.practice.streak, 1);
// Logging twice in a day is one person, not two
await log(5, 30);
assert.equal((await freeToday({ uid: 'u1', today })).practisingToday, 5);
// Someone else's log never shows as mine
assert.equal((await freeToday({ uid: 'u9', today })).practice.streak, 0);

// A second sit adds to the day's minutes (the timer); the quick log replaces them
const mins = async () => (await db.query("SELECT minutes, quality FROM member_practice WHERE uid = 'u6' AND day = $1", [today])).rows[0];
await practice.logPractice({ uid: 'u6', email: 'u6@example.com', day: today, minutes: 20, quality: 'Calm', extras: [] });
await practice.logPractice({ uid: 'u6', email: 'u6@example.com', day: today, minutes: 15, quality: '', extras: [], add: true });
assert.deepEqual(await mins(), { minutes: 35, quality: 'Calm' });
await practice.logPractice({ uid: 'u6', email: 'u6@example.com', day: today, minutes: 590, quality: 'Focused', extras: [], add: true });
assert.deepEqual(await mins(), { minutes: 600, quality: 'Focused' }, 'capped at ten hours');
await practice.logPractice({ uid: 'u6', email: 'u6@example.com', day: today, minutes: 10, quality: 'Calm', extras: [] });
assert.equal((await mins()).minutes, 10);

// A bad day from the browser falls back to the server's
r = await freeToday({ uid: 'u1', today: '1999-01-01' });
assert.equal(r.today, today);

// If the log can't be reached, the free parts still come back
practice._setSql(() => Promise.reject(new Error('down')));
r = await freeToday({ uid: 'u1', today });
assert.equal(r.practice, null); assert.equal(r.practisingToday, null); assert.ok(r.sacred.length > 0);
// A mentee's "due this week": null until the mentee record is connected, then a count (no assignments in the sheet → 0)
const T = await import('../../lib/member/today.js');
assert.equal(await T.dueThisWeek('u1', today).catch(() => 'err'), null);
const mentee = await import('../../lib/mentee/store.js'); mentee._setSql((strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows));
assert.equal(await T.dueThisWeek('u1', '2026-10-21'), 0);
console.log('today-db: ok');
