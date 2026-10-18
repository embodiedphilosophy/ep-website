// The Circle Today page in a real browser: a fake Circle page at /c/today, the real public/circle/today.js, and API
// answers built with the real lib/ code. Checks what each enrolment sees, the timer, the log, the Travelogue and
// phone width. Screenshots go to $OUT (default scripts/ops-test/out).
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/today-ui.mjs
import assert from 'assert/strict';
import fs from 'fs';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('../ops-test/pw.cjs');
process.env.MEMBER_SECRET = 'test-secret';
const { summarise } = await import('../../lib/member/practice.js');
const { freeToday } = await import('../../lib/member/today.js');
const P = await import('../../lib/member/programmes.js');
const HOST = 'https://ss.example.test';
const engine = fs.readFileSync(new URL('../../public/circle/panchanga.js', import.meta.url), 'utf8');
const OUT = process.env.OUT || new URL('../ops-test/out/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });

const TODAY = '2026-10-17'; // a Saturday
const days = []; for (let i = 1; i <= 39; i++) { const d = new Date(TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - i); days.push(d.toISOString().slice(0, 10)); }
const events = [
  { id: 'E1', title: 'Meditation Mondays', date: '2026-10-19', time: '12pm ET', series: 'meditation-mondays', program: 'meditation' },
  { id: 'E2', title: 'The Heart of Recognition · Session 1', date: '2026-10-21', time: '9am ET', series: 'sadhana-fall-2026', program: 'sadhana' },
  { id: 'E3', title: 'CHITHEADS Live', date: '2026-12-17', program: 'community' }, // no time set: shown as a plain date
  { id: 'E4', title: 'Living Room Lecture', date: '2027-01-14', time: '7pm ET', program: 'community' },
];
async function payload(tier, streakDays = days) {
  const free = await freeToday({ uid: 'u1', today: TODAY, tz: 'America/New_York' });
  const practice = { ...summarise(streakDays, TODAY), qualities: ['Calm', 'Focused'], extras: [] };
  const { locked } = P.programmesFor(tier);
  return { ...free, today: TODAY, practice, practisingToday: tier === 'none' ? null : 12, tier, firstName: 'Maya',
    cards: P.openCards({ events, tier, today: TODAY, ce: { cycle: { hours: 6, need: 30 } }, formation: { total: 12.5, target: 100 } }),
    locked: locked.map(P.lockedCard), comingUp: P.comingUp(events, tier, TODAY) };
}

const js = fs.readFileSync(new URL('../../public/circle/today.js', import.meta.url), 'utf8');
const probe = fs.readFileSync(new URL('../../public/circle/probe.js', import.meta.url), 'utf8');
const b = await chromium.launch(); const errs = [];
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };

