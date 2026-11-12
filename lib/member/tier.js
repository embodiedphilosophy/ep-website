// A member's tier, from their Kit tags (the same tags that open their Circle groups: lib/membership.js) together with
// the Circle access groups they are in (Circle paywall buyers never get Kit tags: circleTierGroups in lib/membership.js).
// Highest tier wins. Cached for 10 minutes per email.
import { TAG, circleTierGroups } from '../membership';
import { kitConfigured, findSubscriber, subscriberTagIds } from '../kit';
import { circleConfigured, findMember, accessGroupMemberIds } from '../circle';
import { creditsFromFields, nyToday } from './credits';

export const TIERS = ['none', 'course', 'meditation', 'wisdom', 'wisdom_plus', 'ss_season', 'ss_year', 'mentee'];

export function tierFromTags(tagIds) {
  const t = new Set((tagIds || []).map(Number));
  const seasons = [];
  if (t.has(TAG.ssFall)) seasons.push('fall');
  if (t.has(TAG.ssWinter)) seasons.push('winter');
  if (t.has(TAG.ssSpring)) seasons.push('spring');
  if (t.has(TAG.ssSummer)) seasons.push('summer');
  let tier = 'none';
  if (t.has(TAG.mentorship)) tier = 'mentee';
  else if (t.has(TAG.ssYear)) tier = 'ss_year';
  else if (seasons.length) tier = 'ss_season';
  else if (t.has(TAG.wisdomPlus)) tier = 'wisdom_plus';
  else if (t.has(TAG.wisdom)) tier = 'wisdom';
  else if (t.has(TAG.meditation)) tier = 'meditation';
  return {
    tier,
    seasons,
    wisdom: t.has(TAG.wisdom) || t.has(TAG.wisdomPlus),
    wisdomPlus: t.has(TAG.wisdomPlus),
    meditation: t.has(TAG.meditation),
  };
}

// { access group id: Set of Circle member ids }, refreshed every 10 minutes (one paged read per group)
let groupMembers = null;
async function circleGroupMembers() {
  if (groupMembers && Date.now() - groupMembers.at < 10 * 60 * 1000) return groupMembers.map;
  const map = {};
  await Promise.all(Object.keys(circleTierGroups()).map(async id => { map[id] = await accessGroupMemberIds(id).catch(() => null); }));
  groupMembers = { at: Date.now(), map };
  return map;
}

// The Kit tag ids a member's Circle access groups stand for. Never throws: Circle being down just means Kit decides alone.
export async function circleTagIds(email) {
  if (!circleConfigured()) return [];
  try {
    const member = await findMember(email);
    if (!member?.id) return [];
    const groups = circleTierGroups(), members = await circleGroupMembers(), out = [];
    for (const [gid, tag] of Object.entries(groups)) if (members[gid]?.has(String(member.id))) out.push(Number(tag));
    return out;
  } catch (e) { console.error('Circle tier lookup failed', e.message); return []; }
}

const cache = new Map();
export async function tierFor(email) {
  const hit = cache.get(email);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.value;
  let tags = [], credits = {};
  const [sub, fromCircle] = await Promise.all([
    kitConfigured() ? findSubscriber(email).catch(() => null) : null,
    circleTagIds(email),
  ]);
  if (sub) { tags = await subscriberTagIds(sub.id).catch(() => []); credits = creditsFromFields(sub.fields, nyToday()); }
  const value = { ...tierFromTags([...tags, ...fromCircle]), credits };
  cache.set(email, { at: Date.now(), value });
  return value;
}
