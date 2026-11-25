import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { menteeAvailable, pairRows, addPair, joinPair, leavePair } from '@/lib/mentee/store';
import { checkChoose, checkJoin } from '@/lib/mentee/pairing';
import { cohortList } from '@/lib/mentee/cohortlist';
import { cleanToday } from '@/lib/member/practice';
import { loadWeek } from '@/lib/mentee/load';
import config from '@/data/mentee.json';

export const dynamic = 'force-dynamic';

// A mentee chooses their articulation partner for this month: { action: 'choose', email } pairs them with someone still free,
// { action: 'join', group } adds them to a pair as a third (only when they are the one left over), { action: 'leave' } takes them out.
// Always for the calendar month of `today`. Answers with the refreshed page.
const last = new Map();
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!menteeAvailable()) return reply(req, { error: 'The record isn’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  const today = cleanToday(b.today), month = today.slice(0, 7), season = config.season;
  try {
    if (Date.now() - (last.get(me.uid) || 0) < 1500) return reply(req, { error: 'One moment, then try again.' }, 429);
    last.set(me.uid, Date.now());
    const [rows, cohort] = await Promise.all([pairRows(season, month), cohortList()]);
    const self = { email: me.email, name: (cohort.find(c => c.email === me.email.toLowerCase()) || {}).name || me.firstName || me.email };
    if (b.action === 'choose') {
      const p = checkChoose(me.email, b.email, cohort, rows);
      await addPair(season, month, self, cohort.find(c => c.email === p));
    } else if (b.action === 'join') {
      await joinPair(season, month, checkJoin(me.email, b.group, cohort, rows), self);
    } else if (b.action === 'leave') {
      await leavePair(season, month, me.email);
    } else throw new Error('Choose someone from your cohort');
    return reply(req, await loadWeek(me, { today: b.today, tz: b.tz }));
  } catch (e) {
    const known = /^(Choose|You already|That pair|That person|There are still)/.test(e.message);
    if (!known) console.error('this-week pair', e.message);
    return reply(req, { error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, known ? 400 : 502);
  }
}
export const OPTIONS = preflight;