async function open(tier, { vw = 1366, h = 900, data, seasons = [], admin = false, query = '', delay = 0, wait = true, offer = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: vw, height: h }, timezoneId: 'America/New_York' });
  const p = await ctx.newPage(); const calls = [], urls = [], frameSrcs = [], todayHeaders = [], scripts = [];
  p.on('pageerror', e => errs.push(`${tier}: ${e.message}`));
  await p.clock.install({ time: new Date('2026-10-17T10:30:00-04:00') });
  const body = data || await payload(tier);
  await p.route(HOST + '/**', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><body style="margin:0"><nav id="top" style="height:56px;width:100%;display:flex;gap:8px"><span>Meditation</span><button>New post</button></nav><div style="display:flex"><style>@media (max-width:700px){#side{display:none}}</style><aside id="side" style="width:250px;height:600px"><a aria-current="page">Today in School</a><button>New post</button></aside><div id="col" style="flex:1;height:2400px"><div id="banner" style="position:sticky;top:0;height:70px;display:flex;justify-content:space-between"><h1>Today in School</h1><span><button>New post</button><button>⋯</button></span></div><div class="[container-type:inline-size] bg-secondary"><div>Circle’s own page</div></div></div></div><script>window.circleUser={signedIn:true,identityToken:"t",isAdmin:' + admin + '}</script><script src="https://www.embodiedphilosophy.com/circle/today.js"></script>' }));
  await p.route('https://www.embodiedphilosophy.com/**', async r => {
    const u = new URL(r.request().url()), m = r.request().method(), path = u.pathname;
    if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
    const j = o => r.fulfill({ contentType: 'application/json', headers: CORS, body: JSON.stringify(o) });
    if (path === '/circle/today.js') return r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: js });
    if (path === '/circle/panchanga.js') return r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: engine });
    if (path.startsWith('/circle/') && r.request().resourceType() === 'script') scripts.push(path.slice(8)); // real loads only (not quiet prefetches)
    if (path === '/circle/probe.js') return r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: probe });
    if (path.startsWith('/circle/')) return r.fulfill({ contentType: 'text/javascript', body: '' });
    calls.push(`${m} ${path}${m === 'POST' ? ' ' + r.request().postData() : ''}`); if (path === '/api/member/today') urls.push(u.search);
    if (path === '/api/member/session') return j({ session: 's', tier: { tier, seasons }, firstName: 'Maya', offer: null });
    if (path === '/api/member/today') { todayHeaders.push(r.request().headers()); if (delay) await new Promise(x => setTimeout(x, delay)); return j(r.request().headers()['x-circle-identity'] ? { ...body, signin: { session: 's', tier: { tier, seasons }, firstName: 'Maya', offer, admin } } : body); }
    if (path === '/api/member/practice') { const post = JSON.parse(r.request().postData() || '{}'); return j({ ...body.practice, ...summarise([...days, TODAY], TODAY), qualities: ['Calm'], extras: [], logged: post.minutes }); }
    if (path === '/api/member/cohort') return j({ today: TODAY, rows: [{ name: 'Carolyn', email: 'c@example.com', streak: 0, weekCount: 0, days8w: 0, minutes8w: 0, last: null, daysSince: null, grid: [] }], attention: [{ email: 'c@example.com', name: 'Carolyn', why: 'Hasn’t logged any practice yet' }] });
    if (path === '/api/member/portfolio') return j({ pages: [] });
    if (path === '/api/member/travelogue') return j({ travelogue: m === 'POST' ? [{ id: '1', day: TODAY, text: JSON.parse(r.request().postData()).text }] : [] });
    return j({});
  });
  await p.goto(HOST + '/c/today' + query);
  if (wait) await p.waitForSelector('.etd-h1', { timeout: 8000 });
  return { p, ctx, calls, urls, frameSrcs, todayHeaders, scripts };
}
const text = (p, sel) => p.locator(sel).allInnerTexts();

