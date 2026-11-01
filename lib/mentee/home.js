// The Sahṛdaya Upāya page (/c/mentorship for mentees): what is unique to a mentee. Built on top of the "This week"
// object (lib/mentee/week.js), so practice, teaching and the Wednesday sessions stay on Today and the Sādhana School hub.
// Pure: every source is passed in, so scripts/member-test/mentee-home.mjs can check it offline.
import { addDays } from './week';
import { suggestWindow, hoursAhead } from './window';

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

// The two-month rotation we are in (Oct–Nov, Dec–Jan…), with whole weeks left, or the next one if between rotations
export function rotationFor(list, today) {
  const rows = (list || []).filter(r => DAY.test(r.from || '') && DAY.test(r.to || '')).sort((a, b) => a.from.localeCompare(b.from));
  const r = rows.find(x => x.to >= today);
  if (!r) return null;
  const nx = rows[rows.indexOf(r) + 1];
  return { n: r.n, of: rows.length, label: r.label || '', from: r.from, to: r.to, weeksLeft: Math.max(0, Math.ceil((days(today, r.to) + 1) / 7)), next: nx ? { n: nx.n, from: nx.from } : null };
}

// The articulation card: sessions logged this rotation and hours for the year, from the mentee's own peer entries (pending ones count as logged)
export function articulationFor(formation, config, today) {
  const rot = rotationFor(config.rotations, today);
  const peer = (formation?.entries || []).filter(e => e.component === 'peer');
  const inRot = rot ? peer.filter(e => e.day >= rot.from && e.day <= rot.to).length : 0;
  const hrs = Math.round(peer.reduce((a, e) => a + Number(e.hours || 0), 0) * 100) / 100;
  const comp = (formation?.components || []).find(c => c.id === 'peer');
  return { rotation: rot, target: Number(config.articulation_target) || 2, sessions: inRot, hours: hrs, hoursTarget: comp?.target || 8 };
}

// Questions for the Group: the two latest for the page, and the total
export function questionsFor(posts, config, spaceId = config.questions_space_id) {
  const list = Array.isArray(posts) ? posts : [];
  return { on: !!spaceId, url: config.questions_space_url || '', total: list.length, latest: list.slice(0, 2) };
}

// Confirmed and pending hours for the page header (pending = logged, waiting for Jacob)
export function hoursSplit(f) {
  const pending = Math.round((f?.entries || []).filter(e => e.status === 'pending').reduce((a, e) => a + Number(e.hours || 0), 0) * 100) / 100;
  return { confirmed: f?.total || 0, pending, target: f?.target || 100 };
}

// The partner card: where each partner is ("Milan · 7 hours ahead of you") and a window that suits everyone, shown in the viewer's zone
function partnerView(p, tz, today) {
  if (!p) return null;
  const at = Date.parse(`${today}T12:00:00Z`), first = n => String(n).split(' ')[0];
  const partners = p.partners.map(q => {
    const d = q.tz && tz ? hoursAhead(q.tz, tz, at) : null;
    const diff = d === null ? '' : d === 0 ? 'the same time as you' : `${Math.abs(d)} hour${Math.abs(d) === 1 ? '' : 's'} ${d > 0 ? 'ahead of' : 'behind'} you`;
    return { ...q, where: [q.city, diff].filter(Boolean).join(' · ') };
  });
  const zones = [{ tz, label: 'your time' }, ...p.partners.filter(q => q.tz).map(q => ({ tz: q.tz, label: q.city || first(q.name) }))];
  return { ...p, partners, window: p.partners.every(q => q.tz) && tz ? suggestWindow(zones, today) : null };
}

// The Mentorship Circle's latest posts for the room's tab
export function circleLines(posts, limit = 5) {
  return (posts || []).map(p => ({ id: String(p.id), title: String(p.name || p.title || '').trim(), by: String(p.author?.name || p.user?.name || '').trim(), at: p.published_at || p.created_at || '', url: p.url || '' }))
    .filter(p => p.title && p.at).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
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
  const recent = f ? f.entries.slice(0, 3).map(e => ({ id: e.id, day: e.day, component: e.component, hours: e.hours, note: e.note, detail: e.detail || '', state: e.status === 'pending' ? 'pending' : 'credited' })) : [];
  return {
    ...w,
    home: {
      uid: x.uid || '', filesOn: !!x.filesOn, polls: x.polls || [], books: x.books || { total: 0, current: null, next: null, all: [] },
      immersion,
      articulation: articulationFor(w.formation, config, today),
      questions: questionsFor(x.questions, config, x.questionsSpaceId),
      reflection: { month: today.slice(0, 7), url: config.reflections_url || '' },
      hours: hoursSplit(w.formation),
      assignmentsFor: immersion ? { n: immersion.n, title: immersion.title } : null,
      room: { chat: chatLines(x.chat), pairChatUrl: partner?.chatUrl || '', circle: circleLines(x.circlePosts), cues: x.cues || [], chatUrl: config.chat_url || '', circleUrl: config.mentorship_circle_url || '', messageUrl: config.message_url || '', pinned: Array.isArray(config.pinned) ? config.pinned.filter(p => p && p.label && p.url) : [] },
      oneToOne: { window: win, bookingUrl: config.booking_url || w.oneToOne?.url || '', messageUrl: config.message_url || '', slots: x.slots || [], booked: x.booked || null },
      partner: partnerView(partner, tz, today),
      cohort: x.cohort || [],
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
