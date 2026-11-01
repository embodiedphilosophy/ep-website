// Pure logic for the one-page Sādhana School season (/school/sadhana-school/<season>). No network and no @-imports, so
// scripts/ops-test/school-season.mjs can run it directly. It replaces the hub (the page between the sidebar and the season):
// the sidebar row opens the current season, and everything the hub listed is a tab or a line on this page.
// Circle still decides who can open what: we only read which spaces the member belongs to (a Set of space ids).
import { normEvent, normPost, buildItems } from './tabs.js';
import { planOf, resolveItems, stateOf, watchId, countNew, latestPost, monthOf } from './hub.js';
import { readingWeek } from './readings.js';

export const SEASON_TABS = [
  { key: 'week', label: 'This week' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'readings', label: 'Readings' },
  { key: 'reflections', label: 'Reflections' },
  { key: 'kula', label: 'Kula' },
  { key: 'resources', label: 'Resources' },
];

// Older addresses (the hub's tabs, the season page's old five tabs, Today's links) land on the nearest new tab
const LEGACY = { home: 'week', seasons: 'week', all: 'week', live: 'sessions', recordings: 'sessions', workshops: 'sessions', practice: 'resources' };
export const seasonTabKey = (tab, extra = []) => {
  const t = String(tab || '');
  if (SEASON_TABS.some(x => x.key === t) || extra.includes(t)) return t;
  return LEGACY[t] || 'week';
};

// Rows of data/school-hub.json that this page picks by key
export const KEYS = { announcements: 'announcements', weekend: 'saturday-open-sessions', kula: ['kula-chat', 'kula-commentary'], resources: ['welcome-orientation', 'practice-portfolio', 'sourcebook', 'song-of-sadhana', 'practice-resources'] };

// The "seen" key for the Reflections tab: school_seen holds one row per space, so the tab gets its own, "refl-<hub space id>"
export const reflSeenKey = season => `refl-${season.hub_space_id}`;

const RESOURCE_COPY = {
  'welcome-orientation': ['Start here', 'How the school works · the orientation recording'],
  'practice-portfolio': ['Your practice', 'Your daily log and weekly reflection'],
  sourcebook: ['Books', 'The year’s readings, in one place'],
  'song-of-sadhana': ['Chants', 'The chantbook and recordings'],
  'practice-resources': ['Guided practices', 'Haṃsa, mantra and the practices from each session'],
};
const KULA_COPY = {
  'kula-chat': ['Kula chat', 'Everyday conversation, questions and hellos', 'Open the chat'],
  'kula-commentary': ['Kula Commentary', 'Longer notes and commentary from the kula', 'Read the commentary'],
};

const ms = iso => (iso ? new Date(iso).getTime() : NaN);
const nyWeekday = iso => ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/New_York' }).format(new Date(iso))];
const nyDayOf = iso => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const endedAt = (e, now) => (Number.isNaN(ms(e.end)) ? ms(e.start) + 2 * 3600 * 1000 : ms(e.end)) + 30 * 60 * 1000 < now; // live until 30 minutes past the end
const minutes = e => (Number.isNaN(ms(e.end)) || Number.isNaN(ms(e.start)) ? 0 : Math.round((ms(e.end) - ms(e.start)) / 60000));

// The season to open when someone lands on the programme. Among the seasons the member is in: the one running now, else the next,
// else the last. A member who is in none gets the one running now (its page then explains how to join).
export function landingSeason(seasons, member, today) {
  const list = [...seasons].sort((a, b) => a.order - b.order);
  const state = s => (today < s.starts_on ? 'upcoming' : today > s.ends_on ? 'past' : 'now');
  const pick = arr => arr.find(s => state(s) === 'now') || arr.find(s => state(s) === 'upcoming') || arr[arr.length - 1] || null;
  const mine = list.filter(s => s.hub_space_id && member.has(String(s.hub_space_id)));
  return pick(mine) || pick(list);
}

