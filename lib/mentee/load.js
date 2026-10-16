// Gathers everything the "This week" page needs. Each source is read on its own, so one being down (Circle busy,
// the sheet slow) leaves a note in `unavailable` and the rest of the page still works. Member data is never cached;
// Circle reads are cached 5 minutes per member (lib/school/circle.js) and the sheet tabs 5 minutes (lib/google.js).
import { cookies } from 'next/headers';
import { readSession } from '../member/session';
import { COOKIE } from '../school/session';
import { tierFor } from '../member/tier';
import { practiceAvailable, practiceSummary, practiceDayCount, cleanToday } from '../member/practice';
import { formationAvailable, formationFor } from '../member/formation';
import { buildSchedule } from '../member/schedule';
import { getEvents, todayET } from '../events';
import { headlessConfigured, eventList, spacePosts } from '../school/circle';
import { findSeason } from '../school/config';
import config from '@/data/mentee.json';
import { readTab, TABS, readingFor, assignmentsFor, feedbackFor, launchesFor } from './content';
import { menteeAvailable, doneIds, recentLines } from './store';
import { buildWeek, sessionsFrom, validZone, weekNumber } from './week';

// The signed-in mentee from our own cookie (issued after a verified Circle sign-in, lib/school/session.js), or a reason.
export async function menteeFromCookie() {
  const s = readSession((await cookies()).get(COOKIE)?.value);
  if (!s?.email || !s.uid) return { error: 'signin' };
  if (s.admin) return { me: { uid: s.uid, email: s.email, firstName: s.firstName || '', admin: true } };
  const t = await tierFor(s.email).catch(() => null);
  return t?.tier === 'mentee' ? { me: { uid: s.uid, email: s.email, firstName: s.firstName || '', admin: false } } : { error: 'tier' };
}

const settle = async (name, unavailable, fn, fallback) => { try { return await fn(); } catch (e) { console.error(`This week: ${name}`, e.message); unavailable.push(name); return fallback; } };

export async function loadWeek(me, { today: askedToday, tz: askedTz } = {}) {
  const season = findSeason(config.programme, config.season);
  if (!season) return { ok: false, error: 'This season isn’t set up yet.' };
  const today = cleanToday(askedToday || todayET());
  const tz = validZone(askedTz) ? askedTz : 'America/New_York';
  const unavailable = [];
  const week = weekNumber(season.starts_on, today);

  const [practice, practiceDays, formation, done, travelogue, rawEvents, posts, readingRows, assignmentRows, feedbackRows, launchRows, sheetEvents] = await Promise.all([
    settle('practice', unavailable, () => practiceAvailable() ? practiceSummary(me.uid, today) : Promise.reject(new Error('off')), null),
    settle('practice', unavailable, () => practiceAvailable() ? practiceDayCount(me.uid) : Promise.reject(new Error('off')), 0),
    settle('hours', unavailable, () => formationAvailable() ? formationFor(me.email) : Promise.reject(new Error('off')), null),
    settle('ticks', unavailable, () => menteeAvailable() ? doneIds(me.uid) : Promise.reject(new Error('off')), new Set()),
    settle('travelogue', unavailable, () => menteeAvailable() ? recentLines(me.uid) : Promise.reject(new Error('off')), []),
    settle('sessions', unavailable, () => headlessConfigured() ? eventList(me.email) : Promise.reject(new Error('off')), []),
    settle('threads', unavailable, () => headlessConfigured() && config.mentorship_circle_space_id ? spacePosts(me.email, config.mentorship_circle_space_id) : [], []),
    settle('reading', unavailable, () => readTab(TABS.readings), []),
    settle('assignments', unavailable, () => readTab(TABS.assignments), []),
    settle('feedback', unavailable, () => readTab(TABS.feedback), []),
    settle('launches', unavailable, () => readTab(TABS.launches), []),
    settle('calendar', unavailable, () => getEvents(), []),
  ]);

  const emptyPractice = { today, streak: 0, loggedToday: false, weekCount: 0, nextMilestone: 7, reached: null, grid: Array.from({ length: 8 }, () => Array.from({ length: 7 }, () => ({ state: 'future' }))) };
  const reading = readingFor(readingRows, season.slug, week);
  return buildWeek({
    today, tz, season, firstName: me.firstName, weeks: null,
    practice: practice || emptyPractice, practiceDays: practiceDays || 0, formation,
    sessions: sessionsFrom(rawEvents, [season.event_space_id, config.mentorship_sessions_space_id]),
    schedule: buildSchedule(sheetEvents, 'mentee', today),
    assignments: assignmentsFor(assignmentRows, season.slug, week), doneIds: done,
    reading, workbookUrl: reading?.workbookUrl || config.workbook_url,
    posts, feedback: feedbackFor(feedbackRows, me.email), launches: launchesFor(launchRows, today),
    travelogue, circleUrl: config.mentorship_circle_url, messageUrl: config.message_url,
    unavailable: [...new Set(unavailable)],
  });
}
