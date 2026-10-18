// The member Library by department (public/circle/library.js). Staff write one row per item in the "Library Items" tab
// (ep-ops → Settings → Library): department | level | label | title | teachers | url | access | publish.
// A member sees the rows their membership opens; stars are theirs alone (lib/library/store.js).
import crypto from 'crypto';
import { readTab } from '../mentee/content';
import { getCatalog, PROGRAMMES } from '../catalog';
import { headlessConfigured, memberSpaces } from '../school/circle';

export const TAB = 'Library Items';
// Topics overlay: how the Library is organised for members (by topic, with a format badge). One row per Circle space,
// matched by circle_space_id, then by title. See docs/library-departments.md.
export const TOPICS_TAB = 'Library Topics';
export const LEVELS = ['Foundations', 'Deepening', 'Advanced'];

const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const shown = r => !/^(false|no|hide)$/i.test(r.publish || '');

// "foundation", "Foundations", "Start here" all land in Foundations; anything unrecognised does too
export const levelOf = s => { const p = plain(s); return p.startsWith('deep') ? 'Deepening' : p.startsWith('adv') ? 'Advanced' : 'Foundations'; };

// Who sees a row. Memberships build on each other: a Sādhana School student also sees Wisdom School rows, and so on.
const RANK = { none: 0, meditation: 1, wisdom: 2, wisdom_plus: 3, ss_season: 4, ss_year: 5, mentee: 6 };
const NEED = { '': 0, all: 0, everyone: 0, meditation: 1, 'meditation pass': 1, wisdom: 2, 'wisdom school': 2, 'wisdom plus': 3, 'ws plus': 3, sadhana: 4, 'sadhana school': 4, mentee: 6, mentees: 6, 'sahrdaya upaya': 6 };
// A word we don't recognise hides the row from everyone but admins, so a typo never opens something up by accident
export const canSee = (tier, admin, access) => !!admin || (RANK[tier] ?? 0) >= (NEED[plain(access)] ?? 99);

export const itemId = (dept, title) => 'l' + crypto.createHash('sha1').update(plain(dept) + '|' + plain(title)).digest('hex').slice(0, 12);

