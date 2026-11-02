// Checks the one-page season (lib/school/season.js) with synthetic Circle data and the real config files. No network.
// Run: node --import ./scripts/ce-test/register.mjs scripts/ops-test/school-season.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSeasonPage, landingSeason, seasonTabKey, calendarUrl, wantedSpaces } from '../../lib/school/season.js';
import { readingPlan } from '../../lib/school/readings.js';

const cfg = JSON.parse(readFileSync(new URL('../../data/school-hub.json', import.meta.url)));
const seasons = JSON.parse(readFileSync(new URL('../../data/school-seasons.json', import.meta.url)));
const ids = { announcements: 102, 'welcome-orientation': 103, reflections: 104, 'kula-chat': 105, 'practice-resources': 106, 'practice-portfolio': 107, 'saturday-open-sessions': 108 };
const items = cfg.items.map(it => (ids[it.key] ? { ...it, circle_space_ids: [ids[it.key]] } : it));
const [fall, winter, spring, summer] = seasons;
const base = ['102', '103', '104', '105', '106', '107'];
const urls = Object.fromEntries([...base, '108', ...seasons.map(s => String(s.hub_space_id))].map(i => [i, `https://ss.example/c/${i}`]));
const today = '2026-11-01', now = Date.parse('2026-11-01T15:00:00Z'); // a Sunday, between sessions 2 and 3
const wed = (d, h = 14) => `2026-${d}T${h}:00:00Z`;
const ev = (id, name, space, start, extra = {}) => ({ id, name, space_id: space, starts_at: start, ends_at: new Date(Date.parse(start) + 9000e3).toISOString(), ...extra });
const E = fall.event_space_id;
const events = [
  ev(1, 'Fall Live Session', E, wed('10-21'), { replay_url: 'https://x.test/r1', host: { name: 'Jacob Kyle' } }),
  ev(2, 'Fall Live Session', E, wed('10-28'), { replay_url: 'https://x.test/r2', host: { name: 'Nataraj' }, replay_duration: 8640 }),
  ev(3, 'Fall Live Session', E, wed('11-04'), { host: { name: 'Jacob Kyle' }, rsvped_event: false }),
  ev(4, 'Fall Live Session', E, wed('11-11'), { host: { name: 'Nataraj' } }),
  ev(71, 'Open Session · Beneath the Pose', 108, '2026-11-14T15:00:00Z'),
  ev(72, 'Practicum', 108, '2026-11-15T15:00:00Z'), // a Sunday: not shown
  ev(73, 'Open Session · Last year', 108, '2025-11-15T15:00:00Z'), // another season
];
const R = (session, kind, title, extra = {}) => ({ season: 'fall-2026', session, kind, title, detail: '', pages: '', ...extra });
const readings = readingPlan([
  R('1', 'session', 'Sūtra 1', { detail: 'Sūtra 1', teacher: 'Jacob' }), R('2', 'session', 'Sūtras 2–4', { detail: 'Sūtras 2–4', teacher: 'Nataraj' }),
  R('3', 'session', 'Sūtras 5–7', { detail: 'Sūtras 5–7', teacher: 'Jacob' }), R('3', 'core', 'Pratyabhijñāhṛdaya', { link_url: 'https://x.test/read3' }),
  R('3', 'prompt', 'x', { detail: 'Where did you notice consciousness choosing?' }),
  R('4', 'session', 'Sūtras 8–10', { detail: 'Sūtras 8–10', teacher: 'Nataraj' }),
], 'fall-2026', { 1: wed('10-21'), 2: wed('10-28'), 3: wed('11-04'), 4: wed('11-11') });
const post = (id, name, topics, day, extra = {}) => ({ id, name, topics, created_at: `2026-${day}T10:00:00Z`, ...extra });
const hubPosts = [];
const reflectionPosts = [post(1, 'The pose was never the point', [], '10-31', { comments_count: 3, author: { community_member_id: 502, name: 'Mentee A' } }), post(2, 'Old one', [], '09-20')]; // written before Fall began
const spacePosts = { 102: [post(9, 'Session 2’s recording is up', [], '10-30', { url: 'https://ss.example/p/9' })], 105: [post(5, 'hello', [], '10-31T12:00:00Z'.slice(0, 5))] };
const weekends = [{ day: '2026-11-14', title: 'Beneath the Pose' }, { day: '2026-12-05', title: 'Tasting the Real' }, { day: '2027-02-06', title: 'Two Tongues' }];
const termEvents = events.filter(e => e.space_id !== 108); // a term student is not in the Weekend Workshops space, so Circle sends none of its events
const page = (member, extra = {}) => buildSeasonPage({ season: fall, weekends, reflectionPosts, seasons, items, settings: cfg.settings, member: new Set(member), spaceUrls: urls, events, posts: hubPosts, spacePosts, readings, today, now, ...extra });
const termMember = [...base, String(fall.hub_space_id), String(E)];
const fullMember = [...termMember, '108', ...[winter, spring, summer].map(s => String(s.hub_space_id))];

