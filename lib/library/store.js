// A member's starred Library items. Same Neon database as the rest (DATABASE_URL); the table is made on first use.
import { neon } from '@neondatabase/serverless';

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let sqlFn = null;
let testSql = null;
const sql = () => { if (testSql) return testSql; if (!url()) throw new Error('Stars aren’t connected yet'); return (sqlFn ||= neon(url())); };
export const starsAvailable = () => !!testSql || !!url();
export function _setSql(fn) { testSql = fn; ready = null; } // tests only

let ready = null;
function ensure() {
  return (ready ||= (async () => {
    await sql()`CREATE TABLE IF NOT EXISTS library_stars (uid text NOT NULL, item_id text NOT NULL, at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (uid, item_id))`;
  })().catch(e => { ready = null; throw e; }));
}

export async function starsOf(uid) {
  await ensure();
  return new Set((await sql()`SELECT item_id FROM library_stars WHERE uid = ${uid}`).map(r => r.item_id));
}
export async function setStar(uid, id, on) {
  if (!/^l[0-9a-f]{12}$/.test(String(id))) throw new Error('Unknown item');
  await ensure();
  if (on) await sql()`INSERT INTO library_stars (uid, item_id) VALUES (${uid}, ${id}) ON CONFLICT DO NOTHING`;
  else await sql()`DELETE FROM library_stars WHERE uid = ${uid} AND item_id = ${id}`;
}
