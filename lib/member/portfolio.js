// The Practice Portfolio (Circle page /c/portfolio, public/circle/portfolio.js): a daily entry ("today's tapas")
// and a weekly reflection. Private by default; mentees can share an entry with Jacob, and only shared entries
// ever reach the mentor view. Saving a daily entry also logs the day in the practice log (streaks, milestones).
// Same Neon database as the practice log (DATABASE_URL); the table is made on first use.
import { neon } from '@neondatabase/serverless';
import { QUALITIES, EXTRAS, logPractice } from './practice.js';

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let sqlFn = null;
let testSql = null;
const sql = () => { if (testSql) return testSql; if (!url()) throw new Error('The Practice Portfolio isn’t connected yet'); return (sqlFn ||= neon(url())); };
export const portfolioAvailable = () => !!testSql || !!url();
export function _setSql(fn) { testSql = fn; ready = null; } // tests only

let ready = null;
function ensure() {
  return (ready ||= (async () => {
    await sql()`CREATE TABLE IF NOT EXISTS member_portfolio (
      uid text NOT NULL, email text NOT NULL, kind text NOT NULL, day date NOT NULL,
      data jsonb NOT NULL DEFAULT '{}', shared boolean NOT NULL DEFAULT false,
      at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (uid, kind, day)
    )`;
  })());
}

// Who keeps a portfolio, and who can share it with Jacob
export const PORTFOLIO_TIERS = ['ss_season', 'ss_year', 'mentee'];
export const canShare = tier => tier === 'mentee';

export const OPTIONS = {
  qualities: QUALITIES,
  bodies: EXTRAS,
  noticed: ['Presence', 'Restlessness', 'Devotion', 'Clarity', 'Distraction', 'Joy', 'Resistance', 'Stillness'],
  energy: ['Very low', 'Low', 'Balanced', 'Elevated', 'Expansive'],
  aware: ['Scattered', 'Focused', 'Absorbed', 'Luminous'],
};
export const REFLECTIONS = [
  ['Felt sense.', 'What was the tone, mood, or rasa of your practice?'],
  ['Insight / revelation.', 'Did anything new or clear reveal itself?'],
  ['Obstacle / resistance.', 'What challenged you — mentally, emotionally, physically, or spiritually?'],
  ['Integration / action.', 'What would support deepening or integration of today’s experience?'],
];
export const WEEKLY = [
  ['Emerging patterns', 'What themes, moods, or practices have been consistent this week?'],
  ['Turning points', 'Any moment that felt like a breakthrough or shift in understanding?'],
  ['Integration into life', 'How has your sādhana affected your relationships, work, or perception?'],
  ['Commitment adjustment', 'What will you continue, refine, or release in the coming week?'],
];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const toDate = s => new Date(s + 'T00:00:00Z');
const iso = d => d.toISOString().slice(0, 10);
export const addDays = (s, n) => { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
export const mondayOf = s => addDays(s, -((toDate(s).getUTCDay() + 6) % 7));
export const EDIT_DAYS = 7; // entries can be written or changed for a week afterwards

const text = (v, max = 4000) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);
const one = (v, list) => (list.includes(v) ? v : '');
const many = (v, list) => [...new Set((Array.isArray(v) ? v : []).filter(x => list.includes(x)))];

export function minutesBetween(a, b) {
  if (!TIME.test(a || '') || !TIME.test(b || '')) return 0;
  const [h1, m1] = a.split(':').map(Number), [h2, m2] = b.split(':').map(Number);
  let d = h2 * 60 + m2 - (h1 * 60 + m1);
  if (d < 0) d += 24 * 60; // past midnight
  return d > 0 && d <= 600 ? d : 0;
}

