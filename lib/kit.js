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
