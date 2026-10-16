// Season records for the season spaces (/school/[programme]/[season]). Each season is one row in
// data/school-seasons.json: which Circle spaces belong together, and the topic ids inside the post space.
// Space and topic ids are copied in once per season from Circle (Admin API or the admin URL bar).
import seasons from '@/data/school-seasons.json';

export const PROGRAMMES = {
  'sadhana-school': { title: 'Sādhana School' },
};

export const allSeasons = () => [...seasons].sort((a, b) => a.order - b.order);
export const programmeSeasons = programme => allSeasons().filter(s => s.programme === programme);
export const findSeason = (programme, slug) => allSeasons().find(s => s.programme === programme && s.slug === slug) || null;

// A season whose Circle spaces haven't been copied in yet
export const isWired = s => !!(s.hub_space_id && s.event_space_id);

// 'now' | 'upcoming' | 'past' by calendar day, New York time
export const nyDay = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
export function seasonState(s, today = nyDay()) {
  if (today < s.starts_on) return 'upcoming';
  if (today > s.ends_on) return 'past';
  return 'now';
}

// The season to open when someone lands on the programme: the one running now, else the next, else the last
export function defaultSeason(list, today = nyDay()) {
  return list.find(s => seasonState(s, today) === 'now') || list.find(s => seasonState(s, today) === 'upcoming') || list[list.length - 1] || null;
}
