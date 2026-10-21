// Ops → Settings → Sahṛdaya Upāya → Polls (the mentee "which time works?" survey) and the survey results page.
// The Mentee Polls tab is not in the mock sheet, so this covers "Create it", a bad time being refused, and a good one saved.
// Writes go to the mock; check out/mock.log. Run: node scripts/ops-test/su-settings.cjs
const { chromium } = require('./pw.cjs');
const assert = require('assert/strict');
const cookie = require('fs').readFileSync(__dirname + '/out/cookie.txt', 'utf8').trim();
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [vw, w, h] of [['phone', 390, 844], ['desktop', 1366, 900]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    await c.addCookies([{ name: 'ep_ops', value: cookie, domain: 'localhost', path: '/' }]);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:3100/ops/settings?t=mpolls', { waitUntil: 'networkidle' });
    const nav = await p.locator('.ops-set-nav a').allInnerTexts();
    assert.ok(['Polls', 'Assignments', 'Weekly reading', 'Teaching feedback', 'Coming soon'].every(x => nav.includes(x)), 'Sahṛdaya Upāya tables listed: ' + nav);
    if (vw === 'desktop') {
      await p.click('text=Create it'); await p.waitForSelector('text=Add a row');
      await p.click('text=Add a row');
      await p.fill('#s-poll', 'orientation-2026'); await p.fill('#s-start', 'Saturday 10am');
      await p.click('button[type=submit]');
      await p.waitForSelector('text=A time like', { timeout: 5000 });
      assert.match(await p.innerText('body'), /A time like 2026-10-24 10:00 ET/, 'a bad time is refused with a plain message');
      await p.fill('#s-start', '2026-10-24 10:00 ET'); await p.click('button[type=submit]');
      await p.waitForSelector('.ops-site-row'); assert.match(await p.innerText('.ops-site-row'), /orientation-2026 · 2026-10-24 10:00 ET/);
    }
    await p.screenshot({ path: `${__dirname}/out/su-settings-polls-${vw}.png`, fullPage: true });
    await p.goto('http://localhost:3100/ops/settings/polls', { waitUntil: 'networkidle' });
    await p.waitForSelector('.ops-polls');
    assert.match(await p.innerText('.ops-polls'), /Answers aren’t connected in this environment|No survey is open|mentees have answered/);
    await p.screenshot({ path: `${__dirname}/out/su-polls-results-${vw}.png`, fullPage: true });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, true, vw + ': sideways scroll');
    await c.close();
  }
  await b.close();
  assert.deepEqual(errs, [], 'page errors: ' + errs.join(' | '));
  console.log('su-settings: ok');
})().catch(e => { console.error(e); process.exit(1); });
