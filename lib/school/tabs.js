// Pure logic for a season page: turns Circle's events and posts into the five tabs. No network, so it is
// easy to test (scripts/school-test.mjs). Circle's field names aren't pinned down in the public docs, so the
// normalisers accept the likely spellings; fix them here once the Swagger reference is checked.
export const TABS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live Sessions' },
  { key: 'recordings', label: 'Recordings' },
  { key: 'readings', label: 'Readings' },
  { key: 'reflections', label: 'Reflections' },
];

const first = (...v) => v.find(x => x !== undefined && x !== null && x !== '');
const ms = iso => (iso ? new Date(iso).getTime() : NaN);

export function normEvent(e) {
  const post = e.post || {};
  const rec = first(e.replay_url, e.recording_url, e.replay?.url, e.recording?.url, post.replay_url, e.replay_post_url);
  return {
    kind: 'event',
    id: String(first(e.id, e.event_id)),
    title: first(e.name, e.title, post.name) || 'Live session',
    start: first(e.event_setting_attributes?.starts_at, e.starts_at, e.start_time, e.event_setting_attributes?.starting_at, e.event_setting?.starting_at, e.start),
    end: first(e.event_setting_attributes?.ends_at, e.ends_at, e.end_time, e.event_setting?.ends_at, e.end),
    spaceId: String(first(e.space_id, e.space?.id, e.post?.space_id) ?? ''),
    url: first(e.url, e.join_url, e.zoom_link, e.live_stream_url, e.in_person_location),
    pageUrl: first(e.post_url, e.public_url, post.url),
    replayUrl: rec || '',
    duration: first(e.replay_duration, e.recording_duration, e.duration) ?? null, // seconds
    teacher: first(e.host?.name, e.hosts?.[0]?.name, e.author?.name, e.user?.name) || '',
    rsvped: e.rsvped_event === true || /^(yes|going|attending)/i.test(String(e.rsvp_status || '')),
    replies: Number(first(e.comments_count, e.replies_count, 0)),
  };
}

export function normPost(p) {
  const topics = (p.topics || p.topic_ids || []).map(t => String(typeof t === 'object' ? t.id : t));
  return {
    kind: 'post',
    id: String(p.id),
    title: first(p.name, p.title) || 'Untitled',
    at: first(p.published_at, p.created_at, p.updated_at),
    topics,
    pinned: !!first(p.is_pinned, p.pinned, false),
    url: first(p.url, p.public_url),
    teacher: first(p.user?.name, p.author?.name, p.community_member?.name) || '',
    replies: Number(first(p.comments_count, p.replies_count, 0)),
    duration: first(p.duration, p.video_duration) ?? null,
    position: Number(first(p.position, 0)),
  };
}

// items: every card on the season page, each with the tab it belongs to
export function buildItems(season, rawEvents, rawPosts, now = Date.now()) {
  const eventSpace = String(season.event_space_id);
  const t = season.topic_ids || {};
  const events = rawEvents.map(normEvent).filter(e => e.spaceId === eventSpace).sort((a, b) => ms(a.start) - ms(b.start));
  // Sessions in Circle can share one title; number the ones that are not already called "Session N"
  events.forEach((e, i) => { if (!/session\s*\d/i.test(e.title)) e.title = `${e.title}: Session ${i + 1}`; });
  const posts = rawPosts.map(normPost);
  const has = (p, topic) => t[topic] != null && p.topics.includes(String(t[topic]));
  const items = [];
  for (const e of events) {
    const endMs = ms(e.end);
    const ended = (Number.isNaN(endMs) ? ms(e.start) + 2 * 60 * 60 * 1000 : endMs) + 30 * 60 * 1000 < now; // a session is live until 30 minutes past its end
    items.push({ ...e, at: e.start, chip: ended && e.replayUrl ? 'Recording' : 'Live session', tab: ended ? (e.replayUrl ? 'recordings' : null) : 'live', ended });
  }
  for (const p of posts) {
    if (has(p, 'recordings')) items.push({ ...p, chip: 'Recording', tab: 'recordings' });
    else if (has(p, 'readings')) items.push({ ...p, chip: 'Reading', tab: 'readings' });
    else if (has(p, 'reflections')) items.push({ ...p, chip: 'Reflection', tab: 'reflections' });
    else items.push({ ...p, chip: 'Post', tab: null });
  }
  return items;
}

const byRecent = (a, b) => ms(b.at) - ms(a.at);

export function tabLists(items) {
  const live = items.filter(i => i.tab === 'live').sort((a, b) => ms(a.at) - ms(b.at));
  const recordings = items.filter(i => i.tab === 'recordings').sort(byRecent);
  const readings = items.filter(i => i.tab === 'readings').sort((a, b) => (b.pinned - a.pinned) || (a.position - b.position) || ms(a.at) - ms(b.at));
  const reflections = items.filter(i => i.tab === 'reflections').sort(byRecent);
  // All: newest activity first, with the next live session pinned on top
  const nextLive = live[0];
  const rest = items.filter(i => i !== nextLive).sort((a, b) => {
    // upcoming sessions after the pinned one come before past activity, soonest first
    const fa = a.kind === 'event' && !a.ended, fb = b.kind === 'event' && !b.ended;
    if (fa !== fb) return fa ? -1 : 1;
    if (fa && fb) return ms(a.at) - ms(b.at);
    return byRecent(a, b);
  });
  const all = nextLive ? [nextLive, ...rest] : rest;
  return { all, live, recordings, readings, reflections };
}

export const EMPTY = {
  all: 'Nothing here yet. Check back once the season begins.',
  live: 'The live sessions for this season will appear here.',
  recordings: 'Recordings appear here a few minutes after each live session ends.',
  readings: 'Readings for this season will appear here before Session 1.',
  reflections: 'Be the first to share a reflection for this season.',
};

// Join opens 10 minutes before the start and stays open 30 minutes past the scheduled end, so a late or long
// livestream is still reachable. We cannot see whether the host has pressed "start", so this follows the clock.
export const joinOpen = (e, now = Date.now()) => {
  const s = ms(e.start), end = ms(e.end) || s + 2 * 60 * 60 * 1000;
  return s - 10 * 60 * 1000 <= now && now <= end + 30 * 60 * 1000;
};