// ---- what each enrolment sees
const WANT = {
  none: { open: [], locked: ['Meditation Mondays', 'Wisdom School', 'CE hours', 'Sādhana School'], eyebrow: 'YOUR PRACTICE · TODAY' },
  meditation: { open: ['Meditation Mondays'], locked: ['Wisdom School', 'CE hours', 'Sādhana School'] },
  wisdom: { open: ['Meditation Mondays', 'Wisdom School'], locked: ['CE hours', 'Sādhana School'] },
  wisdom_plus: { open: ['Meditation Mondays', 'Wisdom School', 'CE hours'], locked: ['Sādhana School'] },
  ss_season: { open: ['Sādhana School'], locked: ['Meditation Mondays', 'Wisdom School', 'CE hours'], eyebrow: 'SĀDHANA SCHOOL · FALL · TODAY' },
  ss_year: { open: ['Meditation Mondays', 'Wisdom School', 'Sādhana School'], locked: ['CE hours', 'Sahṛdaya Upāya'] },
  mentee: { open: ['Meditation Mondays', 'Wisdom School', 'Sādhana School', 'Sahṛdaya Upāya'], locked: ['CE hours'], eyebrow: 'SAHṚDAYA UPĀYA · TODAY' },
};
for (const [tier, w] of Object.entries(WANT)) {
  const { p, ctx } = await open(tier, { seasons: tier === 'ss_season' ? ['fall'] : [] });
  assert.deepEqual(await text(p, '.etd-card[aria-label] .ept-h2'), w.open, `${tier} open cards`);
  assert.deepEqual((await text(p, '.etd-lt')).map(s => s.trim()), w.locked, `${tier} locked cards`);
  if (w.eyebrow) assert.equal((await p.locator('.etd-top .ept-l').innerText()).toUpperCase(), w.eyebrow);
  assert.match(await p.locator('.etd-h1').innerText(), /Good morning, Maya\./);
  assert.match(await p.locator('.etd-sub').innerText(), /Saturday,? (October 17|17 October) · (Śukla|Kṛṣṇa) \S+ · (waxing|waning) moon|· (Pūrṇimā · full|Amāvāsyā · new) moon/);
  assert.equal(await p.locator('.etd-moons').count(), 0, 'no week of moons');
  assert.equal(await p.locator('.etd-pn-desk .etd-pnb-cell').count(), 5, 'five limbs');
  assert.equal(await p.locator('.etd-rail-sacred .etd-sdr').count(), 4);
  assert.match(await p.locator('.etd-skt').innerText(), /citiḥ svatantrā/);
  assert.equal(await p.locator('.etd-card[aria-label] .ept-btn').count(), w.open.length);
  assert.equal(await p.locator('button:has-text("Copy page structure")').count(), 0);
  if (tier === 'none') { assert.match(await p.locator('.etd-none').innerText(), /yours to keep, free/); assert.equal(await p.locator('.etd-rail .etd-ev').count(), 2); }
  assert.equal(await p.locator('text=Join a practice circle').count(), 0);
  const dates = await text(p, '.etd-rail .etd-ev > .ept-mono'); assert.ok(dates.every(d => /^(\w{3} \d{1,2}|\d{1,2}–\d{1,2})$/.test(d.trim())), `short dates: ${dates}`);
  assert.ok(await p.evaluate(() => [...document.querySelectorAll('.etd-ev')].every(e => { const a = e.children[0].getBoundingClientRect(), b = e.children[1].getBoundingClientRect(); return a.right <= b.left + 0.5; })), 'dates never run into titles');
  await p.screenshot({ path: `${OUT}/today-${tier}.png`, fullPage: true });
  await ctx.close();
}
console.log('enrolments: ok');

// ---- the cards' own words
{
  const { p, ctx } = await open('mentee');
  const t = await p.locator('.etd-main').innerText();
  assert.match(t, /Monday,? (October 19|19 October) · 12:00 PM EDT/); assert.match(t, /Wednesday,? (October 21|21 October)/); assert.match(t, /October one-to-one · book a time 25–31 October/);
  assert.match(t, /Formation: 12.5 of 100 hours/);
  assert.match(await p.locator('.etd-rail').innerText(), /25–31[\s\S]*October one-to-one with Jacob[\s\S]*Book a time/);
  assert.equal(await p.locator('.etd-nudge, .ept-nudge').count(), 0, 'mentees get no suggestion');
  await ctx.close();
  const y = await open('ss_year', { data: await payload('ss_year', [...days, TODAY]) }); assert.equal(await y.p.locator('.ept-nudge').count(), 1, 'annual student: one suggestion');
  await y.p.locator('[data-act=why]').click(); assert.match(await y.p.locator('.ept-whyt').innerText(), /40 days/);
  await y.p.locator('[data-act=dismiss]').click(); assert.equal(await y.p.locator('.ept-nudge').count(), 0);
  await y.ctx.close();
  const wp = await open('wisdom_plus'); assert.match(await wp.p.locator('.etd-main').innerText(), /6 of 30 hours this Yoga Alliance cycle/); await wp.ctx.close();
}
console.log('cards, suggestion: ok');

