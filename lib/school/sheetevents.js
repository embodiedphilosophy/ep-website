// The calendar sheet (edited in Ops) is the source of truth for what a live session is called and who teaches it.
// Circle events are read for everything else (time, links, RSVPs, replays), but their name and host can lag behind:
// an event made by hand in Circle keeps its old name, and its "host" is whoever made it, not the teacher.
// sheetOverlay() marks each Circle event with the sheet's title and teachers, so normEvent (lib/school/tabs.js) shows those.
//
// Which sheet row is a Circle event's:
//   1. the row whose "Circle Event" cell holds the event's link (set by the Ops Circle sync), else
//   2. the one row that starts at exactly the same moment (its date and time, Eastern). Two rows at the same moment → no match.
// Title: only a row with its own session title (one not repeated across its series, so "Meditation Mondays" or
// "The Heart of Recognition" keep Circle's per-session names). Teacher: the row's Teachers column, when filled.
// Read only, and best effort: if the sheet can't be read, the Circle events are returned unchanged.
import { calendarConfigured, loadCalendar } from '../calendar';
import { to24h, TZ } from '../when';

const linksOf = v => String(v || '').split(/\s+/).filter(u => /^https:\/\//.test(u));
const clean = u => String(u || '').replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();

function etOffset(ms) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return Math.round((Date.UTC(+p.year, p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(ms / 60000) * 60000) / 60000);
}
// "2026-11-03", "6pm ET" → the instant in ms
export function etToMs(date, time) {
  const [h, m] = to24h(time).split(':').map(Number), [Y, M, D] = date.split('-').map(Number);
  const wall = Date.UTC(Y, M - 1, D, h, m);
  let t = wall - etOffset(wall) * 60000;
  return wall - etOffset(t) * 60000;
}
const addDay = d => new Date(Date.parse(`${d}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
const daysOf = ev => { const out = [], end = ev.end_date && ev.end_date > ev.date ? ev.end_date : ev.date; for (let d = ev.date; d <= end && out.length < 31; d = addDay(d)) out.push(d); return out; };
const startOf = e => e.event_setting_attributes?.starts_at || e.starts_at || e.start_time || e.event_setting?.starting_at || e.start;

// What the sheet says about each session: { byUrl, byMs } → { title, teacher }
export function sheetIndex(cal) {
  const bySeries = {};
  for (const ev of cal) if (ev.series) (bySeries[ev.series] ||= []).push(ev.title);
  const byUrl = new Map(), byMs = new Map();
  for (const ev of cal) {
    const days = daysOf(ev);
    const ownTitle = !!ev.public_title && days.length === 1 && !(ev.series && bySeries[ev.series].filter(t => t === ev.title).length > 1);
    const info = { id: ev.sched_id || ev.id, title: ownTitle ? ev.title : '', teacher: String(ev.teachers || '').trim() };
    if (!info.title && !info.teacher) continue;
    for (const u of linksOf(ev.circle_event)) byUrl.set(clean(u), info);
    if (ev.time) for (const d of days) { const ms = etToMs(d, ev.time); byMs.set(ms, byMs.has(ms) ? null : info); }
  }
  return { byUrl, byMs };
}

export function applyIndex(events, idx) {
  return (events || []).map(e => {
    if (!e || typeof e !== 'object') return e;
    const urls = [e.url, e.post_url, e.public_url, e.post?.url].filter(Boolean).map(clean);
    let hit = urls.map(u => idx.byUrl.get(u)).find(Boolean);
    if (!hit) { const ms = Date.parse(startOf(e) || ''); if (ms) hit = idx.byMs.get(ms) || null; }
    return hit ? { ...e, _sheet: hit } : e;
  });
}

export async function sheetOverlay(events) {
  if (!calendarConfigured() || !events?.length) return events;
  try { return applyIndex(events, sheetIndex(await loadCalendar())); }
  catch (e) { console.error('Sheet overlay skipped', e.message); return events; }
}
