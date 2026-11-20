// Cyber Week 2026: tag every Cyber purchase in Kit, so the follow-up automation in Kit can thank the buyer and
// offer the right next step (Kit automation "Cyber 2026 · Thank you + membership menu", triggered by the Buyer tag).
//
// Two sources, both read by the 15-minute purchase-tags cron (app/api/kit/purchase-tags):
//   • Circle paywalls (certificates, Wisdom School Plus, Sādhana School Archive): rows in the EP ledger whose
//     product name ends in "· Cyber Week" (every Cyber paywall's display name does).
//   • Kit Commerce pay-what-you-can courses: Kit purchases of a "(On Demand)" product made during Cyber Week.
//     The same products sell all year through ads, so only purchases inside the Cyber dates count.
//
// Each buyer gets a type tag first (Course / Certificate / Plus / Archive) and then "Cyber 2026: Buyer", so the
// automation, which starts on the Buyer tag, can already see what they bought. Re-running is harmless.
import { dates } from '@/app/lp/cyber-monday/cyber-2026';

export const CYBER_TAGS = {
  buyer: 'Cyber 2026: Buyer',
  course: 'Cyber 2026: Course',
  certificate: 'Cyber 2026: Certificate',
  plus: 'Cyber 2026: Plus',
  archive: 'Cyber 2026: Archive',
  archiveYear: 'Cyber 2026: Archive Year', // a complete past year ($497): a bigger credit toward this year
};

// Cyber Week runs from members' early access to the Open Library's close; a day's grace catches late-night
// checkouts and ledger rows written just after midnight.
const START = Date.parse(dates.earlyAccessOpens);
const END = Date.parse(dates.openLibraryClose) + 864e5;
export const inCyberWeek = when => { const t = Date.parse(when); return t >= START && t <= END; };

const isCyberProduct = name => /·\s*cyber week\s*$/i.test(String(name || '').trim());

// The type tags for a Circle Cyber paywall, by its display name; [] when it isn't a Cyber paywall.
export function cyberTypesForCircle(product) {
  if (!isCyberProduct(product)) return [];
  const p = String(product).toLowerCase();
  if (p.includes('certificate')) return [CYBER_TAGS.certificate];
  if (p.startsWith('wisdom school plus')) return [CYBER_TAGS.plus];
  // Past Sādhana School seasons and the summer retreat; a complete year also gets the Archive Year tag.
  return p.includes('complete year') ? [CYBER_TAGS.archiveYear, CYBER_TAGS.archive] : [CYBER_TAGS.archive];
}

// Kit Commerce pay-what-you-can course purchases made during Cyber Week, in the last `days` days (the cron runs
// every 15 minutes, so a short look-back is enough and keeps each run quick): [{ email, tag, date }]
export async function cyberKitPurchases(listPurchases, { days = 3 } = {}) {
  const since = Date.now() - days * 864e5;
  const out = [];
  let after = '';
  for (let i = 0; i < 40; i++) {
    const r = await listPurchases(after);
    const rows = r.purchases || [];
    for (const p of rows) {
      if (!inCyberWeek(p.transaction_time) || Date.parse(p.transaction_time) < since) continue;
      if (!(p.products || []).some(x => /\(on demand\)/i.test(x.name || ''))) continue;
      const email = String(p.email_address || '').trim().toLowerCase();
      if (email.includes('@')) out.push({ email, tag: CYBER_TAGS.course, date: String(p.transaction_time).slice(0, 10) });
    }
    // Kit lists newest first: stop once a page reaches back before Cyber Week.
    const oldest = rows[rows.length - 1]?.transaction_time;
    if (!r.pagination?.has_next_page || (oldest && Date.parse(oldest) < Math.max(START, since))) break;
    after = r.pagination.end_cursor;
  }
  return out;
}