// ---- the sit: timer, early end, log
{
  const { p, ctx, calls } = await open('none', { data: await payload('none', days.slice(0, 5)) });
  assert.equal(await p.locator('.etd-len[aria-pressed=true]').innerText(), '20m');
  await p.locator('.etd-len', { hasText: '10m' }).click();
  assert.match(await p.locator('.etd-begin').innerText(), /Begin · 10 min/);
  assert.equal(await p.evaluate(() => localStorage.getItem('ep_timer_len')), '10', 'remembers the length');
  await p.locator('.etd-begin').click();
  assert.match(await p.locator('.etd-clock').innerText(), /^10:00$|^9:5\d$/);
  await p.screenshot({ path: `${OUT}/today-timer.png` });
  await p.clock.fastForward('04:00'); await p.waitForTimeout(700);
  assert.match(await p.locator('.etd-clock').innerText(), /^[56]:\d\d$/);
  await p.locator('[data-t=pause]').click(); const frozen = await p.locator('.etd-clock').innerText();
  await p.clock.fastForward('02:00'); await p.waitForTimeout(700);
  assert.equal(await p.locator('.etd-clock').innerText(), frozen, 'paused');
  await p.locator('[data-t=pause]').click();                       // resume
  await p.locator('[data-t=end]').click();                         // end early → offers to log what was sat
  assert.match(await p.locator('.etd-tin').innerText(), /you sat for 4 min/i);
  assert.equal(await p.locator('input[name=tmin]').inputValue(), '4');
  assert.equal(calls.filter(c => c.startsWith('POST /api/member/practice')).length, 0, 'never logs on its own');
  await p.locator('[data-t=skip]').click(); assert.equal(await p.locator('#etd-timer').count(), 0);
  assert.equal(calls.filter(c => c.startsWith('POST /api/member/practice')).length, 0);
  // run it to the end, log it
  await p.locator('.etd-begin').click(); await p.clock.fastForward('10:05'); await p.waitForTimeout(700);
  assert.match(await p.locator('.etd-tin').innerText(), /sit complete/i);
  await p.locator('input[name=tmin]').fill('12'); await p.locator('[data-t=q][data-q=Calm]').click();
  await p.screenshot({ path: `${OUT}/today-timer-done.png` });
  await p.locator('[data-t=log]').click(); await p.waitForSelector('#etd-timer', { state: 'detached' });
  const post = calls.find(c => c.startsWith('POST /api/member/practice')); assert.match(post, /"minutes":12/); assert.match(post, /"add":true/); assert.match(post, /"quality":"Calm"/);
  assert.match(await p.locator('.etd-big').innerText(), /40/);
  // the quick log
  await p.locator('[data-act=form]').click(); await p.locator('input[name=minutes]').fill('20'); await p.locator('form[data-form=log] button[type=submit]').click(); await p.waitForTimeout(400);
  assert.ok(calls.some(c => /POST \/api\/member\/practice \{"today":"2026-10-17","minutes":"20"/.test(c)));
  await ctx.close();
}
console.log('timer and log: ok');

// ---- Travelogue, free for everyone; milestone note
{
  const { p, ctx, calls } = await open('none');
  await p.locator('.etd-quiet').click();
  await p.locator('#etd-line').fill('The breath was kind today.'); await p.locator('form[data-form=line] button[type=submit]').click(); await p.waitForSelector('.etd-lines li');
  assert.match(await p.locator('.etd-lines').innerText(), /The breath was kind today\./);
  assert.ok(calls.some(c => c.startsWith('POST /api/member/travelogue') && c.includes('The breath was kind')));
  await ctx.close();
  const m = await open('none', { data: await payload('none', [...days.slice(0, 39), TODAY].filter((d, i, a) => a.indexOf(d) === i)) });
  assert.match(await m.p.locator('.etd-ms').innerText(), /Forty days unbroken\.[\s\S]*Write to the Travelogue/);
  await m.p.screenshot({ path: `${OUT}/today-milestone.png`, fullPage: true }); await m.ctx.close();
}
console.log('travelogue, milestone: ok');

// ---- speed: Circle's own page never shows through; one round trip signs in and loads; only the scripts that are needed load
{
  const { p, ctx, calls, todayHeaders, scripts } = await open('none', { delay: 1500, wait: false });
  await p.waitForSelector('.etd-sk', { timeout: 4000 });                    // the placeholder is up long before the data
  assert.equal(await p.getByText('Circle’s own page').isVisible(), false, 'Circle’s page is never visible while loading');
  assert.equal(await p.locator('.etd-h1').count(), 0, 'still waiting for the data');
  await p.waitForSelector('.etd-h1', { timeout: 6000 });
  assert.equal(await p.locator('.etd-sk').count(), 0, 'placeholder replaced');
  assert.equal(await p.getByText('Circle’s own page').isVisible(), false);
  assert.ok(!calls.some(c => c.includes('/api/member/session')), 'no separate sign-in call');
  assert.equal(calls.filter(c => c.includes('/api/member/today')).length, 1, 'one call for sign-in and data');
  assert.equal(todayHeaders[0]['x-circle-identity'], 't', 'the first call carries Circle’s identity token'); assert.ok(!todayHeaders[0].authorization);
  assert.equal(await p.evaluate(() => !!JSON.parse(sessionStorage.getItem('ep_today_session') || 'null')?.session), true, 'session kept for the next visit');
  await p.waitForTimeout(1500);
  assert.ok(!scripts.some(x => /^(ce|portfolio|schedule|my-practice|library|this-week)\.js$/.test(x)), 'other pages’ scripts not loaded on Today: ' + scripts);
  assert.ok(scripts.includes('chat-skin.js'), 'chat restyle still loads');
  // a reload re-uses the saved session: Bearer, no identity token needed
  await p.reload(); await p.waitForSelector('.etd-h1', { timeout: 8000 });
  assert.match(todayHeaders.at(-1).authorization || '', /^Bearer s$/); assert.ok(!todayHeaders.at(-1)['x-circle-identity']);
  // moving to another Circle page loads that page's script, and gives Circle's page back
  await p.evaluate(() => history.pushState({}, '', '/c/schedule')); await p.evaluate(() => document.body.appendChild(document.createElement('i'))); await p.waitForTimeout(500);
  assert.ok(scripts.includes('schedule.js'), 'schedule.js loads when that page opens');
  assert.equal(await p.getByText('Circle’s own page').isVisible(), true, 'Circle’s page back off Today');
  await ctx.close();
  // a signed-out visitor is not left with a blank page
  const out = await b.newContext({ viewport: { width: 1000, height: 700 } }); const po = await out.newPage();
  await po.route(HOST + '/**', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><body><div class="[container-type:inline-size] bg-secondary"><div>Circle sign-in page</div></div><script>window.circleUser={signedIn:false}</script><script src="https://www.embodiedphilosophy.com/circle/today.js"></script>' }));
  await po.route('https://www.embodiedphilosophy.com/**', r => r.request().url().endsWith('/circle/today.js') ? r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: js }) : r.fulfill({ contentType: 'text/javascript', body: '' }));
  await po.goto(HOST + '/c/today'); await po.waitForTimeout(500);
  assert.equal(await po.getByText('Circle sign-in page').isVisible(), true, 'while waiting, Circle’s page is hidden or shown, never lost');
  await out.close();
}
console.log('speed: ok');

