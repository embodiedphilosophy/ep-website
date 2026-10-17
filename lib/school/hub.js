// Pure logic for the Sādhana School hub (/school/sadhana-school). No network and no @-imports, so
// scripts/ops-test/school-hub.mjs can run it directly. Circle decides who can open what: the hub only reads which spaces
// the signed-in member belongs to (a Set of space ids) and draws every config row as open, upcoming or locked.
// Config rows: data/school-hub.json (see docs/school-hub.md). Seasons take their space ids from data/school-seasons.json.
import { normEvent, normPost } from './tabs.js';

export const HUB_TABS = [
  { key: 'home', label: 'This term' },
  { key: 'seasons', label: 'Seasons' },
  { key: 'kula', label: 'Kula' },
  { key: 'practice', label: 'Practice' },
  { key: 'workshops', label: 'Weekend workshops' },
  { key: 'mentor', label: 'Sahṛdaya Upāya' },
];

const NEW_WINDOW_MS = 14 * 24 * 3600 * 1000; // a space the member has never opened from the hub: count the last two weeks
const ms = iso => (iso ? new Date(iso).getTime() : NaN);

// Attach space ids to each config row. A row with no Circle space yet (and not a fixed locked card) is "unwired".
export function resolveItems(items, seasons) {
  return items.map(it => {
    const s = it.season ? seasons.find(x => x.slug === it.season) : null;
    const ids = (s ? [s.hub_space_id] : it.circle_space_ids || []).filter(x => x != null && x !== '').map(String);
    const eventIds = (s ? [s.event_space_id] : []).filter(x => x != null && x !== '').map(String);
    return { ...it, ids, eventIds, seasonRec: s, wired: it.always_locked ? true : ids.length > 0 };
  });
}

const seasonName = s => String(s.title || '').split(' · ')[0] || s.short;

// full-year = in all four seasons; mentee = in the Mentorship Circle; term = in some of the seasons
export function planOf(resolved, member) {
  const inAny = r => r.ids.some(id => member.has(id));
  const seasons = resolved.filter(r => r.kind === 'season' && r.wired);
  const mine = seasons.filter(inAny);
  const full = seasons.length > 0 && mine.length === seasons.length;
  const mentee = resolved.some(r => r.mentee_marker && r.wired && inAny(r));
  const key = full ? 'full-year' : mine.length || mentee ? 'term' : 'none';
  let label = '';
  if (full) label = mentee ? 'Full year · Sahṛdaya Upāya' : 'Full year';
  else if (mine.length === 1) label = `${seasonName(mine[0].seasonRec)} term`;
  else if (mine.length > 1) label = `${mine.map(m => seasonName(m.seasonRec)).join(' + ')} terms`;
  else if (mentee) label = 'Sahṛdaya Upāya';
  return { key, full, mentee, label };
}

// 'open' | 'upcoming' | 'locked' | null (null = not wired yet, so the card is left out rather than guessed)
export function stateOf(it, member, plan, today) {
  if (it.always_locked) return 'locked';
  if (!it.wired) return null;
  const inSpace = it.ids.some(id => member.has(id));
  // requires_plan covers rows that share a Circle space (Saturday and Sunday both live in Weekend Workshops)
  const planOk = !it.requires_plan || (it.requires_plan === 'mentee' ? plan.mentee : plan.full || plan.mentee);
  if (!inSpace || !planOk) return 'locked';
  if (it.seasonRec && today < it.seasonRec.starts_on) return 'upcoming';
  return 'open';
}

export const monthOf = ymd => (ymd ? new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(`${ymd}T12:00:00Z`)) : '');

const nyWeekday = iso => ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/New_York' }).format(new Date(iso))];

// The next session in the row's event spaces (a live one counts until 30 minutes past its end)
export function nextEvent(it, rawEvents, now) {
  const spaces = new Set([...it.ids, ...it.eventIds]);
  const list = rawEvents.map(normEvent).filter(e => spaces.has(e.spaceId) && e.start).filter(e => {
    const end = ms(e.end) || ms(e.start) + 2 * 3600 * 1000;
    return end + 30 * 60 * 1000 >= now && (it.weekday == null || nyWeekday(e.start) === it.weekday);
  });
  list.sort((a, b) => ms(a.start) - ms(b.start));
  return list[0] || null;
}

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

const chipOf = it => (it.kind === 'season' ? 'Season' : it.kind === 'chat' ? 'Chat' : it.kind === 'info' ? 'Formation' : it.kind === 'events' ? (it.weekday === 6 ? 'Saturday' : it.weekday === 0 ? 'Sunday' : 'Events') : 'Space');

