// The monthly one-to-one with Jacob, read from Calendly (read-only). Vercel: CALENDLY_TOKEN (a personal access token with
// users:read, event_types:read, availability:read and scheduled_events:read). The event type is in data/mentee.json.
// If Calendly is down or the token is missing, the page just shows the booking button as before.
const BASE = 'https://api.calendly.com';
export const calendlyConfigured = () => !!process.env.CALENDLY_TOKEN;

const cache = new Map();
async function cached(key, ttl, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 200) for (const [k, v] of cache) if (Date.now() - v.at > 15 * 60 * 1000) cache.delete(k);
  return value;
}

async function get(path, params) {
  const res = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${process.env.CALENDLY_TOKEN}` }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Calendly ${res.status}`);
  return res.json();
}

const eventTypeUri = id => `${BASE}/event_types/${id}`;
const userUri = () => cached('user', 6 * 3600e3, async () => (await get('/users/me', {})).resource.uri);

// Open times inside one window (Calendly allows at most 7 days at a time). Starts from now if the window has begun.
export async function openSlots(eventTypeId, from, to, now = Date.now(), limit = 12) {
  if (!calendlyConfigured() || !eventTypeId || !from || !to) return [];
  const start = Math.max(Date.parse(from + 'T00:00:00Z') - 24 * 3600e3, now + 60 * 1000); // a day of slack: the window is in UK evenings
  const end = Math.min(Date.parse(to + 'T00:00:00Z') + 2 * 24 * 3600e3, start + 7 * 24 * 3600e3);
  if (end <= start) return [];
  const iso = ms => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
  return cached(`slots|${eventTypeId}|${from}|${to}`, 5 * 60 * 1000, async () => {
    const d = await get('/event_type_available_times', { event_type: eventTypeUri(eventTypeId), start_time: iso(start), end_time: iso(end) });
    return (d.collection || []).filter(s => s.status === 'available' && s.start_time && /^https:\/\/calendly\.com\//.test(s.scheduling_url || ''))
      .map(s => ({ start: s.start_time, url: s.scheduling_url })).slice(0, limit);
  });
}

// The mentee's next booked one-to-one, if any (matched on their email; short cache)
export async function bookedFor(eventTypeId, email, now = Date.now()) {
  if (!calendlyConfigured() || !eventTypeId || !email) return null;
  return cached(`booked|${email}`, 2 * 60 * 1000, async () => {
    const d = await get('/scheduled_events', { user: await userUri(), invitee_email: String(email).toLowerCase(), min_start_time: new Date(now).toISOString().replace(/\.\d{3}Z$/, 'Z'), status: 'active', sort: 'start_time:asc', count: '10' });
    const e = (d.collection || []).find(x => x.event_type === eventTypeUri(eventTypeId));
    return e ? { start: e.start_time, url: e.location?.join_url || '' } : null;
  });
}
