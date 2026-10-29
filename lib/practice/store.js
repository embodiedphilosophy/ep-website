// The Practice page's own tables (Circle /c/daily-practice): the Diary to the Divine and reading ticks. Same Neon
// database as the practice log (DATABASE_URL); tables are made on first use. Every row is keyed by the Circle member
// id the signed-in session already carries (uid); the browser never says who it is.
import { neon } from '@neondatabase/serverless';

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let sqlFn = null;
let testSql = null;
const sql = () => { if (testSql) return testSql; if (!url()) throw new Error('The diary isn’t connected yet'); return (sqlFn ||= neon(url())); };
export const diaryAvailable = () => !!testSql || !!url();
export function _setSql(fn) { testSql = fn; ready = null; } // tests only

let ready = null;
function ensure() {
  return (ready ||= (async () => {
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS diary_entries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), member_id text NOT NULL, season_id text, week int, prompt text,
      body text NOT NULL DEFAULT '', is_draft boolean NOT NULL DEFAULT true, posted_at timestamptz, circle_post_id text, circle_post_url text,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE INDEX IF NOT EXISTS diary_entries_member ON diary_entries (member_id, created_at DESC)`;
    await q`CREATE UNIQUE INDEX IF NOT EXISTS one_draft_per_member ON diary_entries (member_id) WHERE is_draft`;
    await q`CREATE TABLE IF NOT EXISTS reading_progress (
      member_id text NOT NULL, reading_id text NOT NULL, read_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (member_id, reading_id)
    )`;
  })());
}

export const MAX_BODY = 20000;
const fail = (msg, status = 400) => Object.assign(new Error(msg), { status });
const shape = r => !r ? null : ({ id: r.id, season: r.season_id || '', week: r.week, prompt: r.prompt || '', body: r.body, posted: !!r.posted_at, postedAt: r.posted_at, postUrl: r.circle_post_url || '', at: r.created_at, updatedAt: r.updated_at });

export async function getDraft(uid) {
  await ensure();
  const [r] = await sql()`SELECT * FROM diary_entries WHERE member_id = ${uid} AND is_draft`;
  return shape(r);
}

// Autosave: the member's single open draft. The season, week and prompt are remembered when the draft is first made.
export async function saveDraft(uid, body, { season = null, week = null, prompt = '' } = {}) {
  const text = String(body ?? '').replace(/\r\n/g, '\n').slice(0, MAX_BODY);
  await ensure();
  const [r] = await sql()`INSERT INTO diary_entries (member_id, season_id, week, prompt, body, is_draft) VALUES (${uid}, ${season}, ${week}, ${prompt}, ${text}, true)
    ON CONFLICT (member_id) WHERE is_draft DO UPDATE SET body = EXCLUDED.body, updated_at = now() RETURNING *`;
  return shape(r);
}

// "Save to my diary": the draft becomes an entry (private). Returns it, or throws if there is nothing to save.
export async function saveEntry(uid, body) {
  await ensure();
  if (body !== undefined) await saveDraft(uid, body);
  const [d] = await sql()`SELECT body FROM diary_entries WHERE member_id = ${uid} AND is_draft`;
  if (!d || !String(d.body).trim()) throw fail('Write something before saving');
  const [r] = await sql()`UPDATE diary_entries SET is_draft = false, body = ${String(d.body).trim()}, created_at = now(), updated_at = now() WHERE member_id = ${uid} AND is_draft RETURNING *`;
  return shape(r);
}

export async function getEntry(uid, id) {
  await ensure();
  if (!/^[0-9a-f-]{36}$/i.test(String(id))) return null;
  const [r] = await sql()`SELECT * FROM diary_entries WHERE id = ${id} AND member_id = ${uid} AND NOT is_draft`;
  return shape(r);
}

export async function listEntries(uid, limit = 20) {
  await ensure();
  const rows = await sql()`SELECT * FROM diary_entries WHERE member_id = ${uid} AND NOT is_draft ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map(shape);
}

// Posting claims the entry first (posted_at set only if it was empty), so pressing twice can never make two posts.
// Returns the entry if this call won the claim, or null if it was already posted / not theirs.
export async function claimForPost(uid, id) {
  await ensure();
  if (!/^[0-9a-f-]{36}$/i.test(String(id))) return null;
  const [r] = await sql()`UPDATE diary_entries SET posted_at = now() WHERE id = ${id} AND member_id = ${uid} AND NOT is_draft AND posted_at IS NULL RETURNING *`;
  return shape(r);
}
export async function finishPost(uid, id, postId, postUrl) {
  await ensure();
  const [r] = await sql()`UPDATE diary_entries SET circle_post_id = ${String(postId ?? '')}, circle_post_url = ${postUrl || ''} WHERE id = ${id} AND member_id = ${uid} RETURNING *`;
  return shape(r);
}
export async function releasePost(uid, id) {
  await ensure();
  await sql()`UPDATE diary_entries SET posted_at = NULL WHERE id = ${id} AND member_id = ${uid}`;
}

export async function entryCount(uid, season) {
  await ensure();
  const [r] = await sql()`SELECT count(*)::int AS n FROM diary_entries WHERE member_id = ${uid} AND NOT is_draft AND (${season}::text IS NULL OR season_id = ${season})`;
  return r.n;
}

export async function readIds(uid) {
  await ensure();
  const rows = await sql()`SELECT reading_id FROM reading_progress WHERE member_id = ${uid}`;
  return new Set(rows.map(r => r.reading_id));
}
export async function setRead(uid, readingId, read) {
  const id = String(readingId || '').slice(0, 80);
  if (!id) throw fail('Unknown reading');
  await ensure();
  if (read) await sql()`INSERT INTO reading_progress (member_id, reading_id) VALUES (${uid}, ${id}) ON CONFLICT DO NOTHING`;
  else await sql()`DELETE FROM reading_progress WHERE member_id = ${uid} AND reading_id = ${id}`;
}
