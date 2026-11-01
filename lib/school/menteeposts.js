// Which Reflections posts came from the Sahṛdaya Upāya page: the ones whose Circle post id was stored when a mentee pressed "Post to Sādhana School"
// (mentee_reflections.posted_post_id, created by the Sahṛdaya Upāya Reflections page). A mentee's ordinary reflection, written straight in Sādhana
// School, is not marked. If the table does not exist yet (that page has not shipped) or there is no database, nobody is marked.
import { neon } from '@neondatabase/serverless';

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let sqlFn = null, testSql = null;
const sql = () => testSql || (sqlFn ||= neon(url()));
export function _setSql(fn) { testSql = fn; } // tests only

// → Set of post ids (strings)
export async function menteePostIds() {
  if (!testSql && !url()) return new Set();
  try {
    const rows = await sql()`SELECT posted_post_id FROM mentee_reflections WHERE posted_post_id IS NOT NULL AND status = 'posted'`;
    return new Set(rows.map(r => String(r.posted_post_id)));
  } catch { return new Set(); }
}
