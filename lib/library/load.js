// The member Library by department (public/circle/library.js). Staff write one row per item in the "Library Items" tab
// (ep-ops → Settings → Library): department | level | label | title | teachers | url | access | publish.
// A member sees the rows their membership opens; stars are theirs alone (lib/library/store.js).
import crypto from 'crypto';
import { readTab } from '../mentee/content';

export const TAB = 'Library Items';
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
export function shapeLibrary(rows, tier, admin) {
  const items = rows.filter(shown).filter(r => r.department && r.title && canSee(tier, admin, r.access))
    .map(r => ({ id: itemId(r.department, r.title), department: r.department.trim(), level: levelOf(r.level), label: r.label || '', title: r.title, teachers: r.teachers || '', url: /^https?:\/\//.test(r.url || '') ? r.url : '' }));
  const names = [...new Set(items.map(i => i.department))]; // staff order = the order of the rows
  return { departments: names.map(n => ({ name: n, count: items.filter(i => i.department === n).length })), items };
}

export async function loadLibrary(session, stars) {
  const unavailable = [];
  const rows = await readTab(TAB).catch(e => { console.error('library tab', e.message); unavailable.push('library'); return []; });
  return { ok: true, ...shapeLibrary(rows, session.tier, session.admin), stars: [...(stars || [])], unavailable };
}
