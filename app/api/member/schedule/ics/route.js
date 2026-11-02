import { getEvents, todayET } from '@/lib/events';
import { tierFor } from '@/lib/member/tier';
import { buildSchedule, readFeedToken, toIcs, withZoom } from '@/lib/member/schedule';
import baseConfig from '@/data/mentee.json';
import { readTab } from '@/lib/mentee/content';
import { ROWS_TAB, withOverrides } from '@/lib/mentee/monthlist';

// A member's private calendar feed (subscribe in Google, Apple or Outlook): GET ?t=<feed token from /api/member/schedule>.
// The membership is looked up again on each refresh, so the feed follows upgrades; if Kit can't be reached, the
// membership at the time the link was made is used.
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const who = readFeedToken(new URL(req.url).searchParams.get('t'));
  if (!who) return new Response('This calendar link isn’t valid. Copy a new one from the Schedule page in Circle.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  let tier = who.tier;
  try { if (who.email) tier = (await tierFor(who.email)).tier || tier; } catch { /* keep the tier from the link */ }
  let items = buildSchedule(await getEvents(), tier, todayET());
  if (tier === 'mentee') { // the weekend Zoom links from Ops → Mentee year; the feed still works without them
    try { items = withZoom(items, withOverrides(baseConfig, await readTab(ROWS_TAB)).immersions); } catch (e) { console.error('feed zoom', e.message); }
  }
  return new Response(toIcs(items, { name: 'Embodied Philosophy · My schedule' }), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=1800', 'Content-Disposition': 'inline; filename="embodied-philosophy.ics"' },
  });
}
