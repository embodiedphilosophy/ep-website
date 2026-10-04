import placeholder from '@/data/events.json';
import { readTab } from './sheet';
import { calendarConfigured, loadCalendar } from './calendar';

// Programs: lrl | wisdom | sadhana | seasonal
// Sheet columns (header row, any order):
// id, title, date (YYYY-MM-DD), end_date, time (display text, e.g. "7pm ET"), program,
// price (Free | Pay what you can | By donation | Members | Enrolled | Enroll | $79),
// host, note, registration_url, series, publish (TRUE/FALSE)

// "Today" in US Eastern time, as YYYY-MM-DD
export function todayET() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const iso = d => d.toISOString().slice(0, 10);

// Expand the Recurring tab (e.g. Meditation Mondays) into dated events for the next 10 weeks
export async function recurringRules() {
  if (calendarConfigured()) return []; // weekly series live in the Master Schedule
  return ((await readTab('recurring')) || []).filter(r => r.title && String(r.publish).toUpperCase() !== 'FALSE');
}

async function recurringRows() {
  const rules = (await readTab('recurring')) || [];
  const today = todayET();
  const out = [];
  for (const r of rules) {
    if (!r.title || String(r.publish).toUpperCase() === 'FALSE') continue;
    const dow = DAYS.indexOf(String(r.weekday || '').trim().toLowerCase());
    if (dow < 0) continue;
    const skip = new Set(String(r.skip_dates || '').split(',').map(x => x.trim()).filter(Boolean));
    const d = new Date(today + 'T12:00:00Z');
    while (d.getUTCDay() !== dow) d.setUTCDate(d.getUTCDate() + 1);
    for (let i = 0; i < 10; i++, d.setUTCDate(d.getUTCDate() + 7)) {
      const date = iso(d);
      if ((r.start_date && date < r.start_date) || (r.end_date && date > r.end_date) || skip.has(date)) continue;
      out.push({ ...r, id: `${r.series || r.title}-${date}`, date, end_date: '', publish: 'TRUE' });
    }
  }
  return out;
}

// Every event (website or not). From the Master Schedule when it's connected; otherwise the EP Website sheet.
export async function eventRows() {
  if (calendarConfigured()) {
    try { return await loadCalendar(); } catch (e) { console.error('Calendar read failed, using EP Website sheet', e.message); }
  }
  return ((await readTab('events')) || placeholder).filter(e => e.title && e.date && String(e.publish).toUpperCase() !== 'FALSE');
}

export async function loadRows() {
  if (calendarConfigured()) {
    try { return (await loadCalendar()).filter(e => e.website); } catch (e) { console.error('Calendar read failed, using EP Website sheet', e.message); }
  }
  const rows = [...((await readTab('events')) || placeholder), ...(await recurringRows())];
  return rows.filter(e => e.title && e.date && String(e.publish).toUpperCase() !== 'FALSE');
}

// Upcoming and ongoing events, soonest first
export async function getEvents() {
  const today = todayET();
  return (await loadRows())
    .filter(e => (e.end_date || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Past events, most recent first
export async function getPastEvents() {
  const today = todayET();
  return (await loadRows())
    .filter(e => (e.end_date || e.date) < today)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const isFree = e => ['free', 'pay what you can', 'by donation'].includes(String(e.price).toLowerCase());