// Pure: rows → what a member of this tier sees
// An item can sit under a second topic (topic_2); `order` (from the Library Topics tab) puts the topics in the tab's order.
// The id stays tied to the item's original department so members' stars survive a re-filing.
export function shapeLibrary(rows, tier, admin, order = []) {
  const items = rows.filter(shown).filter(r => r.department && r.title && canSee(tier, admin, r.access))
    .map(r => {
      const department = r.department.trim();
      const topics = [...new Set([department, String(r.topic_2 || '').trim()].filter(Boolean))];
      return { id: itemId(r.id_department || r.department, r.title), department, topics, level: levelOf(r.level), label: r.label || '', note: r.note || '', title: r.title, teachers: r.teachers || '', url: /^https?:\/\//.test(r.url || '') ? r.url : '' };
    });
  const seen = [...new Set(items.flatMap(i => i.topics))]; // staff order = the order of the rows
  const rank = n => { const k = order.indexOf(plain(n)); return k < 0 ? order.length + seen.indexOf(n) : k; };
  const names = seen.sort((a, b) => rank(a) - rank(b));
  return { departments: names.map(n => ({ name: n, count: items.filter(i => i.topics.includes(n)).length })), items };
}

// Library Topics rows → a lookup by Circle space id and by title, plus the topic order (first appearance in the tab)
export function topicIndex(rows) {
  const byId = new Map(), byTitle = new Map(), order = [];
  for (const r of rows || []) {
    const id = String(r.circle_space_id || '').trim(), title = plain(r.title);
    if (!id && !title) continue;
    if (id) byId.set(id, r);
    if (title) byTitle.set(title, r);
    const t = plain(r.topic);
    if (t && shown({ publish: r.show }) && !order.includes(t)) order.push(t);
  }
  return { byId, byTitle, order };
}

// Re-file one row by its topic entry: topic becomes the department (the heading), format the badge, note the small print.
// A topic entry with show = FALSE keeps the item out of the Library.
export function applyTopic(row, idx, spaceId) {
  if (!idx) return row;
  const t = (spaceId && idx.byId.get(String(spaceId))) || idx.byTitle.get(plain(row.title));
  if (!t) return row;
  if (/^(false|no|hide)$/i.test(t.show || '')) return { ...row, publish: 'FALSE' };
  return {
    ...row,
    id_department: row.id_department || row.department,
    department: t.topic || row.department,
    topic_2: t.topic_2 || '',
    label: t.format || row.label,
    note: t.note || row.note || '',
    level: t.level || row.level,
  };
}

// Published Course Library offerings (Ops → Course Library) become rows too, so the library fills itself:
// department = programme, level from depth, access from the offering's access level.
const CATALOG_ACCESS = { pwyc: '', meditation_pass: 'meditation', wisdom_school: 'wisdom', ws_plus: 'wisdom plus', sadhana_school: 'sadhana' };
const CATALOG_LEVEL = { 'Start here': 'Foundations', Deepen: 'Deepening', Formation: 'Advanced' };
export const catalogRows = offerings => offerings.map(o => ({
  department: PROGRAMMES[o.programme]?.label || 'Courses', level: CATALOG_LEVEL[o.depth] || 'Foundations', label: o.label || o.kind || '',
  title: o.title, teachers: o.teachers.map(t => t.name).join(', '), url: `https://www.embodiedphilosophy.com/courses/${o.id}`,
  access: CATALOG_ACCESS[o.access] ?? 'wisdom plus', publish: '',
}));

// Circle is where the courses live: the courses this member can open in Circle are the library. Circle's own space
// group is the department; the Course Library (catalog) adds level and teachers when a title matches.
const first = (o, keys) => { for (const k of keys) { const v = k.split('.').reduce((x, p) => x?.[p], o); if (v !== undefined && v !== null && v !== '') return v; } return ''; };
const isCourse = sp => /course/i.test(String(first(sp, ['space_type', 'type', 'kind'])));
export const circleRows = (spaces, offerings = []) => {
  const byTitle = new Map(offerings.map(o => [plain(o.title), o]));
  return spaces.filter(isCourse).map(sp => {
    const title = String(first(sp, ['name', 'title']));
    const o = byTitle.get(plain(title));
    return {
      space_id: String(first(sp, ['id', 'space_id']) || ''),
      department: String(first(sp, ['space_group_name', 'space_group.name', 'group_name']) || (o && PROGRAMMES[o.programme]?.label) || 'Courses'),
      level: o ? CATALOG_LEVEL[o.depth] || 'Foundations' : 'Foundations', label: o?.label || o?.kind || 'Course', title,
      teachers: o ? o.teachers.map(t => t.name).join(', ') : '', url: String(first(sp, ['url', 'space_url', 'public_url'])), access: '', publish: '',
    };
  }).filter(r => r.title);
};

export async function loadLibrary(session, stars) {
  const unavailable = [];
  const [rows, topicRows, offerings, spaces] = await Promise.all([
    readTab(TAB).catch(e => { console.error('library tab', e.message); unavailable.push('library'); return []; }),
    readTab(TOPICS_TAB).catch(e => { console.error('library topics tab', e.message); unavailable.push('topics'); return []; }),
    getCatalog().catch(e => { console.error('library catalog', e.message); unavailable.push('courses'); return []; }),
    headlessConfigured() && session.email ? memberSpaces(session.email).catch(e => { console.error('library circle', e.message); unavailable.push('circle'); return []; }) : Promise.resolve([]),
  ]);
  // Staff rows win, then Circle's courses, then published Course Library offerings Circle didn't list
  const out = [...rows], have = new Set(rows.map(r => itemId(r.department || '', r.title || '')));
  const seenTitle = new Set(rows.map(r => plain(r.title)));
  for (const r of [...circleRows(spaces, offerings), ...catalogRows(offerings)]) {
    const t = plain(r.title);
    if (seenTitle.has(t) || have.has(itemId(r.department, r.title))) continue;
    seenTitle.add(t); out.push(r);
  }
  const idx = topicIndex(topicRows);
  const filed = out.map(r => applyTopic(r, idx, r.space_id));
  return { ok: true, ...shapeLibrary(filed, session.tier, session.admin, idx.order), stars: [...(stars || [])], unavailable, source: { sheet: rows.length, topics: topicRows.length, circle: spaces.length, courses: spaces.filter(isCourse).length, catalog: offerings.length } };
}
