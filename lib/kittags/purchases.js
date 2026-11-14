// Every Circle paywall purchase → a "Purchased: …" tag in Kit, automatically, for every paywall present and
// future. No per-paywall Circle workflow needed.
//
// Source: the EP ledger (Transactions tab). Make's "Circle Stripe → EP Ledger" scenario writes a row the moment
// a Circle checkout is charged, with the buyer's email and the paywall's product name as the description.
// Every 15 minutes we read the last few days of Circle rows and make sure each buyer carries the product's tag
// (tags are created in Kit if they don't exist yet). Re-running is harmless: Kit keeps existing tags.
import { readRange } from '@/lib/google';
import { ensureTag, upsertSubscriber, addTag } from '@/lib/kit';

export const LEDGER_SHEET = '1gK_02Szjd76AYEUCNcUHAXZtJZh5PYIwSpzrek4OSYs';
const COL = { date: 0, refunded: 5, source: 8, description: 10, charge: 12, email: 14 };

// Memberships and Sādhana School enrolments already have their own tag + access engines; skip them here.
const HANDLED_ELSEWHERE = /^(wisdom school|meditation pass|sādhana school|sadhana school|sahṛdaya|sahrdaya)/i;

// Where an existing tag name differs from the product name, map it here (lower-case product name → tag),
// so emails that already use the old tag keep working. Everything else gets "Purchased: <product name>".
const TAG_FOR = {
  'beneath the pose · open session (sat nov 14)': 'Purchased: Open Session · Beneath the Pose',
  'christian mysticism with mary reilly nichols & floss harry': 'Purchased: Christian Mysticism',
};

const clean = d => String(d || '').replace(/\s*\(combined:[^)]*\)\s*$/i, '').trim();

export function tagNameFor(description) {
  const product = clean(description);
  if (!product || HANDLED_ELSEWHERE.test(product)) return null;
  return TAG_FOR[product.toLowerCase()] || `Purchased: ${product}`;
}

// Rows from the last `days` days that should be tagged: [{ email, product, tag, date, charge }]
export async function recentCirclePurchases({ days = 3 } = {}) {
  const values = await readRange(LEDGER_SHEET, 'Transactions!A:O', { fresh: true });
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const out = [];
  for (const r of values || []) {
    if (String(r[COL.source] || '').trim() !== 'Circle') continue;
    const date = String(r[COL.date] || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < since) continue;
    const email = String(r[COL.email] || '').trim().toLowerCase();
    const tag = tagNameFor(r[COL.description]);
    if (!email.includes('@') || !tag) continue;
    out.push({ email, product: clean(r[COL.description]), tag, date, charge: r[COL.charge] || '' });
  }
  return out;
}

export async function runPurchaseTags({ dry = false, days = 3 } = {}) {
  const rows = await recentCirclePurchases({ days });
  const seen = new Set();
  const todo = rows.filter(r => { const k = `${r.email}|${r.tag}`; if (seen.has(k)) return false; seen.add(k); return true; });
  if (dry) return { dry: true, count: todo.length, would_tag: todo.map(r => ({ tag: r.tag, date: r.date })) };
  const tagIds = new Map();
  const done = [], failed = [];
  for (const r of todo) {
    try {
      if (!tagIds.has(r.tag)) tagIds.set(r.tag, await ensureTag(r.tag));
      await upsertSubscriber(r.email);
      await addTag(tagIds.get(r.tag), r.email);
      done.push(r.tag);
    } catch (e) { failed.push({ tag: r.tag, error: e.message.slice(0, 120) }); }
  }
  return { tagged: done.length, failed };
}
