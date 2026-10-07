// Circle Admin API v2. Vercel: CIRCLE_API_TOKEN (Circle > Settings > Developers > Tokens, type "Admin V2").
// Groups are matched by name: first Circle access groups, then space groups.
const BASE = () => process.env.CIRCLE_BASE || 'https://app.circle.so/api/admin/v2';

export const circleConfigured = () => !!process.env.CIRCLE_API_TOKEN;

async function circle(path, { method = 'GET', body } = {}) {
  if (!process.env.CIRCLE_API_TOKEN) throw new Error('CIRCLE_API_TOKEN is not set');
  const res = await fetch(BASE() + path, {
    method, cache: 'no-store',
    headers: { Authorization: `Bearer ${process.env.CIRCLE_API_TOKEN}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) { const e = new Error(`Circle ${method} ${path.split('?')[0]} failed: ${res.status} ${text.slice(0, 300)}`); e.status = res.status; throw e; }
  return text ? JSON.parse(text) : {};
}

async function listAll(path) {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const r = await circle(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    const rows = r.records || r.data || (Array.isArray(r) ? r : []);
    out.push(...rows);
    if (!r.has_next_page || !rows.length) break;
  }
  return out;
}

// Names match without case or diacritics: "Sadhana School" = "Sādhana School"
const norm = n => String(n || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

let cache = null;
// { name(lowercase): { kind: 'access'|'space_group', id } }
export { norm };
export async function groupIndex() {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.map;
  const map = {};
  for (const g of await listAll('/space_groups').catch(() => [])) map[norm(g.name)] = { kind: 'space_group', id: g.id, name: g.name };
  for (const g of await listAll('/access_groups').catch(() => [])) map[norm(g.name)] = { kind: 'access', id: g.id, name: g.name };
  cache = { at: Date.now(), map };
  return map;
}

export async function findMember(email) {
  const r = await circle(`/community_members/search?email=${encodeURIComponent(email)}`).catch(e => { if (e.status === 404) return null; throw e; });
  return r && (r.id ? r : r.community_member || r.records?.[0]) || null;
}

// Adds the person to Circle if needed. skipInvite=false means Circle emails them an invitation.
export async function ensureMember(email, name, { skipInvite = false } = {}) {
  const found = await findMember(email);
  if (found) return { member: found, created: false };
  const r = await circle('/community_members', { method: 'POST', body: { email, name: name || undefined, skip_invitation: skipInvite } });
  return { member: r.community_member || r, created: true };
}

async function resolve(groupName) {
  const g = (await groupIndex())[norm(groupName)];
  if (!g) throw new Error(`No Circle group named "${groupName}"`);
  return g;
}

export async function grantGroup(groupName, email) {
  const g = await resolve(groupName);
  if (g.kind === 'access') return circle(`/access_groups/${g.id}/community_members`, { method: 'POST', body: { email } });
  return circle('/space_group_members', { method: 'POST', body: { email, space_group_id: g.id } });
}

export async function revokeGroup(groupName, email) {
  const g = await resolve(groupName);
  const q = encodeURIComponent(email);
  const ignore404 = e => { if (e.status === 404) return { already: 'not a member' }; throw e; };
  if (g.kind === 'access') return circle(`/access_groups/${g.id}/community_members?email=${q}`, { method: 'DELETE' }).catch(ignore404);
  return circle(`/space_group_members?email=${q}&space_group_id=${g.id}`, { method: 'DELETE' }).catch(ignore404);
}
