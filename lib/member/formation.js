// Formation hours toward the 100-hour Sahṛdaya Upāya certificate. Staff (Circle admins) enter the hours; mentees
// see their own record on the Today page (public/circle/today.js). One row per credited block of time.
// Same Neon database as the practice log (DATABASE_URL); the table is made on first use.
import { neon } from '@neondatabase/serverless';

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let sqlFn = null;
let testSql = null;
const sql = () => { if (testSql) return testSql; if (!url()) throw new Error('The formation record isn’t connected yet'); return (sqlFn ||= neon(url())); };
export const formationAvailable = () => !!testSql || !!url();
export function _setSql(fn) { testSql = fn; ready = null; } // tests only

let ready = null;
function ensure() {
  return (ready ||= (async () => {
    await sql()`CREATE TABLE IF NOT EXISTS member_formation (
      id bigserial PRIMARY KEY, email text NOT NULL, component text NOT NULL, hours numeric(5,2) NOT NULL,
      day date NOT NULL, note text NOT NULL DEFAULT '', by text NOT NULL DEFAULT '', at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql()`CREATE INDEX IF NOT EXISTS member_formation_email ON member_formation (email)`;
    // Mentees log some hours themselves; those wait as 'pending' until Jacob confirms. Existing staff rows stay 'credited'.
    await sql()`ALTER TABLE member_formation ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'credited'`;
    await sql()`ALTER TABLE member_formation ADD COLUMN IF NOT EXISTS kind_detail text NOT NULL DEFAULT ''`;
  })());
}

export const TOTAL_HOURS = 100;
// The ten components and their target hours, from the Mentee Dashboard design. (The design's targets add up to 101,
// so the total shown is capped at 100; the certificate needs every component complete.)
export const COMPONENTS = [
  { id: 'immersions', name: 'Monthly immersions', what: 'Open Session + Practicum, 8 weekends', type: 'Live contact', target: 40 },
  { id: 'one-to-ones', name: 'One-to-ones with Jacob', what: 'Monthly mentorship', type: 'Live contact', target: 6 },
  { id: 'observation', name: 'Observation hours', what: 'Watching senior teachers lead, with notes', type: 'Self-directed', target: 10 },
  { id: 'practice-teaching', name: 'Practice-teaching', what: 'Teaching or co-holding, credited per session', type: 'Peer-guided', target: 10 },
  { id: 'peer', name: 'Peer articulation', what: 'Partnered and small-group practice between immersions', type: 'Peer-guided', target: 8 },
  { id: 'reflections', name: 'Monthly reflections', what: 'Posts in the Mentorship space', type: 'Self-directed', target: 6 },
  { id: 'retreat', name: 'Retreat practicum', what: 'Summer retreat, in person or online', type: 'Live contact', target: 11 },
  { id: 'assessment', name: 'Final teaching assessment', what: 'Design, rehearse, deliver and record your offering', type: 'Self + live', target: 5 },
  { id: 'report', name: 'Final report', what: 'Positionality and SLBT application essay', type: 'Self-directed', target: 2 },
  { id: 'competency', name: 'Competency check', what: 'Open-book: terminology and frameworks', type: 'Assessment', target: 3 },
];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const round = n => Math.round(n * 100) / 100;
const lower = e => String(e || '').trim().toLowerCase();

// Pure: rows [{component, hours}] → per-component hours (credited up to each target) and the total
export function summarise(rows) {
  const done = {};
  for (const r of rows || []) if ((r.status || 'credited') === 'credited') done[r.component] = round((done[r.component] || 0) + Number(r.hours || 0));
  const components = COMPONENTS.map(c => ({ ...c, done: done[c.id] || 0, credited: Math.min(done[c.id] || 0, c.target) }));
  const total = Math.min(TOTAL_HOURS, round(components.reduce((a, c) => a + c.credited, 0)));
  const open = components.filter(c => c.credited < c.target).sort((a, b) => (a.credited / a.target) - (b.credited / b.target));
  return { total, target: TOTAL_HOURS, components, next: open[0] ? open[0].id : null, complete: components.every(c => c.credited >= c.target) };
}

export async function formationFor(email) {
  await ensure();
  const rows = await sql()`SELECT id, component, hours::float AS hours, day::text AS day, note, status, kind_detail, at FROM member_formation WHERE email = ${lower(email)} ORDER BY day DESC, id DESC`;
  return { ...summarise(rows), entries: rows.map(r => ({ id: String(r.id), component: r.component, hours: r.hours, day: r.day, note: r.note, status: r.status || 'credited', detail: r.kind_detail || '' })) };
}

// Hours credited per mentee, for the mentor view
export async function formationTotals(emails) {
  await ensure();
  const list = (emails || []).map(lower).filter(Boolean);
  if (!list.length) return {};
  const rows = await sql()`SELECT email, component, hours::float AS hours, status FROM member_formation WHERE email = ANY(${list})`;
  const by = {};
  for (const r of rows) (by[r.email] ||= []).push(r);
  return Object.fromEntries(Object.entries(by).map(([e, rs]) => [e, summarise(rs).total]));
}

export function cleanEntry(b) {
  const component = COMPONENTS.some(c => c.id === b?.component) ? b.component : '';
  const hours = round(Number(b?.hours));
  const day = DAY.test(b?.day || '') ? b.day : '';
  const email = lower(b?.email);
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) throw new Error('Choose a mentee');
  if (!component) throw new Error('Choose which part of the formation this counts toward');
  if (!(hours > 0 && hours <= 40)) throw new Error('Hours should be between a quarter and 40');
  if (!day) throw new Error('Choose the date');
  return { email, component, hours, day, note: String(b?.note ?? '').replace(/\s+/g, ' ').trim().slice(0, 200) };
}

export async function addEntry(by, b) {
  const e = cleanEntry(b);
  await ensure();
  await sql()`INSERT INTO member_formation (email, component, hours, day, note, by) VALUES (${e.email}, ${e.component}, ${e.hours}, ${e.day}, ${e.note}, ${lower(by)})`;
  return formationFor(e.email);
}

export async function removeEntry(email, id) {
  await ensure();
  const n = Number(id);
  if (!Number.isInteger(n)) throw new Error('Couldn’t find that entry');
  await sql()`DELETE FROM member_formation WHERE id = ${n} AND email = ${lower(email)}`;
  return formationFor(email);
}

// What a mentee can log for themselves (the other components are credited by staff or added automatically)
export const SELF_LOGGED = ['observation', 'practice-teaching', 'peer', 'retreat'];

// A mentee's own entry: always 'pending' until Jacob confirms it
export async function addPending(email, b) {
  const component = SELF_LOGGED.includes(b?.component) ? b.component : '';
  if (!component) throw new Error('Choose observation, practice-teaching, peer articulation or retreat practicum');
  const e = cleanEntry({ ...b, email, component });
  const detail = String(b?.detail ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  await ensure();
  await sql()`INSERT INTO member_formation (email, component, hours, day, note, by, status, kind_detail) VALUES (${e.email}, ${e.component}, ${e.hours}, ${e.day}, ${e.note}, ${e.email}, 'pending', ${detail})`;
  return formationFor(e.email);
}

// Mentor view: every entry still waiting for Jacob
export async function pendingEntries() {
  await ensure();
  const rows = await sql()`SELECT id, email, component, hours::float AS hours, day::text AS day, note, kind_detail FROM member_formation WHERE status = 'pending' ORDER BY day, id`;
  return rows.map(r => ({ id: String(r.id), email: r.email, component: r.component, hours: r.hours, day: r.day, note: r.note, detail: r.kind_detail || '' }));
}

// Jacob confirms (counts toward the 100 hours) or declines (removes) a pending entry
export async function resolveEntry(id, confirm) {
  await ensure();
  const n = Number(id);
  if (!Number.isInteger(n)) throw new Error('Couldn’t find that entry');
  if (confirm) await sql()`UPDATE member_formation SET status = 'credited' WHERE id = ${n} AND status = 'pending'`;
  else await sql()`DELETE FROM member_formation WHERE id = ${n} AND status = 'pending'`;
  return pendingEntries();
}
