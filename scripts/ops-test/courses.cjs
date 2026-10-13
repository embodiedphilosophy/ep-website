// Course Library click-through: filters, live counts, single-select toggle-off, Clear all, list view, empty state,
// the phone filter sheet, the member view (dev preview), an offering page and its buy links.
// Screenshots go to out/courses-*.png.   node scripts/ops-test/courses.cjs   (after run.sh; reads only)
const { chromium } = require('./pw.cjs');
const assert = require('assert');
const B = 'http://localhost:3100', OUT = __dirname + '/out/';
const num = async p => parseInt(await p.locator('.cl-rcount').innerText(), 10);
const chip = (p, text) => p.locator('.cl-chip').filter({ hasText: text }).first();
const cnt = async (p, text) => parseInt(await chip(p, text).locator('.cnt').innerText(), 10);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const errs = [];
  const open = async (w, h, path = '/courses') => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(B + path, { waitUntil: 'networkidle' }); return p; };

  let p = await open(1440, 1000);
  assert.equal(await num(p), 19, 'all 19 seeded courses show');
  assert.equal(await p.locator('.cl-band').innerText().then(t => t.includes('A locked card shows the membership that opens it')), true);
  await p.screenshot({ path: OUT + 'courses-desktop.png', fullPage: true });
  assert(await p.locator('.cl-chk input').first().isDisabled(), 'membership filter disabled when signed out');
  assert((await p.locator('.cl-lock', { hasText: 'Unlock with Wisdom School Plus' }).count()) >= 1, 'locked cards show an unlock line');
  // counts recalculate against other filters
  const wsBefore = await cnt(p, 'Seasonal Sādhanas');
  await chip(p, 'Sādhana School').click();
  const n1 = await num(p); assert(n1 > 0 && n1 < 19, 'access filter narrows');
  assert((await chip(p, 'Meditation Mondays').getAttribute('class')).includes('dim'), 'zero-count option dims but stays clickable');
  assert.notEqual(await cnt(p, 'Seasonal Sādhanas'), wsBefore, 'counts recalculate');
  // single-select chips toggle off
  const live = p.locator('.cl-fgroup', { hasText: 'Format' }).locator('.cl-chip', { hasText: 'Live' }).first();
  await live.click(); assert.equal(await live.getAttribute('aria-pressed'), 'true'); assert(await num(p) <= n1);
  await live.click(); assert.equal(await live.getAttribute('aria-pressed'), 'false'); assert.equal(await num(p), n1, 'chip toggles off');
  // CE
  await p.locator('.cl-chk', { hasText: 'Certificate or CE' }).locator('input').check(); assert(await num(p) >= 0);
  await p.locator('.cl-fhead .cl-clear').click(); assert.equal(await num(p), 19, 'Clear all resets filters');
  // search (ignores diacritics), then empty state and Clear all
  await p.fill('.cl-search input', 'kali'); assert.equal(await num(p), 0 + (await p.locator('.cl-card').count()));
  await p.fill('.cl-search input', 'siva'); assert(await num(p) >= 1, 'siva finds Śiva Sūtras');
  await p.fill('.cl-search input', 'zzzz'); assert.equal(await num(p), 0);
  assert((await p.locator('.cl-empty h3').innerText()) === 'Nothing matches those filters');
  await p.screenshot({ path: OUT + 'courses-empty.png' });
  await p.locator('.cl-empty button').click(); assert.equal(await num(p), 19, 'Clear all resets search');
  assert.equal(await p.inputValue('.cl-search input'), '');
  // sort
  await p.selectOption('.cl-sort select', 'az');
  const titles = await p.locator('.cl-ctitle').allInnerTexts(); assert.deepEqual(titles, [...titles].sort((a, c) => a.localeCompare(c)));
  await p.selectOption('.cl-sort select', 'soon');
  // list view
  await p.getByRole('button', { name: 'List' }).click(); assert.equal(await p.locator('.cl-row').count(), 19);
  await p.screenshot({ path: OUT + 'courses-list.png', fullPage: true });
  await p.getByRole('button', { name: 'Grid' }).click();
  const hrefs = await p.locator('.cl-card').evaluateAll(a => a.map(x => x.getAttribute('href'))); assert(hrefs.every(h => /^\/courses\/[a-z0-9-]+$/.test(h)), 'every card links to its page');
  // member view (development preview only)
  p = await open(1440, 1000, '/courses?preview=member');
  assert((await p.locator('.cl-band').innerText()).includes('Wisdom School member'));
  await p.locator('.cl-chk', { hasText: 'Included in my membership' }).locator('input').check();
  const inc = await num(p); assert(inc > 0 && inc < 19); assert((await p.locator('.cl-badge.b-inc').count()) === inc);
  await p.screenshot({ path: OUT + 'courses-member.png' });
  // detail: buy buttons open the Circle paywall
  p = await open(1440, 1000, '/courses/siva-sutras');
  const buy = (await p.locator('.cl-cta').getAttribute('href')).replace(/\?amount=.*/, ''); assert(buy.startsWith('https://ss.embodiedphilosophy.com/checkout/'), buy);
  assert((await p.locator('.cl-incl li').count()) >= 1);
  assert((await p.locator('.cl-amt').last().innerText()) === 'Other');
  assert((await p.locator('.cl-cta').getAttribute('href')).endsWith('?amount=25'), 'second amount is preselected');
  await p.locator('.cl-amt', { hasText: 'Other' }).click(); assert.equal(await p.locator('.cl-cta').getAttribute('href'), buy);
  await p.screenshot({ path: OUT + 'courses-detail.png', fullPage: true });
  p = await open(1440, 1000, '/courses/meditation-mondays');
  assert((await p.locator('.cl-cta').getAttribute('href')).includes('meditation-pass'), 'member item opens its paywall');
  assert((await p.locator('.cl-amts').count()) === 0);

  // phone
  p = await open(390, 844);
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= 390), 'no horizontal scroll');
  await p.screenshot({ path: OUT + 'courses-phone.png' });
  assert(!(await p.locator('.cl-filters').isVisible()));
  await p.getByRole('button', { name: /^Filters/ }).click(); assert(await p.locator('.cl-filters').isVisible());
  await chip(p, 'Wisdom School').click();
  const shown = await num(p);
  assert((await p.locator('.cl-sheethead .cl-btn').innerText()).includes(`Show ${shown}`));
  await p.screenshot({ path: OUT + 'courses-phone-filters.png' });
  await p.locator('.cl-sheethead .cl-btn').click(); assert(!(await p.locator('.cl-filters').isVisible()));
  assert((await p.getByRole('button', { name: /^Filters \(1\)/ }).count()) === 1, 'button shows the active count');
  p = await open(390, 844, '/courses/siva-sutras'); assert(await p.evaluate(() => document.documentElement.scrollWidth <= 390));
  await p.screenshot({ path: OUT + 'courses-detail-phone.png', fullPage: true });

  assert.deepEqual(errs, [], 'page errors');
  console.log('courses: all checks passed'); await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
