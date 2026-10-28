// The reading assignments at the top of a season's Readings tab. Staff edit them in Ops (the ep-ops repo) → Settings → Sādhana School →
// Reading assignments: the "Season Readings" tab of EP-Programming-Calendar, one row per line of the page:
//   season | session | kind | title | detail | pages | teacher | file_url | link_url | order | publish
// season: the season's slug (fall-2026). session: its number (1–8); blank for the season-wide rows.
// kind:  intro     detail = the paragraph at the top
//        need      title = a book or file, detail = what it is ("What you'll need")
//        session   one per session: title = its theme, detail = the focus (Sūtras 1–4), pages = how long the reading takes,
//                  teacher = who teaches it
//        core      title = the book, detail = what to read, pages = the pages
//        suggested the same, for optional reading
//        footer    detail = the closing line
// file_url: an uploaded file (Download button). link_url: a page to open (Open button). publish = No hides a row.
// Until the tab has rows for a season, data/season-readings-seed.json is used (and "Create it" in Ops fills the tab from ep-ops' copy of the same file).
// Pure (no network), so it is tested in scripts/ops-test/school-tabs.mjs.
import seed from '../../data/season-readings-seed.json';

export const READINGS_TAB = 'Season Readings';
export const READING_KINDS = ['session', 'core', 'suggested', 'need', 'intro', 'footer'];

const shown = r => !/^(false|no|hide)$/i.test(String(r.publish || '').trim());
const https = v => (/^https:\/\/\S+$/.test(String(v || '').trim()) ? String(v).trim() : '');
const num = v => (/^\d+$/.test(String(v || '').trim()) ? Number(v) : null);
const s = v => String(v ?? '').trim();

// sessionDates: { 1: iso, 2: iso, … } from the season's live sessions, so each week shows its date.
// → null when the season has no readings, else { intro, needs[], weeks[{ session, at, title, focus, teacher, time, core[], suggested[] }], footer }
export function readingPlan(rows, season, sessionDates = {}) {
  let mine = (rows || []).filter(r => s(r.season) === season);
  if (!mine.length) mine = seed.filter(r => s(r.season) === season);
  mine = mine.filter(shown);
  if (!mine.length) return null;
  const item = (r, i) => ({ title: s(r.title), detail: s(r.detail), pages: s(r.pages), file: https(r.file_url), link: https(r.link_url), order: num(r.order) ?? 1000 + i });
  const byOrder = list => list.sort((a, b) => a.order - b.order).map(({ order, ...x }) => x);
  const weeks = new Map();
  const week = n => weeks.get(n) || weeks.set(n, { session: n, at: sessionDates[n] || '', title: '', focus: '', teacher: '', time: '', core: [], suggested: [] }).get(n);
  const needs = [];
  let intro = '', footer = '';
  mine.forEach((r, i) => {
    const kind = s(r.kind).toLowerCase() || 'core', n = num(r.session);
    if (kind === 'intro') intro = s(r.detail) || s(r.title);
    else if (kind === 'footer') footer = s(r.detail) || s(r.title);
    else if (kind === 'need') { if (s(r.title)) needs.push(item(r, i)); }
    else if (n == null) return; // a reading needs its session
    else if (kind === 'session') Object.assign(week(n), { title: s(r.title), focus: s(r.detail), time: s(r.pages), teacher: s(r.teacher) });
    else if (s(r.title)) week(n)[kind === 'suggested' ? 'suggested' : 'core'].push(item(r, i));
  });
  const list = [...weeks.values()].sort((a, b) => a.session - b.session);
  // A book's file or link on its "What you'll need" row is used for every reading from that book that has none of its own,
  // so the Sourcebook PDF is uploaded once and each week's Sourcebook reading gets the Download button
  const book = new Map(needs.map(n => [n.title.toLowerCase(), n]));
  const withBook = r => { const b = book.get(r.title.toLowerCase()); return b && !r.file && !r.link ? { ...r, file: b.file, link: b.link } : r; };
  list.forEach(w => { w.core = byOrder(w.core.map(withBook)); w.suggested = byOrder(w.suggested.map(withBook)); });
  return { intro, needs: byOrder(needs), weeks: list, footer };
}

// { n: iso } for the numbered sessions among a season page's items (titles read "… Session N" after buildItems)
export function sessionDatesOf(items) {
  const out = {};
  for (const it of items || []) {
    const m = it.kind === 'event' && /session\s*(\d+)/i.exec(it.title || '');
    if (m && !out[m[1]]) out[m[1]] = it.at || it.start || '';
  }
  return out;
}

// The week to read for: the first session that hasn't finished yet (3 hours after it starts)
export function readingWeek(plan, now = Date.now()) {
  const w = plan?.weeks.find(x => x.at && Date.parse(x.at) + 3 * 3600 * 1000 > now);
  return w ? w.session : null;
}

// The rows "Create it" writes into a new Season Readings tab
export const readingSeed = seed;
