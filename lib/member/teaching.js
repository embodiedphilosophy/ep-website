// Today's teaching: the sūtra of the week and the question for the day. Staff-edited data (data/teachings.json for
// now; a sheet tab later, same shape). The same text feeds the Circle Today page and the practice app.
import data from '../../data/teachings.json';
import { readRange, googleConfigured } from '../google';

const PROMPT_KEYS = ['prompt_sun', 'prompt_mon', 'prompt_tue', 'prompt_wed', 'prompt_thu', 'prompt_fri', 'prompt_sat'];

// The entry in force on a day: the latest week that has started. Before the first week, there is none.
export function teachingFor(day, weeks = data.weeks) {
  const started = (weeks || []).filter(w => w.week_start && w.week_start <= day).sort((a, b) => b.week_start.localeCompare(a.week_start))[0];
  if (!started) return null;
  // A week is only "this week's" for seven days; after that, show nothing rather than a stale sūtra
  const age = Math.round((new Date(day + 'T00:00:00Z') - new Date(started.week_start + 'T00:00:00Z')) / 86400000);
  if (age > 6) return null;
  const question = String(started[PROMPT_KEYS[new Date(day + 'T00:00:00Z').getUTCDay()]] || '').trim();
  return { week_start: started.week_start, source: started.source || '', sanskrit: started.sanskrit_iast || '', translation: started.translation || '', question: question || null };
}

// The weeks staff keep in the "Site Teachings" tab (Ops → Settings → Today: teaching). Cached 5 minutes like the
// other site tabs. If the sheet isn't reachable or has no rows yet, the shipped file is used instead.
export async function loadWeeks() {
  if (!process.env.CALENDAR_SHEET_ID || !googleConfigured()) return data.weeks;
  try {
    const [head, ...body] = (await readRange(process.env.CALENDAR_SHEET_ID, "'Site Teachings'!A1:L300")).filter(r => r.some(c => String(c ?? '').trim()));
    if (!head) return data.weeks;
    const keys = head.map(h => String(h).trim().toLowerCase());
    const rows = body.map(r => Object.fromEntries(keys.map((k, i) => [k, String(r[i] ?? '').trim()])))
      .filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.week_start) && !/^(false|no|hide)$/i.test(r.publish || ''));
    return rows.length ? rows : data.weeks;
  } catch (e) {
    if (!/\(400\)|: 400|: 404/.test(e.message)) console.error('Teachings tab failed', e.message);
    return data.weeks;
  }
}
export async function currentTeaching(day) { return teachingFor(day, await loadWeeks()); }
