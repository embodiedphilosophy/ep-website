// The Schedule view of the mentee page (/c/mentorship?view=schedule): every immersion (Saturday Open Session + Sunday Practicum), the one-to-one windows
// and the retreat, in order. Practicum pods come from /api/member/practicum on the page itself. Pure (no network): scripts/member-test/mentee-schedule.mjs.
// Times come from the Circle events in the mentorship sessions space (the page shows them in the mentee's own zone); where an event isn't in Circle yet,
// the events sheet's row for that day (buildSchedule) stands in. Nothing is hard-coded.
import { normEvent } from '../school/tabs';
import { etDay } from './recordings';
import { PREPARE_LEAD } from './home';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (s, n) => new Date(Date.parse(`${s}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const zoomUrl = u => (/^https:\/\/[^\s]+$/.test(String(u || '').trim()) ? String(u).trim() : ''); // the Zoom links pasted into Ops → Mentee year
const ms = iso => (iso ? new Date(iso).getTime() : NaN);

export function menteeSchedule({ config, today, events, sheet = [], workbook = {}, now = Date.now() }) {
  const spaces = new Set([config.mentorship_sessions_space_id].filter(Boolean).map(String));
  const seen = new Set();
  const evs = (events || []).map(normEvent).filter(e => !seen.has(e.id) && seen.add(e.id) && spaces.has(e.spaceId) && !Number.isNaN(ms(e.start)));
  const sessionOn = (day, practicum) => {
    const e = evs.find(x => etDay(x.start) === day && /practicum/i.test(x.title) === practicum) || evs.find(x => etDay(x.start) === day);
    if (e) return { id: e.id, start: e.start, end: e.end || '', url: e.pageUrl || e.url || '', rsvped: !!e.rsvped, fromCircle: true };
    const s = (sheet || []).find(x => x.date === day && x.start && /open session|practicum|immersion/i.test(x.title || ''));
    return s ? { id: '', start: s.start, end: s.end || '', url: '', rsvped: false, fromCircle: false } : null;
  };
  const immersions = (config.immersions || []).filter(i => DAY.test(i.sat || '') && DAY.test(i.sun || '')).sort((a, b) => a.sat.localeCompare(b.sat)).map(i => {
    const opens = addDays(i.sat, -PREPARE_LEAD), pre = (workbook.immersions || {})[String(i.n)]?.prepare || {};
    const open = sessionOn(i.sat, false), prac = sessionOn(i.sun, true);
    return { n: i.n, title: i.title, sat: i.sat, sun: i.sun, past: i.sun < today, satZoom: zoomUrl(i.sat_link), sunZoom: zoomUrl(i.sun_link),
      prepare: { opens, open: today >= opens, url: pre.url || '', done: !!pre.done },
      openSession: open && { ...open, today: etDay(new Date(now).toISOString()) === i.sat }, practicum: prac };
  });
  const windows = (config.windows || []).filter(w => DAY.test(w.from || '') && DAY.test(w.to || '') && w.to >= today).map(w => ({ from: w.from, to: w.to, open: today >= addDays(w.from, -21) }));
  const retreat = (sheet || []).filter(x => /retreat/i.test(x.title || '') && DAY.test(x.date || '') && (x.end_date || x.date) >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  return { today, immersions, windows, retreat: retreat ? { title: retreat.title, date: retreat.date, end: retreat.end_date || retreat.date } : null };
}
