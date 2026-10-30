// This week's readings and prompt on the Practice page. Staff fill the "SS Weekly" tab of EP-Programming-Calendar
// (nothing is invented here; no rows means a quiet "nothing yet"). One row per reading:
//   season | week | week_start | reading_id | kind | title | meta | url | action | prompt | publish
// season: the season slug (fall-2026). week_start: the Monday the week begins (YYYY-MM-DD). kind: PRIMARY TEXT, COMMENTARY or
// RECORDING. action: Read or Listen. prompt: the Diary prompt for that week (on any row of the week). publish = No hides a row.
// Pure (no network): tested in scripts/member-test/practice.mjs.
import crypto from 'crypto';

export const WEEKLY_TAB = 'SS Weekly';
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const s = v => String(v ?? '').trim();
const plain = v => s(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const shown = r => !/^(false|no|hide)$/i.test(s(r.publish));
const https = v => (/^https:\/\/\S+$/.test(s(v)) ? s(v) : '');
const toDate = d => new Date(d + 'T00:00:00Z');
const addDays = (d, n) => { const x = toDate(d); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
export const mondayOf = d => addDays(d, -((toDate(d).getUTCDay() + 6) % 7));

const KINDS = { 'primary text': 'PRIMARY TEXT', primary: 'PRIMARY TEXT', commentary: 'COMMENTARY', recording: 'RECORDING' };
const rid = (r, i) => s(r.reading_id) || 'r' + crypto.createHash('sha1').update([plain(r.season), s(r.week), plain(r.title), i].join('|')).digest('hex').slice(0, 12);

export const readingsOf = (rows, season) => (rows || []).filter(r => shown(r) && plain(r.season) === plain(season) && s(r.title)).map((r, i) => ({
  id: rid(r, i), week: Number(r.week) || null, weekStart: DAY.test(s(r.week_start)) ? s(r.week_start) : '', kind: KINDS[plain(r.kind)] || s(r.kind).toUpperCase() || 'READING',
  title: s(r.title), meta: s(r.meta), url: https(r.url), action: /^listen$/i.test(s(r.action)) ? 'Listen' : 'Read', prompt: s(r.prompt),
}));

// The week for a member: the latest week_start on or before this Monday (their own "today"), else the week number given.
// → { week, readings[], prompt } | null
export function weekPlan(rows, season, today, weekNo) {
  const all = readingsOf(rows, season);
  if (!all.length) return null;
  const mon = mondayOf(today), starts = [...new Set(all.map(r => r.weekStart).filter(Boolean))].sort();
  const start = starts.filter(d => d <= mon).pop();
  const mine = start ? all.filter(r => r.weekStart === start) : all.filter(r => r.week === weekNo);
  if (!mine.length) return null;
  return { week: mine[0].week || weekNo, readings: mine.map(({ prompt, weekStart, week, ...r }) => r), prompt: mine.map(r => r.prompt).find(Boolean) || '' };
}
