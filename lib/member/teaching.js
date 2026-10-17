// Today's teaching: the sūtra of the week and the question for the day. Staff-edited in Ops (Settings → Website →
// Today: teaching), with data/teachings.json as the fallback. The same text feeds the Circle Today page and the practice app.
import data from '../../data/teachings.json';
import { readSiteTab } from './sitetab';

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

// The weeks staff keep in the "Site Teachings" tab (Ops → Settings → Today: teaching). If the sheet isn't reachable or
// has no rows yet, the shipped file is used instead.
export const loadWeeks = () => readSiteTab('Site Teachings', { cols: 'A1:L300', valid: r => /^\d{4}-\d{2}-\d{2}$/.test(r.week_start), fallback: data.weeks });
export async function currentTeaching(day) { return teachingFor(day, await loadWeeks()); }
