import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import config from '@/data/mentee.json';
import { cleanToday } from '@/lib/member/practice';
import { todayET } from '@/lib/events';
import { headlessConfigured, courseSections } from '@/lib/school/circle';
import { workbookView } from '@/lib/mentee/workbook';

export const dynamic = 'force-dynamic';

// The Apprentice Workbook page (/c/apprentice-workbook, drawn by public/circle/sahrdaya.js): every lesson with this mentee's progress and when each opens.
// Read only. Asked for on every visit to the page and never cached (ttl 0), so a lesson marked complete in Circle shows as done when the mentee comes back.
// GET ?today=YYYY-MM-DD (bearer session from /api/member/session)
export async function GET(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const today = cleanToday(new URL(req.url).searchParams.get('today') || todayET());
  if (!headlessConfigured() || !config.workbook_space_id) return reply(req, { error: 'The Workbook isn’t connected yet.' }, 503);
  try {
    const sections = await courseSections(me.email, config.workbook_space_id, 0);
    return reply(req, { today, view: workbookView(sections, config.workbook_url, today, config.immersions) });
  } catch (e) {
    console.error('workbook', e.message);
    return reply(req, { error: 'The Workbook couldn’t be loaded just now.' }, 502);
  }
}
export const OPTIONS = preflight;
