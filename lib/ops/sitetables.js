// The website content tabs the dashboard edits (Content → Website). Each is a plain table with headers
// in row 1 on EP-Programming-Calendar; the site reads them through lib/sheet.js (CALENDAR_TABS).
// Shared by the server (checks) and the editor (labels, inputs). Rows are never deleted from here:
// set "Show on the website" to No instead, so nothing the site links to disappears by accident.
export const SITE_TABLES = [
  { key: 'links', title: 'Site Links & Prices', label: 'Links & prices', add: false, locked: ['key', "where it's used"],
    name: r => r["where it's used"] || r.key, sub: r => r.value, help: 'Checkout links and prices used on the site. Each row is used in the place described.' },
  { key: 'stats', title: 'Site Stats', label: 'Stats', add: true, name: r => `${r.number} ${r.label}`, sub: r => r.notes, help: 'The numbers on the home page, in order.' },
  { key: 'teachers', title: 'Site Teachers', label: 'Teachers', add: true, name: r => r.name, sub: r => r.role, help: 'The Teachers page and the faces on event cards. A teacher’s approved bio from onboarding replaces the one here.' },
  { key: 'testimonials', title: 'Site Testimonials', label: 'Testimonials', add: true, name: r => r.name || String(r.quote || '').slice(0, 60), sub: r => r.quote, help: 'Program: home, wisdom, sadhana… or all.' },
  { key: 'pathways', title: 'Site Pathways', label: 'Pathways', add: true, name: r => r.title, sub: r => r.question, help: 'Learning pathways on Wisdom School and Continuing Education, in order.' },
  { key: 'seasons', title: 'Site Seasons', label: 'Seasons', add: true, name: r => [r.key, r.title].filter(Boolean).join(': '), sub: r => r.program, help: 'Sādhana School terms and other seasonal offerings.' },
  { key: 'themes', title: 'Site Annual Themes', label: 'Annual themes', add: true, name: r => `${r.year} · ${r.title}`, sub: r => r.tagline, help: 'Months: one per line as Month | Theme (separated by ;).' },
];

// Admin → Settings (directors only). columns: the headers the dashboard needs; a missing one is added on
// first save, and a missing tab can be created from the editor (create: true).
export const ADMIN_TABLES = [
  { key: 'templates', title: 'Task Templates', label: 'Task templates', add: true, scope: 'admin',
    columns: ['track', 'task', 'assign_to', 'offset_days', 'details', 'done_when'],
    name: r => `${r.track} · ${r.task}`, sub: r => `${r.assign_to}, ${Number(r.offset_days) < 0 ? `${-r.offset_days} days before` : `${r.offset_days || 0} days after`}${r.done_when ? ` · done when: ${r.done_when}` : ''}`,
    help: 'The tasks the daily job makes for each event. Assign to: Teacher, Course Host, Marketing, Media, Director or a name. Days: negative = before the event. Done when: how the task ticks itself off (blank = worked out from the wording).' },
  { key: 'defaults', title: 'Track Defaults', label: 'Track defaults', add: true, scope: 'admin', name: r => r.track, sub: r => r.public_title || r.program,
    help: 'What each track uses when an event leaves a field blank: title, time, length, price, newsletter buttons.' },
  { key: 'team', title: 'Team', label: 'Team', add: true, scope: 'admin', name: r => r.name, sub: r => [r.type, r.roles].filter(Boolean).join(' · '),
    help: 'Who can sign in and what they see. Type: director, manager, projects, marketing or teacher. Roles: comma-separated (e.g. Marketing, Media). Active = No removes access.' },
  { key: 'resources', title: 'Resources', label: 'Resources', add: true, scope: 'admin', create: true, columns: ['group', 'title', 'url', 'teachers'],
    name: r => r.title, sub: r => `${r.group}${String(r.teachers).toUpperCase() === 'TRUE' ? ' · teachers see it too' : ''}`, help: 'Links on the Team page. Teachers = Yes also shows the link to teachers.' },
];
export const tableOf = key => [...SITE_TABLES, ...ADMIN_TABLES].find(t => t.key === key);
export const RULE_OPTIONS = ['', 'bio', 'title', 'blurbs', 'readings', 'video_id', 'manual'];
export const TYPE_OPTIONS = ['director', 'manager', 'projects', 'marketing', 'teacher'];
export const NEWSLETTER_OPTIONS = ['show', 'enrolled_only', 'hide'];

