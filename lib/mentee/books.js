// The Sahṛdaya Upāya reading list ("book of the month"). Staff list the books in Ops → Settings → Sahṛdaya Upāya → Reading list: one row per book on the
// "Mentee Books" tab, grouped by month. The page shows the month whose `starts` date has most recently passed, so it moves on by itself each month.
//   month | starts | theme | kind | title | author | audio | note | search | asin | publish
// kind: required (feeds the monthly written reflection) or suggested (discussed in peer articulation, not assessed). search: what to look for on
// Amazon if the title alone is not enough. asin: the book's Amazon id, for a direct link. publish = No hides a row. Pure helpers.
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const shown = r => !/^(false|no|hide)$/i.test(String(r.publish || '').trim());

const book = r => ({
  kind: /^sugg/i.test(r.kind || '') ? 'suggested' : 'required', title: String(r.title || '').trim(), author: String(r.author || '').trim(),
  audio: String(r.audio || '').trim(), note: String(r.note || '').trim(),
  search: String(r.search || '').trim() || [r.title, r.author].filter(Boolean).join(' '), asin: /^[A-Z0-9]{10}$/i.test(String(r.asin || '').trim()) ? String(r.asin).trim().toUpperCase() : '',
});

// Sheet rows → { current, next, all }. today: 'YYYY-MM-DD'. A month with no start date, or no book, is left out.
export function booksFrom(rows, today) {
  const by = new Map();
  for (const r of rows.filter(shown)) {
    const n = Number(r.month), starts = String(r.starts || '').trim();
    if (!Number.isInteger(n) || n < 1 || !String(r.title || '').trim()) continue;
    const m = by.get(n) || by.set(n, { month: n, starts: '', theme: '', books: [] }).get(n);
    if (DAY.test(starts) && (!m.starts || starts < m.starts)) m.starts = starts;
    m.theme ||= String(r.theme || '').trim();
    m.books.push(book(r));
  }
  const months = [...by.values()].filter(m => m.starts).sort((a, b) => a.starts.localeCompare(b.starts) || a.month - b.month);
  const cur = [...months].reverse().find(m => m.starts <= today) || null;
  const nxt = months.find(m => m.starts > today) || null;
  const shape = m => ({ month: m.month, starts: m.starts, theme: m.theme, required: m.books.filter(b => b.kind === 'required'), suggested: m.books.filter(b => b.kind === 'suggested') });
  return {
    total: months.length,
    current: cur && shape(cur),
    next: nxt && shape(nxt),
    all: months.map(m => ({ ...shape(m), now: !!cur && m.month === cur.month, past: !!cur && m.starts < cur.starts })),
  };
}

// Which Amazon a student should be sent to: the UK one for students in the UK (by browser time zone or language), otherwise amazon.com. Runs in
// the browser (public/circle/sahrdaya.js has the same rule); kept here so it can be tested.
const UK_ZONES = /^Europe\/(London|Belfast|Jersey|Guernsey|Isle_of_Man)$/;
export const amazonHost = (zone, lang) => (UK_ZONES.test(String(zone || '')) || /^en-GB$/i.test(String(lang || '')) ? 'www.amazon.co.uk' : 'www.amazon.com');
export const amazonUrl = (b, host) => b.asin ? `https://${host}/dp/${b.asin}` : `https://${host}/s?k=${encodeURIComponent(b.search)}&i=stripbooks`;
