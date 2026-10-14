// Sādhana School pricing for upgrades and seasonal-sādhana credits, used by the Circle Today strip.
// The full-year price steps down as the year goes on, because past seasons are on-demand only.
// Upgrading = the full-year price today − what they've already paid, but never less than Summer on its own
// (so applying a season to the year can't make Summer cheaper than buying it one-off).

export const SEASONS = ['fall', 'winter', 'spring', 'summer'];
export const SEASON_NAME = { fall: 'Fall', winter: 'Winter', spring: 'Spring', summer: 'Summer' };
export const SEASON_PRICE = { fall: 497, winter: 497, spring: 497, summer: 797 }; // one-off prices
export const SUMMER_ONE_OFF = 797;

// The full-year price from each date (New York). Spring: fill in its first session date when it's scheduled.
export const STAGES = [
  { key: 'early', from: '2026-01-01', year: 1797, live: ['fall', 'winter', 'spring', 'summer'] },
  { key: 'fall', from: '2026-10-21', year: 1997, live: ['fall', 'winter', 'spring', 'summer'] },
  { key: 'winter', from: '2027-01-27', year: 1697, live: ['winter', 'spring', 'summer'] },
  { key: 'spring', from: '', year: 1447, live: ['spring', 'summer'] },
];

// Circle checkout. The year paywall's price should match the stage price above (change it on each date).
// Single seasons: fill in each season's checkout once it's on Circle.
export const CHECKOUT = {
  year: 'https://ss.embodiedphilosophy.com/checkout/sadhana-school-year',
  fall: '', winter: '', spring: '',
};

// Circle coupons (Paywalls → Coupons), by the amount they take off: fixed amount, "Once", valid on the Year and
// single-season paywalls. Each person gets the largest coupon at or below what they should get off.
// Credit ladder for pay-what-you-can sādhanas: 10–297. Upgrades: 497 (one season paid), 650 and 900 (the floor cases).
export const COUPONS = {
  // 10: 'CODE', 20: '', 30: '', 40: '', 50: '', 60: '', 79: '', 100: '', 149: '', 200: '', 250: '', 297: '',
  // 497: '', 650: '', 900: '',
};

export function stageOn(day) {
  let s = null;
  for (const st of STAGES) if (st.from && st.from <= day) s = st;
  return s;
}

// The largest configured coupon at or below `amount` → { amount, code } or null.
export function couponFor(amount, coupons = COUPONS) {
  let best = null;
  for (const [a, code] of Object.entries(coupons)) if (code && Number(a) <= amount + 0.001 && (!best || Number(a) > best.amount)) best = { amount: Number(a), code };
  return best;
}

const money = n => '$' + Math.round(n).toLocaleString('en-US');
const withCoupon = (url, c) => url + (c ? (url.includes('?') ? '&' : '?') + 'coupon_code=' + encodeURIComponent(c.code) : '');

// What it costs this person to make it the full year today. seasons: what they've bought; credit: other money
// that counts (a pay-what-you-can sādhana). Returns null if there's no year to sell or no coupon to make it work.
export function yearQuote({ seasons = [], credit = 0 }, day, coupons = COUPONS) {
  const st = stageOn(day);
  if (!st || !CHECKOUT.year) return null;
  const bought = SEASONS.filter(s => seasons.includes(s));
  const paid = bought.reduce((a, s) => a + SEASON_PRICE[s], 0) + (credit || 0);
  const floor = bought.includes('summer') ? 0 : SUMMER_ONE_OFF;
  const target = Math.max(st.year - paid, floor); // what they should pay
  const off = st.year - target;
  const c = off > 0 ? couponFor(off, coupons) : null;
  if (off > 0 && !c) return null; // no coupon yet: don't show a price we can't honour
  const price = st.year - (c ? c.amount : 0);
  const remaining = st.live.filter(s => !bought.includes(s));
  const onDemand = SEASONS.filter(s => !st.live.includes(s) && !bought.includes(s));
  return {
    stage: st.key, yearPrice: st.year, paid, price, exact: price === target, floor: target === floor && floor > 0,
    remaining, onDemand, aLaCarte: remaining.reduce((a, s) => a + SEASON_PRICE[s], 0),
    href: withCoupon(CHECKOUT.year, c),
  };
}

// One offer for the Today strip, or null. tier: { tier, seasons, credits } from lib/member/tier.js.
export function memberOffer(tier, day, coupons = COUPONS) {
  if (!tier || ['ss_year', 'mentee'].includes(tier.tier)) return null;
  const st = stageOn(day);
  if (!st) return null;
  const seasons = tier.seasons || [];
  const credit = Object.entries(tier.credits || {})[0]; // [key, { name, amount, until }]

  // A pay-what-you-can sādhana (Navarātri…): its amount counts toward this season or the year
  if (credit && !seasons.length) {
    const [key, cr] = credit;
    const options = [];
    const cur = st.live[0];
    const single = CHECKOUT[cur];
    const sc = couponFor(Math.min(cr.amount, SEASON_PRICE[cur]), coupons);
    if (single && sc) options.push({ label: `${SEASON_NAME[cur]} season`, price: SEASON_PRICE[cur] - sc.amount, href: withCoupon(single, sc) });
    const q = yearQuote({ seasons: [], credit: cr.amount }, day, coupons);
    if (q && q.price < q.yearPrice) options.push({ label: 'The full year', price: q.price, href: q.href });
    if (!options.length) return null;
    const off = st.year - options[options.length - 1].price;
    return {
      kind: 'credit', key, until: cr.until,
      eyebrow: `Your ${cr.name} offering`,
      title: `Carry ${cr.name} into Sādhana School`,
      body: `What you offered for ${cr.name} counts: ${money(off)} off ${single && sc ? `the ${SEASON_NAME[cur]} season or ` : ''}the full year of The Path of Recognition. The credit is already applied at checkout.`,
      why: `You joined ${cr.name} this season. For 14 days afterwards, what you offered can go toward Sādhana School.`,
      options,
    };
  }

  // A single-season student: make it the full year
  if (tier.tier === 'ss_season' && seasons.length) {
    const q = yearQuote({ seasons, credit: credit ? credit[1].amount : 0 }, day, coupons);
    if (!q || !q.remaining.length) return null;
    const names = q.remaining.map(s => s === 'summer' ? 'the online summer immersion' : SEASON_NAME[s]);
    const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
    const had = seasons.map(s => SEASON_NAME[s]).join(' and ');
    return {
      kind: 'upgrade', key: `year_${q.stage}_${seasons.join('_')}`,
      eyebrow: 'Your Sādhana School year',
      title: 'Make it the full year',
      body: `What you’ve paid for ${had} counts. ${list.charAt(0).toUpperCase() + list.slice(1)}${q.onDemand.length ? ', with ' + q.onDemand.map(s => SEASON_NAME[s]).join(' and ') + ' on demand,' : ''} ${q.remaining.length > 1 ? 'are' : 'is'} yours for ${money(q.price)}.`,
      note: q.aLaCarte > q.price ? `Bought one by one, the rest comes to ${money(q.aLaCarte)}` : '',
      why: `You’re enrolled in ${had}. The full-year price steps down each season, and what you’ve paid always counts.`,
      options: [{ label: `Make it the full year · ${money(q.price)}`, price: q.price, href: q.href }],
    };
  }
  return null;
}