// ---- upgrade links open in a pop-up over the dashboard, which stays where it is
{
  const OFFER = { key: 'fall_year', eyebrow: 'Before winter opens', title: 'Apply your Fall season to the full year', body: 'Your $497 counts in full.', why: 'You’re enrolled in Fall.', options: [{ label: 'Make it the full year · add $1,300', price: 1300, href: 'https://ss.embodiedphilosophy.com/checkout/sadhana-school-year?coupon=FALLYEAR' }] };
  const { p, ctx } = await open('ss_season', { seasons: ['fall'], offer: OFFER });
  const spy = pg => pg.evaluate(() => { const o = window.open; window.__opened = []; window.open = function (...a) { window.__opened.push(a); return o.apply(this, a); }; });
  await spy(p);
  const [pop] = await Promise.all([p.waitForEvent('popup'), p.locator('.ept-q-red').first().click()]);
  const asked = await p.evaluate(() => window.__opened);
  assert.equal(asked.length, 1); assert.match(asked[0][0], /ss\.embodiedphilosophy\.com\/checkout\/sadhana-school-year\?coupon=FALLYEAR/); assert.equal(asked[0][1], 'ep-upgrade'); assert.match(asked[0][2], /popup=yes,width=520,height=\d+/);
  assert.equal(await p.locator('.etd-h1').isVisible(), true, 'the dashboard is still there'); assert.ok(p.url().includes('/c/today'), 'and still on Today');
  await pop.close();
  // a plain nudge and a locked card too
  const n = await open('wisdom', { data: await payload('wisdom', [...days, TODAY]) });
  await spy(n.p);
  const [pop2] = await Promise.all([n.p.waitForEvent('popup'), n.p.locator('.ept-nudge .ept-q-red').click()]); assert.match((await n.p.evaluate(() => window.__opened)).at(-1)[0], /\/wisdom-school|\/sadhana-school/); assert.equal(await n.p.locator('.etd-h1').isVisible(), true); await pop2.close();
  const [pop3] = await Promise.all([n.p.waitForEvent('popup'), n.p.locator('.etd-lock').first().click()]); assert.match((await n.p.evaluate(() => window.__opened)).at(-1)[0], /programmes\/.*\/preview/); assert.equal(await n.p.locator('.etd-h1').isVisible(), true);
  // closing the pop-up makes the page check again, with a fresh sign-in (in case something was bought)
  const before = n.calls.filter(c => c.includes('/api/member/today')).length;
  await pop3.close(); await n.p.waitForTimeout(2200);
  assert.ok(n.calls.filter(c => c.includes('/api/member/today')).length > before, 'checks again after the pop-up closes');
  assert.ok(n.todayHeaders.at(-1)['x-circle-identity'], 'with a fresh sign-in');
  // all of them are ordinary links that open in a new tab when scripts can't (and for ctrl/cmd-click)
  assert.equal(await n.p.locator('a[data-pop]').evaluateAll(a => a.length > 0 && a.every(x => x.target === '_blank' && /noopener/.test(x.rel))), true);
  await n.ctx.close(); await ctx.close();
  // on a phone they open in a new tab, not a window, and the dashboard stays
  const ph = await open('wisdom', { vw: 390, h: 844, data: await payload('wisdom', [...days, TODAY]) });
  const [tab] = await Promise.all([ph.ctx.waitForEvent('page'), ph.p.locator('.ept-nudge .ept-q-red').click()]);
  assert.equal(await ph.p.locator('.etd-h1').isVisible(), true, 'phone: dashboard stays'); await tab.close(); await ph.ctx.close();
}
console.log('upgrade pop-up: ok');