const LONG = ['description', 'texts', 'quote', 'bio', 'notes', 'months', 'courses', 'kajabi_contents', 'tagline'];
// What kind of value a column holds → which input and which check
export function typeOf(table, col, row = {}) {
  const c = String(col).toLowerCase();
  if (c === 'publish' || c === 'active' || c === 'website' || (table === 'resources' && c === 'teachers')) return 'bool';
  if (table === 'templates') return { track: 'track', offset_days: 'number', done_when: 'rule', details: 'long' }[c] || 'text';
  if (table === 'team') return { email: 'email', type: 'teamtype', welcomed_on: 'date', notes: 'long' }[c] || 'text';
  if (table === 'defaults') {
    if (c === 'track') return 'track';
    if (c === 'time') return 'time';
    if (c === 'duration') return 'number';
    if (c === 'newsletter') return 'newsletter';
    if (c === 'button_color') return 'color';
    if (c.endsWith('_url')) return 'link';
    if (c === 'notes' || c === 'enrolled_tags') return 'long';
    return 'text';
  }
  if (table === 'resources' && c === 'url') return 'link';
  if (c === 'value' && table === 'links') return /_price$|price|hours|seats|yacep|theme/i.test(row.key || '') ? 'text' : 'link';
  if (/(^|_)date$/.test(c)) return 'date';
  if (['order', 'year', 'ce_hours', 'contact_hours', 'non_contact_hours'].includes(c)) return 'number';
  if (['link', 'image', 'photo_url', 'registration_url'].includes(c) || c.endsWith('_url')) return 'link';
  if (LONG.includes(c)) return 'long';
  return 'text';
}

// → { value } or { error }
export function checkCell(type, raw) {
  const v = String(raw ?? '').trim();
  if (!v) return { value: '' };
  if (type === 'track') return /^[A-Za-z]{2,10}$/.test(v) ? { value: v.toUpperCase() } : { error: 'A track code like WSML or ALL' };
  if (type === 'rule') return RULE_OPTIONS.includes(v) ? { value: v } : { error: 'Pick a rule' };
  if (type === 'teamtype') return TYPE_OPTIONS.includes(v.toLowerCase()) ? { value: v.toLowerCase() } : { error: 'Pick a type' };
  if (type === 'newsletter') return NEWSLETTER_OPTIONS.includes(v) ? { value: v } : { error: 'Pick one' };
  if (type === 'email') return /^[^\s@,]+@[^\s@,]+\.[a-z]{2,}$/i.test(v) ? { value: v.toLowerCase() } : { error: 'An email address' };
  if (type === 'time') return /^\d{1,2}(:\d{2})?\s*(am|pm)\s+ET$/i.test(v) ? { value: v } : { error: 'A time like 7pm ET' };
  if (type === 'color') return /^#[0-9a-f]{6}$/i.test(v) ? { value: v.toUpperCase() } : { error: 'A colour like #1E4772' };
  if (type === 'bool') return ['TRUE', 'FALSE'].includes(v.toUpperCase()) ? { value: v.toUpperCase() } : { error: 'Yes or no' };
  if (type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) ? { value: v } : { error: 'A date like 2026-10-21' };
  if (type === 'number') return /^-?\d+(\.\d+)?$/.test(v) ? { value: v } : { error: 'A number' };
  if (type === 'link') return /^(https:\/\/\S+|\/\S*)$/.test(v) ? { value: v } : { error: 'A full link starting with https:// (or a site path starting with /)' };
  if (type === 'text') return v.length > 300 ? { error: 'Keep it under 300 characters' } : { value: v.replace(/\s*\n\s*/g, ' ') };
  return v.length > 6000 ? { error: 'Too long' } : { value: v };
}
