// Checks who can open what for the Sādhana School season page (lib/school/hub.js) with synthetic space ids and the real config files,
// then the last-visit store. No network. (The page itself is checked by school-season.mjs.)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planOf, resolveItems, stateOf, watchId, countNew, latestPost, monthOf } from '../../lib/school/hub.js';

const cfg = JSON.parse(readFileSync(new URL('../../data/school-hub.json', import.meta.url)));
const seasons = JSON.parse(readFileSync(new URL('../../data/school-seasons.json', import.meta.url)));
// Give the rows synthetic space ids (the real ones are copied in from Circle)
const ids = { announcements: 102, 'welcome-orientation': 103, reflections: 104, 'kula-chat': 105, 'practice-resources': 106, 'practice-portfolio': 107, 'saturday-open-sessions': 108, };
const items = cfg.items.map(it => (ids[it.key] ? { ...it, circle_space_ids: [ids[it.key]] } : it));
const [fall, winter, spring, summer] = seasons.map(s => String(s.hub_space_id));
const base = ['102', '103', '104', '105', '106', '107'];
const day = '2026-10-24', now = Date.parse('2026-10-24T12:00:00Z');
const resolved = resolveItems(items, seasons);
const states = member => { const m = new Set(member), plan = planOf(resolved, m); return { plan, by: Object.fromEntries(resolved.map(r => [r.key, stateOf(r, m, plan, day)])) }; };

// the one-page config: no hub-only rows are left
assert.deepEqual(cfg.items.map(i => i.key), ['fall-2026', 'winter-2027', 'spring-2027', 'summer-2027', 'announcements', 'welcome-orientation', 'reflections', 'kula-chat', 'practice-portfolio', 'saturday-open-sessions', 'sourcebook', 'song-of-sadhana', 'inner-travelogue']);
assert.equal(cfg.settings.reflections_space_id, 2896660, 'Kula Commentary is the Reflections space'); assert.ok(cfg.settings.mentee_space_id);
assert.deepEqual(cfg.items.filter(i => i.kind === 'file').map(i => i.key), ['sourcebook', 'song-of-sadhana', 'inner-travelogue'], 'the Sourcebook, Song of Sādhana and the Inner Travelogue are PDFs, not spaces');
assert.ok(cfg.settings.upgrade_url, 'the full-year line needs an upgrade address');
assert.ok(!JSON.stringify(cfg).match(/mentee_marker|collapse_to|always_locked|today-in-school|mentorship/), 'nothing left of the mentor tab or Today in School');

// Fall-only (term) student
const term = states([...base, fall, '108']);
assert.equal(term.plan.key, 'term'); assert.equal(term.plan.label, 'Fall term');
assert.deepEqual([term.by['fall-2026'], term.by['winter-2027'], term.by['spring-2027'], term.by['summer-2027']], ['open', 'locked', 'locked', 'locked']);
assert.equal(term.by['saturday-open-sessions'], 'open', 'a term student who is in the Weekend Workshops space has the Saturdays (the page lists only the weekends within their season)');
assert.equal(term.by.announcements, 'open'); assert.equal(term.by['kula-chat'], 'open');
assert.equal(states([...base, fall]).by['saturday-open-sessions'], 'locked', 'not in the space: not open');

// Full-year student
const full = states([...base, fall, winter, spring, summer, '108']);
assert.equal(full.plan.key, 'full-year'); assert.equal(full.plan.label, 'Full year');
assert.deepEqual([full.by['fall-2026'], full.by['winter-2027'], full.by['spring-2027'], full.by['summer-2027']], ['open', 'upcoming', 'upcoming', 'upcoming']);
assert.equal(full.by['saturday-open-sessions'], 'open');
assert.equal(monthOf('2027-01-27'), 'January'); assert.equal(monthOf(''), '');

// Two terms; a member of no season
assert.equal(states([...base, fall, winter]).plan.label, 'Fall + Winter terms');
assert.equal(states([...base]).plan.key, 'none');
assert.equal(planOf(resolved, new Set()).key, 'none');

// A row with no Circle space yet is left out rather than guessed
assert.equal(stateOf(resolveItems(cfg.items.map(i => ({ ...i, circle_space_ids: [] })), seasons).find(r => r.key === 'announcements'), new Set(base), term.plan, day), null);
assert.equal(watchId(resolved.find(r => r.key === 'announcements'), new Set(['102'])), '102'); assert.equal(watchId(resolved.find(r => r.key === 'announcements'), new Set()), null);

// New-item counts: against the member's last visit; never-visited spaces count the last two weeks
const posts = [{ id: 1, name: 'Old', created_at: '2026-10-01T00:00:00Z' }, { id: 2, name: 'Mid', created_at: '2026-10-20T00:00:00Z' }, { id: 3, name: 'New', created_at: '2026-10-23T00:00:00Z' }];
assert.equal(countNew(posts, '2026-10-21T00:00:00Z', now), 1);
assert.equal(countNew(posts, null, now), 2, 'never opened: last 14 days');
assert.equal(latestPost(posts).title, 'New'); assert.equal(latestPost([]), null);
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
