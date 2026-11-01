import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { menteeAvailable, addArticulation, removeArticulation } from '@/lib/mentee/store';
import { cleanArticulation } from '@/lib/mentee/articulation';
import { readTab, TABS, partnerFor, cohortFrom, profilesFrom } from '@/lib/mentee/content';
import { rotationFor } from '@/lib/mentee/home';
import { cleanToday } from '@/lib/member/practice';
import { loadWeek } from '@/lib/mentee/load';
import config from '@/data/mentee.json';

export const dynamic = 'force-dynamic';

// A mentee logs an articulation session for everyone who was there: { day, hours, present: [emails], mine, terms: { email: text }, before, after, reflected, today, tz },
// or { remove: id } to take back one they logged. The hours are credited to everyone present at once; a partner who already logged the same session stops a second one.
const last = new Map(); // uid → time of the last log, so a double click cannot log twice
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!menteeAvailable()) return reply(req, { error: 'The record isn’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  const today = cleanToday(b.today);
  try {
    if (b.remove) await removeArticulation(me.email, b.remove);
    else {
      if (Date.now() - (last.get(me.uid) || 0) < 3000) return reply(req, { error: 'One moment, then try again.' }, 429);
      last.set(me.uid, Date.now());
      // Who the mentee may name: their partners this rotation, and the rest of the cohort for a third person
      const rows = await readTab(TABS.partners);
      const rot = rotationFor(config.rotations, b.day && /^\d{4}-\d{2}-\d{2}$/.test(b.day) ? b.day : today);
      const mine = partnerFor(rows, me.email, config.season, b.day || today, { rotation: rot?.n, profiles: profilesFrom([]) });
      const partners = (mine?.partners || []).map(p => p.email);
      const a = cleanArticulation(me.email, b, [...partners, ...cohortFrom(rows, config.season, me.email).map(c => c.email)], today);
      await addArticulation({ uid: me.uid, email: me.email, name: me.firstName }, a, { season: config.season, rotation: rot?.n ?? null });
    }
    return reply(req, await loadWeek(me, { today: b.today, tz: b.tz }));
  } catch (e) {
    const known = /^(Choose|Write|Hours should|A group|Only |Couldn)|logged this session already/.test(e.message);
    if (!known) console.error('this-week articulation', e.message);
    return reply(req, { error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, known ? 400 : 502);
  }
}
export const OPTIONS = preflight;
