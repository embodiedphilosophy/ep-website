// Where a Zoom recording goes (docs in app/api/recordings/where/route.js).
// Read-only: this only works out the plan. The Make scenario "EP trimmed recording → Vimeo → Circle" does every write.
//
// planRecording() is pure (no network), so it can be tested with made-up rows; loadAndPlan() fetches the real data.
import seasons from '@/data/school-seasons.json';
import mmHub from '@/data/mm-hub.json';
import wsHub from '@/data/ws-hub.json';
import mentee from '@/data/mentee.json';
import streams from '@/data/mm-streams.json';
import { replayTitle, normStreams } from './hub/meditation.js';
import { parseTime, zonedToUtc, kindOf } from './member/schedule.js';

const TZ = 'America/New_York';
export const etDay = iso => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
const label = (day, opts) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts }).format(new Date(`${day}T12:00:00Z`));
const longDate = day => label(day, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); // "Wed, Oct 21, 2026"
const lower = s => String(s || '').trim().toLowerCase();
const digits = s => String(s || '').replace(/\D/g, '');
const linksOf = v => String(v || '').split(/\s+/).filter(u => /^https:\/\//.test(u));
const zoomLinkOf = e => String(e.zoom_link || e['zoom link'] || '').trim();
const linkHasMeeting = (link, id) => !!id && digits(String(link).split('?')[0]).endsWith(id);
const cancelled = e => /cancel/i.test(e.status || '');
const onDay = (e, day) => e.date === day || (e.end_date && e.date <= day && day <= e.end_date);
const startOf = (e, day) => { const t = parseTime(e.time); return t ? zonedToUtc(day, t.h, t.m, t.zone).getTime() : NaN; };

// Which calendar row is this recording? In order: the row's own Zoom link; the meeting the Zoom sync made for it
// ([ep:key] in the meeting's agenda); Meditation Mondays' hand-made meeting; another row of the same series with that
// link; and last, the only session that day starting within 90 minutes of the recording.
export function matchRow({ rows, meetingId, topic, start, agenda = '', mmMeetingId = '' }) {
  const id = digits(meetingId), day = etDay(start), t0 = Date.parse(start);
  const today = rows.filter(e => onDay(e, day) && !cancelled(e));
  const tag = (String(agenda).match(/\[ep:([^\]]+)\]/) || [])[1] || '';
  const seriesWithLink = new Set(rows.filter(e => e.series && linkHasMeeting(zoomLinkOf(e), id)).map(e => e.series));
  const near = e => Math.abs(startOf(e, day) - t0) <= 90 * 60000;
  const tests = [
    ['zoom link', e => linkHasMeeting(zoomLinkOf(e), id)],
    ['zoom sync tag', e => tag && (lower(e.series) === lower(tag) || lower(e.id) === lower(tag) || lower(e.sched_id) === lower(tag))],
    ['meditation mondays meeting', e => lower(e.series) === 'meditation-mondays' && ((mmMeetingId && digits(mmMeetingId) === id) || /meditation mondays?/i.test(topic || ''))],
    ['series link', e => e.series && seriesWithLink.has(e.series)],
  ];
  for (const [how, test] of tests) {
    const hits = today.filter(test);
    if (hits.length) return { row: hits.sort((a, b) => Math.abs(startOf(a, day) - t0) - Math.abs(startOf(b, day) - t0))[0], how, day };
  }
  const close = today.filter(near);
  if (close.length === 1) return { row: close[0], how: 'only session at that time', day };
  return { row: null, day, why: close.length > 1 ? `${close.length} sessions that day start near the recording's time, and none of them names this Zoom meeting` : 'no calendar session that day matches this Zoom meeting' };
}