// landing season: the one running now among the seasons the member is in
assert.equal(landingSeason(seasons, new Set(termMember), today).slug, 'fall-2026');
assert.equal(landingSeason(seasons, new Set([String(winter.hub_space_id)]), today).slug, 'winter-2027', 'a Winter-only student lands on Winter (the next one they are in)');
assert.equal(landingSeason(seasons, new Set(), today).slug, 'fall-2026', 'in none: the one running now (its page explains how to join)');
assert.equal(landingSeason(seasons, new Set(termMember), '2026-12-20').slug, 'fall-2026', 'between seasons, with only Fall: the last one they are in');
assert.equal(landingSeason(seasons, new Set(fullMember), '2026-12-20').slug, 'winter-2027', 'between seasons: the next one');

// tab keys: new ones, and the hub / old season tabs map to the nearest new tab
assert.deepEqual(['week', 'sessions', 'readings', 'reflections', 'kula', 'resources'].map(t => seasonTabKey(t)), ['week', 'sessions', 'readings', 'reflections', 'kula', 'resources']);
assert.deepEqual(['home', 'seasons', 'all', 'live', 'recordings', 'workshops', 'practice', 'mentor', 'nonsense', undefined].map(t => seasonTabKey(t)), ['week', 'week', 'week', 'sessions', 'sessions', 'sessions', 'resources', 'week', 'week', 'week']);
assert.equal(seasonTabKey('pods', ['pods']), 'pods'); assert.equal(seasonTabKey('pods'), 'week');

