// Mentee data the page writes: ticked assignments and Travelogue lines. Same Neon database as the practice log
// and formation record (DATABASE_URL); tables are made on first use. The Travelogue is the member's own: nothing
// in the site or in Ops reads it back except to show it to the person who wrote it.
import { neon } from '@neondatabase/serverless';

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let sqlFn = null;
let testSql = null;
const sql = () => { if (testSql) return testSql; if (!url()) throw new Error('The mentee record isn’t connected yet'); return (sqlFn ||= neon(url())); };
export const menteeAvailable = () => !!testSql || !!url();
export function _setSql(fn) { testSql = fn; ready = null; } // tests only

let ready = null;
function ensure() {
  return (ready ||= (async () => {
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS mentee_assignments (
      uid text NOT NULL, assignment_id text NOT NULL, done_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (uid, assignment_id)
    )`;
    await q`CREATE TABLE IF NOT EXISTS mentee_travelogue (
      id bigserial PRIMARY KEY, uid text NOT NULL, day date NOT NULL, body text NOT NULL, at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE INDEX IF NOT EXISTS mentee_travelogue_uid ON mentee_travelogue (uid, day DESC, id DESC)`;
  })().catch(e => { ready = null; throw e; }));
}

export async function doneIds(uid) {
  await ensure();
  const rows = await sql()`SELECT assignment_id FROM mentee_assignments WHERE uid = ${uid}`;
  return new Set(rows.map(r => r.assignment_id));
}

export async function setDone(uid, id, done) {
  await ensure();
  if (!/^a[0-9a-f]{12}$/.test(String(id))) throw new Error('Unknown assignment');
  if (done) await sql()`INSERT INTO mentee_assignments (uid, assignment_id) VALUES (${uid}, ${id}) ON CONFLICT DO NOTHING`;
  else await sql()`DELETE FROM mentee_assignments WHERE uid = ${uid} AND assignment_id = ${id}`;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export async function addLine(uid, day, text) {
  const body = String(text ?? '').replace(/[ \t]+/g, ' ').trim();
  if (!body) throw new Error('Write a line first');
  if (body.length > 1000) throw new Error('Keep it to a line or two (1,000 characters at most)');
  if (!DAY.test(day || '')) throw new Error('Unknown date');
  await ensure();
  await sql()`INSERT INTO mentee_travelogue (uid, day, body) VALUES (${uid}, ${day}, ${body})`;
}

export async function recentLines(uid, limit = 3) {
  await ensure();
  const rows = await sql()`SELECT id, day::text AS day, body FROM mentee_travelogue WHERE uid = ${uid} ORDER BY day DESC, id DESC LIMIT ${limit}`;
  return rows.map(r => ({ id: String(r.id), day: r.day, text: r.body }));
}
