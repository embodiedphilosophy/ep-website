import { readTab, published } from './sheet';
import fallback from '@/data/themes.json';

// Annual Wisdom School themes from the "Annual Themes" tab. The current year is chosen by date,
// so the feature moves on by itself on January 1.
export async function getThemes() {
  const rows = ((await readTab('themes')) || fallback).filter(r => r.year && r.title && published(r));
  // THEME_YEAR (optional Vercel setting) previews another year, e.g. 2027, before January 1
  const year = Number(process.env.THEME_YEAR) || Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }).format(new Date()));
  const themes = rows.map(r => ({
    ...r, year: Number(r.year),
    months: String(r.months || '').split(';').map(m => m.split('|').map(x => x.trim())).filter(m => m[0] && m[1])
      .map(([month, title, question]) => ({ month, title, question: question || '' })),
  })).sort((a, b) => a.year - b.year);
  const current = themes.find(t => t.year === year) || [...themes].reverse().find(t => t.year < year) || themes[0];
  return { themes, current: current?.year, year };
}
