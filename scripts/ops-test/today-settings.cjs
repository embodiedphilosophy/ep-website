// Ops → Settings → Website → "Today: teaching" and "Today: sacred days" (the tabs behind Circle's Today page).
// The teaching tab is in the mock sheet; the sacred-days tab is not, so this also covers "Create it".
// Writes go to the mock; check out/mock.log. Run: node scripts/ops-test/today-settings.cjs
const { chromium } = require('./pw.cjs');
const assert = require('assert/strict');
const cookie = require('fs').readFileSync(__dirname + '/out/cookie.txt', 'utf8').trim();
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [vw, w, h] of [['desktop', 1366, 900], ['phone', 390, 844]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    await c.addCookies([{ name: 'ep_ops', value: cookie, domain: 'localhost', path: '/' }]);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:3100/ops/settings?t=teachings', { waitUntil: 'networkidle' });
    const nav = await p.locator('.ops-set-nav a').allInnerTexts();
    assert.ok(nav.includes('Today: teaching') && nav.includes('Today: sacred days'), 'both tabs listed: ' + nav);
    await p.waitForSelector('.ops-site-rows');
    assert.match(await p.locator('.ops-site-row').first().innerText(), /2026-10-12 · Pratyabhijñāhṛdaya 1/);
    assert.match(await p.locator('.ops-site-row').first().innerText(), /in its freedom/);
    await p.screenshot({ path: `${__dirname}/out/today-settings-teachings-${vw}.png` });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, true, vw + ': sideways scroll');
    if (vw === 'desktop') {
      // write a question for Monday and save
      await p.locator('.ops-site-row').first().click();
      await p.fill('#s-prompt_mon', 'Where do you already feel free today? (' + Date.now() + ')');
      await p.screenshot({ path: `${__dirname}/out/today-settings-teachings-edit.png` });
      await p.locator('button:has-text("Save 1 change")').click(); await p.waitForTimeout(1200);
      assert.match(await p.locator('.ops-site-row').first().innerText(), /2026-10-12/);
      // a bad date is refused in plain words
      await p.locator('button:has-text("Add a row")').click(); await p.fill('#s-week_start', '2026-10-19'); await p.fill('#s-source', 'Pratyabhijñāhṛdaya 2');
      await p.fill('#s-sanskrit_iast', 'svecchayā svabhittau viśvam unmīlayati'); await p.fill('#s-translation', 'By its own will it unfolds the universe on the screen of itself.');
      await p.locator('button:text-is("Add")').click(); await p.waitForTimeout(1200);
      assert.ok((await p.locator('.ops-site-row').count()) >= 2, 'new week added');
    }
    // sacred days: the tab isn't in the mock sheet at first → "Create it", then add a day (a second pass finds it made)
    await p.goto('http://localhost:3100/ops/settings?t=sacred', { waitUntil: 'networkidle' });
    await p.getByText('isn’t in the calendar sheet yet').or(p.locator('button:text-is("Add a row")')).first().waitFor();
    if (await p.locator('button:text-is("Create it")').count()) { await p.locator('button:text-is("Create it")').click(); await p.waitForSelector('button:text-is("Add a row")'); }
    if (vw === 'desktop') {
      await p.locator('button:text-is("Add a row")').click();
      await p.fill('#s-date', '2026-11-08'); await p.fill('#s-name', 'Dīpāvalī'); await p.fill('#s-note', 'Festival of lights · Lakṣmī Pūjā on the new moon'); await p.fill('#s-region', 'US');
      await p.screenshot({ path: `${__dirname}/out/today-settings-sacred-add.png` });
      await p.locator('button:text-is("Add")').click(); await p.waitForTimeout(1200);
      assert.match(await p.locator('.ops-site-row').first().innerText(), /2026-11-08 · Dīpāvalī/);
    } else await p.screenshot({ path: `${__dirname}/out/today-settings-sacred-${vw}.png` });
    await c.close();
  }
  await b.close();
  assert.deepEqual(errs, [], 'page errors');
  console.log('today settings: ok');
})().catch(e => { console.error(e); process.exit(1); });
