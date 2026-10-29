// The Practice page (Circle /c/daily-practice) against an in-memory Postgres, with the real code. No real systems touched.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/practice.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';

delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.CALENDAR_SHEET_ID;
const db = new PGlite();
const run = (strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows);
const practice = await import('../../lib/member/practice.js');
const S = await import('../../lib/practice/store.js');
const R = await import('../../lib/practice/readings.js');
const SE = await import('../../lib/practice/season.js');
const P = await import('../../lib/practice/post.js');
const V = await import('../../lib/practice/summary.js');
const SH = await import('../../lib/practice/share.js');
practice._setSql(run); S._setSql(run); V._setRun(run);

// ---- season and access
const list = [{ slug: 'fall-2026', programme: 'sadhana-school', starts_on: '2026-10-21', ends_on: '2026-12-09' }, { slug: 'winter-2027', programme: 'sadhana-school', starts_on: '2027-01-27', ends_on: '2027-03-24' }];
assert.equal(SE.currentSeason('2026-10-29', list).slug, 'fall-2026');
assert.equal(SE.currentSeason('2026-12-20', list).slug, 'fall-2026', 'between seasons: the one just finished');
assert.equal(SE.currentSeason('2026-09-01', list).slug, 'fall-2026', 'before the first');
const fall = list[0];
assert.equal(SE.canSeeSS('ss_year', [], fall), true); assert.equal(SE.canSeeSS('mentee', [], fall), true);
assert.equal(SE.canSeeSS('ss_season', ['fall'], fall), true); assert.equal(SE.canSeeSS('ss_season', ['winter'], fall), false, 'other season only');
for (const t of ['none', 'meditation', 'wisdom', 'wisdom_plus', 'course']) assert.equal(SE.canSeeSS(t, ['fall'], fall), false, t);

// ---- readings: week chosen by the member's own Monday; nothing invented
const rows = [
  { season: 'fall-2026', week: '1', week_start: '2026-10-19', reading_id: 'f1a', kind: 'primary text', title: 'Sūtra 1', meta: '12 min', url: 'https://x.test/1', action: 'Read', prompt: 'Who is reading?' },
  { season: 'fall-2026', week: '1', week_start: '2026-10-19', reading_id: 'f1b', kind: 'RECORDING', title: 'Talk', action: 'Listen', url: 'javascript:alert(1)' },
  { season: 'fall-2026', week: '2', week_start: '2026-10-26', reading_id: 'f2a', kind: 'COMMENTARY', title: 'Sūtra 2', prompt: 'Dear Lord…' },
  { season: 'fall-2026', week: '3', week_start: '2026-11-02', reading_id: 'f3a', title: 'Hidden', publish: 'No' },
  { season: 'winter-2027', week: '1', week_start: '2027-01-25', reading_id: 'w1', title: 'Other season' },
];
let p = R.weekPlan(rows, 'fall-2026', '2026-10-29', 2);
assert.equal(p.week, 2); assert.deepEqual(p.readings.map(r => r.id), ['f2a']); assert.equal(p.prompt, 'Dear Lord…');
p = R.weekPlan(rows, 'fall-2026', '2026-10-25', 1); // Sunday still belongs to week of Oct 19
assert.deepEqual(p.readings.map(r => r.id), ['f1a', 'f1b']); assert.equal(p.readings[1].url, '', 'non-https link dropped'); assert.equal(p.readings[1].action, 'Listen');
assert.equal(R.weekPlan(rows, 'fall-2026', '2026-11-04', 3).week, 2, 'a hidden week is skipped: the last published week stays');
assert.equal(R.weekPlan([], 'fall-2026', '2026-10-29', 2), null);
assert.equal(R.readingsOf(rows, 'fall-2026').length, 3);

// ---- posting title
const t = P.postTitle('Dear Lord, today I sat with the breath for a long long time and nothing happened at all, which was perfect', '2026-10-29T10:00:00Z');
assert.ok(t.startsWith('Thu 29 Oct — Dear Lord'), t); assert.ok(t.length <= 80, t.length);