// Pure: tidy what the browser sent. Unknown keys are dropped; choices must be from the lists.
export function cleanDaily(d = {}) {
  const sittings = (Array.isArray(d.sittings) ? d.sittings : []).slice(0, 2).map(s => ({
    start: TIME.test(s?.start || '') ? s.start : '', end: TIME.test(s?.end || '') ? s.end : '',
  }));
  while (sittings.length < 2) sittings.push({ start: '', end: '' });
  const extra = Math.max(0, Math.min(600, parseInt(d.extraMinutes, 10) || 0)); // minutes without clock times
  const minutes = Math.min(600, sittings.reduce((a, s) => a + minutesBetween(s.start, s.end), 0) + extra);
  return {
    sittings, extraMinutes: extra, minutes,
    quality: one(d.quality, OPTIONS.qualities), feel: text(d.feel, 1000),
    bodies: many(d.bodies, OPTIONS.bodies), bodyQuality: text(d.bodyQuality, 1000), supplemental: text(d.supplemental, 1000),
    reflections: REFLECTIONS.map((_, i) => text((d.reflections || [])[i])),
    noticed: many(d.noticed, OPTIONS.noticed), energy: one(d.energy, OPTIONS.energy), aware: one(d.aware, OPTIONS.aware),
    dedication: text(d.dedication, 300),
  };
}
export function cleanWeekly(d = {}) {
  return { answers: WEEKLY.map((_, i) => text((d.answers || [])[i])) };
}
const isEmpty = d => !d.minutes && !d.quality && !d.feel && !d.bodies.length && !d.bodyQuality && !d.supplemental
  && d.reflections.every(r => !r) && !d.noticed.length && !d.energy && !d.aware && !d.dedication;

// Which day a member may write to: from EDIT_DAYS ago up to today (their local today, already checked).
export function editable(day, today) { return DAY.test(day || '') && day <= today && day >= addDays(today, -EDIT_DAYS); }
// The weekly reflection: this week's, or last week's while its days are still editable.
export function weekEditable(day, today) { const mon = mondayOf(day); return DAY.test(day || '') && mon <= today && mon >= mondayOf(addDays(today, -EDIT_DAYS)); }

export async function getEntry(uid, kind, day) {
  await ensure();
  const rows = await sql()`SELECT data, shared, at FROM member_portfolio WHERE uid = ${uid} AND kind = ${kind} AND day = ${day}`;
  return rows[0] ? { data: rows[0].data, shared: !!rows[0].shared, at: rows[0].at } : null;
}

// The week (Monday-first) around `day`: practice minutes and quality from the log, plus whether a page exists.
export async function weekView(uid, day) {
  await ensure();
  const mon = mondayOf(day), sun = addDays(mon, 6);
  const log = await sql()`SELECT to_char(day, 'YYYY-MM-DD') AS day, minutes, quality, extras FROM member_practice WHERE uid = ${uid} AND day >= ${mon} AND day <= ${sun}`
    .catch(() => []); // the practice table may not exist yet
  const pages = await sql()`SELECT to_char(day, 'YYYY-MM-DD') AS day FROM member_portfolio WHERE uid = ${uid} AND kind = 'day' AND day >= ${mon} AND day <= ${sun}`;
  const byDay = Object.fromEntries(log.map(r => [r.day, r]));
  const has = new Set(pages.map(r => r.day));
  return [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = addDays(mon, i), r = byDay[d];
    return { day: d, minutes: r ? Number(r.minutes) || 0 : 0, quality: r?.quality || '', extras: r?.extras || [], logged: !!r, page: has.has(d) };
  });
}

