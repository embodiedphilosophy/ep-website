// Offline checks for the Sahṛdaya Upāya page (/c/mentorship): next immersion, Prepare opening, windows, peer partner.
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee-home.mjs
import assert from 'assert/strict';
const H = await import('../../lib/mentee/home.js');
const C = await import('../../lib/mentee/content.js');
const config = (await import('../../data/mentee.json', { with: { type: 'json' } })).default;

assert.equal(config.immersions.length, 8);
assert.equal(H.nextImmersion(config.immersions, '2026-10-21').n, 1);
assert.equal(H.nextImmersion(config.immersions, '2026-11-15').n, 1, 'still immersion 1 on its Sunday');
assert.equal(H.nextImmersion(config.immersions, '2026-11-16').n, 2);
assert.equal(H.nextImmersion(config.immersions, '2027-05-31'), null);

const week = { formation: null, due: { items: [] }, sessions: [{ id: 's1', title: 'Sunday Practicum', start: '2026-11-15T15:00:00Z', url: 'https://ss/x', rsvped: false }], oneToOne: null };
const run = today => H.buildHome(week, { config, today, tz: 'Europe/London', partner: null }).home;
let h = run('2026-10-21');
assert.equal(h.immersion.n, 1); assert.equal(h.immersion.daysTo, 24); assert.equal(h.immersion.prepare.open, false); assert.equal(h.immersion.prepare.opens, '2026-10-31');
assert.equal(h.immersion.practicum.id, 's1'); assert.equal(h.startHere, true);
h = run('2026-10-31'); assert.equal(h.immersion.prepare.open, true, 'opens two weeks before the Saturday');
assert.equal(run('2026-11-14').immersion.happening, true);
assert.deepEqual(h.oneToOne.window, { from: '2026-10-26', to: '2026-10-30' }.to < '2026-10-31' ? { from: '2026-11-23', to: '2026-11-27' } : null, 'window passed → next one');
assert.equal(H.windowFor(config.windows, '2026-10-28').from, '2026-10-26');
assert.equal(H.windowFor(config.windows, '2027-06-01'), null);

const rows = [
  { season: 'fall-2026', month: 'November', email_a: 'Maya@x.com', email_b: 'sam@x.com', name_b: 'Sam', publish: '' },
  { season: 'fall-2026', month: 'December', email_a: 'maya@x.com', email_b: 'lee@x.com' },
  { season: 'fall-2026', month: '2026-11', email_a: 'hide@x.com', email_b: 'z@x.com', publish: 'FALSE' },
];
assert.deepEqual(C.partnerFor(rows, 'maya@x.com', 'fall-2026', '2026-11-03'), { month: 'november', name: 'Sam', email: 'sam@x.com' });
assert.equal(C.partnerFor(rows, 'sam@x.com', 'fall-2026', '2026-11-03').email, 'maya@x.com');
assert.equal(C.partnerFor(rows, 'maya@x.com', 'fall-2026', '2026-10-21'), null, 'nothing set for October → card hidden');
assert.equal(C.partnerFor(rows, 'hide@x.com', 'fall-2026', '2026-11-03'), null);
console.log('mentee home: ok');
