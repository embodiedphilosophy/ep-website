// Checks the season-page tab rules (lib/school/tabs.js) with synthetic Circle data. No network.
import assert from 'node:assert/strict';
import { buildItems, tabLists, joinOpen } from '../../lib/school/tabs.js';

const season = { event_space_id: 11, hub_space_id: 22, topic_ids: { readings: 1, reflections: 2, recordings: 3 } };
const now = Date.parse('2026-10-22T12:00:00Z'); // the day after Session 1
const ev = (id, start, extra = {}) => ({ id, name: `Session ${id}`, event_setting_attributes: { starts_at: start, ends_at: new Date(Date.parse(start) + 2 * 3600e3).toISOString() }, space: { id: 11 }, ...extra });
const events = [
  ev(1, '2026-10-21T13:00:00Z', { replay_url: 'https://r/1' }),
  ev(2, '2026-10-28T13:00:00Z'), ev(3, '2026-11-04T13:00:00Z'),
  ev(9, '2026-10-28T13:00:00Z', { space: { id: 99 } }), // another space: ignored
];
const posts = [
  { id: 10, name: 'Reading 2', topics: [1], created_at: '2026-10-10T00:00:00Z', position: 2 },
  { id: 11, name: 'Reading 1', topics: [1], created_at: '2026-10-11T00:00:00Z', position: 1, is_pinned: true },
  { id: 12, name: 'My reflection', topics: [{ id: 2 }], created_at: '2026-10-22T08:00:00Z', comments_count: 3 },
  { id: 13, name: 'Older reflection', topics: [2], created_at: '2026-10-21T20:00:00Z' },
  { id: 14, name: 'Replay post', topics: [3], created_at: '2026-10-21T16:00:00Z' },
  { id: 15, name: 'Untopiced', topics: [], created_at: '2026-10-20T00:00:00Z' },
];
const L = tabLists(buildItems(season, events, posts, now));
const names = k => L[k].map(i => i.title);

assert.deepEqual(names('live'), ['Session 2', 'Session 3'], 'live = upcoming events of the event space, next first');
assert.deepEqual(names('recordings'), ['Replay post', 'Session 1'], 'recordings = replay posts + past events with a replay, newest first');
assert.deepEqual(names('readings'), ['Reading 1', 'Reading 2'], 'readings: pinned first, then course order');
assert.deepEqual(names('reflections'), ['My reflection', 'Older reflection']);
assert.equal(L.all[0].title, 'Session 2', 'next live session is pinned on top of All');
assert.equal(L.all.length, 9, 'All holds the 3 events of the season and all 6 posts');
assert.ok(!L.all.some(i => i.id === '9'), 'events from other spaces never show');
for (const k of ['live', 'recordings', 'readings', 'reflections']) for (const i of L[k]) assert.ok(L.all.includes(i), `${k} item also in All`);
assert.ok(joinOpen(L.live[0], Date.parse('2026-10-28T12:50:00Z')), 'Join opens 10 minutes before');
assert.ok(!joinOpen(L.live[0], Date.parse('2026-10-28T12:49:00Z')), 'not before that');
assert.ok(!joinOpen(L.live[0], Date.parse('2026-10-28T15:01:00Z')), 'closed after the session ends');
console.log('school tabs: all checks passed');

// Events that share a title are numbered in date order
const same = [ev(1, '2026-10-21T13:00:00Z', { name: 'The Heart' }), ev(2, '2026-10-28T13:00:00Z', { name: 'The Heart' }), ev(3, '2026-11-04T13:00:00Z', { name: 'The Heart' })];
assert.deepEqual(tabLists(buildItems(season, same, [], now)).live.map(i => i.title), ['The Heart: Session 2', 'The Heart: Session 3']);
console.log('school tabs: numbering ok');
