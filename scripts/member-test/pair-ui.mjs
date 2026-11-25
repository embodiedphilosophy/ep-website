// The articulation partner chooser on the Sahṛdaya Upāya page (/c/mentorship): with no partner, the row says "Choose your articulation partner
// for November" and opens a list of the people still free; choosing posts to /api/member/this-week/pair. When everyone else is paired,
// the person left over sees "Join a pair" and can make a three. With a partner, "Change" lets them leave. Real public/circle/sahrdaya.js. Run:
//   node --import ./scripts/ce-test/register.mjs scripts/member-test/pair-ui.mjs
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
const free = { on: true, month: '2026-11', open: [{ email: 'ana@x.test', name: 'Ana Ruiz' }, { email: 'ben@x.test', name: 'Ben Ode' }], joinable: [], alone: false, cohortSize: 3 };
const left = { on: true, month: '2026-11', open: [], joinable: [{ id: '7', names: ['Ana Ruiz', 'Ben Ode'] }], alone: true, cohortSize: 3 };
const paired = JSON.parse(JSON.stringify(data));
paired.home.partner = { month: '2026-11', name: 'Ana Ruiz', email: 'ana@x.test', partners: [{ email: 'ana@x.test', name: 'Ana Ruiz', where: '' }], chatUrl: '', window: null };
paired.home.pairing = { on: true, month: '2026-11', open: [], joinable: [], alone: false };
let current = JSON.parse(JSON.stringify(data)); current.home.pairing = free;
const posts = [];

const script = fs.readFileSync(new URL('../../public/circle/sahrdaya.js', import.meta.url), 'utf8');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 1400 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
await p.route('https://ss.example.test/**', r => r.fulfill({ contentType: 'text/html', body: `<html><head><meta charset="utf-8"></head><body><div data-testid="circle-ai-shell-workspace-body"><div>feed</div></div><script>window.circleUser={signedIn:true,email:'${email}',identityToken:'t'};</script><script>${script.replace(/<\/script>/g, '<\\/script>')}</script></body></html>` }));
await p.route('https://www.embodiedphilosophy.com/**', async r => {
  const u = new URL(r.request().url()), cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  if (u.pathname === '/api/member/session') return r.fulfill({ headers: cors, json: { session: 's', firstName: 'Maya', tier: { tier: 'mentee' } } });
  if (u.pathname === '/api/member/this-week') return r.fulfill({ headers: cors, json: current });
  if (u.pathname === '/api/member/this-week/pair') { const body = JSON.parse(r.request().postData()); posts.push(body); return r.fulfill({ headers: cors, json: body.action === 'leave' ? (() => { const x = JSON.parse(JSON.stringify(data)); x.home.pairing = free; return x; })() : paired }); }
  return r.fulfill({ headers: cors, status: 404, json: { error: 'not in this test' } });
});

// 1. No partner yet: the month row and the tile both offer "Choose"
await p.goto('https://ss.example.test/c/mentorship');
const month = p.locator('.esu-month');
const row = month.locator('.esu-mrow', { hasText: 'Choose your articulation partner for November' });
await row.waitFor({ timeout: 15000 });
assert.ok(await row.getByText('2 people are still free').count(), 'how many are free');
assert.ok(await p.locator('.esu-ptile', { hasText: 'Choose your articulation partner for November' }).count(), 'the Practice with others tile says the same');
await row.getByRole('button', { name: 'Choose' }).click();
const dlg = p.locator('.esu-modal, [role="dialog"]').first();
await p.getByRole('button', { name: 'Partner with Ana' }).waitFor({ timeout: 5000 });
await p.screenshot({ path: OUT + 'pair-choose.png' });
await p.getByRole('button', { name: 'Partner with Ana' }).click();
await month.locator('.esu-mrow', { hasText: 'Meet your articulation partner' }).waitFor({ timeout: 5000 });
assert.deepEqual(posts[0], { ...posts[0], action: 'choose', email: 'ana@x.test' }, 'choosing posts the partner');
assert.ok(await month.getByText(/Meet your articulation partner.*Ana/).count(), 'the row now names the partner');

// 2. Change: leave the pair, and the list comes back
await month.locator('.esu-mrow', { hasText: 'Meet your articulation partner' }).getByRole('button', { name: 'Change' }).click();
await p.getByRole('button', { name: 'Leave this pair' }).click();
await p.getByRole('button', { name: 'Partner with Ana' }).waitFor({ timeout: 5000 });
assert.equal(posts[1].action, 'leave');

// 3. The one left over joins a pair to make a three
current = JSON.parse(JSON.stringify(data)); current.home.pairing = left;
await p.goto('https://ss.example.test/c/mentorship');
const lrow = p.locator('.esu-month .esu-mrow', { hasText: 'Join a pair for November' });
await lrow.waitFor({ timeout: 15000 });
await lrow.getByRole('button', { name: 'Join a pair' }).click();
await p.getByRole('button', { name: 'Join them' }).waitFor({ timeout: 5000 });
assert.ok(await p.getByText('Ana Ruiz and Ben Ode').count(), 'the pair is named');
await p.screenshot({ path: OUT + 'pair-join.png' });
await p.getByRole('button', { name: 'Join them' }).click();
await p.waitForTimeout(300);
assert.deepEqual([posts[2].action, posts[2].group], ['join', '7']);

// phone width: the chooser fits
await p.setViewportSize({ width: 390, height: 900 });
current = JSON.parse(JSON.stringify(data)); current.home.pairing = free;
await p.goto('https://ss.example.test/c/mentorship');
await p.locator('.esu-month .esu-mrow', { hasText: 'Choose your articulation partner' }).getByRole('button', { name: 'Choose' }).click();
await p.getByRole('button', { name: 'Partner with Ben' }).waitFor({ timeout: 5000 });
const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
assert.ok(over <= 1, 'no sideways scroll at phone width');
await p.screenshot({ path: OUT + 'pair-phone.png' });
assert.deepEqual(errs, [], 'no page errors');
await b.close();
console.log('pair ui: ok');
