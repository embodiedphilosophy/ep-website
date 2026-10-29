import { gate, isResponse, reply, options } from '@/lib/practice/route';
import { practiceView } from '@/lib/practice/summary';

export const dynamic = 'force-dynamic';

// The whole Practice page (public/circle/practice.js). GET ?today=YYYY-MM-DD[&as=<tier>]. Everyone gets the sit stats and
// their season totals; the readings, prompt and diary come back only for Sādhana School (checked here, not in the page).
export async function GET(req) {
  const g = await gate(req, { needSS: false });
  if (isResponse(g)) return g;
  try { return reply(req, await practiceView({ uid: g.s.uid, access: g.access, today: g.today })); }
  catch (e) { console.error('practice summary', e.message); return reply(req, { error: 'Couldn’t load your practice just now' }, 502); }
}
export const OPTIONS = options;