// Which programme a row belongs to
export function programmeOf(e) {
  const p = lower(e.program), s = lower(e.series), t = String(e.title || ''), tr = lower(e.track);
  if (s === 'meditation-mondays') return 'meditation';
  if (/practicum|sah[ṛr]daya|mentorship|mentee/i.test(`${t} ${s} ${tr}`)) return 'mentorship';
  if (p === 'sadhana' || /^sadhana/.test(s) || /sādhana school|sadhana school/i.test(t)) return 'sadhana';
  if (p === 'wisdom') return 'wisdom';
  return 'other';
}
const seasonFor = day => seasons.find(s => s.starts_on && s.ends_on && s.starts_on <= day && day <= s.ends_on && s.hub_space_id) || null;
const sessionNumber = (row, rows) => {
  if (!row.series) return 0;
  const list = rows.filter(e => e.series === row.series && !cancelled(e)).sort((a, b) => a.date.localeCompare(b.date));
  return list.findIndex(e => e === row || (e.date === row.date && e.title === row.title)) + 1;
};

// The Circle event for this session: the row's own Circle Event link, else the one in the expected space that day
function findEvent(events, row, day, spaceId, t0) {
  const links = linksOf(row.circle_event);
  const sameDay = events.filter(e => e.starts_at && etDay(e.starts_at) === day);
  const byLink = sameDay.find(e => links.includes(e.url)) || events.find(e => links.includes(e.url));
  if (byLink) return byLink;
  const inSpace = sameDay.filter(e => spaceId && String(e.space?.id || e.space_id) === String(spaceId) && !/orientation/i.test(e.name || '') === !/orientation/i.test(row.title || ''));
  if (inSpace.length) return inSpace.sort((a, b) => Math.abs(Date.parse(a.starts_at) - t0) - Math.abs(Date.parse(b.starts_at) - t0))[0];
  return null;
}
const bodyText = e => String(e?.body || '').replace(/<[^>]+>/g, ' ').replace(/▶ Watch the recording/g, '').replace(/\s+/g, ' ').trim();
const eventAction = (ev, fallbackText) => ev ? [{ type: 'event', event_id: ev.id, space_id: ev.space?.id || ev.space_id, url: ev.url || '', keep_text: bodyText(ev) || fallbackText }] : [];

