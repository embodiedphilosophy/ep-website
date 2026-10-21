import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { loadWeek } from '@/lib/mentee/load';
import { readTab, TABS } from '@/lib/mentee/content';
import { pollsFrom, checkVotes } from '@/lib/mentee/polls';
import { setVotes, menteeAvailable } from '@/lib/mentee/store';

export const dynamic = 'force-dynamic';

// A mentee answers a "which time works?" survey: { poll, slots: [iso, ...], today, tz }. Replaces their earlier picks; an empty list clears them.
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!menteeAvailable()) return reply(req, { error: 'Answers aren’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  try {
    const polls = pollsFrom(await readTab(TABS.polls));
    await setVotes(me, b.poll, checkVotes(polls, String(b.poll || ''), b.slots));
    return reply(req, await loadWeek(me, { today: b.today, tz: b.tz }));
  } catch (e) {
    const known = /^(That survey|One of those)/.test(e.message);
    if (!known) console.error('this-week poll', e.message);
    return reply(req, { error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, known ? 400 : 502);
  }
}
export const OPTIONS = preflight;
