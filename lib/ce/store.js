// Continuing-education records in Neon (DATABASE_URL, the same database as the practice log).
// Tables are made on first use. Certificates keep a copy of the pathway's title, hours and category as they
// were on the day they were issued, so later edits to Site Pathways never change an issued certificate.
import { neon } from '@neondatabase/serverless';

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let sqlFn = null;
const sql = () => { if (sqlFn) return sqlFn; if (!url()) throw new Error('CE records aren’t connected yet'); return (sqlFn ||= neon(url())); };
export const ceAvailable = () => !!url() || !!sqlFn;
export function _setSql(fn) { sqlFn = fn; ready = null; } // tests only (scripts/ce-test)

let ready = null;
function ensure() {
  return (ready ||= (async () => {
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS ce_events (
      id serial PRIMARY KEY, at timestamptz NOT NULL DEFAULT now(), kind text NOT NULL DEFAULT '',
      email text NOT NULL DEFAULT '', space_id text NOT NULL DEFAULT '', lesson_id text NOT NULL DEFAULT '',
      pathway text NOT NULL DEFAULT '', raw jsonb)`;
    await q`CREATE TABLE IF NOT EXISTS ce_lessons (
      email text NOT NULL, pathway text NOT NULL, lesson_id text NOT NULL, at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (email, pathway, lesson_id))`;
    await q`CREATE TABLE IF NOT EXISTS ce_done (
      email text NOT NULL, pathway text NOT NULL, at timestamptz NOT NULL DEFAULT now(), source text NOT NULL DEFAULT 'circle',
      PRIMARY KEY (email, pathway))`;
    await q`CREATE TABLE IF NOT EXISTS ce_certs (
      seq serial, id text PRIMARY KEY, email text NOT NULL, uid text NOT NULL DEFAULT '', name text NOT NULL,
      ya_id text NOT NULL DEFAULT '', pathway text NOT NULL, title text NOT NULL, hours numeric NOT NULL, category text NOT NULL DEFAULT '',
      first_at timestamptz, done_at timestamptz, r1 text NOT NULL DEFAULT '', r2 text NOT NULL DEFAULT '', attested_at timestamptz,
      pace text NOT NULL DEFAULT 'unknown', status text NOT NULL DEFAULT 'issued', issued_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(), notes text NOT NULL DEFAULT '')`;
    await q`CREATE UNIQUE INDEX IF NOT EXISTS ce_certs_one_per_pathway ON ce_certs (lower(email), pathway) WHERE status <> 'revoked'`;
    await q`CREATE TABLE IF NOT EXISTS ce_members (email text PRIMARY KEY, renewal date, updated_at timestamptz NOT NULL DEFAULT now())`;
  })());
}

const low = e => String(e || '').trim().toLowerCase();

export async function logEvent({ kind, email, spaceId, lessonId, pathway, raw }) {
  await ensure();
  await sql()`INSERT INTO ce_events (kind, email, space_id, lesson_id, pathway, raw)
    VALUES (${kind || ''}, ${low(email)}, ${spaceId || ''}, ${lessonId || ''}, ${pathway || ''}, ${JSON.stringify(raw ?? null)})`;
}

export async function recordLesson(email, pathway, lessonId) {
  await ensure();
  await sql()`INSERT INTO ce_lessons (email, pathway, lesson_id) VALUES (${low(email)}, ${pathway}, ${String(lessonId)}) ON CONFLICT DO NOTHING`;
}

export async function recordDone(email, pathway, source = 'circle') {
  await ensure();
  await sql()`INSERT INTO ce_done (email, pathway, source) VALUES (${low(email)}, ${pathway}, ${source}) ON CONFLICT DO NOTHING`;
}

// Everything about one member: { lessons: { slug: { count, firstAt } }, done: { slug: at }, certs, renewal }
export async function memberRecords(email) {
  await ensure();
  const e = low(email);
  const [ls, ds, cs, ms] = await Promise.all([
    sql()`SELECT pathway, count(*)::int AS count, min(at) AS first_at FROM ce_lessons WHERE email = ${e} GROUP BY pathway`,
    sql()`SELECT pathway, at FROM ce_done WHERE email = ${e}`,
    sql()`SELECT * FROM ce_certs WHERE lower(email) = ${e} ORDER BY issued_at`,
    sql()`SELECT to_char(renewal, 'YYYY-MM-DD') AS renewal FROM ce_members WHERE email = ${e}`,
  ]);
  return {
    lessons: Object.fromEntries(ls.map(r => [r.pathway, { count: r.count, firstAt: r.first_at }])),
    done: Object.fromEntries(ds.map(r => [r.pathway, r.at])),
    certs: cs.map(plain),
    renewal: ms[0]?.renewal || null,
  };
}

export async function setRenewal(email, renewal) {
  await ensure();
  await sql()`INSERT INTO ce_members (email, renewal) VALUES (${low(email)}, ${renewal || null})
    ON CONFLICT (email) DO UPDATE SET renewal = EXCLUDED.renewal, updated_at = now()`;
}

// Creates the certificate with the next number for this year. Throws 'exists' if this member already has one.
export async function createCert(c) {
  await ensure();
  // Check first, so a second try doesn't use up a certificate number
  const have = await sql()`SELECT id FROM ce_certs WHERE lower(email) = ${low(c.email)} AND pathway = ${c.pathway} AND status <> 'revoked'`;
  if (have.length) { const x = new Error('You already have a certificate for this pathway'); x.code = 'exists'; throw x; }
  const year = new Date().getUTCFullYear();
  const [{ n }] = await sql()`SELECT nextval(pg_get_serial_sequence('ce_certs', 'seq'))::int AS n`;
  const id = `EP-CE-${year}-${String(n).padStart(4, '0')}`;
  try {
    const rows = await sql()`INSERT INTO ce_certs (seq, id, email, uid, name, ya_id, pathway, title, hours, category, first_at, done_at, r1, r2, attested_at, pace, status, notes)
      VALUES (${n}, ${id}, ${low(c.email)}, ${c.uid || ''}, ${c.name}, ${c.yaId || ''}, ${c.pathway}, ${c.title}, ${c.hours}, ${c.category || ''},
        ${c.firstAt || null}, ${c.doneAt || null}, ${c.r1 || ''}, ${c.r2 || ''}, now(), ${c.pace || 'unknown'}, ${c.status || 'issued'}, ${c.notes || ''})
      RETURNING *`;
    return plain(rows[0]);
  } catch (e) {
    if (/ce_certs_one_per_pathway|duplicate key/.test(e.message)) { const x = new Error('You already have a certificate for this pathway'); x.code = 'exists'; throw x; }
    throw e;
  }
}

export async function getCert(id) {
  await ensure();
  const rows = await sql()`SELECT * FROM ce_certs WHERE id = ${id}`;
  return rows[0] ? plain(rows[0]) : null;
}

export async function updateCert(id, { status, name, notes }) {
  await ensure();
  const rows = await sql()`UPDATE ce_certs SET
      status = COALESCE(${status ?? null}, status), name = COALESCE(${name ?? null}, name),
      notes = CASE WHEN ${notes ?? null}::text IS NULL THEN notes WHEN notes = '' THEN ${notes ?? ''} ELSE notes || ' · ' || ${notes ?? ''} END,
      issued_at = CASE WHEN ${status ?? null}::text = 'issued' AND status = 'held' THEN now() ELSE issued_at END,
      updated_at = now()
    WHERE id = ${id} RETURNING *`;
  return rows[0] ? plain(rows[0]) : null;
}

// For the ops ledger
export async function listCerts({ status } = {}) {
  await ensure();
  const rows = status ? await sql()`SELECT * FROM ce_certs WHERE status = ${status} ORDER BY issued_at DESC`
    : await sql()`SELECT * FROM ce_certs ORDER BY issued_at DESC`;
  return rows.map(plain);
}

// Circle events we couldn't match to a pathway or a member (most recent first)
export async function unmatchedEvents(limit = 20) {
  await ensure();
  return (await sql()`SELECT id, at, kind, email, space_id, lesson_id FROM ce_events WHERE pathway = '' OR email = '' ORDER BY at DESC LIMIT ${limit}`).map(plain);
}

export async function counts() {
  await ensure();
  const [r] = await sql()`SELECT
    (SELECT count(*)::int FROM ce_certs WHERE status = 'issued' AND issued_at >= date_trunc('month', now())) AS issued_month,
    (SELECT coalesce(sum(hours), 0)::float FROM ce_certs WHERE status = 'issued') AS hours_all,
    (SELECT count(DISTINCT email)::int FROM ce_lessons) AS tracking,
    (SELECT count(*)::int FROM ce_certs WHERE status = 'held') AS held,
    (SELECT max(at) FROM ce_events) AS last_event`;
  return plain(r);
}

// Dates → ISO strings; numerics → numbers
function plain(r) {
  const o = {};
  for (const [k, v] of Object.entries(r || {})) o[k] = v instanceof Date ? v.toISOString() : k === 'hours' ? Number(v) : v;
  return o;
}
