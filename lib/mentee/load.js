// Gathers everything the "This week" page needs. Each source is read on its own, so one being down (Circle busy,
// the sheet slow) leaves a note in `unavailable` and the rest of the page still works. Member data is never cached;
// Circle reads are cached 5 minutes per member (lib/school/circle.js) and the sheet tabs 5 minutes (lib/google.js).
import { cookies } from 'next/headers';
import { readSession } from '../member/session';
import { COOKIE } from '../school/session';
import { tierFor } from '../member/tier';
import { practiceAvailable, practiceSummary, practiceDayCount, cleanToday } from '../member/practice';
import { formationAvailable, formationFor, withAuto } from '../member/formation';
import { buildSchedule } from '../member/schedule';
import { getEvents, todayET } from '../events';
import { headlessConfigured, weekEvents, spacePosts, myMemberId, chatMessages, courseSections } from '../school/circle';
import { findSeason } from '../school/config';
import config from '@/data/mentee.json';
import { readTab, TABS, readingFor, assignmentsFor, feedbackFor, launchesFor, partnerFor } from './content';
import { buildHome, reflectionRows, workbookFor } from './home';
import { filesConfigured } from './filelink';
import { openSlots, bookedFor } from './calendly';
import { windowFor } from './home';
import { menteeAvailable, doneIds, recentLines, submissionsFor, votesFor } from './store';
import { pollsFrom } from './polls';
import { booksFrom } from './books';
import { buildWeek, sessionsFrom, validZone, weekNumber } from './week';

// The signed-in mentee from our own cookie (issued after a verified Circle sign-in, lib/school/session.js), or a reason.
export async function menteeFromCookie() {
  const s = readSession((await cookies()).get(COOKIE)?.value);
  if (!s?.email || !s.uid) return { error: 'signin' };
  if (s.admin) return { me: { uid: s.uid, email: s.email, firstName: s.firstName || '', admin: true } };
  const t = await tierFor(s.email).catch(() => null);
  return t?.tier === 'mentee' ? { me: { uid: s.uid, email: s.email, firstName: s.firstName || '', admin: false } } : { error: 'tier' };
}

// Each source is timed (ms, shown in the page's debug badge) and abandoned after 12 seconds so one slow service can't hold the page up
const settle = async (name, unavailable, fn, fallback) => {
  const t0 = Date.now();
  try { return await Promise.race([fn(), new Promise((_, no) => setTimeout(() => no(new Error('timed out')), 12000))]); }
  catch (e) { console.error(`This week: ${name}`, e.message); unavailable.push(name); return fallback; }
  finally { const t = (unavailable.timing ||= {}); t[name] = Math.max(t[name] || 0, Date.now() - t0); }
};

