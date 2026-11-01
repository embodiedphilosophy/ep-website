// Checks the Reflections helpers (lib/school/reflections.js, menteeposts.js) and how the season page uses them. No network.
// Run: node --import ./scripts/ce-test/register.mjs scripts/ops-test/school-reflections.mjs
import assert from 'node:assert/strict';
import { plainText, opening, authorOf, initials, weekOf, commentLines, threadOf, countComments, filterReflections, roleOf } from '../../lib/school/reflections.js';
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
assert.deepEqual(lines.map(l => l.id), ['1', '2', '3', '4', '5'], 'oldest first; empty comments dropped');
const ids = { menteeIds: new Set(['5']), teacherIds: new Set() };
const th = threadOf(lines, { ids });
assert.deepEqual(th.map(t => t.id), ['1', '3', '5'], 'comments on the post; a reply whose parent is gone is shown as a comment');
assert.deepEqual(th[0].replies.map(r => [r.id, r.to]), [['2', ''], ['4', 'Ana']], 'a reply to a reply stays at the second level and says who it answered');
assert.deepEqual([th[0].role, th[0].replies[0].role, th[0].replies[1].role, th[1].role, th[2].role], ['', 'mentee', '', 'teacher', ''], 'a mentee (Ana) wherever she writes, a Circle admin is a teacher, others none');
assert.equal(countComments(th), 5);
assert.deepEqual(threadOf([]), []);

// roles: a teacher badge beats the mentee badge
assert.equal(roleOf('5', {}, ids), 'mentee'); assert.equal(roleOf('5', { community_admin: true }, ids), 'teacher'); assert.equal(roleOf('5', { moderator: true }, {}), 'teacher');
assert.equal(roleOf('7', {}, { teacherIds: new Set(['7']) }), 'teacher'); assert.equal(roleOf('', {}, ids), ''); assert.equal(roleOf('9', {}, {}), '');

// filters
const list = [{ id: 1, role: 'mentee', mine: false }, { id: 2, role: '', mine: true }, { id: 3, role: 'teacher', mine: false }];
assert.deepEqual(filterReflections(list, 'all').length, 3); assert.deepEqual(filterReflections(list, 'mentees').map(p => p.id), [1]); assert.deepEqual(filterReflections(list, 'mine').map(p => p.id), [2]);

// mentee posts come from mentee_reflections.posted_post_id; nothing marked without a database or without the table
assert.equal((await menteePostIds()).size, 0, 'no database, nobody marked');
const q = (strings) => { assert.match(strings.join('?'), /FROM mentee_reflections WHERE posted_post_id IS NOT NULL AND status = 'posted'/); return [{ posted_post_id: 14 }, { posted_post_id: '20' }]; };
_setSql(q); assert.deepEqual([...await menteePostIds()].sort(), ['14', '20']);
_setSql(() => { throw new Error('relation "mentee_reflections" does not exist'); }); assert.equal((await menteePostIds()).size, 0, 'table not created yet, nobody marked');

// the season page: Reflections come from the one Reflections space, with badges by author, "mine", week and opening lines
import { readFileSync } from 'node:fs';
const { buildSeasonPage } = await import('../../lib/school/season.js');
const cfg = JSON.parse(readFileSync(new URL('../../data/school-hub.json', import.meta.url)));
const seasons = JSON.parse(readFileSync(new URL('../../data/school-seasons.json', import.meta.url)));
const fall = seasons[0];
const items = cfg.items.map(it => (it.key === 'reflections' ? { ...it, circle_space_ids: [104] } : it));
const posts = [
  { id: 12, name: 'Mine', created_at: '2026-10-30T10:00:00Z', comments_count: 2, author: { community_member_id: 501, name: 'Maya' }, body: '<p>Opening lines of mine.</p>' },
  { id: 14, name: 'From a mentee', created_at: '2026-11-01T08:00:00Z', author: { community_member_id: 502, name: 'Mentee D' }, body: 'Mentee text' },
  { id: 15, name: 'From a teacher', created_at: '2026-10-25T08:00:00Z', author: { community_member_id: 1, name: 'Jacob', community_admin: true } },
  { id: 16, name: 'Posted from the cohort page, author not in the space list', created_at: '2026-10-26T08:00:00Z', author: { community_member_id: 777, name: 'X' } },
  { id: 17, name: 'Before the season', created_at: '2026-09-01T08:00:00Z', author: { community_member_id: 503, name: 'Q' } },
];
const base = { season: fall, seasons, items, settings: cfg.settings, events: [], posts: [], reflectionPosts: posts, menteePosts: new Set(['16']), ids: { menteeIds: new Set(['502']), teacherIds: new Set() }, memberId: 501, today: '2026-11-01', now: Date.parse('2026-11-01T12:00:00Z') };
const mem = new Set([String(fall.hub_space_id), '104']);
const page = buildSeasonPage({ ...base, member: mem });
const L = page.reflections.list;
assert.deepEqual(L.map(p => p.id), ['14', '12', '16', '15'], 'newest first; a one-season student does not see the post written before the season');
assert.deepEqual(L.map(p => [p.role, p.fromCohort, p.mine]), [['mentee', false, false], ['', false, true], ['mentee', true, false], ['teacher', false, false]], 'badges by author, wherever they write; the cohort line only for posts from the Sahṛdaya Upāya page');
assert.equal(L[1].excerpt, 'Opening lines of mine.'); assert.equal(L[1].replies, 2); assert.equal(L[0].week, 2, '1 Nov is in the second week of a season that began 21 Oct'); assert.equal(L[3].week, 1);
assert.equal(page.reflections.memberId, '501'); assert.deepEqual(page.reflections.latest.map(p => p.id), ['14', '12']);
assert.equal(filterReflections(L, 'mentees').length, 2);
const fullMem = new Set(['104', ...seasons.map(s => String(s.hub_space_id))]);
assert.equal(buildSeasonPage({ ...base, member: fullMem }).reflections.list.length, 5, 'the full year sees everything');
assert.equal(buildSeasonPage({ ...base, member: new Set([String(fall.hub_space_id)]) }).reflections.list.length, 0, 'not in the Reflections space: none');
assert.equal(buildSeasonPage({ ...base, member: mem, menteePosts: new Set(), ids: {}, memberId: null }).reflections.list.some(p => p.role === 'mentee' || p.mine), false, 'no roster, no member id: nobody marked');
console.log('school reflections: ok');
