// The free layer of the Today page: the same for every member, whatever they have bought, and the free tier of the
// practice app. Practice summary, the teaching, the moon and tithi, the sacred days, and how many sat today.
// Each part stands alone: if one is unavailable the others still come back.
import { practiceAvailable, practiceSummary, practisingOn, cleanToday, QUALITIES, EXTRAS } from './practice';
import { currentTeaching } from './teaching';
import { sacredAheadNow } from './sacred';
import { moonWeek, placeFor, validZone } from './moon';

// Optional exact location from the browser: rounded to about 11 km, used for this answer only, never stored.
export function cleanPlace(tz, lat, lon) {
  const la = Number(lat), lo = Number(lon);
  const exact = Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 66 && Math.abs(lo) <= 180 && lat !== '' && lon !== '' && lat != null && lon != null;
  const base = placeFor(validZone(tz) ? tz : '');
  return exact ? { zone: base.zone, lat: Math.round(la * 10) / 10, lon: Math.round(lo * 10) / 10 } : base;
}

export async function freeToday({ uid, today: rawToday, tz, lat, lon }) {
  const today = cleanToday(rawToday);
  const place = cleanPlace(tz, lat, lon);
  const [teaching, sacred] = await Promise.all([currentTeaching(today).catch(() => null), sacredAheadNow(today).catch(() => [])]);
  const out = { today, teaching, moon: moonWeek(today, place), sacred, practice: null, practisingToday: null };
  if (practiceAvailable()) {
    try { out.practice = { ...(await practiceSummary(uid, today)), qualities: QUALITIES, extras: EXTRAS }; } catch { /* leave null */ }
    try { out.practisingToday = await practisingOn(today); } catch { /* leave null */ }
  }
  return out;
}

// The whole page: the free layer plus the member's enrolment. tier is the membership tier name (an admin may preview
// another). Each part stands alone, like the free layer.
import { getEvents } from '../events';
import { comingUp, openCards, programmesFor, lockedCard } from './programmes';
import { memberSummary, ceReady } from '../ce/service';
import { formationAvailable, formationFor } from './formation';
import config from '@/data/mentee.json';
import { findSeason } from '../school/config';
import { readTab, TABS, assignmentsFor } from '../mentee/content';
import { menteeAvailable, doneIds } from '../mentee/store';
import { weekNumber } from '../mentee/week';

// How many of this week's Sahṛdaya Upāya assignments a mentee hasn't ticked yet (the same list and ticks as "This week")
export async function dueThisWeek(uid, today) {
  const season = findSeason(config.programme, config.season);
  if (!season || !menteeAvailable()) return null;
  const week = weekNumber(season.starts_on, today);
  const [rows, done] = await Promise.all([readTab(TABS.assignments), doneIds(uid)]);
  return assignmentsFor(rows, season.slug, week).filter(a => !done.has(a.id)).length;
}

export async function memberToday({ uid, email, tier, today, tz, lat, lon }) {
  const free = await freeToday({ uid, today, tz, lat, lon });
  const events = await getEvents().catch(() => []);
  const ce = tier === 'wisdom_plus' && ceReady() ? await memberSummary(email, { tier, wisdomPlus: true }, free.today).catch(() => null) : null;
  const formation = tier === 'mentee' && formationAvailable() ? await formationFor(email).catch(() => null) : null;
  const due = tier === 'mentee' ? await dueThisWeek(uid, free.today).catch(() => null) : null;
  const { locked } = programmesFor(tier);
  return { ...free, tier, cards: openCards({ events, tier, today: free.today, ce, formation, due }), locked: locked.map(lockedCard), comingUp: comingUp(events, tier, free.today) };
}
