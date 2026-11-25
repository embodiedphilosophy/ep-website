// "Your courses" on Circle's Today page (public/circle/today.js, data from /api/member/courses).
// The courses this member has actually been given in Circle (a Kit purchase, a Circle paywall, a membership), so that someone
// who buys a course while already being a Circle member can find it the moment they sign in. Circle sends no email in that
// case, and course spaces are kept out of the sidebar on purpose.
import { headlessConfigured, joinedSpaces } from '../school/circle';
import { adminConfirmsMember } from '../school/access';

const first = (o, keys) => { for (const k of keys) { const v = k.split('.').reduce((x, p) => x?.[p], o); if (v !== undefined && v !== null && v !== '') return v; } return ''; };
const isCourse = sp => /course/i.test(String(first(sp, ['space_type', 'type', 'kind'])));
const https = u => (/^https:\/\//.test(String(u || '')) ? String(u) : '');
const SITE = 'https://ss.embodiedphilosophy.com';

// Pure: Circle space records → the cards. Newest course spaces first (a higher Circle id is a newer space), so a course
// added this week sits ahead of the older Learning Pathways. Field names are read from the likely spellings, as elsewhere.
export function shapeCourses(spaces) {
  const seen = new Set();
  return (spaces || []).filter(isCourse).map(sp => {
    const id = String(first(sp, ['id', 'space_id']) || '');
    const slug = String(first(sp, ['slug']) || '');
    const url = https(first(sp, ['url', 'space_url', 'public_url'])) || (slug ? `${SITE}/c/${encodeURIComponent(slug)}` : '');
    return {
      id, title: String(first(sp, ['name', 'title']) || '').trim(), url,
      image: https(first(sp, ['cover_image_url', 'cover_image.url', 'course_setting.cover_image_url', 'banner_image_url', 'image_url', 'thumbnail_url'])),
      group: String(first(sp, ['space_group_name', 'space_group.name', 'group_name']) || ''),
    };
  }).filter(c => c.title && c.url && !seen.has(c.id) && seen.add(c.id))
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
}

export const coursesAvailable = () => headlessConfigured();

// Circle lists every course space a member can *see*, and most courses are visible-but-locked to everyone (to drive upgrades),
// so the headless list alone showed courses people had never enrolled in. Each course is kept only when Circle's Admin API
// lists this member in it: a programme (Wisdom School, Sādhana School), a Learning Pathway or a one-off course all give
// space membership. check(email, spaceId) is injectable for the offline test.
export async function enrolledOnly(email, courses, check = adminConfirmsMember) {
  const ok = await Promise.all(courses.map(c => check(email, c.id).catch(() => false)));
  return courses.filter((c, i) => ok[i]);
}

export async function myCourses(email) {
  return enrolledOnly(email, shapeCourses(await joinedSpaces(email)));
}
