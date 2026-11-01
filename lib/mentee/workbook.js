// The Apprentice Workbook as a page of its own on /c/apprentice-workbook (public/circle/sahrdaya.js): Start Here, the eight immersions
// (Prepare, Practicum, Integrate) and Completion Requirements, with this mentee's progress. Pure (no network): scripts/member-test/workbook.mjs.
// Sections come from courseSections() in lib/school/circle.js, each lesson with progress.status ('complete' | 'incomplete').
// An immersion lesson's state: done · open (gold: its time is now) · due (open, not done, its date has passed) · locked (not open yet, or Circle says so).
import { PREPARE_LEAD } from './home';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (s, n) => new Date(Date.parse(`${s}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const kindOf = name => (/^\s*(prepare|practicum|integrate)\b/i.exec(String(name || '')) || [])[1]?.toLowerCase() || '';

// A short line under some lessons (keyed by the lesson's lowercased name), and the name to show (the line already says "10 hrs")
export const NOTES = {
  'welcome: how this workbook works': '5 minutes', 'your year at a glance': 'The rhythm of the year', 'the practice & study imperative': 'Why the daily sit comes first',
  'your monthly 1-on-1 with jacob': 'How to book, and what to bring', 'observation hours (10 hrs)': '10 hours, with notes against the six competencies',
  'practice-teaching (10 hrs)': '10 hours, co-signed by a partner', 'retreat practicum (11 hrs)': '11 hours, July 2027', 'final teaching project': 'The 60-minute talk',
  'final report & reflective essay': 'By 31 July', 'competency check: open-book quiz': 'An open-book quiz', 'certification': 'What happens in August',
};
const SHOWN = { 'final report & reflective essay': 'Final report and reflective essay', 'competency check: open-book quiz': 'Competency check' };
const SENTENCE = { 'observation hours': 'Observation hours', 'retreat practicum': 'Retreat practicum', 'final teaching project': 'Final teaching project' };
export const shownName = name => { const n = String(name || '').trim(); if (SHOWN[n.toLowerCase()]) return SHOWN[n.toLowerCase()]; const t = n.replace(/\s*\(\d+(?:\.\d+)?\s*hrs?\)\s*$/i, ''); return SENTENCE[t.toLowerCase()] || t; };
export const noteFor = name => NOTES[String(name || '').trim().toLowerCase()] || '';

const lockedByCircle = l => l.locked === true || l.is_locked === true || l.progress?.status === 'locked' || l.drip_locked === true;

// today: YYYY-MM-DD; immersions: data/mentee.json `immersions` ({ n, title, sat, sun }); baseUrl: the course address
export function workbookView(sections, baseUrl, today, immersions) {
  const base = String(baseUrl || '').replace(/\/$/, '');
  const row = (sec, l) => ({ id: String(l.id), name: shownName(l.name), note: noteFor(l.name), done: l.progress?.status === 'complete', url: base ? `${base}/sections/${sec.id}/lessons/${l.id}` : '', locked: lockedByCircle(l) });
  const ims = (immersions || []).filter(i => DAY.test(i.sat || '') && DAY.test(i.sun || '')).sort((a, b) => a.sat.localeCompare(b.sat));
  const out = { total: 0, done: 0, start: [], immersions: ims.map(i => ({ n: i.n, title: i.title, sat: i.sat, sun: i.sun, current: false, lessons: {} })), requirements: [] };
  for (const sec of sections || []) {
    const name = String(sec?.name || ''), lessons = sec?.lessons || [];
    const n = /^\s*(\d+)\s*·/.exec(name)?.[1];
    if (n) {
      const im = out.immersions.find(x => String(x.n) === n); if (!im) continue;
      for (const l of lessons) {
        const k = kindOf(l.name); if (!k || im.lessons[k]) continue;
        const r = row(sec, l), opensOn = k === 'prepare' ? addDays(im.sat, -PREPARE_LEAD) : k === 'practicum' ? im.sun : addDays(im.sun, 1);
        const over = k === 'prepare' ? today > im.sat : k === 'practicum' ? today > im.sun : today > addDays(im.sun, 21);
        const state = r.done ? 'done' : r.locked || today < opensOn ? 'locked' : over ? 'due' : 'open';
        im.lessons[k] = { id: r.id, name: String(l.name || '').trim(), done: r.done, state, opensOn, url: state === 'locked' ? '' : r.url };
      }
    } else if (/^\s*start here/i.test(name)) out.start = lessons.map(l => row(sec, l));
    else if (/^\s*completion requirements/i.test(name)) out.requirements = lessons.map(l => row(sec, l));
  }
  // The immersion to light up: the next one, or the one whose Integrate lesson is still waiting after the weekend
  const cur = out.immersions.find(i => i.sun >= today) || null, integ = out.immersions.filter(i => i.sun < today && today <= addDays(i.sun, 21) && i.lessons.integrate && !i.lessons.integrate.done).pop();
  const pick = integ || cur; if (pick) pick.current = true;
  const all = [...out.start, ...out.requirements, ...out.immersions.flatMap(i => Object.values(i.lessons))];
  out.total = all.length; out.done = all.filter(l => l.done).length;
  return out;
}