// A preview is chosen by staff in the config: a web address (public post) or a short excerpt. Nothing is read from a locked space.
const previewOf = p => { const v = String(p || '').trim(); return !v ? null : /^https?:\/\//i.test(v) ? { link: v } : { text: v }; };

/**
 * The whole hub as plain data for the page.
 * in: { items (config), seasons, settings, member:Set, spaceUrls:{id:url}, events:[raw], posts:{spaceId:[raw]},
 *       seen:{spaceId:iso}|null (null = the last-visit store is not connected, so no counts are shown), today, now }
 */
export function buildHub({ items, seasons, settings = {}, member, spaceUrls = {}, events = [], posts = {}, seen = null, today, now = Date.now() }) {
  const resolved = resolveItems(items, seasons);
  const plan = planOf(resolved, member);
  const cards = {};
  const all = resolved.map(it => ({ it, state: stateOf(it, member, plan, today) })).filter(x => x.state);

  const card = ({ it, state }) => {
    const wid = watchId(it, member);
    const open = state !== 'locked';
    const url = open ? (wid && spaceUrls[wid]) || (it.seasonRec ? `/school/sadhana-school/${it.seasonRec.slug}` : '') : '';
    const next = open && (it.kind === 'events' || it.kind === 'season') ? nextEvent(it, events, now) : null;
    const rawPosts = open && wid && it.kind !== 'events' ? posts[wid] : undefined;
    const last = rawPosts ? latestPost(rawPosts) : null;
    const newCount = rawPosts && seen ? countNew(rawPosts, seen[wid] || null, now) : 0;
    return {
      key: it.key, kind: it.kind, chip: chipOf(it), title: it.title || it.seasonRec?.title.split(' · ').slice(1).join(' · ') || it.key, state,
      season: it.seasonRec ? { slug: it.seasonRec.slug, short: it.seasonRec.short, name: seasonName(it.seasonRec), starts_on: it.seasonRec.starts_on, ends_on: it.seasonRec.ends_on, now: today >= it.seasonRec.starts_on && today <= it.seasonRec.ends_on } : null,
      description: it.description || '', audience: it.audience_note || '', href: url, spaceId: open ? wid : null,
      opensIn: state === 'upcoming' ? monthOf(it.seasonRec.starts_on) : '',
      last, next: next && { title: next.title, at: next.start }, newCount,
      preview: state === 'locked' ? previewOf(it.preview) : null,
      cta: state === 'locked' ? { label: it.cta_label || 'Learn more', url: it.cta_url || (it.seasonRec && it.seasonRec.enrol_url) || (it.kind === 'info' || it.requires_plan === 'mentee' ? settings.formation_url : settings.upgrade_url) || '' } : null,
      order: it.order ?? 99, collapse_to: it.collapse_to || '', always_locked: !!it.always_locked,
    };
  };

  for (const t of HUB_TABS) {
    const rows = all.filter(x => (x.it.tabs || []).includes(t.key)).map(card).sort((a, b) => a.order - b.order);
    // Several locked rows that describe one thing (the three mentorship spaces) become a single card; the card itself shows only then
    const folded = new Set(rows.filter(c => c.state === 'locked' && c.collapse_to).map(c => c.collapse_to));
    const sources = new Set(rows.filter(c => c.collapse_to).map(c => c.collapse_to));
    cards[t.key] = rows.filter(c => (c.collapse_to ? c.state !== 'locked' : c.always_locked && sources.has(c.key) ? folded.has(c.key) : true));
  }

  const showMentor = plan.full || plan.mentee;
  const tabs = HUB_TABS.filter(t => t.key !== 'mentor' || showMentor).map(t => {
    const list = cards[t.key];
    const fresh = list.reduce((n, c) => n + c.newCount, 0);
    const locked = list.filter(c => c.state === 'locked');
    let badge = null;
    if (fresh > 0) badge = { count: fresh };
    else if (locked.length) badge = { locked: locked.length === list.length && locked.length === 1 ? locked[0].audience || 'Locked' : `${locked.length} locked` };
    return { key: t.key, label: t.label, badge };
  });

  // The season banner on the first tab: the season running now, else the next one the member can enter
  const seasonCards = cards.seasons.filter(c => c.state !== 'locked');
  const cur = seasonCards.find(c => c.season.now) || seasonCards.find(c => c.state === 'upcoming') || null;
  const banner = cur && { title: cur.title, short: cur.season.short, state: cur.state, opensIn: cur.opensIn, next: cur.next, href: cur.href, slug: cur.season.slug };

  const newSince = [];
  const seenKeys = new Set();
  for (const c of Object.values(cards).flat()) if (c.newCount > 0 && !seenKeys.has(c.spaceId)) { seenKeys.add(c.spaceId); newSince.push({ key: c.key, title: c.title, count: c.newCount, last: c.last, href: c.href, spaceId: c.spaceId }); }

  return { plan, tabs, cards, banner, newSince, countsOn: !!seen, upgrade: { label: settings.upgrade_label || 'Upgrade to the full year', url: settings.upgrade_url || '' }, joinUrl: settings.join_url || '' };
}

// Ids to read the latest posts of: every open space card (one read per space, however many tabs it appears on)
export function postSpaces(items, seasons, member, plan, today) {
  const resolved = resolveItems(items, seasons);
  const out = new Set();
  for (const it of resolved) {
    if (it.kind === 'events' || it.kind === 'info') continue;
    const st = stateOf(it, member, plan, today);
    if (st === 'open') out.add(watchId(it, member));
  }
  return [...out];
}

export const hubTabKey = (tab, tabs) => (tabs.some(t => t.key === tab) ? tab : 'home');
