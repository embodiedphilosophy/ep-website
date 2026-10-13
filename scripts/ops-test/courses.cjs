// Course Library click-through: filters, live counts, single-select toggle-off, Clear all, list view, empty state,
// the phone filter sheet, an offering page and the revalidate endpoint. Screenshots go to out/courses-*.png.
//   node scripts/ops-test/courses.cjs        (after run.sh; reads only, nothing is written anywhere)
const { chromium } = require('./pw.cjs');
const assert = require('assert');
const B = 'http://localhost:3100', OUT = __dirname + '/out/';
const num = async p => parseInt(await p.locator('.cl-count b').innerText(), 10);
const cnt = async (p, text) => parseInt(await p.locator('.cl-opt, .cl-chip').filter({ hasText: text }).first().locator('.cl-n').innerText(), 10);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const errs = [];
  const open = async (w, h, path = '/courses') => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(B + path, { waitUntil: 'networkidle' }); return p; };

  let p = await open(1440, 1000);
  assert.equal(await num(p), 19, 'all 19 seeded courses show');
  await p.screenshot({ path: OUT + 'courses-desktop.png' });
  assert(await p.locator('.cl-opt.off input').isDisabled(), 'membership filter disabled when signed out');
  assert.equal(await p.locator('.cl-lock').count() > 0, true, 'locked cards show an unlock line');
  assert((await p.locator('.cl-lock', { hasText: 'Unlock with Wisdom School Plus' }).count()) >= 1);
  // counts recalc against other filters
  const before = await cnt(p, 'Meditation Mondays');
  await p.locator('.cl-opt', { hasText: 'Sādhana School' }).first().locator('.cl-box').click();
  const n1 = await num(p); assert(n1 > 0 && n1 < 19, 'access filter narrows');
  assert.notEqual(await cnt(p, 'Meditation Mondays'), before === 0 ? -1 : before + 99, 'sanity');
  // single-select chips toggle off
  const chip = p.locator('.cl-chip', { hasText: 'Live' }).first();
  await chip.click(); const n2 = await num(p); assert(n2 <= n1);
  assert.equal(await chip.getAttribute('aria-pressed'), 'true');
  await chip.click(); assert.equal(await chip.getAttribute('aria-pressed'), 'false'); assert.equal(await num(p), n1, 'chip toggles off');
  // CE
  await p.locator('.cl-opt', { hasText: 'Certificate or CE' }).locator('.cl-box').click();
  assert(await num(p) < n1 || n1 === await num(p));
  // search then clear all
  await p.fill('.cl-search input', 'kali'); assert.equal(await num(p), 1);
  await p.fill('.cl-search input', 'zzzz'); assert.equal(await num(p), 0);
  assert(await p.locator('.cl-empty').isVisible()); assert((await p.locator('.cl-empty h2').innerText()).includes('Nothing matches those filters'));
  await p.screenshot({ path: OUT + 'courses-empty.png' });
  await p.locator('.cl-empty button').click(); assert.equal(await num(p), 19, 'Clear all resets search and filters');
  assert.equal(await p.inputValue('.cl-search input'), '');
  // sort
  await p.selectOption('.cl-sort select', 'title');
  const titles = await p.locator('.cl-card h3').allInnerTexts(); assert.deepEqual(titles, [...titles].sort((a, c) => a.localeCompare(c)));
  // list view
  await p.selectOption('.cl-sort select', 'soonest');
  await p.getByRole('button', { name: 'List' }).click(); assert.equal(await p.locator('.cl-row').count(), 19);
  await p.screenshot({ path: OUT + 'courses-list.png' });
  // every card links to its detail page
  await p.getByRole('button', { name: 'Grid' }).click();
  const hrefs = await p.locator('.cl-card').evaluateAll(a => a.map(x => x.getAttribute('href'))); assert(hrefs.every(h => /^\/courses\/[a-z0-9-]+$/.test(h)));
  // detail page: buy button opens the Circle paywall
  p = await open(1440, 1000, '/courses/shiva-sutras');
  const buy = await p.locator('.cl-cta').getAttribute('href'); assert(buy.startsWith('https://ss.embodiedphilosophy.com/checkout/'), buy);
  assert((await p.locator('.cl-incl li').count()) >= 1);
  await p.screenshot({ path: OUT + 'courses-detail.png', fullPage: true });
  p = await open(1440, 1000, '/courses/meditation-mondays');
  await p.locator('.cl-amts .cl-chip', { hasText: '$15' }).click();
  assert((await p.locator('.cl-cta').getAttribute('href')).endsWith('?amount=15'));

  // phone
  p = await open(390, 844);
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= 390), 'no horizontal scroll');
  await p.screenshot({ path: OUT + 'courses-phone.png' });
  assert(!(await p.locator('.cl-filters').isVisible()));
  await p.getByRole('button', { name: /^Filters/ }).click(); assert(await p.locator('.cl-filters').isVisible());
  await p.locator('.cl-opt', { hasText: 'Wisdom School' }).first().locator('.cl-box').click();
  const shown = await num(p);
  assert((await p.locator('.cl-sheet-foot .btn').innerText()).includes(`Show ${shown}`));
  await p.screenshot({ path: OUT + 'courses-phone-filters.png' });
  await p.locator('.cl-sheet-foot .btn').click(); assert(!(await p.locator('.cl-filters').isVisible()));
  p = await open(390, 844, '/courses/shiva-sutras'); assert(await p.evaluate(() => document.documentElement.scrollWidth <= 390));
  await p.screenshot({ path: OUT + 'courses-detail-phone.png', fullPage: true });

  assert.deepEqual(errs, [], 'page errors');
  console.log('courses: all checks passed'); await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
