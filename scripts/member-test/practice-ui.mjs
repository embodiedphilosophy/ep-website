// The Circle Practice page in a real browser: a fake Circle page at /c/daily-practice, the real public/circle/practice.js, and
// a stand-in API that behaves like /api/practice/* (the real routes are covered by practice.mjs). Checks the SS and non-SS
// views, autosave, saving, posting, reading ticks, the timer and phone width. Screenshots go to $OUT (default scripts/ops-test/out).
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/practice-ui.mjs
import assert from 'assert/strict';
import fs from 'fs';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('../ops-test/pw.cjs');
const { summarise } = await import('../../lib/member/practice.js');
const OUT = process.env.OUT || new URL('../ops-test/out', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const js = fs.readFileSync(new URL('../../public/circle/practice.js', import.meta.url), 'utf8');
const HOST = 'https://ss.embodiedphilosophy.com', TODAY = '2026-10-29';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const season = { slug: 'fall-2026', title: 'Fall · The Heart of Recognition', short: 'Fall 2026', subtitle: '', hubSlug: 'fall-heart-of-recognition' };
const join = { enrol: 'https://enroll.embodiedphilosophy.com/sadhana-school', landing: 'https://www.embodiedphilosophy.com/sadhana-school' };
const b = await chromium.launch(); const errs = [];

async function open({ ss, vw = 1280, sharing = true }) {
  const ctx = await b.newContext({ viewport: { width: vw, height: 900 }, timezoneId: 'America/New_York' });
  const p = await ctx.newPage(); const calls = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-10-29T10:30:00-04:00') });
  const st = { sit: { ...summarise(['2026-10-27', '2026-10-28'], TODAY), qualities: [], extras: [] }, draft: null, entries: [{ id: 'old', body: 'An earlier line.', posted: false, at: '2026-10-22T12:00:00Z' }],
    readings: [{ id: 'r1', kind: 'PRIMARY TEXT', title: 'Sūtra 2', meta: '12 min', url: 'https://x.test/2', action: 'Read', read: false }, { id: 'r2', kind: 'RECORDING', title: 'Talk', meta: '', url: 'https://x.test/3', action: 'Listen', read: true }] };
  const view = () => ({ isSS: ss, today: TODAY, season, week: 2, sit: st.sit, join, totals: ss ? { sits: 3, hours: 1.5, readingsDone: st.readings.filter(r => r.read).length, readingsTotal: 6, diary: st.entries.length } : { sits: 3, hours: 1.5 },
    ...(ss ? { plan: { week: 2, readings: st.readings, done: st.readings.filter(r => r.read).length, prompt: 'What is it that is aware?' }, draft: st.draft, entries: st.entries, sharing } : {}) });
  await p.route(HOST + '/**', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><body style="margin:0"><div id="banner" style="height:64px;display:flex;justify-content:space-between"><h1>Daily practice</h1><button>New post</button></div><div class="container-type:inline-size bg-secondary" style="width:100%"><div id="orig">Circle’s own page</div></div><script>window.circleUser={signedIn:true,identityToken:"t"}</script><script src="https://www.embodiedphilosophy.com/circle/practice.js"></script></body>' }));
  await p.route('https://www.embodiedphilosophy.com/**', async r => {
    const u = new URL(r.request().url()), m = r.request().method(), path = u.pathname, body = JSON.parse(r.request().postData() || '{}');
    if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
    const j = (o, status = 200) => r.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(o) });
    if (path === '/circle/practice.js') return r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: js });
    calls.push(`${m} ${path} ${r.request().postData() || ''}`.trim());
    if (path === '/api/member/session') return j({ session: 's', tier: { tier: ss ? 'ss_year' : 'none', seasons: [] }, firstName: 'Maya' });
    if (path === '/api/practice/summary') return j(view());
    if (path === '/api/member/practice') { st.sit = { ...summarise(['2026-10-27', '2026-10-28', body.day], TODAY), qualities: [], extras: [] }; return j(st.sit); }
    if (path === '/api/practice/diary/draft') { st.draft = { body: body.body, updatedAt: new Date().toISOString() }; return j({ draft: st.draft }); }
    if (path === '/api/practice/diary/save') { const e = { id: 'new' + st.entries.length, body: body.body, posted: !!body.post, postUrl: body.post ? 'https://ss.embodiedphilosophy.com/c/x/p' : '', at: '2026-10-29T14:30:00Z' }; st.entries.unshift(e); st.draft = null; return j({ entry: e, shared: !!body.post }); }
    if (path.endsWith('/post')) { const e = st.entries.find(x => x.id === path.split('/')[4]); e.posted = true; e.postUrl = 'https://ss.embodiedphilosophy.com/c/x/q'; return j({ entry: e, shared: true }); }
    if (path.startsWith('/api/practice/readings/')) { st.readings.find(x => x.id === decodeURIComponent(path.split('/')[4])).read = body.read; return j({ ok: true }); }
    return j({});
  });
  await p.goto(HOST + '/c/daily-practice');
  await p.waitForSelector('.epq-h1', { timeout: 8000 });
  return { p, ctx, calls, st };
}
const noSideways = p => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// ---- not in Sādhana School: the sit, their totals, one locked card; nothing about readings or the diary
{
  const { p, ctx } = await open({ ss: false });
  assert.equal(await p.locator('#orig').isHidden(), true, 'Circle’s own page is hidden');
  assert.match(await p.locator('.epq-h1').innerText(), /Your practice\./);
  await p.waitForFunction(() => document.getElementById('banner').style.display === 'none'); // Circle's "Daily practice · New post" banner is hidden
  assert.equal(await p.locator('#epq-text').count(), 0); assert.equal(await p.locator('.epq-rd').count(), 0);
  assert.equal(await p.locator('.epq-lock').count(), 1);
  assert.match(await p.locator('.epq-side').innerText(), /Sits logged[\s\S]*3/); assert.doesNotMatch(await p.locator('.epq-side').innerText(), /Readings done|Diary entries/);
  await p.click('text=Join Sādhana School'); assert.equal(await p.locator('[role=dialog]').count(), 1);
  assert.match(await p.locator('[role=dialog] a').first().getAttribute('href'), /enroll\.embodiedphilosophy\.com/);
  await p.keyboard.press('Escape'); assert.equal(await p.locator('[role=dialog]').count(), 0);
  await p.screenshot({ path: `${OUT}/practice-nonss.png`, fullPage: true }); await ctx.close();
}

