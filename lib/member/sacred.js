// The great observances shown on Today ("Sacred days ahead"): the next few from today, with a countdown.
import data from '../../data/sacred-days.json';

export function sacredAhead(today, n = 4, days = data.days) {
  const t0 = new Date(today + 'T00:00:00Z');
  return (days || []).filter(d => d.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, n).map(d => ({
    date: d.date, name: d.name, note: d.note || '', region: d.region || data.region || '',
    inDays: Math.round((new Date(d.date + 'T00:00:00Z') - t0) / 86400000),
  }));
}
