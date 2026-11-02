// The texts tab on /school/mentee-year: every month's books in one list, kept out of the month cards so they are managed in one place.
// Source of truth: the "Mentee Books" sheet tab (Ops → Settings → Sahṛdaya Upāya → Reading list), the same rows behind "Book of the month" in Circle.
// Until that tab has rows, the list is read from the **Read** bullets in data/mentee-year.json, so the page is never empty.
// Reflection due dates come from the Mentee Months tab (reflection_due), else from the bullet's ^date^. Pure (no network): scripts/ops-test/mentee-texts.mjs.
import { booksFrom } from './books.js';

// A month-card bullet that is the month's reading (these move to the texts tab)
export const isReadBullet = t => /^\*\*Read\*\*\s/.test(String(t || ''));

// "Michael Polanyi, _The Tacit Dimension_: the essay…" → { author, title, note }
const one = (s, kind) => {
  const m = String(s).match(/^\s*(.*?),?\s*_([^_]+)_\s*(.*)$/);
  if (!m) return null;
  const note = m[3].replace(/^[.:,\s]+|[.\s]+$/g, '').replace(/^\((.*)\)$/, '$1');
  return { kind, author: m[1].trim(), title: m[2].trim(), note, audio: '', search: `${m[2]} ${m[1]}`.trim(), asin: '' };
};

// One **Read** bullet → { required: [book], suggested: [book], due }
export function parseReadBullet(t) {
  const s = String(t || '').replace(/^\*\*Read\*\*\s*/, '');
  const due = (s.match(/\^([^^]+)\^/) || [])[1] || '';
  const sugg = (s.match(/~\s*Suggested:\s*([^~]*)~/i) || [])[1] || '';
  const req = s.replace(/~[^~]*~/g, '').replace(/Reflection due\s*\^[^^]*\^\.?/i, '');
  return { required: [one(req, 'required')].filter(Boolean), suggested: sugg ? sugg.split(/;\s*/).map(x => one(x, 'suggested')).filter(Boolean) : [], due };
}

const dueFmt = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(',', '');

// months: data.months (id 'YYYY-MM', title, theme, items). bookRows: Mentee Books rows. monthRows: Mentee Months rows.
// → { source: 'sheet' | 'page', months: [{ id, title, theme, required, suggested, due, current }] }, one entry per month that has a book
export function textsFor(months, bookRows, monthRows, today) {
  const dueFrom = id => { const r = (monthRows || []).find(x => x.month === id && /^\d{4}-\d{2}-\d{2}$/.test(x.reflection_due || '')); return r ? dueFmt(r.reflection_due) : ''; };
  const sheet = booksFrom(bookRows || [], today).all;
  const fromPage = id => { const b = (months.find(m => m.id === id)?.items || []).find(isReadBullet); return b ? parseReadBullet(b) : null; };
  const out = sheet.length
    ? sheet.map(s => {
      const id = s.starts.slice(0, 7), m = months.find(x => x.id === id);
      return { id, title: m ? m.title : new Date(`${id}-15T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }), theme: s.theme || m?.theme || '', required: s.required, suggested: s.suggested, due: dueFrom(id) || fromPage(id)?.due || '' };
    })
    : months.map(m => { const p = fromPage(m.id); return p && { id: m.id, title: m.title, theme: m.theme, required: p.required, suggested: p.suggested, due: dueFrom(m.id) || p.due }; }).filter(Boolean);
  const ym = String(today).slice(0, 7);
  return { source: sheet.length ? 'sheet' : 'page', months: out.map(x => ({ ...x, current: x.id === ym })) };
}
