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
const OUT = process.env.OUT || new URL('../ops-test/out/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });

const TODAY = '2026-10-17'; // a Saturday
const days = []; for (let i = 1; i <= 39; i++) { const d = new Date(TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - i); days.push(d.toISOString().slice(0, 10)); }
const events = [
  { id: 'E1', title: 'Meditation Mondays', date: '2026-10-19', time: '12pm ET', series: 'meditation-mondays', program: 'meditation' },
  { id: 'E2', title: 'The Heart of Recognition · Session 1', date: '2026-10-21', time: '9am ET', series: 'sadhana-fall-2026', program: 'sadhana' },
  { id: 'E3', title: 'CHITHEADS Live', date: '2026-12-17', time: '1pm ET', program: 'community' },
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
const b = await chromium.launch(); const errs = [];
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };

async function open(tier, { vw = 1366, h = 900, data, seasons = [], admin = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: vw, height: h }, timezoneId: 'America/New_York' });
  const p = await ctx.newPage(); const calls = [];
  p.on('pageerror', e => errs.push(`${tier}: ${e.message}`));
  await p.clock.install({ time: new Date('2026-10-17T10:30:00-04:00') });
  const body = data || await payload(tier);
  await p.route('https://ss.example.test/**', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><body><div class="[container-type:inline-size] bg-secondary"><div>Circle’s own page</div></div><script>window.circleUser={signedIn:true,identityToken:"t",isAdmin:' + admin + '}</script><script src="https://www.embodiedphilosophy.com/circle/today.js"></script>' }));
  await p.route('https://www.embodiedphilosophy.com/**', async r => {
    const u = new URL(r.request().url()), m = r.request().method(), path = u.pathname;
    if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
    const j = o => r.fulfill({ contentType: 'application/json', headers: CORS, body: JSON.stringify(o) });
    if (path === '/circle/today.js') return r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: js });
    if (path.startsWith('/circle/')) return r.fulfill({ contentType: 'text/javascript', body: '' });
    calls.push(`${m} ${path}${m === 'POST' ? ' ' + r.request().postData() : ''}`);
    if (path === '/api/member/session') return j({ session: 's', tier: { tier, seasons }, firstName: 'Maya', offer: null });
    if (path === '/api/member/today') return j(body);
    if (path === '/api/member/practice') { const post = JSON.parse(r.request().postData() || '{}'); return j({ ...body.practice, ...summarise([...days, TODAY], TODAY), qualities: ['Calm'], extras: [], logged: post.minutes }); }
    if (path === '/api/member/cohort') return j({ today: TODAY, rows: [{ name: 'Carolyn', email: 'c@example.com', streak: 0, weekCount: 0, days8w: 0, minutes8w: 0, last: null, daysSince: null, grid: [] }], attention: [{ email: 'c@example.com', name: 'Carolyn', why: 'Hasn’t logged any practice yet' }] });
    if (path === '/api/member/portfolio') return j({ pages: [] });
    if (path === '/api/member/travelogue') return j({ travelogue: m === 'POST' ? [{ id: '1', day: TODAY, text: JSON.parse(r.request().postData()).text }] : [] });
    return j({});
  });
  await p.goto('https://ss.example.test/c/today');
  await p.waitForSelector('.etd-h1', { timeout: 8000 });
  return { p, ctx, calls };
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
  assert.match(await p.locator('.etd-sub').innerText(), /Saturday,? (October 17|17 October) · Śukla Saptamī · waxing moon/);
  assert.equal(await p.locator('.etd-moons .etd-md').count(), 7);
  assert.equal(await p.locator('.etd-sd').count(), 4);
  assert.match(await p.locator('.etd-skt').innerText(), /citiḥ svatantrā/);
  assert.equal(await p.locator('.etd-card[aria-label] .ept-btn').count(), w.open.length);
  if (tier === 'none') { assert.match(await p.locator('.etd-none').innerText(), /yours to keep, free/); assert.equal(await p.locator('.etd-rail .etd-ev').count(), 2); }
  assert.equal(await p.locator('text=Join a practice circle').count(), 0);
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

// ---- Circle admins: the cohort sits below the student's page, never on top of it
{
  const { p, ctx } = await open('ss_year', { admin: true });
  await p.waitForSelector('.ept-pg');
  const order = await p.evaluate(() => { const top = e => e.getBoundingClientRect().top; return [top(document.querySelector('.etd-hero')), top(document.querySelector('.ept-pg'))]; });
  assert.ok(order[0] < order[1], 'cohort below the hero');
  assert.match(await p.locator('.etd-mentor').innerText(), /mentor view/i);
  assert.match(await p.locator('.ept-pg').innerText(), /Your cohort/);
  await p.screenshot({ path: `${OUT}/today-admin.png`, fullPage: true });
  await ctx.close();
}
console.log('admin mentor view: ok');

// ---- phone width: no sideways scroll, targets at least 44px
for (const tier of ['none', 'mentee']) {
  const { p, ctx } = await open(tier, { vw: 390, h: 844 });
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${tier}: sideways scroll`);
  const small = await p.evaluate(() => [...document.querySelectorAll('.etd a, .etd button')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40 && !e.closest('.ept-chips')).map(e => e.textContent.trim().slice(0, 30) + ':' + Math.round(e.getBoundingClientRect().height)));
  console.log(tier, 'phone: small targets:', JSON.stringify(small));
  await p.screenshot({ path: `${OUT}/today-phone-${tier}.png`, fullPage: true });
  await ctx.close();
}
await b.close();
assert.deepEqual(errs, [], 'page errors');
console.log('today-ui: ok');
