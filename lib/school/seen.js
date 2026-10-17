// When each member last opened a space from the hub, so the hub can say how much is new. Circle shows no unread dots
// for spaces hidden from its sidebar and the API gives no per-member counts, so we keep our own. Same Neon database as
// the rest (DATABASE_URL); the table is made on first use. Without a database the hub simply shows no counts.
import { neon } from '@neondatabase/serverless';

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let sqlFn = null;
let testSql = null;
const sql = () => { if (testSql) return testSql; return (sqlFn ||= neon(url())); };
export const seenAvailable = () => !!testSql || !!url();
export function _setSql(fn) { testSql = fn; ready = null; } // tests only

let ready = null;
function ensure() {
  return (ready ||= (async () => {
    await sql()`CREATE TABLE IF NOT EXISTS school_seen (email text NOT NULL, space_id text NOT NULL, at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (email, space_id))`;
  })().catch(e => { ready = null; throw e; }));
}

const key = email => String(email || '').trim().toLowerCase();

// { spaceId: ISO time } for this member. Null when the store is not connected or not reachable.
export async function seenOf(email) {
  if (!seenAvailable()) return null;
  try {
    await ensure();
    const rows = await sql()`SELECT space_id, at FROM school_seen WHERE email = ${key(email)}`;
    return Object.fromEntries(rows.map(r => [r.space_id, new Date(r.at).toISOString()]));
  } catch { return null; }
}

export async function markSeen(email, spaceId) {
  if (!seenAvailable()) return false;
  if (!/^\d+$/.test(String(spaceId))) throw new Error('Unknown space');
  await ensure();
  await sql()`INSERT INTO school_seen (email, space_id, at) VALUES (${key(email)}, ${String(spaceId)}, now()) ON CONFLICT (email, space_id) DO UPDATE SET at = now()`;
  return true;
}
