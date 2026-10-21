// The Sahṛdaya Upāya page (/c/mentorship for mentees): what is unique to a mentee. Built on top of the "This week"
// object (lib/mentee/week.js), so practice, teaching and the Wednesday sessions stay on Today and the Sādhana School hub.
// Pure: every source is passed in, so scripts/member-test/mentee-home.mjs can check it offline.
import { addDays } from './week';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const days = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
const ms = iso => (iso ? new Date(iso).getTime() : NaN);
const PREPARE_LEAD = 14; // the Prepare lesson opens about two weeks before the weekend

// The first immersion whose Sunday has not passed yet
export function nextImmersion(list, today) {
  const rows = (list || []).filter(i => DAY.test(i.sat || '') && DAY.test(i.sun || '')).sort((a, b) => a.sat.localeCompare(b.sat));
  const i = rows.findIndex(r => r.sun >= today);
  return i < 0 ? null : { ...rows[i], of: rows.length };
}

// The one-to-one window now open, or the next one coming
export function windowFor(list, today) {
  const rows = (list || []).filter(w => DAY.test(w.from || '') && DAY.test(w.to || '')).sort((a, b) => a.from.localeCompare(b.from));
  return rows.find(w => w.to >= today) || null;
}

export function buildHome(w, x) {
  const { config, today, tz, partner } = x;
  const im = nextImmersion(config.immersions, today);
  let immersion = null;
  if (im) {
    const opens = addDays(im.sat, -PREPARE_LEAD);
    // The Sunday Practicum is a Circle event in the Mentorship Sessions space; RSVP goes to that event
    const sun = (w.sessions || []).find(s => s.start && new Date(s.start).toLocaleDateString('en-CA', { timeZone: tz }) === im.sun)
      || (w.sessions || []).find(s => Math.abs(days(im.sun, new Date(s.start).toISOString().slice(0, 10))) <= 1 && /practicum/i.test(s.title));
    const wb = (x.workbook?.immersions || {})[String(im.n)] || {};
    immersion = {
      n: im.n, of: im.of, title: im.title, sat: im.sat, sun: im.sun, daysTo: Math.max(0, days(today, im.sat)), happening: today >= im.sat,
      prepare: { open: today >= opens, opens, url: wb.prepare?.url || im.prepare_url || config.workbook_url || '', done: !!wb.prepare?.done },
      practicumLesson: wb.practicum ? { url: wb.practicum.url, done: wb.practicum.done } : null,
      practicum: sun ? { id: sun.id, url: sun.url, rsvped: !!sun.rsvped, start: sun.start } : null,
      allUrl: config.workbook_url || '',
    };
  }
  // Integrate: the lesson for an immersion that has just happened, until the mentee completes it (for three weeks after the Sunday)
  const past = (config.immersions || []).filter(i => DAY.test(i.sun || '') && i.sun < today && today <= addDays(i.sun, 21)).sort((a, b) => b.sun.localeCompare(a.sun))[0];
  const pi = past && (x.workbook?.immersions || {})[String(past.n)]?.integrate;
  const integrate = past && pi && !pi.done ? { n: past.n, title: past.title, url: pi.url } : null;
  const win = windowFor(config.windows, today);
  const f = w.formation;
  const recent = f ? f.entries.slice(0, 3).map(e => ({ id: e.id, day: e.day, component: e.component, hours: e.hours, note: e.note, state: e.status === 'pending' ? 'pending' : 'credited' })) : [];
  return {
    ...w,
    home: {
      uid: x.uid || '', filesOn: !!x.filesOn, polls: x.polls || [], books: x.books || { total: 0, current: null, next: null, all: [] },
      immersion,
      assignmentsFor: immersion ? { n: immersion.n, title: immersion.title } : null,
      room: { chat: chatLines(x.chat), chatUrl: config.chat_url || '', circleUrl: config.mentorship_circle_url || '', messageUrl: config.message_url || '', pinned: Array.isArray(config.pinned) ? config.pinned.filter(p => p && p.label && p.url) : [] },
      oneToOne: { window: win, bookingUrl: config.booking_url || w.oneToOne?.url || '', messageUrl: config.message_url || '', slots: x.slots || [], booked: x.booked || null },
      partner: partner || null,
      recent,
      workbookUrl: config.workbook_url || '',
      startHere: !(w.due.items || []).length,
      startLessons: x.workbook?.start || [],
      integrate,
    },
  };
}

// Monthly reflections: one hour for each calendar month in which the mentee posted in the Mentorship Circle (Circle's posts
// carry author.community_member_id and created_at). Counted automatically, at read time, never stored; the component's target caps it.
export function reflectionRows(posts, memberId, since) {
  if (memberId == null) return [];
  const months = new Map();
  for (const p of posts || []) {
    if (String(p?.author?.community_member_id) !== String(memberId) || !p.created_at) continue;
    const day = String(p.created_at).slice(0, 10);
    if (!DAY.test(day) || (since && day < since)) continue;
    const m = day.slice(0, 7);
    if (!months.has(m) || day < months.get(m)) months.set(m, day);
  }
  return [...months.values()].sort().map((day, i) => ({ id: 'auto-reflection-' + day.slice(0, 7), component: 'reflections', hours: 1, day, note: 'Posted in the Mentorship Circle', status: 'credited', auto: true }));
}

// Cohort chat messages from Circle → what the page shows. Messages from Circle admins and moderators get the MENTOR tag.
export function chatLines(msgs, limit = 30) {
  return (msgs || []).filter(m => m?.body && m.sent_at).slice(-limit).map(m => ({
    id: String(m.id), who: String(m.sender?.name || 'Member'), mentor: !!(m.sender?.community_admin || m.sender?.moderator),
    at: m.sent_at, text: String(m.body).replace(/\s+$/g, '').slice(0, 1500),
  }));
}

// The Apprentice Workbook for one mentee: each immersion's section ("1 · Beneath the Pose · Nov 14–15, 2026") holds Prepare, Practicum and
// Integrate lessons; "Start Here" holds the opening lessons. Lesson links follow Circle's course address pattern.
const kind = name => (/^\s*(prepare|practicum|integrate)\b/i.exec(String(name || '')) || [])[1]?.toLowerCase() || '';
export function workbookFor(sections, baseUrl) {
  const lesson = (sec, l) => ({ id: String(l.id), name: l.name, done: l.progress?.status === 'complete', url: baseUrl ? `${String(baseUrl).replace(/\/$/, '')}/sections/${sec.id}/lessons/${l.id}` : '' });
  const out = { immersions: {}, start: [] };
  for (const sec of sections || []) {
    const n = /^\s*(\d+)\s*·/.exec(sec?.name || '')?.[1];
    if (n) {
      const steps = {};
      for (const l of sec.lessons || []) { const k = kind(l.name); if (k && !steps[k]) steps[k] = lesson(sec, l); }
      out.immersions[n] = steps;
    } else if (/^\s*start here/i.test(sec?.name || '')) out.start = (sec.lessons || []).map(l => lesson(sec, l));
  }
  return out;
}