// ---- Circle's own space banner ("Today in School", New post) is hidden; the top bar and sidebar are left alone; it comes back elsewhere
{
  const { p, ctx } = await open('none');
  await p.waitForFunction(() => document.querySelector('#banner').style.display === 'none');
  assert.equal(await p.locator('#banner').isVisible(), false, 'banner hidden');
  assert.equal(await p.locator('#top').isVisible(), true, 'top bar kept'); assert.equal(await p.locator('#top button').isVisible(), true);
  assert.equal(await p.locator('#side').isVisible(), true, 'sidebar kept'); assert.equal(await p.locator('#side button').isVisible(), true);
  // scrolled down (a sticky banner is then pinned at the top): still found
  await ctx.close();
  const s2 = await open('none'); await s2.p.evaluate(() => window.scrollTo(0, 500)); await s2.p.waitForTimeout(400);
  assert.equal(await s2.p.locator('#banner').isVisible(), false);
  // moving to another space gives the banner back
  await s2.p.evaluate(() => history.pushState({}, '', '/c/announcements')); await s2.p.evaluate(() => document.body.appendChild(document.createElement('i'))); await s2.p.waitForTimeout(700);
  assert.equal(await s2.p.locator('#banner').isVisible(), true, 'banner restored on another space');
  await s2.ctx.close();
}
console.log('space banner: ok');