// term (Fall only) student
const t = page(termMember, { seen: {}, events: termEvents });
assert.equal(t.plan.key, 'term'); assert.equal(t.header.eyebrow, 'Sādhana School · Fall term');
assert.equal(t.header.title, 'The Heart of Recognition'); assert.equal(t.header.week, 3, 'week = the session coming up'); assert.equal(t.header.of, 4, 'sessions in this synthetic season');
assert.deepEqual(t.seasonsMenu.map(s => [s.slug, s.state, s.note]), [['fall-2026', 'open', ''], ['winter-2027', 'locked', 'full year only'], ['spring-2027', 'locked', 'full year only'], ['summer-2027', 'locked', 'full year only']]);
assert.deepEqual(t.rows.map(r => `${r.kind}${r.n || ''}:${r.state}${r.locked ? ':locked' : ''}`), ['session1:past', 'session2:past', 'session3:next', 'session4:future', 'weekend:future', 'weekend:future'], 'Wednesdays, then the weekends within the season’s weeks, none locked for a term student; Sunday and other seasons left out');
assert.equal(t.rows[4].tag, ''); assert.deepEqual([t.rows[4].title, t.rows[4].tbd], ['Open Session · Beneath the Pose', true], 'a term student whose feed has no weekend events gets the Saturdays of the season from the immersion list, time not shown');
assert.equal(t.rows.some(r => r.at.startsWith('2027')), false, 'a weekend of another season is left out');
assert.equal(t.rows[2].teacher, 'Jacob'); assert.equal(t.rows[1].focus, 'Sūtras 2–4'); assert.equal(t.rows[1].replayUrl, 'https://x.test/r2');
assert.equal(t.week.next.n, 3); assert.ok(t.week.next.cal.startsWith('https://calendar.google.com/'), 'Add to calendar link');
assert.equal(t.week.reading.title, 'Sūtras 5–7'); assert.equal(t.week.reading.url, 'https://x.test/read3');
assert.equal(t.week.recording.n, 2); assert.equal(t.week.recording.minutes, 144, 'latest recording is session 2, 2 hrs 24 min');
assert.equal(t.week.reflect.prompt, 'Where did you notice consciousness choosing?');
assert.deepEqual(t.week.weeks.map(w => [w.n, w.recording, w.next]), [[1, true, false], [2, true, false], [3, false, true], [4, false, false]]);
assert.equal(t.announcement.title, 'Session 2’s recording is up'); assert.equal(t.announcement.allUrl, 'https://ss.example/c/102');
assert.deepEqual(t.reflections.list.map(p => p.id), ['1'], 'a one-season student sees only the posts from when the season began');
assert.equal(page(fullMember).reflections.list.length, 2, 'the full year sees everything');
assert.equal(t.reflections.count, 1, 'one reflection in the last 14 days, none seen yet'); assert.equal(t.tabs.find(x => x.key === 'reflections').count, 1); assert.equal(t.reflections.seenKey, 'refl-104'); assert.equal(t.reflections.canPost, true);
assert.equal(page(['102', String(fall.hub_space_id)]).reflections.list.length, 0, 'not in the Reflections space: none'); assert.equal(page(['102', String(fall.hub_space_id)]).reflections.canPost, false);
assert.equal(t.reflections.latest[0].replies, 3);
assert.equal(t.fullYear.label, 'See the full year'); assert.equal(t.fullYear.url, cfg.settings.upgrade_url); assert.ok(!/Saturday/.test(t.fullYear.text), 'the weekends are not a full-year extra');
assert.deepEqual(t.resources.map(r => r.key).sort(), ['inner-travelogue', 'practice-portfolio', 'song-of-sadhana', 'welcome-orientation'], 'PDF cards need a file: Song and the Inner Travelogue have theirs; the Sourcebook waits for the reading plan');
const withFiles = page(termMember, { items: items.map(i => (i.key === 'song-of-sadhana' ? { ...i, url: 'https://files.test/song.pdf' } : i)), readings: readingPlan([R('', 'need', 'The Sādhaka\'s Sourcebook', { file_url: 'https://files.test/sourcebook.pdf' })], 'fall-2026', {}) });
assert.deepEqual(withFiles.resources.filter(r => r.file).map(r => [r.key, r.href]), [['sourcebook', 'https://files.test/sourcebook.pdf'], ['song-of-sadhana', 'https://files.test/song.pdf'], ['inner-travelogue', 'https://assets-v2.circle.so/z7l40hi72md237ij98abbg4qvt6b']], 'the Sourcebook file comes from the reading plan, Song and the Inner Travelogue from their own url; all open the PDF');
assert.equal(t.resources.find(r => r.key === 'practice-portfolio').pdf, 'https://assets-v2.circle.so/1n7219z1xh2mfal1a5n1nyxuxioh', 'the Practice Portfolio card also offers its printable PDF');
const heart = page(termMember, { readings: readingPlan([R('', 'need', 'The Heart of Recognition', {}), R('1', 'core', 'The Heart of Recognition', { file_url: 'https://files.test/heart.pdf' })], 'fall-2026', {}) });
assert.equal(heart.resources.find(r => r.key === 'heart-of-recognition')?.href, 'https://files.test/heart.pdf', 'the Heart of Recognition card opens the study edition, from a weekly reading when the need row has no file');
assert.ok(!t.resources.some(r => r.key === 'practice-resources'), 'no Practice Resources card: its PDFs are on the tab itself');
assert.deepEqual(t.kula.cards.map(c => c.key), ['kula-chat'], 'Kula Commentary became the Reflections space, so Kula is the chat');

// counts only with the last-visit store; a visit to the tab clears them
assert.equal(page(termMember, { seen: null }).reflections.count, 0, 'no store, no counts');
assert.equal(page(termMember, { seen: { 'refl-104': '2026-11-01T00:00:00Z' } }).reflections.count, 0);

// full-year student: Saturday open, no upgrade line, later seasons open soon
const f = page(fullMember);
assert.equal(f.plan.label, 'Full year'); assert.equal(f.fullYear, null);
const wk = f.rows.filter(r => r.kind === 'weekend'); assert.deepEqual(wk.map(r => [r.title, r.tbd]), [['Open Session · Beneath the Pose', false], ['Open Session · Tasting the Real', true]], 'a visible event is used for its Saturday; the other weekend is a dated row');
assert.deepEqual(f.seasonsMenu.map(s => s.note), ['', 'opens January', 'opens April', 'opens July']);

// a season not started yet, no events: the page still builds
const empty = buildSeasonPage({ season: winter, seasons, items, settings: cfg.settings, member: new Set(fullMember), spaceUrls: urls, events: [], posts: [], today, now });
assert.equal(empty.header.started, false); assert.equal(empty.week.next, null); assert.deepEqual(empty.rows, []);

// post spaces to read: only those the member can open, each once
assert.deepEqual(wantedSpaces(items, seasons, new Set(termMember), today).sort(), ['102', '103', '105', '107'], 'announcements, Kula chat, Resources (the Reflections list is read in full by the page)');
assert.deepEqual(wantedSpaces(items, seasons, new Set([String(fall.hub_space_id)]), today), [], 'a member of no resource spaces reads none');
assert.equal(calendarUrl({ at: '', title: 'x' }), '');
console.log('school season: ok');
