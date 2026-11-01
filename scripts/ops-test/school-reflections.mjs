// Checks the Reflections helpers (lib/school/reflections.js, menteeposts.js) and how the season page uses them. No network.
// Run: node --import ./scripts/ce-test/register.mjs scripts/ops-test/school-reflections.mjs
import assert from 'node:assert/strict';
import { plainText, opening, authorOf, initials, weekOf, commentLines, threadOf, countComments, filterReflections } from '../../lib/school/reflections.js';
import { menteePostIds, _setSql } from '../../lib/school/menteeposts.js';

assert.equal(plainText('<p>One &amp; two</p><p>Three<br>four</p>'), 'One & two\n\nThree\nfour');
assert.equal(opening({ body: '<p>Short.</p>' }), 'Short.');
const long = opening({ body: `<p>${'word '.repeat(100)}</p>` });
assert.ok(long.endsWith('…') && long.length <= 301, 'long openings are cut at a word with an ellipsis');
assert.equal(opening({}), '', 'no body, no opening');
assert.deepEqual(authorOf({ author: { community_member_id: 5, name: ' Ana ' } }), { id: '5', name: 'Ana' });
assert.deepEqual(authorOf({ user: { name: 'Bo' } }), { id: '', name: 'Bo' });
assert.equal(initials('Maya Rose Quinn'), 'MQ'); assert.equal(initials('jacob'), 'J'); assert.equal(initials(''), '?');
assert.equal(weekOf('2026-10-21T10:00:00Z', '2026-10-21'), 1); assert.equal(weekOf('2026-10-28T10:00:00Z', '2026-10-21'), 2);
assert.equal(weekOf('2027-03-01T00:00:00Z', '2026-10-21', 8), 8, 'capped at the last week'); assert.equal(weekOf('2026-10-01T00:00:00Z', '2026-10-21'), 1, 'before the start counts as week 1');

// comments → plain lines → two levels
const raw = [
  { id: 4, parent_comment_id: 2, body: '<p>reply to a reply</p>', author: { community_member_id: 9, name: 'P' }, created_at: '2026-11-01T04:00:00Z' },
  { id: 1, body: '<p>first</p>', author: { community_member_id: 9, name: 'P' }, created_at: '2026-11-01T01:00:00Z' },
  { id: 2, parent_comment_id: 1, body: 'author answers', author: { community_member_id: 5, name: 'Ana' }, created_at: '2026-11-01T02:00:00Z' },
  { id: 3, body: 'by staff', author: { community_member_id: 1, name: 'Jacob', community_admin: true }, created_at: '2026-11-01T03:00:00Z' },
  { id: 5, parent_comment_id: 99, body: 'parent was deleted', author: { name: 'Q' }, created_at: '2026-11-01T05:00:00Z' },
  { id: 6, body: '   ', author: { name: 'Empty' }, created_at: '2026-11-01T06:00:00Z' },
];
const lines = commentLines(raw);
assert.deepEqual(lines.map(l => l.id), ['1', '2', '3', '4', '5'], 'oldest first; empty comments dropped'); assert.equal(lines[2].staff, true);
const th = threadOf(lines, { postAuthorId: '5', mentee: true });
assert.deepEqual(th.map(t => t.id), ['1', '3', '5'], 'comments on the post; a reply whose parent is gone is shown as a comment');
assert.deepEqual(th[0].replies.map(r => [r.id, r.to]), [['2', ''], ['4', 'Ana']], 'a reply to a reply stays at the second level and says who it answered');
assert.equal(th[0].replies[0].mentee, true, 'the mentee post’s author carries the MENTEE chip on their own reply'); assert.equal(th[0].mentee, false); assert.equal(th[0].replies[1].mentee, false);
assert.equal(countComments(th), 5);
assert.equal(threadOf(lines, { postAuthorId: '5', mentee: false })[0].replies[0].mentee, false, 'no chip on an ordinary post');
assert.deepEqual(threadOf([]), []);

// filters
const list = [{ id: 1, mentee: true, mine: false }, { id: 2, mentee: false, mine: true }, { id: 3, mentee: false, mine: false }];
assert.deepEqual(filterReflections(list, 'all').length, 3); assert.deepEqual(filterReflections(list, 'mentees').map(p => p.id), [1]); assert.deepEqual(filterReflections(list, 'mine').map(p => p.id), [2]);

// mentee posts come from mentee_reflections.posted_post_id; nothing marked without a database or without the table
assert.equal((await menteePostIds()).size, 0, 'no database, nobody marked');
const q = (strings) => { assert.match(strings.join('?'), /FROM mentee_reflections WHERE posted_post_id IS NOT NULL AND status = 'posted'/); return [{ posted_post_id: 14 }, { posted_post_id: '20' }]; };
_setSql(q); assert.deepEqual([...await menteePostIds()].sort(), ['14', '20']);
_setSql(() => { throw new Error('relation "mentee_reflections" does not exist'); }); assert.equal((await menteePostIds()).size, 0, 'table not created yet, nobody marked');

// the season page marks mentee posts and "mine", and carries week + opening lines
import { readFileSync } from 'node:fs';
const { buildSeasonPage } = await import('../../lib/school/season.js');
const cfg = JSON.parse(readFileSync(new URL('../../data/school-hub.json', import.meta.url)));
const seasons = JSON.parse(readFileSync(new URL('../../data/school-seasons.json', import.meta.url)));
const fall = seasons[0], T = fall.topic_ids.reflections;
const posts = [
  { id: 12, name: 'Mine', topics: [T], created_at: '2026-10-30T10:00:00Z', comments_count: 2, author: { community_member_id: 501, name: 'Maya' }, body: '<p>Opening lines of mine.</p>' },
  { id: 14, name: 'From a mentee', topics: [T], created_at: '2026-11-01T08:00:00Z', author: { community_member_id: 502, name: 'Mentee D' }, body: 'Mentee text' },
  { id: 15, name: 'Someone else', topics: [T], created_at: '2026-10-25T08:00:00Z', author: { community_member_id: 503, name: 'Student Q' } },
  { id: 16, name: 'Not a reflection', topics: [99], created_at: '2026-10-25T08:00:00Z' },
];
const page = buildSeasonPage({ season: fall, seasons, items: cfg.items, settings: cfg.settings, member: new Set([String(fall.hub_space_id)]), events: [], posts, menteePosts: new Set(['14']), memberId: 501, today: '2026-11-01', now: Date.parse('2026-11-01T12:00:00Z') });
const L = page.reflections.list;
assert.deepEqual(L.map(p => p.id), ['14', '12', '15'], 'newest first, only the Reflections topic');
assert.deepEqual(L.map(p => [p.mentee, p.mine]), [[true, false], [false, true], [false, false]]);
assert.equal(L[1].excerpt, 'Opening lines of mine.'); assert.equal(L[1].replies, 2); assert.equal(L[0].week, 2, '1 Nov is in the second week of a season that began 21 Oct'); assert.equal(L[2].week, 1);
assert.equal(page.reflections.memberId, '501'); assert.deepEqual(page.reflections.latest.map(p => p.id), ['14', '12']);
assert.equal(filterReflections(L, 'mentees').length, 1);
assert.equal(buildSeasonPage({ season: fall, seasons, items: cfg.items, settings: cfg.settings, member: new Set([String(fall.hub_space_id)]), events: [], posts, today: '2026-11-01' }).reflections.list.some(p => p.mentee || p.mine), false, 'no mentee set, no member id: nothing marked');
console.log('school reflections: ok');
