import { readTab, published } from './sheet';
import { eventRows, todayET } from './events';
import fallback from '@/data/seasons.json';

const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

// Seasons (e.g. Sādhana School terms) from the Seasons tab, with session dates from the calendar
// when it has them (rows like "Sādhana School — Fall 2026 wk 3"), otherwise weekly from start to end.
export async function getSeasons(program = 'sadhana') {
  const rows = ((await readTab('seasons')) || fallback).filter(r => r.key && r.program === program && published(r));
  const events = await eventRows().catch(() => []);
  const today = todayET();
  const seasons = rows.map(r => {
    let sessions = events.filter(e => String(e.internal_title || e.title || '').includes(r.key) && (e.track === 'SS' || e.program === program))
      .map(e => e.date).sort();
    if (!sessions.length && r.start_date && r.end_date && /week|weekly|wednesday|monday|tuesday|thursday|friday/i.test(r.meeting + r.format)) {
      for (let d = r.start_date; d <= r.end_date; d = addDays(d, 7)) sessions.push(d);
    }
    const start = sessions[0] || r.start_date, end = sessions[sessions.length - 1] || r.end_date;
    let status = 'upcoming', week = 0;
    if (start && today >= start && today <= end) { status = 'live'; week = sessions.filter(d => d <= today).length || 1; }
    else if (end && today > end) status = 'done';
    return { ...r, sessions, start, end, status, week, total: sessions.length };
  }).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  const next = seasons.find(s => s.status === 'upcoming');
  return { seasons, current: seasons.find(s => s.status === 'live'), next, featured: next || seasons.find(s => s.status === 'live') || seasons[seasons.length - 1] };
}
