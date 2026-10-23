// Wisdom School hub in a browser (docs/wisdom-hub.md): every tab for each plan at desktop and phone width, the upgrade pop-up,
// the tab in the address, sideways tabs and the 4 x 3 month tiles on a phone. Needs the app on :3200 with scripts/ops-test/circle-mock.mjs
// as Circle, DATABASE_URL unset, and an admin ep_school cookie in out/ws-cookie.txt (see the doc). Screenshots go to out/ws-*.png.
const { chromium } = require('./pw.cjs');
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, 'out'), cookie = fs.readFileSync(path.join(out, 'ws-cookie.txt'), 'utf8').trim();
const BASE = process.env.BASE || 'http://localhost:3200';
const TABS = ['month', 'live', 'year', 'book', 'pathways', 'library', 'ce'];
let bad = 0;
const check = (ok, msg) => { if (!ok) { bad++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
(async () => {
  const browser = await chromium.launch();
  for (const [label, vp] of [['desktop', { width: 1100, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, timezoneId: 'America/Los_Angeles' });
    await ctx.addCookies([{ name: 'ep_school', value: cookie, url: BASE }]);
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    for (const plan of ['ws', 'plus', 'none']) {
      for (const tab of TABS) {
        await page.goto(`${BASE}/school/wisdom-school?as=${plan}&tab=${tab}`, { waitUntil: 'networkidle' });
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(over <= 1, `${label} ${plan}/${tab}: no sideways page scroll (${over}px)`);
        if (tab === 'month' || tab === 'pathways' || label === 'desktop' && plan === 'ws') await page.screenshot({ path: path.join(out, `ws-${label}-${plan}-${tab}.png`), fullPage: true });
      }
    }
    // content checks
    await page.goto(`${BASE}/school/wisdom-school?as=ws`, { waitUntil: 'networkidle' });
    const txt = () => page.evaluate(() => document.body.innerText);
    let t = await txt();
    check(/This month · October · 10 of 12/i.test(t) && /The Return with Wisdom/.test(t), `${label}: October is current with Circle's theme`);
    check(/What are you carrying home from the road\?/.test(t), `${label}: question for practice shown`);
    check(/Mon \d+ \w{3}/i.test(t), `${label}: Up next shows a Monday meditation in the viewer's zone`);
    check(/Hundreds of hours, certificates and CE\./.test(t), `${label}: WS side card`);
    const tabsEl = await page.$('.sch-tabs');
    const sc = await tabsEl.evaluate(e => ({ sw: e.scrollWidth, cw: e.clientWidth }));
    if (label === 'phone') check(sc.sw > sc.cw, `phone: tabs scroll sideways (${sc.sw} > ${sc.cw})`);
    const cols = await page.$eval('.wsh-tiles', e => getComputedStyle(e).gridTemplateColumns.split(' ').length);
    check(cols === (label === 'phone' ? 4 : 6), `${label}: month tiles in ${cols} columns`);
    // tab in the URL
    await page.click('button.sch-tab:has-text("Pathways")');
    check(/[?&]tab=pathways/.test(page.url()), `${label}: tab is in the address`);
    check(await page.$$eval('.sch-card.locked', els => els.length) >= 5, `${label}: WS sees the Plus pathways locked (five, plus any added since)`);
    t = await txt();
    check(/Plus opens the whole archive: every pathway, the Course Library, past years, certificates and CE\./.test(t) && /You keep everything you have now\. Upgrade at any time\./.test(t), `${label}: upgrade banner copy`);
    check(/Upgrade to Plus · \$497\/yr/.test(t), `${label}: upgrade button`);
    check(/Starter · included/.test(t) && /Continue · 2 of 4/.test(t), `${label}: starter chip and progress`);
    check(/56 CE hrs/.test(t) && /19\.5 CE hrs/.test(t), `${label}: locked rows show their CE hours`);
    // two-step upgrade
    await page.click('.sch-card.locked button:has-text("Upgrade")');
    await page.waitForSelector('.wsh-modal');
    const links = await page.$$eval('.wsh-modal a', as => as.map(a => [a.textContent.trim(), a.href]));
    check(links.some(l => /wisdom-school-plus/.test(l[1])) && links.some(l => /Learn more about Wisdom School Plus/.test(l[0]) && /embodiedphilosophy\.com\/wisdom-school/.test(l[1])), `${label}: pop-up has checkout and the learn-more link`);
    if (label === 'desktop') await page.screenshot({ path: path.join(out, 'ws-desktop-modal.png') });
    await page.keyboard.press('Escape');
    check(!(await page.$('.wsh-modal')), `${label}: Escape closes the pop-up`);
    // none: preview banner and join
    await page.goto(`${BASE}/school/wisdom-school?as=none`, { waitUntil: 'networkidle' });
    t = await txt();
    check(/You’re looking at a preview of Wisdom School/.test(t) && /Join · \$27\/mo or \$297\/yr/.test(t) && /Watch a sample lecture/.test(t), `${label}: visitor preview banner`);
    const join = await page.$eval('.wsh-banner a', a => a.href);
    check(join === 'https://ss.embodiedphilosophy.com/checkout/wisdom-school', `${label}: Join goes to the checkout`);
    // plus
    await page.goto(`${BASE}/school/wisdom-school?as=plus&tab=pathways`, { waitUntil: 'networkidle' });
    check(await page.$$eval('.sch-card.locked', els => els.length) === 0, `${label}: Plus has nothing locked`);
    await page.goto(`${BASE}/school/wisdom-school?as=plus&tab=library`, { waitUntil: 'networkidle' });
    const lib = await page.$$eval('.sch-card a.sch-btn', as => as.map(a => a.href));
    check(lib.length === 5 && lib[0].includes('c/library?dept=Yoga%20philosophy'), `${label}: Plus library rows open the filtered Library`);
    check(errors.length === 0, `${label}: no page errors ${errors.join(' | ')}`);
    await ctx.close();
  }
  await browser.close();
  console.log(bad ? `${bad} FAILED` : 'all browser checks passed');
  process.exit(bad ? 1 : 0);
})();
