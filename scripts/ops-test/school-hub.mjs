// Checks the Sādhana School hub rules (lib/school/hub.js) with synthetic data and the real config file. No network.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHub, planOf, resolveItems, postSpaces, countNew, hubTabKey } from '../../lib/school/hub.js';

const cfg = JSON.parse(readFileSync(new URL('../../data/school-hub.json', import.meta.url)));
const seasonsAll = JSON.parse(readFileSync(new URL('../../data/school-seasons.json', import.meta.url)));
// Give the placeholder rows synthetic space ids (the real ones are copied in from Circle at launch)
const ids = { 'today-in-school': 101, announcements: 102, 'welcome-orientation': 103, 'kula-commentary': 104, 'kula-chat': 105, 'practice-resources': 106, 'practice-portfolio': 107, 'saturday-open-sessions': 108, 'sunday-practicum': 108, 'mentorship-circle': 109, 'mentorship-sessions': 110, 'apprentice-workbook': 111 };
const items = cfg.items.map(it => (ids[it.key] ? { ...it, circle_space_ids: [ids[it.key]] } : it));
const seasons = seasonsAll;
const [fall, winter, spring, summer] = seasons.map(s => String(s.hub_space_id));
const base = ['101', '102', '103', '104', '105', '106', '107'];
const day = '2026-10-24'; // a Saturday, mid-Fall
const now = Date.parse('2026-10-24T12:00:00Z');
const urls = Object.fromEntries([...base, fall, winter, spring, summer, '108', '109', '110', '111'].map(i => [i, `https://ss.example/c/${i}`]));
const view = (spaces, extra = {}) => buildHub({ items, seasons, settings: cfg.settings, member: new Set(spaces), spaceUrls: urls, today: day, now, ...extra });
const by = (h, tab) => Object.fromEntries(h.cards[tab].map(c => [c.key, c.state]));

// Saturday 31 Oct and Sunday 1 Nov sessions in the shared Weekend Workshops space (108)
const events = [
  { id: 1, name: 'Open Session', space_id: 108, starts_at: '2026-10-31T14:00:00Z', ends_at: '2026-10-31T15:30:00Z' },
  { id: 2, name: 'Practicum', space_id: 108, starts_at: '2026-11-01T14:00:00Z', ends_at: '2026-11-01T15:30:00Z' },
  { id: 3, name: 'Session 2', space_id: seasons[0].event_space_id, starts_at: '2026-10-28T13:00:00Z', ends_at: '2026-10-28T15:00:00Z' },
];

// Fall-only (term) student
const term = view([...base, fall, String(seasons[0].event_space_id)], { events });
assert.equal(term.plan.key, 'term'); assert.equal(term.plan.label, 'Fall term');
assert.deepEqual(by(term, 'seasons'), { 'fall-2026': 'open', 'winter-2027': 'locked', 'spring-2027': 'locked', 'summer-2027': 'locked' }, 'Fall open, the rest locked');
assert.ok(term.cards.seasons[0].season.now, 'Fall is Now');
assert.equal(term.cards.seasons[1].cta.label, 'Add this season');
assert.ok(!term.tabs.some(t => t.key === 'mentor'), 'term student has no Sahṛdaya Upāya tab');
assert.deepEqual(by(term, 'workshops'), { 'saturday-open-sessions': 'locked', 'sunday-practicum': 'locked' }, 'both workshop cards locked');
assert.equal(by(term, 'home')['saturday-open-sessions'], 'locked', 'Open Session card locked on This term');
assert.equal(term.banner.next.title, 'Session 2', 'banner shows the next session');
assert.ok(term.tabs.find(t => t.key === 'seasons').badge.locked, 'Seasons tab carries a locked label');

// Even if a term student is in the Weekend Workshops space, the plan gate keeps Saturday locked
assert.equal(by(view([...base, fall, '108']), 'workshops')['saturday-open-sessions'], 'locked');

// Full-year student, not a mentee
const full = view([...base, fall, winter, spring, summer, '108'], { events });
assert.equal(full.plan.label, 'Full year');
assert.deepEqual(by(full, 'seasons'), { 'fall-2026': 'open', 'winter-2027': 'upcoming', 'spring-2027': 'upcoming', 'summer-2027': 'upcoming' });
assert.deepEqual(full.cards.seasons.map(c => c.opensIn), ['', 'January', 'April', 'July'], 'Opens January / April / July');
assert.deepEqual(by(full, 'workshops'), { 'saturday-open-sessions': 'open', 'sunday-practicum': 'locked' }, 'Saturday open, Sunday locked although the space is shared');
assert.equal(full.cards.workshops[0].next.title, 'Open Session', 'Saturday card shows the Saturday session');
assert.equal(full.cards.workshops[0].next.at, '2026-10-31T14:00:00Z');
assert.equal(full.cards.workshops[1].cta.label, 'Learn about formation');
assert.ok(full.tabs.some(t => t.key === 'mentor'), 'full-year student sees the Sahṛdaya Upāya tab');
assert.equal(full.cards.mentor.length, 1, 'one locked formation card');
assert.equal(full.cards.mentor[0].key, 'formation'); assert.equal(full.cards.mentor[0].state, 'locked');
assert.deepEqual(full.cards.kula.map(c => c.state), ['open', 'open', 'open']);

