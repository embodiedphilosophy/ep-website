// Seasonal sādhana credits. What someone offered for a pay-what-you-can sādhana (Navarātri…) can be applied to
// the Fall season or the full year for a short time afterwards. The amount lives in a Kit custom field per offer
// (filled by the SamCart webhook today; by Kit-based pay-what-you-can checkouts later). The Circle Today strip
// shows the offer and links to Circle checkout with the matching ladder coupon (public/circle/today.js).

// field: the Kit custom field holding the amount paid. until: last day of the offer (New York date).
// samcart: how to recognise the product in a SamCart order (by id or name).
export const CREDIT_OFFERS = [
  { key: 'navaratri_2026', name: 'Navarātri', field: 'navaratri_credit', from: '2026-10-01', until: '2026-11-03', samcart: { ids: ['1131997'], name: /navar[aā]tri/i } },
];

// "$79.00", "79", 79 → 79. Anything else → 0. Rounded down to cents.
export function parseAmount(v) {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.floor(n * 100) / 100 : 0;
}

// Kit subscriber fields → the offers this person can use today: { key: { name, amount, until } }
export function creditsFromFields(fields, today) {
  const out = {};
  for (const o of CREDIT_OFFERS) {
    const amount = parseAmount(fields?.[o.field]);
    if (amount > 0 && today >= o.from && today <= o.until) out[o.key] = { name: o.name, amount, until: o.until };
  }
  return out;
}

const pick = (...v) => v.find(x => x !== undefined && x !== null && String(x).trim() !== '');

// A SamCart webhook body → { kitField: amount } for any credit offer it contains.
// Uses the product's own line amount when SamCart sends one, otherwise the order total.
export function samcartCredits(b) {
  const lines = [].concat(b?.products || [], b?.product ? [b.product] : [], b?.order?.products || []);
  const out = {};
  for (const o of CREDIT_OFFERS) {
    const line = lines.find(p => o.samcart.ids.includes(String(pick(p.id, p.product_id, p.pid) || '')) || o.samcart.name.test(String(pick(p.name, p.product_name, p.title) || '')));
    if (!line) continue;
    const amount = parseAmount(pick(line.total, line.price, line.amount, line.subtotal, b?.order?.total, b?.total, b?.order?.subtotal));
    if (amount > 0) out[o.field] = amount;
  }
  return out;
}

// New York date, YYYY-MM-DD
export const nyToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
