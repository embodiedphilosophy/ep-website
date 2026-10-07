// Kit (ConvertKit) API v4. Vercel: KIT_API_KEY (Kit > Settings > Developer > API v4 key)
const BASE = () => process.env.KIT_BASE || 'https://api.kit.com/v4';

export const kitConfigured = () => !!process.env.KIT_API_KEY;

async function kit(path, { method = 'GET', body } = {}) {
  if (!process.env.KIT_API_KEY) throw new Error('KIT_API_KEY is not set');
  const res = await fetch(BASE() + path, {
    method, cache: 'no-store',
    headers: { 'X-Kit-Api-Key': process.env.KIT_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Kit ${method} ${path} failed: ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

export const draftUrl = id => `https://app.kit.com/campaigns/${id}/draft`;

export async function getBroadcast(id) {
  return (await kit(`/broadcasts/${id}`)).broadcast;
}

// Always a draft: send_at stays null, so nothing is scheduled or sent from here.
export async function createDraft(fields) {
  return (await kit('/broadcasts', { method: 'POST', body: { public: false, ...fields, send_at: null } })).broadcast;
}

export async function updateDraft(id, fields) {
  return (await kit(`/broadcasts/${id}`, { method: 'PUT', body: { public: false, ...fields, send_at: null } })).broadcast;
}

// A draft we may overwrite: not sent, not scheduled
export const isEditableDraft = b => b && !b.send_at && !b.published_at && (!b.status || b.status === 'draft');

// ---- Subscribers and tags (member sync) ----
export async function findSubscriber(email) {
  const q = new URLSearchParams({ email_address: String(email).trim().toLowerCase(), status: 'all' });
  return (await kit(`/subscribers?${q}`)).subscribers?.[0] || null;
}

// Upsert by email (Kit keeps the existing record if there is one)
export async function upsertSubscriber(email, first_name) {
  return (await kit('/subscribers', { method: 'POST', body: { email_address: String(email).trim().toLowerCase(), ...(first_name ? { first_name } : {}) } })).subscriber;
}

export async function addTag(tagId, email) {
  return kit(`/tags/${tagId}/subscribers`, { method: 'POST', body: { email_address: String(email).trim().toLowerCase() } });
}

export async function removeTag(tagId, subscriberId) {
  return kit(`/tags/${tagId}/subscribers/${subscriberId}`, { method: 'DELETE' });
}

export async function subscriberTagIds(subscriberId) {
  const ids = [];
  let after = '';
  for (let i = 0; i < 10; i++) {
    const r = await kit(`/subscribers/${subscriberId}/tags?per_page=100${after ? `&after=${after}` : ''}`);
    ids.push(...(r.tags || []).map(t => t.id));
    if (!r.pagination?.has_next_page) break;
    after = r.pagination.end_cursor;
  }
  return ids;
}
