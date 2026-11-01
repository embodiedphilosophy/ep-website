// Gathers everything the "This week" page needs. Each source is read on its own, so one being down (Circle busy,
// the sheet slow) leaves a note in `unavailable` and the rest of the page still works. Member data is never cached;
// Circle reads are cached 5 minutes per member (lib/school/circle.js) and the sheet tabs 5 minutes (lib/google.js).
import { cookies } from 'next/headers';
import { readSession } from '../member/session';
import { COOKIE } from '../school/session';
import { tierFor } from '../member/tier';
import { practiceAvailable, practiceSummary, practiceDayCount, cleanToday } from '../member/practice';
import { formationAvailable, formationFor, withAuto, awaitingCosign } from '../member/formation';
import { buildSchedule } from '../member/schedule';
import { getEvents, todayET } from '../events';
import { headlessConfigured, weekEvents, spacePosts, chatMessages, courseSections, questionPosts, spaceIdBySlug } from '../school/circle';
import { findSeason } from '../school/config';
import config from '@/data/mentee.json';
import { readTab, TABS, readingFor, assignmentsFor, feedbackFor, launchesFor, partnerFor, profilesFrom, cohortFrom, nameFrom } from './content';
import { buildHome, workbookFor, rotationFor } from './home';
import { reflectionRows, monthOf } from './reflections';
import { reflectionsAvailable, summaryFor } from './reflectionstore';
import { filesConfigured } from './filelink';
import { openSlots, bookedFor } from './calendly';
import { windowFor } from './home';
import { menteeAvailable, doneIds, recentLines, submissionsFor, votesFor, cueBank, bookingNotes } from './store';
import { pollsFrom } from './polls';
import { booksFrom } from './books';
import { buildWeek, sessionsFrom, validZone, weekNumber } from './week';
import { buildYear } from './year';
import { statusRows } from './yearstore';

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

// The "Questions for the Group" space: its id if set in data/mentee.json, else found by its address (mentee-questions) among the member's spaces
export async function questionsSpace(email) {
  if (!headlessConfigured()) return null;
  return config.questions_space_id || (await spaceIdBySlug(email, config.questions_space_slug)) || null;
}

export async function loadWeek(me, { today: askedToday, tz: askedTz, fast = false } = {}) {
  const season = findSeason(config.programme, config.season);
  if (!season) return { ok: false, error: 'This season isn’t set up yet.' };
  const today = cleanToday(askedToday || todayET());
  const tz = validZone(askedTz) ? askedTz : 'America/New_York';
  const unavailable = [];
  const week = weekNumber(season.starts_on, today);

  // The project steps, months and this mentee's ticks (three tabs; a missing Schedule or Months tab falls back to data/mentee-year.json)
  const yearP = Promise.all([
    settle('project steps', unavailable, () => readTab(TABS.schedule), []),
    settle('this month', unavailable, () => readTab(TABS.months), []),
    settle('your ticks', unavailable, () => statusRows({ strict: true }), null),
  ]);
  const [practice, practiceDays, formation, done, travelogue, rawEvents, posts, readingRows, assignmentRows, feedbackRows, launchRows, sheetEvents, partnerRows, submissions, slots, chat, booked, pollRows, votes, bookRows, sections, profileRows, cues, cosignRows, questions, reflections] = await Promise.all([
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
    settle('profiles', unavailable, () => readTab(TABS.profiles), []),
    settle('cues', unavailable, () => menteeAvailable() ? cueBank() : Promise.reject(new Error('off')), []),
    settle('cosign', unavailable, () => formationAvailable() ? awaitingCosign(me.email) : Promise.reject(new Error('off')), []),
    settle('questions', unavailable, async () => { const id = await questionsSpace(me.email); return id ? { id, posts: await questionPosts(me.email, id) } : { id: null, posts: [] }; }, { id: null, posts: [] }),
    settle('reflections', unavailable, () => reflectionsAvailable() ? summaryFor({ email: me.email, name: me.firstName }, monthOf(today)) : Promise.reject(new Error('off')), { mine: null, unread: 0, posted: [] }),
  ]);

  // Reflections count toward the 9 once they are posted to Sādhana School (from the Reflections page, never stored as hours)
  const formationAll = withAuto(formation, reflectionRows(reflections.posted, season.starts_on));

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
  const [schedRows, monthRows, tickRows] = await yearP;
  // What the mentee wrote for Jacob when they booked: their own summary from the Step Status tab, Calendly's answer, or an older note
  let bookedView = booked, legacyNote = '';
  if (booked) {
    const note = !booked.answers?.length && menteeAvailable() ? (await bookingNotes([{ email: me.email, uuid: booked.uuid }]).catch(() => ({})))[`${me.email.toLowerCase()}|${booked.uuid}`] || '' : '';
    legacyNote = note;
    bookedView = { start: booked.start, url: booked.url, summary: booked.answers?.length ? booked.answers : note ? [{ q: 'What you sent', a: note }] : [] };
  }
  const year = buildYear({ scheduleRows: schedRows, monthRows, statusRows: tickRows || [], email: me.email, today, booked: booked ? { start: booked.start, summary: booked.answers || [] } : null, legacyNote });
  year.ticksOk = tickRows !== null;
  if (year.oneToOne.summary && bookedView) bookedView = { ...bookedView, summary: [{ q: year.oneToOne.summary.source === 'calendly' ? 'What you wrote' : 'What you sent', a: year.oneToOne.summary.text }] };
  // This rotation's partner(s): a rotation row matches both of its months; cities come from the Mentee Profiles tab
  const partner = partnerFor(partnerRows, me.email, season.slug, today, { rotation: rotationFor(config.rotations, today)?.n, profiles: profilesFrom(profileRows) });
  // The Sahṛdaya Upāya page (/c/mentorship) adds what is unique to mentees on top of the same week object
  return buildHome(week_, { start: (profilesFrom(profileRows)[me.email.toLowerCase()] || {}).start || '', year, config, today, tz, slots, booked: bookedView, chat, questions: questions.posts, questionsSpaceId: questions.id, reflections, polls: pollsFrom(pollRows, votes), books: booksFrom(bookRows, today), workbook: workbookFor(sections, config.workbook_url), uid: me.uid, filesOn: filesConfigured(), partner, cosign: cosignRows.map(c => ({ id: c.id, who: nameFrom(partnerRows, c.by).split(' ')[0], day: c.day, hours: c.hours, detail: c.detail })), cohort: cohortFrom(partnerRows, season.slug, me.email, (partner?.partners || []).map(p => p.email)), cues, circlePosts: posts });
}
