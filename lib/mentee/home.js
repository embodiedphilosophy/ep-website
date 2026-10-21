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
    immersion = {
      n: im.n, of: im.of, title: im.title, sat: im.sat, sun: im.sun, daysTo: Math.max(0, days(today, im.sat)), happening: today >= im.sat,
      prepare: { open: today >= opens, opens, url: im.prepare_url || config.workbook_url || '' },
      practicum: sun ? { id: sun.id, url: sun.url, rsvped: !!sun.rsvped, start: sun.start } : null,
      allUrl: config.workbook_url || '',
    };
  }
  const win = windowFor(config.windows, today);
  const f = w.formation;
  const recent = f ? f.entries.slice(0, 3).map(e => ({ id: e.id, day: e.day, component: e.component, hours: e.hours, note: e.note, state: e.status === 'pending' ? 'pending' : 'credited' })) : [];
  return {
    ...w,
    home: {
      uid: x.uid || '', filesOn: !!x.filesOn,
      immersion,
      assignmentsFor: immersion ? { n: immersion.n, title: immersion.title } : null,
      room: { chatUrl: config.chat_url || '', circleUrl: config.mentorship_circle_url || '', messageUrl: config.message_url || '', pinned: Array.isArray(config.pinned) ? config.pinned.filter(p => p && p.label && p.url) : [] },
      oneToOne: { window: win, bookingUrl: config.booking_url || w.oneToOne?.url || '', messageUrl: config.message_url || '' },
      partner: partner || null,
      recent,
      workbookUrl: config.workbook_url || '',
      startHere: !(w.due.items || []).length,
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
