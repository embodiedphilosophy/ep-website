// Practice Portfolio end-to-end against an in-memory Postgres (PGlite), with the real portfolio and practice code.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/portfolio-db.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';

delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite();
const run = (strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows);
const practice = await import('../../lib/member/practice.js');
const P = await import('../../lib/member/portfolio.js');
practice._setSql(run); P._setSql(run);
await practice.practiceSummary('u0', '2026-10-21'); // makes the practice table

const maya = { uid: 'u1', email: 'maya@example.com', tier: 'mentee' };
const sam = { uid: 'u2', email: 'sam@example.com', tier: 'ss_year' };
const today = '2026-10-21'; // a Wednesday

// Pure bits
assert.equal(P.minutesBetween('05:40', '06:15'), 35);
assert.equal(P.minutesBetween('23:50', '00:20'), 30, 'past midnight');
assert.equal(P.minutesBetween('6:00', '07:00'), 0, 'bad time');
assert.equal(P.mondayOf('2026-10-25'), '2026-10-19'); assert.equal(P.mondayOf('2026-10-19'), '2026-10-19');
const c = P.cleanDaily({ sittings: [{ start: '05:40', end: '06:15' }, { start: '21:30', end: '21:50' }], quality: 'Calm', bodies: ['Mantra', 'Nope'], energy: 'Loud', reflections: ['  felt warm  '], evil: 1 });
assert.equal(c.minutes, 55); assert.deepEqual(c.bodies, ['Mantra']); assert.equal(c.energy, ''); assert.equal(c.reflections[0], 'felt warm'); assert.equal(c.evil, undefined);
assert.equal(P.editable('2026-10-14', today), true); assert.equal(P.editable('2026-10-13', today), false); assert.equal(P.editable('2026-10-22', today), false);
assert.equal(P.weekEditable('2026-10-12', today), true, 'last week, still open'); assert.equal(P.weekEditable('2026-10-05', today), false);

// Empty entries are refused; old days are refused
await assert.rejects(() => P.saveDaily(maya, today, today, {}, false), /Write something/);
await assert.rejects(() => P.saveDaily(maya, '2026-10-01', today, { feel: 'x' }, false), /up to a week/);

// Maya writes today (shared) and Monday (private); the minutes reach the practice log
await P.saveDaily(maya, today, today, { sittings: [{ start: '05:40', end: '06:15' }, { start: '21:30', end: '21:50' }], quality: 'Calm', bodies: ['Mantra'], feel: 'Quiet', dedication: 'For all beings' }, true);
await P.saveDaily(maya, '2026-10-19', today, { extraMinutes: 40, quality: 'Restless', reflections: ['', 'A small opening'] }, false);
let v = await P.portfolioView(maya, today, today);
assert.equal(v.entry.data.minutes, 55); assert.equal(v.entry.shared, true); assert.equal(v.canShare, true);
assert.equal(v.week.length, 7); assert.equal(v.week[0].day, '2026-10-19');
assert.deepEqual(v.week.filter(d => d.logged).map(d => [d.day, d.minutes]), [['2026-10-19', 40], ['2026-10-21', 55]]);
assert.match(v.weekLine, /^2 of 7 days · 95 min · most often (calm|restless)/);
assert.equal(v.entryNumber, 2);
const s = await practice.practiceSummary('u1', today);
assert.equal(s.loggedToday, true); assert.equal(s.weekCount, 2);

// Editing keeps one row per day; a writing-only entry doesn't touch the log
await P.saveDaily(maya, today, today, { sittings: [{ start: '05:40', end: '06:10' }], quality: 'Focused' }, true);
v = await P.portfolioView(maya, today, today);
assert.equal(v.entry.data.minutes, 30); assert.equal(v.week.find(d => d.day === today).minutes, 30);
await P.saveDaily(maya, '2026-10-20', today, { feel: 'Only words today' }, false);
v = await P.portfolioView(maya, today, today);
assert.equal(v.week.find(d => d.day === '2026-10-20').logged, false); assert.equal(v.week.find(d => d.day === '2026-10-20').page, true);

// Weekly reflection, shared
await assert.rejects(() => P.saveWeekly(maya, today, today, { answers: ['', ''] }, true), /at least one/);
await P.saveWeekly(maya, today, today, { answers: ['Calm mornings', '', '', 'Keep the evening sit'] }, true);
v = await P.portfolioView(maya, today, today);
assert.equal(v.weekly.data.answers[3], 'Keep the evening sit'); assert.equal(v.weekly.shared, true);

// Sam (not a mentee) can't share, even if asked
await P.saveDaily(sam, today, today, { feel: 'Private by design' }, true);
v = await P.portfolioView(sam, today, today);
assert.equal(v.entry.shared, false); assert.equal(v.canShare, false);

// Mentor sees only what was shared: Maya's today page and weekly reflection, nothing of Sam's or Maya's Monday
const shared = await P.sharedPages('2026-08-01');
assert.deepEqual(shared.map(p => [p.email, p.kind, p.day]).sort(), [['maya@example.com', 'day', today], ['maya@example.com', 'week', '2026-10-19']]);

// Unsharing takes it back out of the mentor view
await P.saveDaily(maya, today, today, { sittings: [{ start: '05:40', end: '06:10' }], quality: 'Focused' }, false);
assert.equal((await P.sharedPages('2026-08-01')).filter(p => p.kind === 'day').length, 0);

console.log('portfolio db: ok');
