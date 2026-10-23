// The Meditation Pass hub in a browser (docs/meditation-hub.md): each plan at desktop and phone width, the four tabs and the address,
// the stream filter, locked replays, Join live around the start time, the roll to the next Monday, the upgrade pop-up.
// Needs the sheet mock (mock.mjs) and scripts/ops-test/circle-mock.mjs as Circle, and the app on :3200 started with
// CIRCLE_HEADLESS_BASE=http://localhost:4600 CIRCLE_HEADLESS_TOKEN=test MEMBER_SECRET=mmtest-secret and DATABASE_URL unset (source env.sh).
// The Pass is previewed by an admin (?as=pass) because the mock Kit has no tags; drop-in and not-enrolled are found by the same
// rule as live (mmdrop@test is only in the live space, mmnone@test in nothing). Screenshots go to out/mm-*.png.
const { chromium } = require('./pw.cjs');
const crypto = require('crypto'), path = require('path');
const out = path.join(__dirname, 'out');
const BASE = process.env.BASE || 'http://localhost:3200';
const secret = process.env.MEMBER_SECRET || 'mmtest-secret';
const cookie = (email, admin) => { const body = Buffer.from(JSON.stringify({ email, admin: !!admin, uid: '77', kind: 'member', exp: Date.now() + 3600e3 })).toString('base64url'); return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`; };
let bad = 0;
const check = (ok, msg) => { if (!ok) { bad++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
(async () => {
  const browser = await chromium.launch();
  const open = async (vp, who, tz = 'America/Los_Angeles') => {
    const ctx = await browser.newContext({ viewport: vp, timezoneId: tz });
    await ctx.addCookies([{ name: 'ep_school', value: cookie(who.email, who.admin), url: BASE }]);
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); page.errors = errors;
    return { ctx, page };
  };
  const admin = { email: 'mmadmin@test', admin: true };
  for (const [label, vp] of [['desktop', { width: 1100, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    // ---------- Meditation Pass ----------
    let { ctx, page } = await open(vp, admin);
    const txt = () => page.evaluate(() => document.body.innerText);
    await page.goto(`${BASE}/school/meditation-pass?as=pass`, { waitUntil: 'networkidle' });
    let t = await txt();
    check(/Meditation Pass · Every Monday, 12pm ET/i.test(t) && /Meditation Mondays/.test(t), `${label}/pass: header kicker and title`);
    check(/Mon 26 Oct/i.test(t) && /Neuroscience & Yoga with Dr\. Abha Rajbhandari/.test(t), `${label}/pass: hero is Mon 26 Oct, Neuroscience & Yoga, Dr. Abha Rajbhandari`);
    check(/12:00 pm ET · 9:00 am your time/.test(t), `${label}/pass: 12:00 pm ET plus the viewer's own time (Los Angeles)`);
    check(!(await page.$('a:has-text("Join live")')), `${label}/pass: no Join live on Friday`);
    check(/The next four Mondays/.test(t) && /Mon 2 Nov/.test(t) && /Mon 9 Nov/.test(t) && /Oneika Mays/.test(t) && /Mon 23 Nov/.test(t), `${label}/pass: next four Mondays with teachers`);
    check(/Latest replay/.test(t) && /Mon 19 Oct/.test(t) && /Mystical/.test(t), `${label}/pass: latest replay is Mon 19 Oct (Mystical)`);
    check((await page.$$('.mmh-streams li')).length === 5, `${label}/pass: five stream tiles`);
    check(/Wisdom School · \$297 a year/i.test(t) && !(await page.$('.wsh-banner')), `${label}/pass: no banner, Wisdom School teaser`);
    const watch = await page.$$eval('.mmh-one a', as => as.map(a => [a.href, a.target]));
    check(watch.length === 1 && /ss\.example\.test\/c\/meditation-pass\/sections\/1\/lessons\/6112/.test(watch[0][0]) && watch[0][1] === '_top', `${label}/pass: Watch opens Circle's own lesson page in the top window`);
    await page.screenshot({ path: path.join(out, `mm-${label}-pass-week.png`), fullPage: true });
    // tabs and the address
    await page.click('button.sch-tab:has-text("Replays")');
    check(/[?&]tab=replays/.test(page.url()), `${label}/pass: tab is in the address`);
    t = await txt();
    check(/Start here/.test(t) && /October 2026/.test(t) && /Archive · September 2026/.test(t) && !/November 2026/.test(t), `${label}/pass: sections in order, empty months left out`);
    const heads = await page.$$eval('section h2.sch-sub', hs => hs.map(h => h.textContent));
    check(heads.join('|') === 'Start here|October 2026|Archive · September 2026|Archive · August 2026|Archive · January 2026', `${label}/pass: Start here, the month, then the Archive newest first (${heads.join(' / ')})`);
    check((await page.$$('.mmh-card a.mmh-card-a')).length === 9 && !/Locked ·/.test(t), `${label}/pass: every replay opens (9, none locked)`);
    check(await page.$$eval('.mmh-thumb.sage', e => e.length) > 0, `${label}/pass: the sage Meditation Mondays Library artwork is the thumbnail`);
    // stream filter
    await page.click('button.mmh-chip:has-text("Metta")');
    check(/[?&]stream=metta/.test(page.url()), `${label}/pass: stream filter is in the address`);
    let cards = await page.$$eval('.mmh-card b', e => e.map(x => x.textContent));
    check(cards.length === 2 && cards.every(c => /^Metta with Oneika Mays$/.test(c)), `${label}/pass: Metta filter shows only Metta (${cards.length})`);
    await page.click('button.mmh-chip:has-text("All")');
    check((await page.$$eval('.mmh-card', e => e.length)) === 9, `${label}/pass: All brings every replay back`);
    // a stream tile opens Replays filtered
    await page.click('button.sch-tab:has-text("This week")');
    await page.click('.mmh-stream:has-text("Tantrik")');
    check(/tab=replays/.test(page.url()) && /stream=tantrik/.test(page.url()) && await page.$eval('button.mmh-chip.on', e => e.textContent) === 'Tantrik', `${label}/pass: stream tile opens Replays filtered`);
    // upcoming
    await page.click('button.sch-tab:has-text("Upcoming")');
    t = await txt();
    const rows = await page.$$('ul.sch-list > li');
    check(rows.length >= 7 && /Subscribe to every Monday/.test(t), `${label}/pass: six or more sessions plus the closing row (${rows.length})`);
    check((await page.$$('button:has-text("Add to calendar")')).length >= 6, `${label}/pass: Add to calendar on each`);
    const sub = await page.$eval('li:has-text("Subscribe to every Monday") a', a => a.href);
    check(/^webcal:\/\/www\.embodiedphilosophy\.com\/api\/member\/schedule\/ics\?t=/.test(sub), `${label}/pass: subscribe link is the member's calendar feed`);
    await page.screenshot({ path: path.join(out, `mm-${label}-pass-upcoming.png`), fullPage: true });
    // teachers & streams
    await page.click('button.sch-tab:has-text("Teachers")');
    t = await txt();
    check(/Mary Reilly Nichols/.test(t) && /Oneika Mays/.test(t) && /Nataraj Chaitanya/.test(t) && /Floss Harry/.test(t) && /Dr\. Abha Rajbhandari/.test(t), `${label}/pass: five teachers`);
    check(/Loving-kindness practice/.test(t) && /2 replays/.test(t) && /1 replay\b/.test(t), `${label}/pass: approach line and replay count`);
    await page.click('li:has-text("Somatic") button:has-text("See replays")');
    check(/stream=somatic/.test(page.url()), `${label}/pass: a row links to the filtered replays`);
    // the tab survives a reload
    await page.reload({ waitUntil: 'networkidle' });
    check(await page.$eval('button.sch-tab.on', e => e.textContent) === 'Replays' && await page.$eval('button.mmh-chip.on', e => e.textContent) === 'Somatic', `${label}/pass: reload keeps the tab and the stream`);
    // phone layout
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(over <= 1, `${label}/pass: no sideways page scroll (${over}px)`);
    if (label === 'phone') {
      const sc = await (await page.$('.sch-tabs')).evaluate(e => ({ sw: e.scrollWidth, cw: e.clientWidth }));
      check(sc.sw > sc.cw, `phone: tabs scroll sideways (${sc.sw} > ${sc.cw})`);
      await page.click('button.mmh-chip:has-text("All")');
      const cols = await page.$eval('.mmh-grid', e => getComputedStyle(e).gridTemplateColumns.split(' ').length);
      check(cols === 1, `phone: replay cards stack (${cols} column)`);
      await page.goto(`${BASE}/school/meditation-pass?as=pass`, { waitUntil: 'networkidle' });
      const bx = await page.$$eval('.wsh-main > section, .wsh-side', els => els.map(e => Math.round(e.getBoundingClientRect().left)));
      check(new Set(bx).size === 1, `phone: hero, latest replay, list and side card stack in one column`);
    }
    check(page.errors.length === 0, `${label}/pass: no page errors ${page.errors.join(';')}`);
    await page.screenshot({ path: path.join(out, `mm-${label}-pass-end.png`), fullPage: true });
    await ctx.close();

    // ---------- Join live around the start; the hero rolls on ----------
    for (const [when, expectJoin, expectDate] of [['2026-10-26T15:44:00Z', false, 'Mon 26 Oct'], ['2026-10-26T15:46:00Z', true, 'Mon 26 Oct'], ['2026-10-26T16:40:00Z', true, 'Mon 26 Oct'], ['2026-10-26T17:01:00Z', false, 'Mon 2 Nov']]) {
      ({ ctx, page } = await open(vp, admin));
      await page.clock.setFixedTime(new Date(when));
      await page.goto(`${BASE}/school/meditation-pass?as=pass`, { waitUntil: 'networkidle' });
      const hero = await page.$eval('.wsh-hero', e => e.innerText);
      const joinLink = await page.$('.wsh-hero a:has-text("Join live")');
      check(!!joinLink === expectJoin && hero.toLowerCase().includes(expectDate.toLowerCase()), `${label}/pass @ ${when}: ${expectDate}, Join live ${expectJoin ? 'shown' : 'not shown'}`);
      if (joinLink) check(/events\/9000$/.test(await joinLink.getAttribute('href')) && await joinLink.getAttribute('target') === '_top', `${label}/pass: Join live goes to the event's live room`);
      if (expectDate === 'Mon 2 Nov') check(/^Meditation Mondays$/m.test(hero), `${label}/pass: the Monday with no teacher on the schedule is just “Meditation Mondays”`);
      await ctx.close();
    }

    // ---------- Drop-in ----------
    ({ ctx, page } = await open(vp, { email: 'mmdrop@test' }));
    await page.goto(`${BASE}/school/meditation-pass`, { waitUntil: 'networkidle' });
    t = await txt();
    check(/You’re in for this Monday\./.test(t) && /Upgrade · \$9\.99\/mo/.test(t), `${label}/dropin: banner and upgrade button`);
    check(/Drop-in · one week/.test(t), `${label}/dropin: plan pill`);
    check(/Upgrade to the Pass/.test(t), `${label}/dropin: side card`);
    check(/Locked · 5-minute preview/.test(t) && (await page.$$('a[href*="/lessons/"]')).length === 0, `${label}/dropin: latest replay is a 5-minute preview, no lesson link`);
    await page.click('button.sch-tab:has-text("Upcoming")');
    t = await txt();
    check((t.match(/Pass only/g) || []).length >= 5 && /Your session/.test(t), `${label}/dropin: their session is open, the rest say Pass only`);
    await page.click('button.sch-tab:has-text("Replays")');
    check((await page.$$('.mmh-card.locked')).length >= 2 && (await page.$$('a[href*="/lessons/"]')).length === 0, `${label}/dropin: replays locked, no lesson links`);
    await page.screenshot({ path: path.join(out, `mm-${label}-dropin-replays.png`), fullPage: true });
    await ctx.close();
    // their own session lets them in near the start
    ({ ctx, page } = await open(vp, { email: 'mmdrop@test' }));
    await page.clock.setFixedTime(new Date('2026-10-26T15:50:00Z'));
    await page.goto(`${BASE}/school/meditation-pass`, { waitUntil: 'networkidle' });
    check(!!(await page.$('.wsh-hero a:has-text("Join live")')), `${label}/dropin: Join live on their one session`);
    await ctx.close();

    // ---------- Not enrolled ----------
    ({ ctx, page } = await open(vp, { email: 'mmnone@test' }));
    await page.goto(`${BASE}/school/meditation-pass`, { waitUntil: 'networkidle' });
    t = await txt();
    check(/Sit with us this Monday\./.test(t) && /Start your free week · \$99 a year/.test(t), `${label}/none: banner and button`);
    check(/Your first week is free/.test(t), `${label}/none: side card`);
    check(/Mon 26 Oct/i.test(t) && /Neuroscience & Yoga/.test(t), `${label}/none: they still see the date and who teaches (from the site's schedule)`);
    check(!(await page.$('a:has-text("Join live")')) && (await page.$$('a[href*="ss.example.test"]')).length === 0, `${label}/none: no live link, no Circle link at all`);
    await page.click('button.sch-tab:has-text("Upcoming")');
    check((await page.$$('button:has-text("Start your free week")')).length >= 6, `${label}/none: every session says Start your free week`);
    await page.click('li:has-text("Subscribe to every Monday") button');
    await page.waitForSelector('.wsh-modal');
    const links = await page.$$eval('.wsh-modal a', as => as.map(a => [a.textContent.trim(), a.href, a.target]));
    check(links.some(l => /Start your free week · \$99 a year/.test(l[0]) && l[1] === 'https://ss.embodiedphilosophy.com/checkout/meditation-pass' && l[2] === '_top') && links.some(l => /Learn more about the Meditation Pass/.test(l[0])), `${label}/none: two-step pop-up with the Pass checkout`);
    if (label === 'desktop') await page.screenshot({ path: path.join(out, 'mm-desktop-none-modal.png') });
    await page.keyboard.press('Escape');
    check(!(await page.$('.wsh-modal')), `${label}/none: Escape closes the pop-up`);
    await page.click('button.sch-tab:has-text("Replays")');
    t = await txt();
    check((await page.$$('.mmh-card.locked')).length >= 2 && (await page.$$('a[href*="/lessons/"]')).length === 0, `${label}/none: replays locked`);
    await page.screenshot({ path: path.join(out, `mm-${label}-none-replays.png`), fullPage: true });
    check(page.errors.length === 0, `${label}/none: no page errors`);
    await ctx.close();

    // ---------- Pass previewed as Wisdom School; the admin's Preview as ----------
    ({ ctx, page } = await open(vp, admin));
    await page.goto(`${BASE}/school/meditation-pass?as=dropin`, { waitUntil: 'networkidle' });
    check(/Drop-in · one week/.test(await txt()) && await page.$eval('.wsh-as select', e => e.value) === 'dropin', `${label}/admin: Preview as works`);
    await ctx.close();
  }

  // the endpoint itself (Today reads it): the same payload, here through the hub's own cookie
  const r = await fetch(`${BASE}/api/hub/meditation?as=pass`, { headers: { Cookie: `ep_school=${cookie('mmadmin@test', true)}` } });
  const j = await r.json();
  check(r.status === 200 && j.plan === 'pass' && j.next?.date === '2026-10-26' && j.nextFour.length === 4 && j.upcoming.length >= 6 && j.streams.length === 5 && Array.isArray(j.sections) && j.latestReplay?.id === '6112', 'endpoint: {plan, next, latestReplay, nextFour[4], upcoming[], sections[], streams[5]}');
  const r2 = await fetch(`${BASE}/api/hub/meditation`);
  check(r2.status === 401, 'endpoint: signed-out is refused');
  const r3 = await fetch(`${BASE}/api/hub/meditation?as=none`, { headers: { Cookie: `ep_school=${cookie('mmnone@test', false)}` } });
  const j3 = await r3.json();
  check(j3.plan === 'none' && j3.upcoming.every(s => !s.url) && j3.sections.flatMap(s => s.lessons).every(l => l.locked && !l.url), 'endpoint: a visitor gets no live link and no lesson link in the payload');
  await browser.close();
  console.log(bad ? `\n${bad} check(s) FAILED` : '\nall browser checks passed');
  process.exit(bad ? 1 : 0);
})();
