// The Sahṛdaya Upāya page (/c/mentorship) in a real browser with tasks added in Ops → Mentee year (Mentee Schedule, kind task):
// the task shows in "This month" with "Open" and a checkbox; ticking posts to /api/member/year/tick and the row moves to "Completed tasks".
// Every row has a checkbox and a small Skip under it; Skip asks first (Cancel / Yes), and a skipped row is saved as status skipped.
// A fake Circle page, the real public/circle/sahrdaya.js, page data built with the real lib/ code. Run:
//   node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee-tasks-ui.mjs
import assert from 'assert/strict';
import fs from 'fs';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('../ops-test/pw.cjs');
const { buildWeek } = await import('../../lib/mentee/week.js');
const { buildHome } = await import('../../lib/mentee/home.js');
const { buildYear } = await import('../../lib/mentee/year.js');
const config = (await import('../../data/mentee.json', { with: { type: 'json' } })).default;
const OUT = process.env.OUT || new URL('../ops-test/out/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });

const TODAY = '2026-11-02', email = 'maya@x.test';
const task = { step_id: 't-2026-11-watch', kind: 'task', date: '2026-11-20', title: 'Watch the orientation recording', detail: 'Twenty minutes, before the first immersion.', link: 'https://ss.embodiedphilosophy.com/c/mentorship', publish: 'TRUE' };
const season = { slug: 'fall-2026', title: 'The Heart of Recognition', starts_on: '2026-10-21', ends_on: '2026-12-09' };
const empty = { today: TODAY, streak: 0, loggedToday: false, weekCount: 0, nextMilestone: 7, reached: null, grid: Array.from({ length: 8 }, () => Array.from({ length: 7 }, () => ({ state: 'future' }))) };
const week = buildWeek({ today: TODAY, tz: 'Europe/London', season, firstName: 'Maya', practice: empty, practiceDays: 0, formation: null, sessions: [], schedule: [], assignments: [], doneIds: new Set(), submissions: {}, reading: null, posts: [], feedback: [], launches: [], travelogue: [], unavailable: [], timing: {} });
const year = buildYear({ scheduleRows: [task], monthRows: [], statusRows: [], email, today: TODAY });
year.ticksOk = true;
const data = buildHome(week, { config, today: TODAY, tz: 'Europe/London', partner: null, year, slots: [], booked: null, chat: [], questions: [], reflections: { mine: null, unread: 0, posted: [] }, polls: [], books: { current: null, next: null }, workbook: null, uid: 'u1', filesOn: false, cosign: [], cohort: [], cues: [], circlePosts: [] });
assert.equal(data.home.year.tasks.length, 1);
// Rows changed in Ops → Mentee year (home.monthRows, from the Mentee Month Rows tab)
data.home.immersion.satLink = 'https://zoom.us/j/111'; data.home.immersion.sunLink = 'https://zoom.us/j/222';
data.home.monthOrder = ['t-2026-11-watch', 'reflection'];
data.home.monthRows = { reflection: { title: 'Your first reflection, gently', line: 'One page is plenty.', hide: false } };

const script = fs.readFileSync(new URL('../../public/circle/sahrdaya.js', import.meta.url), 'utf8');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 1400 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
let ticked = null; const ticks = [];
await p.route('https://ss.example.test/**', r => r.fulfill({ contentType: 'text/html', body: `<html><head><meta charset="utf-8"></head><body><div data-testid="circle-ai-shell-workspace-body"><div>feed</div></div><script>window.circleUser={signedIn:true,email:'${email}',identityToken:'t'};</script><script>${script.replace(/<\/script>/g, '<\\/script>')}</script></body></html>` }));
await p.route('https://www.embodiedphilosophy.com/**', async r => {
  const u = new URL(r.request().url()), cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  if (u.pathname === '/api/member/session') return r.fulfill({ headers: cors, json: { session: 's', firstName: 'Maya', tier: { tier: 'mentee' } } });
  if (u.pathname === '/api/member/this-week') return r.fulfill({ headers: cors, json: data });
  if (u.pathname === '/api/member/year/tick') { ticked = JSON.parse(r.request().postData()); ticks.push(ticked); return r.fulfill({ headers: cors, json: { ok: true } }); }
  return r.fulfill({ headers: cors, status: 404, json: { error: 'not in this test' } });
});
await p.goto('https://ss.example.test/c/mentorship');
const row = p.locator('.esu-mrow', { hasText: 'Watch the orientation recording' });
await row.waitFor({ timeout: 15000 });
assert.ok(await row.getByRole('link', { name: 'Open' }).count(), 'Open button for the link');
await row.screenshot({ path: OUT + 'mentee-task-row.png' });
await p.locator('.esu-month').screenshot({ path: OUT + 'mentee-task-month.png' });
const month = p.locator('.esu-month');
const firsts = await month.locator('.esu-mrow .esu-rw-t').allInnerTexts();
assert.deepEqual(firsts.slice(0, 2), ['Watch the orientation recording', 'Your first reflection, gently'], 'the order set in Ops');
assert.ok(await month.getByText('Your first reflection, gently').count() && await month.getByText('One page is plenty.').count(), 'reworded row');
// every open row has a checkbox and a skip, the buddy row included
const buddy = month.locator('.esu-mrow', { hasText: 'Your articulation partner is on the way' });
assert.equal(await buddy.getByRole('checkbox').count(), 1, 'the buddy row can be ticked');
assert.equal(await buddy.getByRole('button', { name: 'skip' }).count(), 1, 'and skipped');
const nOpen = await month.locator('.esu-mlist:not(.esu-mdone) > .esu-mrow').count();
// tick the task: it leaves the list for Completed
await row.getByRole('checkbox').click();
await p.waitForFunction(() => !document.querySelector('.esu-month .esu-mlist:not(.esu-mdone)')?.innerText.includes('Watch the orientation recording'));
assert.deepEqual([ticked.id, ticked.status], ['t-2026-11-watch', 'done']);
assert.equal(await month.locator('.esu-mlist:not(.esu-mdone) > .esu-mrow').count(), nOpen - 1, 'one row fewer in the list');
assert.ok(await month.getByText(/1 of \d+ done/).count(), 'the month counts it');
await month.getByRole('button', { name: 'Completed tasks (1)' }).click();
assert.ok(await month.locator('.esu-mdone').getByText('Watch the orientation recording').count(), 'it is under Completed');
// skip the buddy row: the question first; Cancel leaves it alone
await buddy.getByRole('button', { name: 'skip' }).click();
const q = p.getByRole('alertdialog');
assert.ok(await q.getByText('If you skip this, it will go onto your student report as not having been completed. Do you want to Skip?').count());
await p.screenshot({ path: OUT + 'mentee-skip-ask.png' });
const before = ticks.length;
await q.getByRole('button', { name: 'Cancel' }).click();
assert.equal(await p.getByRole('alertdialog').count(), 0); assert.equal(ticks.length, before, 'Cancel saves nothing');
await month.locator('.esu-mrow', { hasText: 'Your articulation partner is on the way' }).getByRole('button', { name: 'skip' }).click();
await p.getByRole('alertdialog').getByRole('button', { name: 'Yes' }).click();
await month.locator('.esu-mdone').getByText('Skipped').waitFor({ timeout: 5000 });
assert.deepEqual([ticked.id, ticked.status], ['m:2026-11:buddy', 'skipped']);
assert.ok(await month.getByText(/· 1 skipped/).count(), 'the tally names the skip');
await month.screenshot({ path: OUT + 'mentee-month-completed.png' });
// Undo puts it back
await month.locator('.esu-mdone .esu-mrow', { hasText: 'Your articulation partner is on the way' }).getByRole('button', { name: 'Undo' }).click();
await month.locator('.esu-mlist:not(.esu-mdone) .esu-mrow', { hasText: 'Your articulation partner is on the way' }).waitFor({ timeout: 5000 });
assert.deepEqual([ticked.id, ticked.status], ['m:2026-11:buddy', 'undone']);
const hero = p.locator('.esu-mrow.hero').first();
assert.equal(await hero.getByRole('checkbox').count(), 1, 'the immersion can be ticked too');
assert.equal(await hero.getByRole('link', { name: 'Join Saturday’s Open Session' }).getAttribute('href'), 'https://zoom.us/j/111');
assert.equal(await hero.getByRole('link', { name: 'Join Sunday’s Practicum' }).getAttribute('href'), 'https://zoom.us/j/222');
await hero.screenshot({ path: OUT + 'immersion-hero.png' });
assert.deepEqual(errs, []);
await b.close();
console.log('mentee tasks ui: ok');
