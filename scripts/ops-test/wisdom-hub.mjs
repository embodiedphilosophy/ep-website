// The Wisdom School hub's rules: which plan a member has and what each tab shows for it.
// Run: node --import ./scripts/ce-test/register.mjs scripts/ops-test/wisdom-hub.mjs
import assert from 'assert/strict';
import { wisdomPlan, buildWisdomHub, tabKey } from '../../lib/school/wisdom.js';
import settings from '../../data/wisdom-hub.json' with { type: 'json' };

const rows = [
  { slug: 'meditation-for-real-life', title: 'Meditation for Real Life', hours: 6, sample: true, percent: 40, status: 'progress', lessonsDone: 4, lessonsTotal: 10, url: 'https://x/c/mfrl' },
  { slug: 'classical-yoga', title: 'Classical Yoga', hours: 12, sample: false, percent: 100, status: 'reflect', lessonsDone: 8, lessonsTotal: 8, url: 'https://x/c/cy' },
  { slug: 'subtle-body', title: 'The Subtle Body', hours: 12, sample: false, percent: 100, status: 'certified', cert: { id: 'EP-CE-2026-0001', status: 'issued', pdf: 'https://x/pdf' }, lessonsDone: 6, lessonsTotal: 6, url: 'https://x/c/sb' },
];
const T = (tier, extra = {}) => ({ tier, wisdom: false, wisdomPlus: false, ...extra });

// plans
assert.equal(wisdomPlan(T('none')).key, 'none');
assert.equal(wisdomPlan(T('meditation')).key, 'none');
assert.equal(wisdomPlan(T('wisdom', { wisdom: true })).label, 'Wisdom School');
assert.equal(wisdomPlan(T('wisdom_plus', { wisdomPlus: true })).label, 'Wisdom School Plus');
assert.equal(wisdomPlan(T('ss_year')).key, 'wisdom', 'annual Sādhana School includes Wisdom School, not Plus');
assert.equal(wisdomPlan(T('ss_year', { wisdomPlus: true })).key, 'plus', 'the Plus tag wins');
assert.equal(wisdomPlan(T('ss_season')).key, 'none', 'one season does not include Wisdom School');
assert.equal(tabKey('nope'), 'month'); assert.equal(tabKey('ce'), 'ce');

// Wisdom School member: only the sample Pathway open; Plus tabs are locked previews; one upgrade banner
const w = buildWisdomHub({ tier: T('wisdom', { wisdom: true }), rows, ce: null, settings });
assert.deepEqual(w.pathways.map(p => p.state), ['open', 'locked', 'locked']);
assert.equal(w.pathways[0].action, 'Resume'); assert.equal(w.pathways[1].action, 'Preview the first lesson · Unlock with Plus');
assert.equal(w.pathways[1].href, '', 'locked Pathways never carry a link into the space');
assert.ok(w.certificates.every(c => c.state === 'locked' && /Included with Plus, or take one on its own/.test(c.note) && c.cert === null));
assert.equal(w.ce.open, false); assert.equal(w.ce.dashboard.cycle.hours, 0); assert.ok(w.ce.explain);
assert.deepEqual(w.tabs.filter(t => t.locked).map(t => t.key), ['pathways', 'certificates', 'ce']);
assert.ok(w.banner && /Plus opens every Learning Pathway/.test(w.banner.text) && w.banner.url === settings.plus_url);

// Plus member: everything open, progress, certificates, owed reflections; no banner
const ce = { cycle: { hours: 12, need: 30, met: false }, certifiedHours: 12, availableHours: 30, byCategory: { 'Anatomy & Physiology': 12 }, rows };
const p = buildWisdomHub({ tier: T('wisdom_plus', { wisdomPlus: true }), rows, ce, settings });
assert.ok(p.pathways.every(x => x.state === 'open')); assert.equal(p.pathways[1].action, 'Review');
assert.equal(p.certificates[2].cert.pdf, 'https://x/pdf');
assert.deepEqual(p.ce.owed, [{ slug: 'classical-yoga', title: 'Classical Yoga' }]); assert.equal(p.ce.ready, 1); assert.equal(p.ce.dashboard.cycle.hours, 12);
assert.equal(p.banner, null); assert.ok(p.tabs.every(t => !t.locked));
console.log('wisdom hub: ok');
