// A member's tier, from their Kit tags (the same tags that open their Circle groups: lib/membership.js).
// Highest tier wins. Cached for 10 minutes per email.
import { TAG } from '../membership';
import { kitConfigured, findSubscriber, subscriberTagIds } from '../kit';
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

const cache = new Map();
export async function tierFor(email) {
  const hit = cache.get(email);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.value;
  let value = { ...tierFromTags([]), credits: {} };
  if (kitConfigured()) {
    const sub = await findSubscriber(email).catch(() => null);
    if (sub) value = { ...tierFromTags(await subscriberTagIds(sub.id).catch(() => [])), credits: creditsFromFields(sub.fields, nyToday()) };
  }
  cache.set(email, { at: Date.now(), value });
  return value;
}
