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
  tokens.set(email, { token, exp: Date.now() + 55 * 60 * 1000 }); // Circle's tokens last an hour
  return token;
}

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

export const eventList = email => cached(email, 'events', 5 * 60 * 1000, () => all(email, '/community_events'));

// Posts in one space. Topic filtering happens in lib/school/tabs.js because the filter parameter isn't documented.
export const spacePosts = (email, spaceId) => cached(email, `posts:${spaceId}`, 60 * 1000, () => all(email, `/spaces/${spaceId}/posts?sort=latest`, 5));

export async function rsvp(email, eventId) {
  const r = await member(email, `/events/${encodeURIComponent(eventId)}/event_attendees`, { method: 'POST', body: '{}' });
  cache.delete(`${email}|events`);
  return r;
}

// The post body shape is a best guess until checked in the Swagger reference
export async function createPost(email, spaceId, { title, body, topicId }) {
  const r = await member(email, `/spaces/${spaceId}/posts`, {
    method: 'POST', body: JSON.stringify({ name: title, body, topic_ids: topicId != null ? [Number(topicId)] : [], status: 'published' }),
  });
  cache.delete(`${email}|posts:${spaceId}`);
  return r;
}