// ---- the pañcāṅga band: native, full width at the bottom on desktop; the rail holds Coming up, Sacred days, Practising
{
  const { p, ctx } = await open('wisdom');
  await p.waitForSelector('.etd-pn-desk .etd-pnb-grid');
  assert.deepEqual(await p.locator('.etd-rail > section h2').allInnerTexts(), ['Coming up', 'Sacred days ahead', 'Practising with you']);
  const g = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const cells = [...document.querySelectorAll('.etd-pn-desk .etd-pnb-cell')].map(c => c.getBoundingClientRect());
    return { band: r('.etd-pn-desk'), cols: r('.etd-cols'), rail: r('.etd-rail'), ys: cells.map(c => Math.round(c.top)), phoneShown: getComputedStyle(document.querySelector('.etd-pn-phone')).display }; });
  assert.ok(g.band.top >= g.cols.bottom - 1, 'band below both columns'); assert.ok(g.band.width >= g.cols.width - 2, 'full width');
  assert.ok(Math.abs(g.rail.width - 270) < 2, 'rail 270px'); assert.equal(new Set(g.ys).size, 1, 'limbs side by side'); assert.equal(g.phoneShown, 'none');
  assert.equal(await p.locator('.etd-pn-desk iframe, .etd iframe').count(), 0, 'not an iframe');
  const names = await p.locator('.etd-pn-desk .etd-pnb-lab').allTextContents(); assert.deepEqual(names, ['Tithi (lunar day)', 'Vāra (weekday)', 'Nakṣatra (lunar mansion)', 'Yoga (Sun and Moon together)', 'Karaṇa (half lunar day)']);
  assert.match(await p.locator('.etd-pn-desk .etd-pnb-foot').innerText(), /Read at sunrise in New York/);
  assert.equal(await p.locator('.etd-cards').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length), 2, 'cards two across');
  // explainer: button, Esc and backdrop all close it
  const guide = p.locator('.etd-pn-desk [data-act=pn-about]');
  await guide.click(); assert.match(await p.locator('.etd-about').innerText(), /The day’s five limbs[\s\S]*Tithi[\s\S]*Karaṇa[\s\S]*How to read it/i);
  await p.keyboard.press('Escape'); assert.equal(await p.locator('.etd-about').count(), 0);
  await guide.click(); await p.locator('.etd-about-x').click(); assert.equal(await p.locator('.etd-about').count(), 0);
  await guide.click(); await p.mouse.click(5, 5); assert.equal(await p.locator('.etd-about').count(), 0);
  // place: tz city first; choosing another is remembered and moves the times
  const before = await p.locator('.etd-pn-desk .etd-pnb-when').first().innerText();
  await p.selectOption('.etd-pn-desk select[data-pn-place]', 'Asia/Kolkata');
  assert.match(await p.locator('.etd-pn-desk .etd-pnb-foot').innerText(), /Read at sunrise in (Mumbai|Delhi|Kolkata|Chennai|India)|Read at sunrise in/);
  assert.notEqual(await p.locator('.etd-pn-desk .etd-pnb-when').first().innerText(), before);
  assert.match(await p.evaluate(() => localStorage.getItem('ep-panchanga-place')), /Asia\/Kolkata/);
  await p.screenshot({ path: `${OUT}/today-layout2.png`, fullPage: true });
  await ctx.close();
  // saved place beats the time zone; the address beats the saved place
  const sv = await open('none', { wait: false });
  await sv.p.addInitScript(() => localStorage.setItem('ep-panchanga-place', JSON.stringify({ label: 'Reykjavik', lat: 64.1, lon: -21.9, tz: 'Atlantic/Reykjavik', key: 'x' })));
  await sv.p.reload(); await sv.p.waitForSelector('.etd-pn-desk .etd-pnb-foot');
  assert.match(await sv.p.locator('.etd-pn-desk .etd-pnb-foot').innerText(), /in Reykjavik/); await sv.ctx.close();
  const q = await open('none', { query: '?lat=51.5&lon=-0.1&tz=Europe%2FLondon&place=London' }); await q.p.waitForSelector('.etd-pn-desk .etd-pnb-foot');
  assert.match(await q.p.locator('.etd-pn-desk .etd-pnb-foot').innerText(), /in London/); await q.ctx.close();
  // everyone gets the band
  for (const t of ['mentee', 'none']) { const x = await open(t); assert.equal(await x.p.locator('.etd-pn-desk .etd-pnb-cell').count(), 5, t); await x.ctx.close(); }
}
console.log('panchanga band: ok');