// "Add to calendar": a Google Calendar link for one session
const stamp = iso => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
export function calendarUrl(e) {
  if (!e.at) return '';
  const end = e.end && !Number.isNaN(ms(e.end)) ? e.end : new Date(ms(e.at) + 2.5 * 3600 * 1000).toISOString();
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Sādhana School · ${e.title}`)}&dates=${stamp(e.at)}/${stamp(end)}${e.url ? `&details=${encodeURIComponent(e.url)}` : ''}`;
}

/**
 * The page as plain data.
 * in: { season, seasons, items (data/school-hub.json rows), settings, member:Set, spaceUrls:{id:url}, events:[raw], posts:[raw] (the season's post space),
 *       spacePosts:{spaceId:[raw]} (announcements, kula), seen:{key:iso}|null, readings (lib/school/readings.js plan or null),
 *       weekends:[{ day:'YYYY-MM-DD', title }] (the season's weekend Open Sessions by date: a term student's feed has none of them, so these give the "Full year only" rows), today, now }
 */
export function buildSeasonPage({ season, seasons, items, settings = {}, member, spaceUrls = {}, events = [], posts = [], spacePosts = {}, seen = null, readings = null, weekends = [], today, now = Date.now() }) {
  const resolved = resolveItems(items, seasons);
  const plan = planOf(resolved, member);
  const row = key => resolved.find(r => r.key === key);
  const stateFor = r => (r ? stateOf(r, member, plan, today) : null);

  // The season's own events and posts (numbered sessions, recordings, readings, reflections)
  const built = buildItems(season, events, posts, now);
  const sessions = built.filter(i => i.kind === 'event').sort((a, b) => ms(a.at) - ms(b.at));
  const numbered = sessions.filter(s => /session\s*\d/i.test(s.title));
  const num = s => +(/session\s*(\d+)/i.exec(s.title) || [])[1] || 0;
  const readingWeeks = new Map((readings?.weeks || []).map(w => [w.session, w]));
  const readingNow = readings ? readingWeek(readings, now) : null;

  // The weekend Open Sessions of this season (Saturdays in the Weekend Workshops space). A term student sees them, marked as full year only.
  const wr = row(KEYS.weekend), wState = stateFor(wr), wSpaces = new Set(wr ? [...wr.ids, ...wr.eventIds] : []);
  const weekend = wr && wState ? events.map(normEvent).filter(e => wSpaces.has(e.spaceId) && e.start && nyWeekday(e.start) === (wr.weekday ?? 6) && nyDayOf(e.start) >= season.starts_on && nyDayOf(e.start) <= season.ends_on)
    .map(e => { const ended = endedAt(e, now); return { ...e, at: e.start, ended, title: e.title, weekend: true, locked: wState === 'locked' }; }) : [];

  // A weekend with no event in this member's feed (a term student is not in the Weekend Workshops space; or it is not scheduled yet) still gets its row
  const dated = weekends.filter(w => w.day >= season.starts_on && w.day <= season.ends_on && !weekend.some(e => nyDayOf(e.at) === w.day))
    .map(w => ({ id: `weekend-${w.day}`, kind: 'event', at: `${w.day}T12:00:00Z`, end: '', title: w.title ? `Open Session · ${w.title}` : 'Open Session', weekend: true, tbd: true, ended: w.day < today, locked: wState === 'locked', teacher: '' }));
  const rows = [...sessions.map(s => ({ ...s, weekend: false, locked: false })), ...weekend, ...dated].sort((a, b) => ms(a.at) - ms(b.at)).map(s => {
    const n = s.weekend ? 0 : num(s), w = n ? readingWeeks.get(n) : null;
    const replay = s.replayUrl || '';
    const focus = w?.focus || '';
    return {
      id: s.id, kind: s.weekend ? 'weekend' : 'session', n, tbd: !!s.tbd, at: s.at, end: s.end || '', minutes: minutes(s), ended: !!s.ended, locked: s.locked,
      title: s.weekend ? s.title : `Session ${n || ''}`.trim() === 'Session' ? s.title : `Session ${n}`, focus,
      teacher: w?.teacher || s.teacher || '', tag: s.weekend ? 'Full year' : '',
      rsvped: !!s.rsvped, joinUrl: s.url || s.pageUrl || '', replayUrl: replay, pageUrl: s.pageUrl || '', video: s.video || '', replayMin: s.duration ? Math.round(Number(s.duration) / 60) : 0,
      raw: s.title,
    };
  });
  // The first session still to come that this member can attend is the "next" one
  const upcoming = rows.filter(r => !r.ended && !r.locked && !r.tbd);
  const nextRow = upcoming[0] || null;
  rows.forEach(r => { r.state = r.ended ? 'past' : r === nextRow ? 'next' : 'future'; });

  // Week number: the numbered session coming up (or the last one once the season is over)
  const of = readings?.weeks.length || numbered.length || 8; // the plan has every week; Circle may only hold the sessions scheduled so far
  const nextNumbered = rows.find(r => r.kind === 'session' && !r.ended);
  const week = today < season.starts_on ? 0 : nextNumbered ? nextNumbered.n || 1 : of;

  const latestRec = [...rows].filter(r => r.kind === 'session' && r.ended && (r.replayUrl || r.video)).pop() || null;
  const rw = readingNow ? readingWeeks.get(readingNow) : null;
  const first = rw?.core?.[0];
  const reflect = rw ? { session: rw.session, prompt: rw.prompt || '', focus: rw.focus || '' } : null;

  const weeks = (readings?.weeks || []).map(w => {
    const r = rows.find(x => x.kind === 'session' && x.n === w.session);
    return { n: w.session, at: w.at || r?.at || '', focus: w.focus || w.title || '', teacher: w.teacher || r?.teacher || '', recording: !!(r && r.ended && (r.replayUrl || r.video)), next: !!(r && nextNumbered && r === nextNumbered), now: w.session === readingNow };
  });

  // Reflections: posts with the Reflections topic, newest first. Counted new since the tab was last opened (needs the last-visit store).
  const refl = built.filter(i => i.tab === 'reflections').sort((a, b) => ms(b.at) - ms(a.at));
  const reflSeen = seen ? seen[reflSeenKey(season)] || null : null;
  const reflNew = seen ? refl.filter(p => ms(p.at) > (reflSeen ? ms(reflSeen) : now - 14 * 24 * 3600 * 1000)).length : 0;

  // Space-backed lines: announcements, Kula, Resources
  const spaceCard = r => {
    const state = stateFor(r);
    if (!state || !r.wired) return null;
    const wid = watchId(r, member), open = state !== 'locked';
    const raw = open && wid ? spacePosts[wid] : undefined;
    return { key: r.key, state, spaceId: open ? wid : null, href: open ? (wid && spaceUrls[wid]) || '' : '', last: raw ? latestPost(raw) : null, newCount: raw && seen ? countNew(raw, seen[wid] || null, now) : 0 };
  };
  const ann = spaceCard(row(KEYS.announcements));
  const annPosts = ann && ann.state === 'open' && spacePosts[ann.spaceId] ? spacePosts[ann.spaceId].map(normPost).filter(p => p.at).sort((a, b) => ms(b.at) - ms(a.at)) : [];
  const recent = annPosts[0] && now - ms(annPosts[0].at) <= 30 * 24 * 3600 * 1000 ? annPosts[0] : null;
  const announcement = recent ? { title: recent.title, at: recent.at, url: recent.url || ann.href, allUrl: ann.href } : null;

  const kula = KEYS.kula.map(k => { const c = spaceCard(row(k)); return c && { ...c, title: KULA_COPY[k][0], line: KULA_COPY[k][1], action: KULA_COPY[k][2] }; }).filter(Boolean);
  const kulaNew = kula.reduce((n, c) => n + c.newCount, 0);
  const resources = KEYS.resources.map(k => { const c = spaceCard(row(k)); return c && { ...c, eyebrow: RESOURCE_COPY[k][0], title: row(k).title || k, line: RESOURCE_COPY[k][1] }; }).filter(Boolean);

  // The Season dropdown: seasons the member can open are choices; the rest say why not
  const anySeason = resolved.some(r => r.kind === 'season' && r.wired && stateFor(r) !== 'locked');
  const seasonsMenu = resolved.filter(r => r.kind === 'season' && r.seasonRec).map(r => {
    const st = stateFor(r), s = r.seasonRec;
    const name = `${s.short} · ${String(s.title || '').split(' · ').slice(1).join(' · ') || s.subtitle || ''}`;
    return { slug: s.slug, label: name, current: s.slug === season.slug, state: st || 'locked', note: st === 'locked' ? (anySeason ? 'full year only' : 'not enrolled') : st === 'upcoming' ? `opens ${monthOf(s.starts_on)}` : '' };
  });

  const tabs = SEASON_TABS.map(t => ({ ...t, count: t.key === 'reflections' ? reflNew : t.key === 'kula' ? kulaNew : 0 }));
  const cur = seasonsMenu.find(s => s.current);

  return {
    plan, today,
    header: { eyebrow: `Sādhana School · ${plan.label || ''}`.replace(/ · $/, ''), title: String(season.title || '').split(' · ').slice(1).join(' · ') || season.title, short: season.short, subtitle: season.subtitle || '', week, of, started: today >= season.starts_on, startsOn: season.starts_on, ended: today > season.ends_on },
    seasonsMenu, currentState: cur?.state || 'open', announcement, tabs, rows,
    week: {
      next: nextRow && { id: nextRow.id, title: nextRow.title, n: nextRow.n, focus: nextRow.focus, at: nextRow.at, end: nextRow.end, minutes: nextRow.minutes, teacher: nextRow.teacher, rsvped: nextRow.rsvped, joinUrl: nextRow.joinUrl, pageUrl: nextRow.pageUrl, cal: calendarUrl(nextRow), weekend: nextRow.kind === 'weekend' },
      reading: rw ? { session: rw.session, title: rw.focus || rw.title, source: [first?.title, `week ${rw.session}`].filter(Boolean).join(', '), url: first?.link || first?.file || '' } : null,
      recording: latestRec && { id: latestRec.id, title: latestRec.title, n: latestRec.n, at: latestRec.at, teacher: latestRec.teacher, minutes: latestRec.replayMin || latestRec.minutes, url: latestRec.replayUrl || latestRec.pageUrl },
      reflect, weeks,
    },
    readingNow,
    reflections: { count: reflNew, list: refl.map(p => ({ id: p.id, title: p.title, who: p.teacher, at: p.at, replies: p.replies || 0, url: p.url || '' })), latest: refl.slice(0, 2).map(p => ({ id: p.id, title: p.title, who: p.teacher, at: p.at, replies: p.replies || 0, url: p.url || '' })), canPost: season.topic_ids?.reflections != null, spaceUrl: spaceUrls[String(season.hub_space_id)] || '' },
    kula: { cards: kula, count: kulaNew },
    resources,
    fullYear: plan.full ? null : { text: 'Winter, Spring and the Summer immersion, plus the Saturday Open Sessions, all in this one page.', label: 'See the full year', url: settings.upgrade_url || '' },
    // Spaces to read the latest posts of (one read each)
    spaceIds: spaceIdsFor(resolved, member, plan, today),
  };
}

// Space ids the page reads recent posts from: announcements, Kula and Resources, only those the member can open
export function spaceIdsFor(resolved, member, plan, today) {
  const keys = [KEYS.announcements, ...KEYS.kula, ...KEYS.resources];
  const out = new Set();
  for (const r of resolved) if (keys.includes(r.key) && r.wired && stateOf(r, member, plan, today) === 'open') { const id = watchId(r, member); if (id) out.add(id); }
  return [...out];
}

// What the page needs to know before it can read: which post spaces to fetch for this member
export function wantedSpaces(items, seasons, member, today) {
  const resolved = resolveItems(items, seasons), plan = planOf(resolved, member);
  return spaceIdsFor(resolved, member, plan, today);
}