// Pure: one line about the week, e.g. "5 of 7 days · 290 min · most often calm · mantra on 4 days"
export function weekLine(days) {
  const done = days.filter(d => d.logged);
  if (!done.length) return 'No practice logged this week yet';
  const total = done.reduce((a, d) => a + d.minutes, 0);
  const count = (xs) => { const c = {}; xs.forEach(x => { c[x] = (c[x] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
  const q = count(done.map(d => d.quality).filter(Boolean));
  const x = count(done.flatMap(d => d.extras || []));
  const parts = [`${done.length} of 7 days`, `${total} min`];
  if (q.length) parts.push(`most often ${q[0][0].toLowerCase()}`);
  if (x.length) parts.push(`${x[0][0].toLowerCase()} on ${x[0][1]} day${x[0][1] > 1 ? 's' : ''}`);
  return parts.join(' · ');
}

export async function recentPages(uid, today, n = 60) {
  await ensure();
  const rows = await sql()`SELECT kind, to_char(day, 'YYYY-MM-DD') AS day, shared FROM member_portfolio WHERE uid = ${uid} AND day <= ${today} ORDER BY day DESC, kind LIMIT ${n}`;
  return rows.map(r => ({ kind: r.kind, day: r.day, shared: !!r.shared }));
}

// Everything the page needs for one day
export async function portfolioView({ uid, tier }, day, today) {
  const [entry, week, weekly, recent] = await Promise.all([
    getEntry(uid, 'day', day), weekView(uid, day), getEntry(uid, 'week', mondayOf(day)), recentPages(uid, today),
  ]);
  return {
    day, today, editable: editable(day, today), weekEditable: weekEditable(day, today), weekStart: mondayOf(day),
    entry, week, weekLine: weekLine(week), weekly, recent, canShare: canShare(tier),
    options: OPTIONS, reflections: REFLECTIONS, weeklyQuestions: WEEKLY, entryNumber: recent.filter(r => r.kind === 'day').length,
  };
}

export async function saveDaily({ uid, email, tier }, day, today, raw, shared) {
  if (!editable(day, today)) throw Object.assign(new Error('Entries can be written for up to a week afterwards'), { status: 400 });
  const data = cleanDaily(raw);
  if (isEmpty(data)) throw Object.assign(new Error('Write something, or add your practice times, before saving'), { status: 400 });
  await ensure();
  const share = canShare(tier) && !!shared;
  await sql()`INSERT INTO member_portfolio (uid, email, kind, day, data, shared) VALUES (${uid}, ${email}, 'day', ${day}, ${JSON.stringify(data)}, ${share})
    ON CONFLICT (uid, kind, day) DO UPDATE SET data = EXCLUDED.data, shared = EXCLUDED.shared, email = EXCLUDED.email, at = now()`;
  // The days and minutes count toward the streak whatever the sharing
  if (data.minutes > 0) await logPractice({ uid, email, day, minutes: data.minutes, quality: data.quality, extras: data.bodies });
  return data;
}

export async function saveWeekly({ uid, email, tier }, day, today, raw, shared) {
  const mon = mondayOf(day);
  if (!weekEditable(day, today)) throw Object.assign(new Error('This week’s reflection can no longer be changed'), { status: 400 });
  const data = cleanWeekly(raw);
  if (data.answers.every(a => !a)) throw Object.assign(new Error('Write at least one answer before saving'), { status: 400 });
  await ensure();
  const share = canShare(tier) && !!shared;
  await sql()`INSERT INTO member_portfolio (uid, email, kind, day, data, shared) VALUES (${uid}, ${email}, 'week', ${mon}, ${JSON.stringify(data)}, ${share})
    ON CONFLICT (uid, kind, day) DO UPDATE SET data = EXCLUDED.data, shared = EXCLUDED.shared, email = EXCLUDED.email, at = now()`;
  return data;
}

// Mentor view: pages mentees chose to share, newest first. Nothing private ever leaves here.
export async function sharedPages(since) {
  await ensure();
  const rows = await sql()`SELECT lower(email) AS email, kind, to_char(day, 'YYYY-MM-DD') AS day, data, at FROM member_portfolio
    WHERE shared = true AND day >= ${since} ORDER BY at DESC LIMIT 100`;
  return rows.map(r => ({ email: r.email, kind: r.kind, day: r.day, data: r.data, at: r.at }));
}
