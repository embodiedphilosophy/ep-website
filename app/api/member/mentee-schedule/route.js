import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import baseConfig from '@/data/mentee.json';
import { readTab } from '@/lib/mentee/content';
import { ROWS_TAB, withOverrides } from '@/lib/mentee/monthlist';
import { cleanToday } from '@/lib/member/practice';
import { todayET, getEvents } from '@/lib/events';
import { headlessConfigured, weekEvents, courseSections } from '@/lib/school/circle';
import { buildSchedule, feedToken } from '@/lib/member/schedule';
import { workbookFor } from '@/lib/mentee/home';
import { menteeSchedule } from '@/lib/mentee/schedule';

export const dynamic = 'force-dynamic';

// The Schedule view on the mentee page: immersions with their Saturday and Sunday sessions, the one-to-one windows, the retreat, and the private
// calendar feed. Read only, and only asked for when the view opens. GET ?today=YYYY-MM-DD (bearer session from /api/member/session)
export async function GET(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const config = withOverrides(baseConfig, await readTab(ROWS_TAB).catch(() => [])); // immersion dates and names as changed in Ops → Mentee year
  const today = cleanToday(new URL(req.url).searchParams.get('today') || todayET()), unavailable = [];
  const ok = async (name, p, d) => { try { return await p; } catch (e) { console.error('mentee schedule', name, e.message); unavailable.push(name); return d; } };
  const [events, sheet, sections] = await Promise.all([
    ok('sessions', headlessConfigured() ? weekEvents(me.email) : Promise.reject(new Error('off')), []),
    ok('calendar', getEvents().then(e => buildSchedule(e, 'mentee', today)), []),
    ok('workbook', headlessConfigured() && config.workbook_space_id ? courseSections(me.email, config.workbook_space_id) : Promise.resolve([]), []),
  ]);
  const out = menteeSchedule({ config, today, events, sheet, workbook: workbookFor(sections, config.workbook_url) });
  const feed = `https://www.embodiedphilosophy.com/api/member/schedule/ics?t=${feedToken({ uid: me.uid, email: me.email, tier: 'mentee' })}`;
  return reply(req, { ...out, feed, unavailable }, 200);
}
export const OPTIONS = preflight;
