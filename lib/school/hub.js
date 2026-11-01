// Who can open what, for the Sādhana School season page (lib/school/season.js). No network and no @-imports, so
// scripts/ops-test/school-hub.mjs can run it directly. Circle decides who can open what: we only read which spaces the signed-in
// member belongs to (a Set of space ids) and draw every config row as open, upcoming or locked.
// Config rows: data/school-hub.json (see docs/school-hub.md). Seasons take their space ids from data/school-seasons.json.
import { normPost } from './tabs.js';

const NEW_WINDOW_MS = 14 * 24 * 3600 * 1000; // a space the member has never opened from the page: count the last two weeks
const ms = iso => (iso ? new Date(iso).getTime() : NaN);

// Attach space ids to each config row. A row with no Circle space yet is "unwired" and left out (nothing is guessed).
export function resolveItems(items, seasons) {
  return items.map(it => {
    const s = it.season ? seasons.find(x => x.slug === it.season) : null;
    const ids = (s ? [s.hub_space_id] : it.circle_space_ids || []).filter(x => x != null && x !== '').map(String);
    const eventIds = (s ? [s.event_space_id] : []).filter(x => x != null && x !== '').map(String);
    return { ...it, ids, eventIds, seasonRec: s, wired: ids.length > 0 };
  });
}

const seasonName = s => String(s.title || '').split(' · ')[0] || s.short;

// full-year = in all four seasons; term = in some of them; none = in no season
export function planOf(resolved, member) {
  const seasons = resolved.filter(r => r.kind === 'season' && r.wired);
  const mine = seasons.filter(r => r.ids.some(id => member.has(id)));
  const full = seasons.length > 0 && mine.length === seasons.length;
  const key = full ? 'full-year' : mine.length ? 'term' : 'none';
  let label = '';
  if (full) label = 'Full year';
  else if (mine.length === 1) label = `${seasonName(mine[0].seasonRec)} term`;
  else if (mine.length > 1) label = `${mine.map(m => seasonName(m.seasonRec)).join(' + ')} terms`;
  return { key, full, label };
}

// 'open' | 'upcoming' | 'locked' | null (null = not wired yet, so the card is left out rather than guessed)
export function stateOf(it, member, plan, today) {
  if (!it.wired) return null;
  const inSpace = it.ids.some(id => member.has(id));
  // requires_plan: full-year keeps a row locked for term students even if they are in its space (the Saturday Open Sessions share one)
  const planOk = !it.requires_plan || plan.full;
  if (!inSpace || !planOk) return 'locked';
  if (it.seasonRec && today < it.seasonRec.starts_on) return 'upcoming';
  return 'open';
}

export const monthOf = ymd => (ymd ? new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(`${ymd}T12:00:00Z`)) : '');

export function countNew(rawPosts, lastSeen, now) {
  const base = lastSeen ? ms(lastSeen) : now - NEW_WINDOW_MS;
  return rawPosts.map(normPost).filter(p => ms(p.at) > base).length;
}

export function latestPost(rawPosts) {
  const ps = rawPosts.map(normPost).filter(p => p.at).sort((a, b) => ms(b.at) - ms(a.at));
  return ps[0] ? { title: ps[0].title, at: ps[0].at } : null;
}

// Which Circle space a member opens from this row: the first of its spaces they belong to
export const watchId = (it, member) => it.ids.find(id => member.has(id)) || null;
