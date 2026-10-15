import { getEvents, todayET } from '@/lib/events';
import { tierFor } from '@/lib/member/tier';
import { buildSchedule, readFeedToken, toIcs } from '@/lib/member/schedule';

// A member's private calendar feed (subscribe in Google, Apple or Outlook): GET ?t=<feed token from /api/member/schedule>.
// The membership is looked up again on each refresh, so the feed follows upgrades; if Kit can't be reached, the
// membership at the time the link was made is used.
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const who = readFeedToken(new URL(req.url).searchParams.get('t'));
  if (!who) return new Response('This calendar link isn’t valid. Copy a new one from the Schedule page in Circle.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  let tier = who.tier;
  try { if (who.email) tier = (await tierFor(who.email)).tier || tier; } catch { /* keep the tier from the link */ }
  const items = buildSchedule(await getEvents(), tier, todayET());
  return new Response(toIcs(items, { name: 'Embodied Philosophy · My schedule' }), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=1800', 'Content-Disposition': 'inline; filename="embodied-philosophy.ics"' },
  });
}
