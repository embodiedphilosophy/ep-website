// The Schedule view's data: immersions with their sessions (Circle first, the events sheet as a stand-in), prepare dates, windows, retreat.
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee-schedule.mjs
import assert from 'assert/strict';
const S = await import('../../lib/mentee/schedule.js');
const config = { mentorship_sessions_space_id: 7, immersions: [{ n: 2, title: 'Tasting the Real', sat: '2026-12-05', sun: '2026-12-06', sat_link: 'https://zoom.us/j/1', sun_link: 'not a link' }, { n: 1, title: 'Beneath the Pose', sat: '2026-11-14', sun: '2026-11-15' }],
  windows: [{ from: '2026-11-23', to: '2026-11-27' }, { from: '2026-10-19', to: '2026-10-23' }, { from: '2026-12-21', to: '2026-12-23' }] };
const ev = (id, name, s, e, x = {}) => ({ id, name, starts_at: s, ends_at: e, space_id: 7, ...x });
const events = [ev(1, 'Open Session', '2026-11-14T15:00:00Z', '2026-11-14T17:30:00Z'), ev(2, 'Practicum', '2026-11-15T15:00:00Z', '2026-11-15T17:30:00Z', { rsvped_event: true, post_url: 'https://ss/e/2' }), ev(3, 'Other space', '2026-12-05T15:00:00Z', '2026-12-05T17:30:00Z', { space_id: 9 })];
const sheet = [{ date: '2026-12-05', title: 'Open Session · Tasting the Real', start: '2026-12-05T15:00:00Z', end: '2026-12-05T17:30:00Z' }, { date: '2027-07-10', end_date: '2027-07-16', title: 'Summer retreat' }];
const workbook = { immersions: { 1: { prepare: { url: 'https://wb/p1', done: true } } } };
const r = S.menteeSchedule({ config, today: '2026-11-14', events, sheet, workbook, now: Date.parse('2026-11-14T16:00:00Z') });
assert.deepEqual(r.immersions.map(i => i.n), [1, 2], 'in date order');
const i1 = r.immersions[0], i2 = r.immersions[1];
assert.equal(i1.openSession.id, '1'); assert.equal(i1.openSession.today, true, 'Saturday itself: the Join button'); assert.equal(i1.practicum.rsvped, true); assert.equal(i1.practicum.url, 'https://ss/e/2');
assert.deepEqual([i1.prepare.opens, i1.prepare.open, i1.prepare.url, i1.prepare.done], ['2026-10-31', true, 'https://wb/p1', true]);
assert.equal(i2.openSession.fromCircle, false, 'no Circle event in the mentorship space: the sheet row stands in'); assert.equal(i2.practicum, null); assert.equal(i2.prepare.open, false); assert.equal(i2.prepare.opens, '2026-11-21');
assert.deepEqual(r.windows.map(w => [w.from, w.open]), [['2026-11-23', true], ['2026-12-21', false]], 'past windows dropped; booking shows from three weeks before');
assert.deepEqual(r.retreat, { title: 'Summer retreat', date: '2027-07-10', end: '2027-07-16' });
assert.equal(S.menteeSchedule({ config, today: '2027-01-01', events: [], sheet: [], workbook: {} }).retreat, null);
assert.deepEqual([i2.satZoom, i2.sunZoom, i1.satZoom], ['https://zoom.us/j/1', '', ''], 'the Zoom links from Ops ride along; anything that isn’t an https link is dropped');
console.log('mentee schedule: ok');