// ---- Sādhana School, desktop
{
  const { p, ctx, calls, st } = await open({ ss: true });
  assert.match(await p.locator('.epq-mono').first().innerText(), /PRACTICE · SĀDHANA SCHOOL · FALL · WEEK 2/i);
  assert.match(await p.locator('.epq-prompt').innerText(), /What is it that is aware/);
  assert.equal(await p.locator('label[for=epq-text]').count(), 1, 'the diary box has a label');
  // readings
  assert.equal(await p.locator('.epq-chk[aria-pressed=true]').count(), 1);
  await p.click('.epq-chk[data-id=r1]');
  assert.equal(await p.locator('.epq-chk[aria-pressed=true]').count(), 2); assert.match(await p.locator('.epq-side').innerText(), /Readings done\s*2 of 6/);
  assert.ok(calls.some(c => /^PUT \/api\/practice\/readings\/r1 .*"read":true/.test(c)));
  // autosave: not on every key, but ~1.5s after typing stops
  await p.click('#epq-text'); await p.keyboard.type('Dear Lord, today I sat.');
  assert.equal(calls.filter(c => c.startsWith('PUT /api/practice/diary/draft')).length, 0);
  await p.clock.runFor(1600); await p.waitForTimeout(100);
  assert.equal(calls.filter(c => c.startsWith('PUT /api/practice/diary/draft')).length, 1); assert.equal(st.draft.body, 'Dear Lord, today I sat.');
  assert.equal(await p.inputValue('#epq-text'), 'Dear Lord, today I sat.', 'typing is never wiped by a re-draw');
  // save privately → top of the list, marked Private
  await p.click('text=Save to my diary'); await p.waitForSelector('.epq-ent >> nth=0 >> text=Dear Lord, today I sat.'); // the new entry, not the older private one already listed
  assert.match(await p.locator('.epq-ent').first().innerText(), /Private/i);
  assert.match(await p.locator('.epq-ent').first().innerText(), /Dear Lord, today I sat\./); assert.equal(await p.inputValue('#epq-text'), '');
  // save & post → shared with a link
  await p.fill('#epq-text', 'Second line'); await p.click('text=Save & post to SS Reflections'); await p.waitForSelector('.epq-ent >> nth=0 >> text=Shared in SS Reflections');
  assert.equal(await p.locator('.epq-ent').first().locator('a:has-text("View post")').count(), 1);
  // post an older entry
  await p.click('.epq-ent >> text=Post to SS Reflections >> nth=0'); await p.waitForSelector('.epq-ent >> nth=1 >> text=Shared in SS Reflections'); assert.equal(await p.locator('.epq-ent >> text=Post to SS Reflections').count(), 1, 'only the oldest is still private');
  // empty save is refused kindly
  await p.click('text=Save to my diary'); assert.match(await p.locator('.epq-err').innerText(), /Write something/);
  // the sit: timer and log
  await p.click('[data-act=len][data-len="10"]'); assert.equal(await p.locator('[data-len="10"]').getAttribute('aria-pressed'), 'true');
  await p.click('[data-act=begin]'); assert.equal(await p.locator('[role=timer]').count(), 1);
  await p.clock.runFor(10 * 60 * 1000 + 2000); await p.waitForSelector('text=Sit complete · 10 min logged');
  assert.ok(calls.some(c => /^POST \/api\/member\/practice .*"minutes":10.*"add":true/.test(c)));
  await p.click('text=Log an earlier day'); await p.fill('[name=minutes]', '25'); await p.click('form >> text=Save'); await p.waitForSelector('text=/Logged · 25 min/');
  assert.ok(await noSideways(p)); await p.screenshot({ path: `${OUT}/practice-ss.png`, fullPage: true }); await ctx.close();
}

// ---- phone width: the columns stack, nothing scrolls sideways, tap targets are at least 44px
{
  for (const ss of [true, false]) {
    const { p, ctx } = await open({ ss, vw: 390 });
    assert.ok(await noSideways(p), `no sideways scroll (ss=${ss})`);
    const cols = await p.evaluate(() => { const m = document.querySelector('.epq-main').getBoundingClientRect(), s = document.querySelector('.epq-side').getBoundingClientRect(); return s.top >= m.bottom - 1; });
    assert.ok(cols, 'right column stacks underneath');
    const small = await p.evaluate(() => [...document.querySelectorAll('.epq button, .epq a.epq-q, .epq input')].filter(e => e.offsetParent && (e.getBoundingClientRect().height < 43.5 || e.getBoundingClientRect().width < 43.5)).map(e => e.textContent.trim() || e.name));
    assert.deepEqual(small, [], 'tap targets ≥ 44px');
    await p.screenshot({ path: `${OUT}/practice-${ss ? 'ss' : 'nonss'}-phone.png`, fullPage: true }); await ctx.close();
  }
}
await b.close();
assert.deepEqual(errs, [], 'no page errors');
console.log('practice ui: all good');
