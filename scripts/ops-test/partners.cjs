// Ops → Settings → Peer partners (Sahṛdaya Upāya): suggest pairs from the (mock) Kit list, adjust, save; the tab is made on the first save.
// Writes go to the mock; check out/mock.log. Run: node scripts/ops-test/partners.cjs
const { chromium } = require('./pw.cjs');
const assert = require('assert/strict');
const cookie = require('fs').readFileSync(__dirname + '/out/cookie.txt', 'utf8').trim();
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [vw, w, h] of [['phone', 390, 844], ['desktop', 1366, 900]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    await c.addCookies([{ name: 'ep_ops', value: cookie, domain: 'localhost', path: '/' }]);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:3100/ops/settings/partners', { waitUntil: 'networkidle' });
    await p.waitForSelector('.ops-partners');
    assert.match(await p.innerText('.ops-partners'), /Nothing is set yet/);
    assert.match(await p.innerText('.ops-partners'), /not yet paired: Lee, Maya, Noor, Priya, Sam, Tomas, Wen/, 'all seven mentees from Kit, unpaired');
    await p.click('text=Suggest pairs');
    assert.equal(await p.locator('.ops-pair').count(), 3, 'seven people: three groups');
    assert.equal(await p.locator('.ops-pair').filter({ has: p.locator('select >> nth=2') }).count(), 1, 'one group of three');
    assert.match(await p.innerText('.ops-partners'), /2 pairs, 1 group of three · everyone is paired/);
    await p.screenshot({ path: `${__dirname}/out/partners-${vw}-suggested.png`, fullPage: true });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, true, vw + ': sideways scroll');
    if (vw === 'desktop') {
      await p.click('text=Back to two'); // the third person becomes unpaired
      assert.match(await p.innerText('.ops-partners'), /3 pairs.*not yet paired: \w+/);
      await p.click('text=Suggest again'); // dirty → no confirm needed; new arrangement
      assert.equal(await p.locator('text=Save for both months of the rotation').count(), 1, 'the rotation option is there');
      await p.fill('input[aria-label="Group 1 chat link"]', 'https://ss.example/c/pair-1');
      await p.click('button.primary');
      await p.waitForSelector('text=Saved. Mentees see these partners now.');
      await p.screenshot({ path: `${__dirname}/out/partners-${vw}-saved.png`, fullPage: true });
      const log = require('fs').readFileSync(__dirname + '/out/mock.log', 'utf8');
      assert.ok((log.match(/APPENDED[^\n]*Mentee Partners/g) || []).length >= 6, 'three pairs written for each of the two months of the rotation');
      assert.match(log, /pair-1/, 'the chat link is written to the pairs');
      await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('.ops-pair');
      assert.equal(await p.inputValue('input[aria-label="Group 1 chat link"]'), 'https://ss.example/c/pair-1', 'the chat link comes back');
      // where everyone lives
      await p.fill('input[aria-label^="City for"] >> nth=0', 'Milan'); await p.fill('input[aria-label^="Time zone for"] >> nth=0', 'Europe/Rome');
      await p.click('text=Save places'); await p.waitForSelector('text=Saved. Mentees see the new places now.');
      await p.fill('input[aria-label^="Time zone for"] >> nth=1', 'Mars/Olympus'); await p.click('text=Save places'); await p.waitForSelector('text=isn’t a time zone we know');
      assert.equal(await p.locator('.ops-pair').count(), 3, 'what was saved is what comes back');
      // change one person's partner, save: only that pair changes (the old pair is hidden, the new one added)
      await p.click('text=Remove >> nth=0'); await p.click('button.primary'); await p.waitForSelector('text=Saved.');
      assert.equal(await p.locator('.ops-pair').count(), 2);
    }
    await c.close();
  }
  await b.close();
  assert.deepEqual(errs, [], 'page errors: ' + errs.join(' | '));
  console.log('partners: ok');
})().catch(e => { console.error(e); process.exit(1); });
