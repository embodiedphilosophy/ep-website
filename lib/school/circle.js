// Circle Headless Member API, server side only. Vercel: CIRCLE_HEADLESS_TOKEN (a "Headless Auth" token from
// Circle → Developers → Tokens; an Admin V2 token gets a 403). Optional: CIRCLE_HEADLESS_BASE (tests).
//
// Who the member is comes from our own signed cookie (lib/school/session.js), which is only ever issued after a
// verified Circle sign-in. This file turns that email into a one-hour Circle access token and keeps it in
// memory, so no Circle token reaches the browser and there is no refresh token to store.
const ORIGIN = () => (process.env.CIRCLE_HEADLESS_BASE || 'https://app.circle.so').replace(/\/$/, '');
const V1 = () => `${ORIGIN()}/api/headless/v1`;

export const headlessConfigured = () => !!process.env.CIRCLE_HEADLESS_TOKEN;

let blockedUntil = 0; // after a 429 we leave Circle alone for a minute
const tokens = new Map(); // email → { token, exp }
const cache = new Map(); // key → { at, value }

export class CircleError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function raw(url, init = {}) {
  if (Date.now() < blockedUntil) throw new CircleError('Circle is busy', 429);
  const res = await fetch(url, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (res.status === 429) { blockedUntil = Date.now() + 60 * 1000; throw new CircleError('Circle is busy', 429); }
  const text = await res.text();
  let body = {}; try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!res.ok) throw new CircleError(`Circle ${res.status}: ${body.message || body.error || ''}`.slice(0, 200), res.status);
  return body;
}

async function accessToken(email, fresh = false) {
  const hit = tokens.get(email);
  if (!fresh && hit && hit.exp > Date.now() + 2 * 60 * 1000) return hit.token;
  const r = await raw(`${ORIGIN()}/api/v1/headless/auth_token`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.CIRCLE_HEADLESS_TOKEN}` }, body: JSON.stringify({ email }),
  });
  const token = r.access_token;
  if (!token) throw new CircleError('Circle gave no access token', 502);
  tokens.set(email, { token, memberId: r.community_member_id, exp: Date.now() + 55 * 60 * 1000 }); // Circle's tokens last an hour
  return token;
}

// This member's id in the community (it comes with the access token), to tell their own posts from everyone else's
export async function myMemberId(email) { await accessToken(email); return tokens.get(email)?.memberId ?? null; }

async function member(email, path, init = {}) {
  const go = async fresh => raw(`${V1()}${path}`, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${await accessToken(email, fresh)}` } });
  try { return await go(false); }
  catch (e) { if (e.status === 401) return go(true); throw e; }
}

// Cached read: key by member so one person's view is never served to another
async function cached(email, key, ttl, load) {
  const k = `${email}|${key}`, hit = cache.get(k);
  if (hit && Date.now() - hit.at < ttl) return hit.value;
  const value = await load();
  cache.set(k, { at: Date.now(), value });
  if (cache.size > 500) for (const [key2, v] of cache) if (Date.now() - v.at > 10 * 60 * 1000) cache.delete(key2);
  return value;
}

const rows = r => (Array.isArray(r) ? r : r.records || r.data || r.items || []);

async function all(email, path, maxPages = 10) {
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const r = await member(email, `${path}${path.includes('?') ? '&' : '?'}page=${page}&per_page=100`);
    const list = rows(r);
    out.push(...list);
    if (!list.length || r.has_next_page === false || (r.has_next_page === undefined && list.length < 100)) break;
  }
  return out;
}

// The spaces this member can see (ids as strings)
export const memberSpaceIds = email => cached(email, 'spaces', 5 * 60 * 1000, async () => new Set((await all(email, '/spaces')).map(s => String(s.id))));

// The full space records this member can see (name, url, type, space group), for the member Library
export const memberSpaces = email => cached(email, 'spacerecs', 5 * 60 * 1000, () => all(email, '/spaces'));

