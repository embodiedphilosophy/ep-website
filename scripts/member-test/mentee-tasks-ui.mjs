// The Sahṛdaya Upāya page (/c/mentorship) in a real browser with tasks added in Ops → Mentee year (Mentee Schedule, kind task):
// the task shows in "This month" with "Open" and "Mark done", the tick posts to /api/member/year/tick and the row turns Done.
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

const script = fs.readFileSync(new URL('../../public/circle/sahrdaya.js', import.meta.url), 'utf8');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 1400 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
let ticked = null;
await p.route('https://ss.example.test/**', r => r.fulfill({ contentType: 'text/html', body: `<html><head><meta charset="utf-8"></head><body><div data-testid="circle-ai-shell-workspace-body"><div>feed</div></div><script>window.circleUser={signedIn:true,email:'${email}',identityToken:'t'};</script><script>${script.replace(/<\/script>/g, '<\\/script>')}</script></body></html>` }));
await p.route('https://www.embodiedphilosophy.com/**', async r => {
  const u = new URL(r.request().url()), cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  if (u.pathname === '/api/member/session') return r.fulfill({ headers: cors, json: { session: 's', firstName: 'Maya', tier: { tier: 'mentee' } } });
  if (u.pathname === '/api/member/this-week') return r.fulfill({ headers: cors, json: data });
  if (u.pathname === '/api/member/year/tick') { ticked = JSON.parse(r.request().postData()); return r.fulfill({ headers: cors, json: { ok: true } }); }
  return r.fulfill({ headers: cors, status: 404, json: { error: 'not in this test' } });
});
await p.goto('https://ss.example.test/c/mentorship');
const row = p.locator('.esu-mrow', { hasText: 'Watch the orientation recording' });
await row.waitFor({ timeout: 15000 });
assert.ok(await row.getByRole('link', { name: 'Open' }).count(), 'Open button for the link');
await row.screenshot({ path: OUT + 'mentee-task-row.png' });
await p.locator('.esu-month').screenshot({ path: OUT + 'mentee-task-month.png' });
await row.getByRole('button', { name: 'Mark done' }).click();
await p.locator('.esu-month').screenshot({ path: OUT + 'mentee-task-after.png' }).catch(() => {});
await row.getByRole('button', { name: 'Done ✓' }).waitFor({ timeout: 5000 });
assert.deepEqual([ticked.id, ticked.done], ['t-2026-11-watch', true]);
assert.ok(await p.locator('.esu-month').getByText(/of \d+ done/).count(), 'the month counts it');
assert.deepEqual(errs, []);
await b.close();
console.log('mentee tasks ui: ok');
