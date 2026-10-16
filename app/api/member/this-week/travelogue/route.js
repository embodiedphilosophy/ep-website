import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { cleanToday } from '@/lib/member/practice';
import { addLine, recentLines, menteeAvailable } from '@/lib/mentee/store';

export const dynamic = 'force-dynamic';

// Add one private Travelogue line: { text, today }. Returns only the member's own latest lines.
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!menteeAvailable()) return reply(req, { error: 'The Travelogue isn’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  try {
    await addLine(me.uid, cleanToday(b.today), b.text);
    return reply(req, { travelogue: await recentLines(me.uid) });
  } catch (e) {
    const known = /^(Write a line|Keep it|Unknown date)/.test(e.message);
    if (!known) console.error('this-week travelogue', e.message);
    return reply(req, { error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, known ? 400 : 502);
  }
}
export const OPTIONS = preflight;