// Spaces the member has actually joined. Circle may list private spaces to non-members; if the record carries an explicit
// "not a member" flag we honour it, otherwise being listed counts as joined (as the season pages already assume).
// Not yet checked against the live API: /api/school/debug shows which flag names Circle really sends.
const NOT_JOINED_FLAGS = ['is_member', 'member', 'joined', 'is_joined', 'current_user_is_member', 'current_member_joined'];
export const isJoined = rec => !NOT_JOINED_FLAGS.some(k => rec?.[k] === false);
export const joinedSpaces = email => memberSpaces(email).then(list => list.filter(isJoined));

// Circle's event list is upcoming sessions only unless past_events is asked for, so we read both and merge them
export const eventList = email => cached(email, 'events', 5 * 60 * 1000, async () => {
  const [up, past] = await Promise.all([all(email, '/community_events'), all(email, '/community_events?past_events=true')]);
  const seen = new Set();
  return [...up, ...past].filter(e => !seen.has(e.id) && seen.add(e.id));
});

// Posts in one space. Topic filtering happens in lib/school/tabs.js because the filter parameter isn't documented.
export const spacePosts = (email, spaceId) => cached(email, `posts:${spaceId}`, 60 * 1000, () => all(email, `/spaces/${spaceId}/posts?status=published`, 5));

// The newest posts of one space, one request, for the hub's "latest" line and new-item counts.
// 20 is enough to count new items; the sort is repeated client side in lib/school/hub.js because the parameter isn't verified.
export const latestPosts = (email, spaceId) => cached(email, `latest:${spaceId}`, 2 * 60 * 1000, async () => rows(await member(email, `/spaces/${spaceId}/posts?status=published&sort=latest&per_page=20`)));

// "This week" only needs what is coming up plus a few recent ones, so it reads far less than the season view does
export const weekEvents = email => cached(email, 'weekevents', 5 * 60 * 1000, async () => {
  const [up, past] = await Promise.all([all(email, '/community_events', 3), all(email, '/community_events?past_events=true', 1)]);
  const seen = new Set();
  return [...up, ...past].filter(e => !seen.has(e.id) && seen.add(e.id));
});

export async function rsvp(email, eventId) {
  const r = await member(email, `/events/${encodeURIComponent(eventId)}/event_attendees`, { method: 'POST', body: '{}' });
  cache.delete(`${email}|events`);
  return r;
}

// Request body per Circle's Headless Member API spec: name, topics (ids), tiptap_body (a document of paragraphs)
const paragraphs = text => String(text).split(/\n{1,}/).map(t => t.trim()).filter(Boolean).map(t => ({ type: 'paragraph', content: [{ type: 'text', text: t }] }));
export async function createPost(email, spaceId, { title, body, topicId }) {
  const r = await member(email, `/spaces/${spaceId}/posts`, {
    method: 'POST',
    body: JSON.stringify({
      space_id: Number(spaceId), name: title, topics: topicId != null ? [Number(topicId)] : [],
      is_comments_enabled: true, is_liking_enabled: true,
      tiptap_body: { body: { type: 'doc', content: paragraphs(body) } },
    }),
  });
  cache.delete(`${email}|posts:${spaceId}`);
  return r;
}

// The latest messages of a chat room the member belongs to (the cohort chat). Read as the member, so a room they are not in reads as empty.
// Each message has body (plain text), sent_at and sender { name, community_admin, moderator } (checked against the real API, 21 Oct 2026).
export const chatMessages = (email, roomUuid, limit = 30) => cached(email, `chat:${roomUuid}`, 30 * 1000, async () => {
  if (!/^[0-9a-f-]{36}$/i.test(String(roomUuid))) return [];
  const r = await member(email, `/messages/${roomUuid}/chat_room_messages?per_page=${limit}`);
  return rows(r).filter(m => m && m.body && m.sent_at).sort((a, b) => Date.parse(a.sent_at) - Date.parse(b.sent_at)).slice(-limit);
});

// A course's sections with their lessons, each with this member's progress ({ status: 'incomplete' | 'complete' }) (checked 21 Oct 2026).
export const courseSections = (email, courseSpaceId) => cached(email, `course:${courseSpaceId}`, 2 * 60 * 1000, async () => {
  const r = await member(email, `/courses/${Number(courseSpaceId)}/sections`);
  return Array.isArray(r) ? r : rows(r);
});