export async function loadWeek(me, { today: askedToday, tz: askedTz, fast = false } = {}) {
  const season = findSeason(config.programme, config.season);
  if (!season) return { ok: false, error: 'This season isn’t set up yet.' };
  const today = cleanToday(askedToday || todayET());
  const tz = validZone(askedTz) ? askedTz : 'America/New_York';
  const unavailable = [];
  const week = weekNumber(season.starts_on, today);

  const [practice, practiceDays, formation, done, travelogue, rawEvents, posts, readingRows, assignmentRows, feedbackRows, launchRows, sheetEvents, partnerRows, submissions, slots, chat, booked, pollRows, votes, bookRows, sections] = await Promise.all([
    settle('practice', unavailable, () => practiceAvailable() ? practiceSummary(me.uid, today) : Promise.reject(new Error('off')), null),
    settle('practice', unavailable, () => practiceAvailable() ? practiceDayCount(me.uid) : Promise.reject(new Error('off')), 0),
    settle('hours', unavailable, () => formationAvailable() ? formationFor(me.email) : Promise.reject(new Error('off')), null),
    settle('ticks', unavailable, () => menteeAvailable() ? doneIds(me.uid) : Promise.reject(new Error('off')), new Set()),
    settle('travelogue', unavailable, () => menteeAvailable() ? recentLines(me.uid) : Promise.reject(new Error('off')), []),
    fast ? [] : settle('sessions', unavailable, () => headlessConfigured() ? weekEvents(me.email) : Promise.reject(new Error('off')), []),
    fast ? [] : settle('threads', unavailable, () => headlessConfigured() && config.mentorship_circle_space_id ? spacePosts(me.email, config.mentorship_circle_space_id) : [], []),
    settle('reading', unavailable, () => readTab(TABS.readings), []),
    settle('assignments', unavailable, () => readTab(TABS.assignments), []),
    settle('feedback', unavailable, () => readTab(TABS.feedback), []),
    settle('launches', unavailable, () => readTab(TABS.launches), []),
    fast ? [] : settle('calendar', unavailable, () => getEvents(), []),
    settle('partner', unavailable, () => readTab(TABS.partners), []),
    settle('handins', unavailable, () => menteeAvailable() ? submissionsFor(me.uid) : Promise.reject(new Error('off')), {}),
    fast ? [] : settle('times', unavailable, () => { const w = windowFor(config.windows, today); return w ? openSlots(config.calendly_event_type, w.from, w.to) : []; }, []),
    fast ? [] : settle('chat', unavailable, () => headlessConfigured() && config.chat_room_uuid ? chatMessages(me.email, config.chat_room_uuid) : [], []),
    fast ? null : settle('booking', unavailable, () => bookedFor(config.calendly_event_type, me.email), null),
    settle('polls', unavailable, () => readTab(TABS.polls), []),
    settle('votes', unavailable, () => menteeAvailable() ? votesFor(me.uid) : Promise.reject(new Error('off')), {}),
    settle('books', unavailable, () => readTab(TABS.books), []),
    fast ? [] : settle('workbook', unavailable, () => headlessConfigured() && config.workbook_space_id ? courseSections(me.email, config.workbook_space_id) : [], []),
  ]);

  // Reflections posted in the Mentorship Circle count toward "Monthly reflections" (only on the full answer, which reads the posts)
  const myId = !fast && posts.length ? await myMemberId(me.email).catch(() => null) : null;
  const formationAll = withAuto(formation, reflectionRows(posts, myId, season.starts_on));

  const emptyPractice = { today, streak: 0, loggedToday: false, weekCount: 0, nextMilestone: 7, reached: null, grid: Array.from({ length: 8 }, () => Array.from({ length: 7 }, () => ({ state: 'future' }))) };
  const reading = readingFor(readingRows, season.slug, week);
  const week_ = buildWeek({
    today, tz, season, firstName: me.firstName, weeks: null,
    practice: practice || emptyPractice, practiceDays: practiceDays || 0, formation: formationAll,
    sessions: sessionsFrom(rawEvents, [season.event_space_id, config.mentorship_sessions_space_id]),
    schedule: buildSchedule(sheetEvents, 'mentee', today),
    assignments: assignmentsFor(assignmentRows, season.slug, week), doneIds: done, submissions,
    reading, workbookUrl: reading?.workbookUrl || config.workbook_url,
    posts, feedback: feedbackFor(feedbackRows, me.email), launches: launchesFor(launchRows, today),
    travelogue, circleUrl: config.mentorship_circle_url, messageUrl: config.message_url,
    unavailable: [...new Set(unavailable)], pending: fast, timing: { ...(unavailable.timing || {}) },
  });
  // The Sahṛdaya Upāya page (/c/mentorship) adds what is unique to mentees on top of the same week object
  return buildHome(week_, { config, today, tz, slots, booked, chat, polls: pollsFrom(pollRows, votes), books: booksFrom(bookRows, today), workbook: workbookFor(sections, config.workbook_url), uid: me.uid, filesOn: filesConfigured(), partner: partnerFor(partnerRows, me.email, season.slug, today) });
}
