import { memberFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { loadPractice } from '@/lib/meditation/load';

export const dynamic = 'force-dynamic';

// The Meditation Pass homepage's data. GET ?today=YYYY-MM-DD (bearer session from /api/member/session).
export async function GET(req) {
  const { me, res } = memberFromBearer(req, ['meditation'], 'Meditation Pass members');
  if (!me) return res;
  return reply(req, await loadPractice(me, { today: new URL(req.url).searchParams.get('today') }));
}
export const OPTIONS = preflight;
