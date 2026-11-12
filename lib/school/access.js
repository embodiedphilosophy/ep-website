// A second opinion on "is this member in this space?", from Circle's Admin API.
// The season pages gate on the member's headless space list (lib/school/circle.js joinedSpaces). On 12 Nov 2026 that
// list stopped including the Fall season for members the Admin API shows as active in it (Jacob included), so every
// student landed on "This season is open to students enrolled in it". When the headless list says no, we ask the Admin
// API before showing the gate. Each check is logged so the runtime logs show how often the headless list disagrees.
import { circleConfigured, findMember, spaceMemberIds } from '../circle';

const TTL = 5 * 60 * 1000;
const members = new Map(); // space id → { at, ids }
const people = new Map(); // email → { at, id }

async function memberId(email) {
  const hit = people.get(email);
  if (hit && Date.now() - hit.at < TTL) return hit.id;
  const m = await findMember(email);
  const id = m?.id != null ? String(m.id) : null;
  people.set(email, { at: Date.now(), id });
  return id;
}

async function idsIn(spaceId) {
  const k = String(spaceId), hit = members.get(k);
  if (hit && Date.now() - hit.at < TTL) return hit.ids;
  const ids = await spaceMemberIds(spaceId);
  members.set(k, { at: Date.now(), ids });
  return ids;
}

// True when the Admin API lists this member in the space. Never throws: if it cannot tell, the answer is no.
export async function adminConfirmsMember(email, spaceId) {
  if (!circleConfigured() || !email || !spaceId) return false;
  try {
    const id = await memberId(email);
    if (!id) return false;
    return (await idsIn(spaceId)).has(id);
  } catch (e) {
    console.error('Season access check (Admin API) failed', String(e.message || e).slice(0, 200));
    return false;
  }
}

// Adds to `member` (a Set of space ids) every one of `spaceIds` the headless list left out but the Admin API confirms.
// `recs` are the headless space records, so the log can say whether the space was missing or listed as not joined.
export async function confirmSpaces(email, member, spaceIds, recs = []) {
  const missing = [...new Set(spaceIds.filter(Boolean).map(String))].filter(id => !member.has(id));
  await Promise.all(missing.map(async id => {
    if (!(await adminConfirmsMember(email, id))) return;
    member.add(id);
    const rec = recs.find(r => String(r.id) === id);
    const flags = rec ? Object.fromEntries(Object.entries(rec).filter(([, v]) => typeof v === 'boolean')) : null;
    console.warn('Season access: headless list left out a space the Admin API confirms', JSON.stringify({ space: id, listed: !!rec, flags }));
  }));
  return member;
}