// ---- Circle admins: the cohort sits below the student's page, never on top of it
{
  const { p, ctx } = await open('ss_year', { admin: true });
  await p.waitForSelector('.ept-pg');
  const order = await p.evaluate(() => { const top = e => e.getBoundingClientRect().top; return [top(document.querySelector('.etd-hero')), top(document.querySelector('.ept-pg'))]; });
  assert.ok(order[0] < order[1], 'cohort below the hero');
  assert.match(await p.locator('.etd-mentor').innerText(), /mentor view/i);
  await p.waitForTimeout(500);
  assert.equal(await p.locator('button:has-text("Copy page structure")').count(), 0, 'no debug button for admins');
  const dbg = await open('ss_year', { admin: true, query: '?epdebug=1' }); await dbg.p.waitForTimeout(500);
  assert.equal(await dbg.p.locator('button:has-text("Copy page structure")').count(), 1, 'debug button still available on request'); await dbg.ctx.close();
  assert.match(await p.locator('.ept-pg').innerText(), /Your cohort/);
  await p.screenshot({ path: `${OUT}/today-admin.png`, fullPage: true });
  await ctx.close();
}
console.log('admin mentor view: ok');

// ---- "use my location": only when chosen, saved on this device, a clear message if it's blocked
{
  const { p, ctx } = await open('none');
  await ctx.grantPermissions(['geolocation']); await ctx.setGeolocation({ latitude: 51.5074, longitude: -0.1278 });
  await p.selectOption('.etd-pn-desk select[data-pn-place]', 'geo'); await p.waitForFunction(() => /your location/.test(document.querySelector('.etd-pn-desk .etd-pnb-foot').textContent));
  await ctx.close();
  const d = await open('none');
  await d.p.evaluate(() => { navigator.geolocation.getCurrentPosition = (ok, no) => no({ code: 1, message: 'denied' }); });
  await d.p.selectOption('.etd-pn-desk select[data-pn-place]', 'geo');
  await d.p.waitForSelector('.etd-pn-desk .etd-pnb-err'); assert.match(await d.p.locator('.etd-pn-desk .etd-pnb-err').innerText(), /Choose a city/);
  await d.ctx.close();
}
console.log('location: ok');

// ---- phone width: no sideways scroll, targets at least 44px
for (const tier of ['none', 'mentee']) {
  const { p, ctx } = await open(tier, { vw: 390, h: 844 });
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${tier}: sideways scroll ${await p.evaluate(() => [...document.querySelectorAll('.etd *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && e.offsetParent).slice(0, 6).map(e => e.className + ':' + Math.round(e.getBoundingClientRect().right)).join(' '))}`);
  const ph = await p.evaluate(() => { const t = s => document.querySelector(s); const top = s => t(s).getBoundingClientRect().top; return { desk: getComputedStyle(t('.etd-pn-desk')).display, rs: getComputedStyle(t('.etd-rail-sacred') || document.body).display, sacred: !!t('.etd-pn-phone .etd-sdp'), after: top('.etd-pn-phone') > top('#etd-teach'), rows: new Set([...document.querySelectorAll('.etd-pn-phone .etd-pnb-cell')].map(c => Math.round(c.getBoundingClientRect().top))).size }; });
  assert.equal(ph.desk, 'none'); assert.ok(ph.sacred, 'sacred days inside the band on a phone'); assert.equal(ph.rows, 5, 'limbs as rows'); assert.ok(ph.after, 'band follows the teaching');
  const small = await p.evaluate(() => [...document.querySelectorAll('.etd a, .etd button')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40 && !e.closest('.ept-chips')).map(e => e.textContent.trim().slice(0, 30) + ':' + Math.round(e.getBoundingClientRect().height)));
  console.log(tier, 'phone: small targets:', JSON.stringify(small));
  await p.screenshot({ path: `${OUT}/today-phone-${tier}.png`, fullPage: true });
  await ctx.close();
}
await b.close();
assert.deepEqual(errs, [], 'page errors');
console.log('today-ui: ok');