// ---- diary: autosave, one draft, save, privacy between members
const maya = 'u1', sam = 'u2';
assert.equal(await S.getDraft(maya), null);
await S.saveDraft(maya, 'Dear', { season: 'fall-2026', week: 2, prompt: 'Dear Lord…' });
await S.saveDraft(maya, 'Dear Lord, today I sat.', { season: 'fall-2026', week: 2, prompt: 'changed later' });
let d = await S.getDraft(maya);
assert.equal(d.body, 'Dear Lord, today I sat.'); assert.equal(d.prompt, 'Dear Lord…', 'prompt is a snapshot from the first save'); assert.equal(d.week, 2);
assert.equal((await run`SELECT count(*)::int n FROM diary_entries`)[0].n, 1, 'one draft per member');
await assert.rejects(() => S.saveEntry(sam, ''), /Write something/);
const e1 = await S.saveEntry(maya);
assert.equal(e1.posted, false); assert.equal(await S.getDraft(maya), null);
await S.saveDraft(maya, 'Second thought', { season: 'fall-2026', week: 2 });
const e2 = await S.saveEntry(maya);
const list2 = await S.listEntries(maya);
assert.deepEqual(list2.map(e => e.body), ['Second thought', 'Dear Lord, today I sat.'], 'newest first');
assert.equal((await S.listEntries(sam)).length, 0, 'private to its writer');
assert.equal(await S.getEntry(sam, e1.id), null, 'cannot read or share another member’s entry');
assert.equal(await S.claimForPost(sam, e1.id), null);

// ---- sharing: off by default, never twice, failure leaves it private
let created = 0;
const realFetch = globalThis.fetch;
const viaSeason = { hub_space_id: 22, topic_ids: { reflections: 7 }, circle_slug: 'fall-heart' };
process.env.CIRCLE_HEADLESS_TOKEN = 'test'; process.env.CIRCLE_HEADLESS_BASE = 'http://circle.test';
let failNext = false;
globalThis.fetch = async (url, init = {}) => {
  if (String(url).includes('/auth_token')) return new Response(JSON.stringify({ access_token: 'tok', community_member_id: 5 }), { status: 200 });
  if (String(url).includes('/spaces/22/posts')) {
    if (failNext) return new Response(JSON.stringify({ message: 'nope' }), { status: 500 });
    created++; const b = JSON.parse(init.body);
    assert.equal(b.space_id, 22); assert.deepEqual(b.topics, [7]); assert.ok(b.name.length <= 80);
    return new Response(JSON.stringify({ post: { id: 900 + created, slug: 'p' + created } }), { status: 200 });
  }
  throw new Error('unexpected fetch ' + url);
};
const mayaS = { uid: maya, email: 'maya@example.com' };
let r = await SH.shareEntry(mayaS, viaSeason, e1);
assert.equal(r.shared, false); assert.match(r.error, /switched on/); assert.equal(created, 0, 'off by default');
process.env.PRACTICE_POST = 'live';
failNext = true;
r = await SH.shareEntry(mayaS, viaSeason, e1);
assert.equal(r.shared, false); assert.match(r.error, /Couldn’t post/); assert.equal((await S.getEntry(maya, e1.id)).posted, false, 'failed post stays private');
failNext = false;
const [a, b] = await Promise.all([SH.shareEntry(mayaS, viaSeason, e1), SH.shareEntry(mayaS, viaSeason, e1)]);
assert.equal(created, 1, 'double press makes one post'); assert.equal(a.shared && b.shared, true);
const shared = await S.getEntry(maya, e1.id);
assert.equal(shared.posted, true); assert.match(shared.postUrl, /fall-heart\/p1/);
r = await SH.shareEntry(mayaS, viaSeason, shared); assert.equal(created, 1, 'already shared: no second post');
globalThis.fetch = realFetch; delete process.env.PRACTICE_POST;

// ---- reading ticks
await S.setRead(maya, 'f1a', true); await S.setRead(maya, 'f1a', true); await S.setRead(maya, 'f2a', true); await S.setRead(maya, 'f2a', false);
assert.deepEqual([...await S.readIds(maya)], ['f1a']); assert.equal((await S.readIds(sam)).size, 0);

// ---- the page: totals, and nothing private for non-SS
await practice.logPractice({ uid: maya, email: 'maya@example.com', day: '2026-10-22', minutes: 30 });
await practice.logPractice({ uid: maya, email: 'maya@example.com', day: '2026-10-28', minutes: 45 });
const season = list[0];
const ssAccess = { isSS: true, season, week: 2 };
const view = await V.practiceView({ uid: maya, access: ssAccess, today: '2026-10-29' });
assert.equal(view.totals.sits, 2); assert.equal(view.totals.hours, 1.3); assert.equal(view.totals.diary, 2);
assert.equal(view.entries.length, 2); assert.equal(view.sit.weekCount, 1);
const other = await V.practiceView({ uid: maya, access: { isSS: false, season, week: 2 }, today: '2026-10-29' });
for (const k of ['plan', 'draft', 'entries']) assert.equal(k in other, false, `${k} must not be sent to non-SS`);
assert.deepEqual(Object.keys(other.totals).sort(), ['hours', 'sits']);
console.log('practice: all good');
