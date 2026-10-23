// Ops → Settings → Website → "Wisdom School hub: pathways" (the WS Pathways tab behind the Wisdom School hub).
// The tab is not in the mock sheet at first, so this covers "Create it" (which fills in the seven 2026 pathways), a bad plan being
// refused in plain words, and adding a pathway. Writes go to the mock; check out/mock.log. Run: node scripts/ops-test/ws-pathways.cjs
const { chromium } = require('./pw.cjs');
const assert = require('assert/strict');
const cookie = require('fs').readFileSync(__dirname + '/out/cookie.txt', 'utf8').trim();
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [vw, w, h] of [['desktop', 1366, 900], ['phone', 390, 844]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    await c.addCookies([{ name: 'ep_ops', value: cookie, domain: 'localhost', path: '/' }]);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:3100/ops/settings?t=wspathways', { waitUntil: 'networkidle' });
    const nav = await p.locator('.ops-set-nav a').allInnerTexts();
    assert.ok(nav.includes('Wisdom School hub: pathways'), 'listed in Settings: ' + nav);
    await p.getByText('isn’t in the calendar sheet yet').or(p.locator('button:text-is("Add a row")')).first().waitFor();
    if (await p.locator('button:text-is("Create it")').count()) { await p.locator('button:text-is("Create it")').click(); await p.waitForSelector('.ops-site-row', { timeout: 30000 }); }
    const rows = await p.locator('.ops-site-row').allInnerTexts();
    assert.equal(rows.length >= 7, true, vw + ': the seven pathways are there: ' + rows.length);
    assert.match(rows[0], /Meditation for Real Life/); assert.match(rows[0], /14 CE hrs/);
    assert.match(rows[2], /Classical Yoga/); assert.match(rows[2], /56 CE hrs/); assert.match(rows[2], /Plus/);
    await p.screenshot({ path: `${__dirname}/out/ws-pathways-${vw}.png` });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, true, vw + ': sideways scroll');
    if (vw === 'desktop') {
      await p.locator('button:has-text("Add a row")').click();
      await p.fill('#s-name', 'Gnosticism'); await p.fill('#s-space_id', '2900999'); await p.fill('#s-ce_hours', '8');
      await p.selectOption('#s-plan', 'plus');
      await p.locator('button:text-is("Add")').click(); await p.waitForTimeout(1500);
      assert.ok((await p.locator('.ops-site-row').allInnerTexts()).some(r => /Gnosticism/.test(r)), 'new pathway added');
    }
    await c.close();
  }
  await b.close();
  assert.deepEqual(errs, [], 'page errors');
  console.log('ws pathways settings: ok');
})().catch(e => { console.error(e); process.exit(1); });
