// The Wisdom School hub (/school/wisdom-school): the plan a member has, and what each tab shows for it.
// Wisdom School members see the Plus tabs as locked previews with one upgrade path; Plus members see everything open.
// Pure: no reads here, so the rules are testable (scripts/ops-test/wisdom-hub.mjs).
import { OPEN } from '../member/programmes';

export const TABS = [
  { key: 'month', label: 'This month' },
  { key: 'live', label: 'Live' },
  { key: 'pathways', label: 'Learning Pathways', plus: true },
  { key: 'certificates', label: 'Certificates', plus: true },
  { key: 'ce', label: 'CE credits', plus: true },
];
export const tabKey = t => (TABS.some(x => x.key === t) ? t : 'month');

// tier: lib/member/tier.js (tier name plus wisdom / wisdomPlus flags). The highest plan wins; annual Sādhana School includes
// Wisdom School but not Plus.
export function wisdomPlan(tier) {
  const open = OPEN[tier?.tier] || [];
  if (tier?.wisdomPlus || open.includes('ce')) return { key: 'plus', label: 'Wisdom School Plus' };
  if (tier?.wisdom || open.includes('wisdom')) return { key: 'wisdom', label: 'Wisdom School' };
  return { key: 'none', label: '' };
}

const LOCK_PATHWAY = 'Preview the first lesson · Unlock with Plus';
const LOCK_CERT = 'Included with Plus, or take one on its own';

// rows: the CE summary rows (lib/ce/rules.js summarise) or bare pathways; ce: the CE summary or null
export function buildWisdomHub({ tier, rows = [], ce = null, settings }) {
  const plan = wisdomPlan(tier), plus = plan.key === 'plus';
  const pathways = rows.map(r => {
    const open = plus || !!r.sample;
    return {
      slug: r.slug, title: r.title, hours: r.hours, category: r.category, modules: r.modules || [], sample: !!r.sample,
      state: open ? 'open' : 'locked', percent: open ? r.percent || 0 : 0, status: open ? r.status || 'new' : 'locked',
      lessons: open ? { done: r.lessonsDone || 0, total: r.lessonsTotal || 0 } : null,
      href: open ? r.url || '' : '', action: !open ? LOCK_PATHWAY : r.percent > 0 && r.percent < 100 ? 'Resume' : r.percent >= 100 ? 'Review' : 'Start',
      cta: !open ? settings.plus_url : '',
    };
  });
  const certificates = rows.map(r => ({
    slug: r.slug, title: r.title, hours: r.hours, state: plus ? 'open' : 'locked',
    percent: plus ? r.percent || 0 : 0, status: plus ? r.status || 'new' : 'locked', cert: plus ? r.cert || null : null,
    note: plus ? '' : LOCK_CERT, cta: plus ? '' : (settings.certificate_urls && settings.certificate_urls[r.slug]) || settings.plus_url,
  }));
  const owed = plus ? rows.filter(r => r.status === 'reflect').map(r => ({ slug: r.slug, title: r.title })) : [];
  const total = Math.round(rows.reduce((a, r) => a + (r.hours || 0), 0) * 10) / 10;
  const dash = plus && ce ? ce : { cycle: { hours: 0, need: 30, met: false }, certifiedHours: 0, availableHours: total, byCategory: {} };
  return {
    plan, tabs: TABS.map(t => ({ ...t, locked: t.plus && !plus })), pathways, certificates,
    ce: { open: plus, dashboard: dash, owed, ready: rows.filter(r => r.cert && r.cert.status === 'issued').length,
      explain: plus ? '' : 'Your hours appear here as you finish Pathways and write a short reflection.' },
    // one banner, Wisdom School members only, on the Plus tabs
    banner: plan.key === 'wisdom' ? { text: settings.plus_banner, url: settings.plus_url, key: `ep-wisdom-banner-${settings.season}` } : null,
  };
}
