// The /today/panchanga page in a real browser against a running dev or production server (default :3200).
// Checks the answer, the layout at 320px and on desktop in light and dark, the location picker and its memory, the
// "How to read this" dialog (mouse, keyboard, touch) and framing from Circle (and refusal for other sites).
// Run: node scripts/panchanga-test/ui.cjs        Screenshots: scripts/panchanga-test/out/
const { chromium } = require('../ops-test/pw.cjs');
const assert = require('assert/strict');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:3200';
const OUT = __dirname + '/out'; fs.mkdirSync(OUT, { recursive: true });
const DELHI = '?date=2026-10-18&lat=28.61&lon=77.21&tz=Asia%2FKolkata&place=New%20Delhi';

(async () => {
  const b = await chromium.launch(); const errs = [];
  const open = async (qs, { w = 1366, h = 900, scheme = 'light', tz = 'America/New_York', touch = false, ctx: c0 } = {}) => {
    const ctx = c0 || await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, timezoneId: tz, hasTouch: touch });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '/today/panchanga' + qs, { waitUntil: 'networkidle' }); await p.waitForSelector('.pn-name');
    return { p, ctx };
  };

  // ---- the answer (New Delhi, 18 October 2026)
  { const { p, ctx } = await open(DELHI);
    const t = await p.locator('.pn').innerText();
    assert.match(await p.locator('h1').innerText(), /Sunday 18 October/);
    assert.match(await p.locator('.pn-month').innerText(), /^Āśvina, bright fortnight$/);
    for (const re of [/Saptamī[\s\S]*Until 8:28 AM, then Aṣṭamī/, /Pūrvāṣāḍhā[\s\S]*Until 12:48 PM, then Uttarāṣāḍhā/, /Moon in Dhanu \(the Archer\), entering Makara at 7:3\d PM/,
      /Sukarman[\s\S]*Until 11:54 PM, then Dhṛti/, /Vaṇija[\s\S]*Until 8:28 AM, then Viṣṭi/, /Sunday|Ravivāra[\s\S]*Sunrise to sunrise, from 6:23 AM/])
      assert.match(t, re);
    assert.match(await p.locator('.pn footer').innerText(), /Read at sunrise in New Delhi \(6:23 AM\)/);
    assert.equal(await p.locator('.pn-card ol > li').count(), 5);
    assert.equal(await p.locator('.pn-icon svg').count(), 5);
    assert.equal(await p.locator('#pn-loc').inputValue(), 'current'); // a place from the address shows as its own entry
    assert.match(await p.locator('#pn-loc option:checked').innerText(), /New Delhi/);
    await ctx.close(); }

  // ---- a site-less page: no header, footer or chat widget of the website
  { const { p, ctx } = await open(DELHI);
    assert.equal(await p.evaluate(() => [...document.body.children].filter(e => e.tagName !== 'MAIN' && e.tagName !== 'SCRIPT' && getComputedStyle(e).display !== 'none' && e.offsetHeight > 0).length), 0, 'site chrome hidden');
    assert.equal(await p.locator('nav, footer.site-footer, header.nav').filter({ visible: true }).count(), 0);
    await ctx.close(); }

  // ---- looks: 320px and desktop, light and dark, no sideways scroll
  for (const [name, w, scheme] of [['320-light', 320, 'light'], ['320-dark', 320, 'dark'], ['desktop-light', 1366, 'light'], ['desktop-dark', 1366, 'dark']]) {
    const { p, ctx } = await open(DELHI, { w, h: 800, scheme });
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, name + ': sideways scroll');
    const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(bg, scheme === 'dark' ? 'rgb(21, 30, 26)' : 'rgb(250, 245, 235)', name + ' ground colour');
    assert.ok((await p.locator('.pn-card').boundingBox()).width <= 560.5);
    await p.screenshot({ path: `${OUT}/panchanga-${name}.png`, fullPage: true }); await ctx.close();
  }
  // forced theme beats the device setting
  { const { p, ctx } = await open(DELHI + '&theme=dark', { scheme: 'light' });
    assert.equal(await p.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(21, 30, 26)'); await ctx.close(); }

  // ---- location: default from the device time zone, change it, it persists after a reload
  { const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, timezoneId: 'America/New_York' });
    const { p } = await open('?date=2026-10-18', { ctx });
    assert.equal(await p.locator('#pn-loc').inputValue(), 'America/New_York'); assert.match(await p.locator('.pn footer').innerText(), /New York/);
    const nyUntil = await p.locator('.pn-when').first().innerText();
    await p.selectOption('#pn-loc', 'Asia/Kolkata'); await p.waitForTimeout(300);
    assert.match(await p.locator('.pn footer').innerText(), /New Delhi \(6:2\d AM\)/);
    assert.match(await p.locator('.pn-when').first().innerText(), /Until 8:28 AM, then Aṣṭamī/); assert.notEqual(await p.locator('.pn-when').first().innerText(), nyUntil);
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('.pn-name');
    assert.equal(await p.locator('#pn-loc').inputValue(), 'Asia/Kolkata', 'choice persists'); assert.match(await p.locator('.pn-when').first().innerText(), /Until 8:28 AM/);
    // the address wins over a saved choice
    await p.goto(BASE + '/today/panchanga?date=2026-10-18&lat=51.51&lon=-0.13&tz=Europe%2FLondon&place=London', { waitUntil: 'networkidle' }); await p.waitForSelector('.pn-name');
    assert.match(await p.locator('.pn footer').innerText(), /London/);
    // geolocation: allowed → "your location"; blocked → a plain message, the list still works
    await ctx.grantPermissions(['geolocation']); await ctx.setGeolocation({ latitude: 35.68, longitude: 139.69 });
    await p.goto(BASE + '/today/panchanga?date=2026-10-18', { waitUntil: 'networkidle' }); await p.waitForSelector('.pn-name');
    await p.selectOption('#pn-loc', 'geo'); await p.waitForFunction(() => /your location/.test(document.querySelector('.pn footer').innerText));
    await p.evaluate(() => { navigator.geolocation.getCurrentPosition = (ok, no) => no({ code: 1 }); });
    await p.selectOption('#pn-loc', 'America/Chicago'); await p.waitForTimeout(200);
    await p.evaluate(() => { document.querySelector('#pn-loc').value = 'geo'; });
    await p.selectOption('#pn-loc', 'geo'); await p.waitForSelector('.pn-geo');
    assert.match(await p.locator('.pn-geo').innerText(), /Choose a city/);
    await ctx.close(); }
  // bad address values are ignored, not trusted
  { const { p, ctx } = await open('?date=2026-10-18&lat=999&lon=abc&tz=Mars%2FBase'); assert.match(await p.locator('.pn footer').innerText(), /New York/); await ctx.close(); }

  // ---- the explainer: mouse, keyboard, touch
  { const { p, ctx } = await open(DELHI);
    const dlg = p.locator('dialog'); assert.equal(await dlg.evaluate(d => d.open), false);
    await p.locator('.pn-info').click(); assert.equal(await dlg.evaluate(d => d.open), true);
    const dt = await dlg.innerText(); assert.match(dt, /The day’s five limbs/); assert.match(dt, /Indian astronomy uses the star-based \(sidereal\) zodiac/); assert.match(dt, /Karaṇa\s+Half a lunar day\./);
    assert.equal(await p.locator('.pn-dlg').evaluate(e => e.scrollTop), 0, 'opens at the top');
    assert.ok(await p.locator('dialog h2').isVisible());
    await p.screenshot({ path: `${OUT}/panchanga-dialog.png` });
    await p.keyboard.press('Escape'); assert.equal(await dlg.evaluate(d => d.open), false, 'Esc closes');
    await p.locator('.pn-info').focus(); await p.keyboard.press('Enter'); assert.equal(await dlg.evaluate(d => d.open), true, 'keyboard opens');
    await p.locator('.pn-close').click(); assert.equal(await dlg.evaluate(d => d.open), false, 'Close button');
    await p.locator('.pn-info').click(); await p.mouse.click(5, 5); assert.equal(await dlg.evaluate(d => d.open), false, 'click outside closes');
    await ctx.close(); }
  { const { p, ctx } = await open(DELHI, { w: 390, h: 800, touch: true });
    await p.locator('.pn-info').tap(); assert.equal(await p.locator('dialog').evaluate(d => d.open), true, 'touch opens');
    await p.locator('.pn-close').tap(); assert.equal(await p.locator('dialog').evaluate(d => d.open), false, 'touch closes');
    await ctx.close(); }

  // ---- framing: Circle's domain may frame it; another site may not
  // The page is served under a pretend https address that passes everything (headers included) straight through to the
  // server under test, so the browser applies the real framing rule against the real parent origin.
  const host = async origin => {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.route('https://panchanga.test/**', async r => { const u = new URL(r.request().url()); r.fulfill({ response: await r.fetch({ url: BASE + u.pathname + u.search }) }).catch(() => {}); });
    await p.route(origin + '/**', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><body><iframe id=f src="https://panchanga.test/today/panchanga${DELHI}" width="420" height="900"></iframe>` }));
    await p.goto(origin + '/c/today', { waitUntil: 'domcontentloaded' });
    const fr = p.frames().find(f => f !== p.mainFrame());
    let ok = 0; try { await fr.waitForSelector('.pn-name', { timeout: 9000 }); ok = await fr.locator('.pn-name').count(); } catch { ok = 0; }
    if (ok && origin.includes('ss.embodiedphilosophy.com')) await p.screenshot({ path: `${OUT}/panchanga-in-circle.png`, timeout: 8000 }).catch(() => {}); // best effort: web fonts may be unreachable
    await ctx.close(); return ok;
  };
  assert.ok(await host('https://ss.embodiedphilosophy.com') >= 5, 'framed by ss.embodiedphilosophy.com');
  assert.ok(await host('https://embodied-philosophy.circle.so') >= 5, 'framed by circle.so');
  assert.equal(await host('https://evil.example.test'), 0, 'other sites are refused');

  await b.close();
  assert.deepEqual(errs, [], 'page errors');
  console.log('panchanga ui: ok');
})().catch(e => { console.error(e); process.exit(1); });
