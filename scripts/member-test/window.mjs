// Checks the time-zone window for peer partners (lib/mentee/window.js). No network.
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/window.mjs
import assert from 'assert/strict';
const W = await import('../../lib/mentee/window.js');

// The case from the handoff: Milan + Costa Rica gives 8–10 am in San José = 3–5 pm in Milan (Milan is 7 hours ahead once the clocks go back)
const cr = W.suggestWindow([{ tz: 'America/Costa_Rica', label: 'your time' }, { tz: 'Europe/Rome', label: 'Milan' }], '2026-11-01');
assert.deepEqual(cr, { days: 'Sat or Sun', spans: [{ label: 'your time', text: '8–10 am' }, { label: 'Milan', text: '3–5 pm' }] });
// From Milan's side it is the same block
const it = W.suggestWindow([{ tz: 'Europe/Rome', label: 'your time' }, { tz: 'America/Costa_Rica', label: 'San José' }], '2026-11-01');
assert.deepEqual(it.spans.map(s => s.text), ['3–5 pm', '8–10 am']);
// Two people in the same zone: the first block of the day that is allowed (8 am)
assert.deepEqual(W.suggestWindow([{ tz: 'America/New_York', label: 'a' }, { tz: 'America/New_York', label: 'b' }], '2026-11-02').spans.map(s => s.text), ['8–10 am', '8–10 am']);
// London and New York (5 hours apart): 8 am New York = 1 pm London
assert.deepEqual(W.suggestWindow([{ tz: 'America/New_York', label: 'you' }, { tz: 'Europe/London', label: 'London' }], '2026-11-02').spans.map(s => s.text), ['8–10 am', '1–3 pm']);
// A trio: everyone has to be inside 8 am to 9 pm
const trio = W.suggestWindow([{ tz: 'America/Los_Angeles', label: 'you' }, { tz: 'America/New_York', label: 'NY' }, { tz: 'Europe/London', label: 'London' }], '2026-11-02');
assert.deepEqual(trio.spans.map(s => s.text), ['8–10 am', '11 am–1 pm', '4–6 pm']);
// No overlap at all: Auckland and Rome are 12 hours apart in November, so 8 am to 9 pm never meets
assert.equal(W.suggestWindow([{ tz: 'Pacific/Auckland', label: 'you' }, { tz: 'Europe/Rome', label: 'Rome' }], '2026-11-02'), null, 'no block suits both');
// The weekend comes first: asked on a Wednesday it answers for the coming Saturday and Sunday
assert.equal(W.suggestWindow([{ tz: 'America/New_York', label: 'a' }, { tz: 'Europe/Paris', label: 'b' }], '2026-11-04').days, 'Sat or Sun');
// Clocks that change between the Saturday and Sunday: US clocks go back on Sunday 1 Nov 2026, so Saturday 31 Oct and Sunday 1 Nov differ for a New York/Rome pair
const dst = W.suggestWindow([{ tz: 'America/New_York', label: 'you' }, { tz: 'Europe/Rome', label: 'Rome' }], '2026-10-28');
assert.ok(dst.days === 'Sat' || dst.days === 'Sat or Sun', 'a day is named');
// Bad input
assert.equal(W.suggestWindow([{ tz: 'Nowhere/City', label: 'x' }, { tz: 'Europe/Rome', label: 'y' }], '2026-11-01'), null);
assert.equal(W.suggestWindow([{ tz: 'Europe/Rome', label: 'y' }], '2026-11-01'), null, 'one zone is no pair');
assert.equal(W.suggestWindow([{ tz: 'Europe/Rome', label: 'a' }, { tz: 'Europe/Paris', label: 'b' }], 'soon'), null);

// span text and the hours apart
assert.equal(W.spanText(9, 11), '9–11 am'); assert.equal(W.spanText(11, 13), '11 am–1 pm'); assert.equal(W.spanText(15, 17), '3–5 pm'); assert.equal(W.spanText(12, 14), '12–2 pm');
assert.equal(W.hoursAhead('Europe/Rome', 'America/Costa_Rica', Date.parse('2026-11-01T12:00:00Z')), 7);
assert.equal(W.hoursAhead('Europe/Rome', 'America/Costa_Rica', Date.parse('2026-08-01T12:00:00Z')), 8, 'summer time in Milan');
assert.equal(W.hoursAhead('Asia/Kolkata', 'Europe/London', Date.parse('2026-11-01T12:00:00Z')), null, 'half hours are not whole');
assert.equal(W.validZone('Europe/Rome'), true); assert.equal(W.validZone('nope'), false);
console.log('window: ok');
