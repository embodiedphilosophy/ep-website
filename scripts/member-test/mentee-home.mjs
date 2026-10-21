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

// Reflections posted in the Mentorship Circle count automatically: one hour per calendar month, only the member's own posts
const post = (id, day) => ({ author: { community_member_id: id }, created_at: day + 'T10:00:00.000Z' });
const rr = H.reflectionRows([post(7, '2026-11-03'), post(7, '2026-11-20'), post(9, '2026-11-04'), post(7, '2026-12-02'), post(7, '2026-09-01'), { author: {}, created_at: '2026-11-05T00:00:00Z' }], 7, '2026-10-21');
assert.deepEqual(rr.map(r => r.day), ['2026-11-03', '2026-12-02'], 'one per month, earliest post, own posts only, nothing before the season');
assert.equal(H.reflectionRows([post(7, '2026-11-03')], null, '').length, 0, 'no member id → nothing counted');
const { summarise, withAuto } = await import('../../lib/member/formation.js');
const base = { ...summarise([{ component: 'immersions', hours: 6 }]), entries: [{ id: '1', component: 'immersions', hours: 6, day: '2026-11-15', status: 'credited' }] };
const merged = withAuto(base, rr);
assert.equal(merged.total, 8); assert.equal(merged.components.find(c => c.id === 'reflections').credited, 2); assert.equal(merged.entries.length, 3);
assert.equal(withAuto(base, []), base);
const capped = withAuto(base, Array.from({ length: 9 }, (_, i) => ({ id: 'x' + i, component: 'reflections', hours: 1, day: '2026-1' + (i % 3) + '-01', status: 'credited' })));
assert.equal(capped.components.find(c => c.id === 'reflections').credited, 6, 'capped at the component target');
console.log('reflections: ok');

// Calendly: open times and the mentee's own booking, with the API faked (live shapes checked against the real API on 21 Oct 2026)
process.env.CALENDLY_TOKEN = 'test';
const CAL = await import('../../lib/mentee/calendly.js');
const realFetch = globalThis.fetch; const urls = [];
globalThis.fetch = async u => {
  urls.push(String(u));
  const json = b => ({ ok: true, status: 200, json: async () => b });
  if (String(u).includes('/users/me')) return json({ resource: { uri: 'https://api.calendly.com/users/U1' } });
  if (String(u).includes('/event_type_available_times')) return json({ collection: [
    { status: 'available', start_time: '2026-11-24T18:00:00Z', scheduling_url: 'https://calendly.com/embodied-philosophy/x/2026-11-24T18:00:00Z' },
    { status: 'unavailable', start_time: '2026-11-24T19:00:00Z', scheduling_url: 'https://calendly.com/embodied-philosophy/x/b' },
    { status: 'available', start_time: '2026-11-25T18:00:00Z', scheduling_url: 'https://evil.example/x' }] });
  if (String(u).includes('/scheduled_events')) return json({ collection: [{ event_type: 'https://api.calendly.com/event_types/ET1', start_time: '2026-11-25T18:00:00Z', location: { join_url: 'https://zoom.us/j/1' } }, { event_type: 'https://api.calendly.com/event_types/OTHER', start_time: '2026-11-20T18:00:00Z' }] });
  return { ok: false, status: 404 };
};
const now = Date.parse('2026-10-21T07:30:00Z');
const sl = await CAL.openSlots('ET1', '2026-11-23', '2026-11-27', now);
assert.deepEqual(sl.map(s => s.start), ['2026-11-24T18:00:00Z'], 'only available times, only Calendly links');
const q = new URL(urls.find(u => u.includes('available_times'))); assert.ok(Date.parse(q.searchParams.get('end_time')) - Date.parse(q.searchParams.get('start_time')) <= 7 * 864e5, 'never asks for more than 7 days');
assert.deepEqual(await CAL.bookedFor('ET1', 'Maya@x.com', now), { start: '2026-11-25T18:00:00Z', url: 'https://zoom.us/j/1' }, 'matches the one-to-one event type only');
delete process.env.CALENDLY_TOKEN; assert.deepEqual(await CAL.openSlots('ET1', '2026-11-23', '2026-11-27', now + 1), [], 'no token → button only');
globalThis.fetch = realFetch;
console.log('calendly: ok');

// Cohort chat: real message shape (body, sent_at, sender.community_admin), newest last, mentor tag for admins/moderators
const msg = (id, who, at, extra = {}) => ({ id, body: 'Hello ' + id, sent_at: at, sender: { name: who, community_admin: false, moderator: false, ...extra } });
const lines = H.chatLines([msg(1, 'Jacob', '2026-10-21T07:32:01Z', { community_admin: true }), msg(2, 'Maya', '2026-10-21T08:00:00Z'), { id: 3, body: '', sent_at: '2026-10-21T09:00:00Z', sender: {} }, msg(4, 'Sam', '2026-10-21T09:30:00Z', { moderator: true })]);
assert.deepEqual(lines.map(l => [l.who, l.mentor]), [['Jacob', true], ['Maya', false], ['Sam', true]], 'empty messages dropped, mentor tag for admins and moderators');
assert.equal(H.chatLines(Array.from({ length: 40 }, (_, i) => msg(i, 'x', '2026-10-21T07:' + String(i % 60).padStart(2, '0') + ':00Z'))).length, 30);
console.log('chat: ok');
