import placeholder from '@/data/events.json';
import { readTab } from './sheet';

// Programs: lrl | wisdom | sadhana | seasonal
// Sheet columns (header row, any order):
// id, title, date (YYYY-MM-DD), end_date, time (display text, e.g. "7pm ET"), program,
// price (Free | Pay what you can | By donation | Members | Enrolled | Enroll | $79),
// host, note, registration_url, series, publish (TRUE/FALSE)

// "Today" in US Eastern time, as YYYY-MM-DD
export function todayET() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

async function loadRows() {
  const rows = (await readTab('events')) || placeholder;
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