// The plan: names, and the Circle actions Make carries out (post / lesson / event)
export function planRecording({ rows, events = [], sections = {}, meetingId, topic, start, agenda, mmMeetingId }) {
  const m = matchRow({ rows, meetingId, topic, start, agenda, mmMeetingId });
  if (!m.row) return { matched: false, day: m.day, topic, reason: m.why };
  const row = m.row, day = m.day, t0 = Date.parse(start), prog = programmeOf(row), kind = kindOf(row);
  const title = String(row.public_title || row.title || '').trim(), dateLabel = longDate(day);
  const notes = [], actions = [];
  let programme = 'Embodied Philosophy', vimeo = `${title} · ${dateLabel}`;

  if (prog === 'meditation') {
    programme = 'Meditation Mondays';
    const lessonName = replayTitle({ ...row, date: day }, normStreams(streams));
    const monthName = `${label(day, { month: 'long' })} ${day.slice(0, 4)}`;
    const sec = (sections[mmHub.circle.course_space_id] || []).find(s => lower(s.name) === lower(monthName));
    if (sec) actions.push({ type: 'lesson', space_id: mmHub.circle.course_space_id, section_id: sec.id, name: lessonName });
    else notes.push(`No "${monthName}" section in the Meditation Pass course yet, so no replay lesson was added. Add the section in Circle, then add the lesson by hand.`);
    actions.push(...eventAction(findEvent(events, row, day, mmHub.circle.live_space_id, t0), 'A live guided meditation.'));
    vimeo = `Meditation Mondays · ${lessonName} ${day.slice(0, 4)}`;
  } else if (prog === 'sadhana') {
    const season = seasonFor(day);
    programme = `Sādhana School${season ? ` · ${season.short}` : ''}`;
    const n = kind === 'session' ? sessionNumber(row, rows) : 0;
    const what = kind === 'session' && n ? `Session ${n}` : /open session/i.test(title) ? 'Open Session' : kind === 'orientation' ? 'Orientation' : title;
    if (season) {
      actions.push({ type: 'post', space_id: season.hub_space_id, topic_ids: [season.topic_ids?.recordings].filter(Boolean), name: `${what} · Recording · ${dateLabel}`, link_text: `▶ Watch the ${what} recording`, slug: `recording-${day}-${digits(meetingId).slice(-6)}` });
    } else notes.push(`${day} isn't inside any season in data/school-seasons.json, so no post in a season hub; only the session page gets the link.`);
    actions.push(...eventAction(findEvent(events, row, day, season?.event_space_id, t0), `${what} of ${season?.title || 'Sādhana School'}.`));
    vimeo = `Sādhana School · ${season ? season.short + ' · ' : ''}${what} · ${dateLabel}`;
  } else if (prog === 'mentorship') {
    programme = 'Sahṛdaya Upāya';
    actions.push({ type: 'post', space_id: mentee.mentorship_circle_space_id, topic_ids: [], name: `${title} · Recording · ${dateLabel}`, link_text: `▶ Watch the recording`, slug: `recording-${day}-${digits(meetingId).slice(-6)}` });
    actions.push(...eventAction(findEvent(events, row, day, mentee.mentorship_sessions_space_id, t0), title));
    vimeo = `Sahṛdaya Upāya · ${title} · ${dateLabel}`;
  } else if (prog === 'wisdom') {
    programme = 'Wisdom School';
    const c = wsHub.circle, year = Number(day.slice(0, 4)), month = Number(day.slice(5, 7));
    const section = /book club/i.test(title) ? c.book_club_section_id : /workshop/i.test(title) ? c.workshops_section_id
      : year === Number(wsHub.settings.year) ? c.month_sections[month - 1] : null;
    if (section) actions.push({ type: 'lesson', space_id: c.year_course_id, section_id: section, name: title });
    else notes.push(`No Wisdom School course section for ${day} (the year course in data/ws-hub.json is ${wsHub.settings.year}), so no lesson was added.`);
    actions.push(...eventAction(findEvent(events, row, day, c.live_space_id, t0), title));
    vimeo = `Wisdom School · ${title} · ${dateLabel}`;
  } else {
    actions.push(...eventAction(findEvent(events, row, day, null, t0), title));
  }
  if (!actions.some(a => a.type === 'event')) notes.push('No Circle event found for this session, so its session page has no recording link.');
  return { matched: true, how: m.how, day, programme, title, row_id: row.sched_id || row.id || '', series: row.series || '', vimeo_name: vimeo.slice(0, 120), actions, notes };
}

// ---------- network ----------
async function circleGet(path) {
  const res = await fetch(`https://app.circle.so/api/admin/v2${path}`, { cache: 'no-store', headers: { Authorization: `Bearer ${process.env.CIRCLE_API_TOKEN}` } });
  if (!res.ok) throw new Error(`Circle ${path}: ${res.status}`);
  return res.json();
}
async function eventsAround(day) {
  const out = [];
  for (let page = 1; page <= 30; page++) {
    const r = await circleGet(`/events?per_page=100&page=${page}`);
    out.push(...(r.records || []).filter(e => e.starts_at && Math.abs(Date.parse(e.starts_at) - Date.parse(`${day}T12:00:00Z`)) < 3 * 864e5));
    if (!r.has_next_page) break;
  }
  return out;
}

export async function loadAndPlan({ meetingId, topic, start }) {
  const [{ reminderRows }, { getMeeting }] = await Promise.all([import('./events'), import('./zoom')]);
  const day = etDay(start);
  const [rows, events, agenda, mmSections] = await Promise.all([
    reminderRows(),
    eventsAround(day).catch(e => { console.error('recordings events', e.message); return []; }),
    getMeeting(digits(meetingId)).then(m => m?.agenda || '').catch(() => ''),
    circleGet(`/course_sections?space_id=${mmHub.circle.course_space_id}&per_page=100`).then(r => r.records || []).catch(() => []),
  ]);
  return planRecording({ rows, events, sections: { [mmHub.circle.course_space_id]: mmSections }, meetingId, topic, start, agenda, mmMeetingId: process.env.MEDITATION_MONDAYS_MEETING_ID || '' });
}
