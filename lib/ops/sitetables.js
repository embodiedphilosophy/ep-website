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
export const tableOf = key => SITE_TABLES.find(t => t.key === key);

const LONG = ['description', 'texts', 'quote', 'bio', 'notes', 'months', 'courses', 'kajabi_contents', 'tagline'];
// What kind of value a column holds → which input and which check
export function typeOf(table, col, row = {}) {
  const c = String(col).toLowerCase();
  if (c === 'publish') return 'bool';
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
  if (type === 'bool') return ['TRUE', 'FALSE'].includes(v.toUpperCase()) ? { value: v.toUpperCase() } : { error: 'Yes or no' };
  if (type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) ? { value: v } : { error: 'A date like 2026-10-21' };
  if (type === 'number') return /^-?\d+(\.\d+)?$/.test(v) ? { value: v } : { error: 'A number' };
  if (type === 'link') return /^(https:\/\/\S+|\/\S*)$/.test(v) ? { value: v } : { error: 'A full link starting with https:// (or a site path starting with /)' };
  if (type === 'text') return v.length > 300 ? { error: 'Keep it under 300 characters' } : { value: v.replace(/\s*\n\s*/g, ' ') };
  return v.length > 6000 ? { error: 'Too long' } : { value: v };
}
