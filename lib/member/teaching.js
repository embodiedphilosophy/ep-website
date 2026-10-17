// Today's teaching: the sūtra of the week and the question for the day. Staff-edited data (data/teachings.json for
// now; a sheet tab later, same shape). The same text feeds the Circle Today page and the practice app.
import data from '../../data/teachings.json';

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
