// The great observances shown on Today ("Sacred days ahead"): the next few from today, with a countdown.
import data from '../../data/sacred-days.json';
import { readSiteTab } from './sitetab';

export function sacredAhead(today, n = 4, days = data.days) {
  const t0 = new Date(today + 'T00:00:00Z');
  return (days || []).filter(d => d.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, n).map(d => ({
    date: d.date, name: d.name, note: d.note || '', region: d.region || data.region || '',
    inDays: Math.round((new Date(d.date + 'T00:00:00Z') - t0) / 86400000),
  }));
}

// The observances staff keep in the "Site Sacred Days" tab (Ops → Settings → Today: sacred days); the shipped file is the fallback.
export const loadSacredDays = () => readSiteTab('Site Sacred Days', { cols: 'A1:F300', valid: r => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.name, fallback: data.days });
export async function sacredAheadNow(today, n = 4) { return sacredAhead(today, n, await loadSacredDays()); }
