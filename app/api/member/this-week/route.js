import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { loadWeek } from '@/lib/mentee/load';

export const dynamic = 'force-dynamic';

// Everything the "This week" page shows. GET ?today=YYYY-MM-DD&tz=Europe/London (bearer session from /api/member/session)
export async function GET(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const q = new URL(req.url).searchParams;
  const w = await loadWeek(me, { today: q.get('today'), tz: q.get('tz'), fast: q.get('fast') === '1' });
  return reply(req, w, w.ok ? 200 : 503);
}
export const OPTIONS = preflight;