// Mentee
const mentee = view([...base, fall, winter, spring, summer, '108', '109', '110', '111'], { events });
assert.equal(mentee.plan.label, 'Full year · Sahṛdaya Upāya');
assert.deepEqual(by(mentee, 'workshops'), { 'saturday-open-sessions': 'open', 'sunday-practicum': 'open' });
assert.deepEqual(mentee.cards.mentor.map(c => c.state), ['open', 'open', 'open']);

// Nothing leaks from locked cards: only config text, no space id, no link into the space
for (const c of Object.values(term.cards).flat().filter(c => c.state === 'locked')) {
  assert.equal(c.href, ''); assert.equal(c.spaceId, null); assert.equal(c.last, null); assert.equal(c.next, null); assert.equal(c.newCount, 0);
}
// Previews come from config only
const withPreview = view([...base, fall], { items: items.map(i => (i.key === 'winter-2027' ? { ...i, preview: 'A short public excerpt.' } : i.key === 'spring-2027' ? { ...i, preview: 'https://www.embodiedphilosophy.com/x' } : i)) });
assert.deepEqual(withPreview.cards.seasons[1].preview, { text: 'A short public excerpt.' });
assert.deepEqual(withPreview.cards.seasons[2].preview, { link: 'https://www.embodiedphilosophy.com/x' });

// Open cards link to the Circle space, and a not-yet-wired row is left out
assert.equal(term.cards.seasons[0].href, urls[fall]);
assert.ok(!view([fall], { items: cfg.items }).cards.practice.length, 'rows with no Circle space yet are not drawn');

// New-item counts: against the member's last visit; never-visited spaces count the last two weeks; store off = no counts
const posts = { [fall]: [{ id: 1, name: 'Old', created_at: '2026-10-01T00:00:00Z' }, { id: 2, name: 'Mid', created_at: '2026-10-20T00:00:00Z' }, { id: 3, name: 'New', created_at: '2026-10-23T00:00:00Z' }] };
assert.equal(countNew(posts[fall], '2026-10-21T00:00:00Z', now), 1);
assert.equal(countNew(posts[fall], null, now), 2, 'never opened: last 14 days');
const counted = view([...base, fall], { posts, seen: { [fall]: '2026-10-21T00:00:00Z' } });
assert.equal(counted.cards.seasons[0].newCount, 1); assert.equal(counted.cards.seasons[0].last.title, 'New');
assert.deepEqual(counted.tabs.find(t => t.key === 'seasons').badge, { count: 1 });
assert.equal(counted.newSince.length, 1, 'New since your last visit lists it once');
assert.equal(view([...base, fall], { posts, seen: null }).cards.seasons[0].newCount, 0, 'no store, no counts');
assert.deepEqual(postSpaces(items, seasons, new Set([...base, fall]), planOf(resolveItems(items, seasons), new Set([...base, fall])), day).sort(), [...base, fall].sort(), 'one read per open space');

assert.equal(planOf(resolveItems(items, seasons), new Set()).key, 'none');
assert.equal(hubTabKey('seasons', term.tabs), 'seasons'); assert.equal(hubTabKey('mentor', term.tabs), 'home'); assert.equal(hubTabKey('nope', term.tabs), 'home');
console.log('school hub: all checks passed');

// The last-visit store (lib/school/seen.js) against an in-memory stand-in for Neon
{
  const { _setSql, seenOf, markSeen } = await import('../../lib/school/seen.js');
  const rows = new Map();
  _setSql(async (strings, ...v) => {
    const q = strings.join('?');
    if (/^SELECT/.test(q.trim())) return [...rows].filter(([k]) => k.startsWith(v[0] + '|')).map(([k, at]) => ({ space_id: k.split('|')[1], at }));
    if (/^INSERT/.test(q.trim())) { rows.set(`${v[0]}|${v[1]}`, new Date().toISOString()); return []; }
    return [];
  });
  await markSeen('Fall@Test ', '2911545');
  assert.deepEqual(Object.keys(await seenOf('fall@test')), ['2911545'], 'email is matched without case or spaces');
  assert.deepEqual(await seenOf('other@test'), {}, 'one member never sees another member’s visits');
  await assert.rejects(() => markSeen('fall@test', 'x; drop table'), /Unknown space/);
  _setSql(null);
  assert.equal(await seenOf('fall@test'), null, 'no database: null, so the hub shows no counts');
}
console.log('school hub: last-visit store ok');
