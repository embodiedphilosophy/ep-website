import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { formationAvailable, addPending, removePending, resendEntry, cosign } from '@/lib/member/formation';
import { currentPartnerEmails } from '@/lib/mentee/partners';
import { cleanToday } from '@/lib/member/practice';
import { loadWeek } from '@/lib/mentee/load';

export const dynamic = 'force-dynamic';

// A mentee logs hours for themselves: { component, hours, day, detail, competencies, watcher, note, today, tz }. It waits as "pending" until Jacob confirms it; a practice-teaching class a partner watched
// waits for that partner to co-sign first. Also { remove: id } (take back an entry not yet confirmed), { resend: id, …fields } (edit and resend an entry that was sent back)
// and { cosign: id, ok } (the partner who watched confirms, or says it is not right).
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!formationAvailable()) return reply(req, { error: 'The hours record isn’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  try {
    if (b.remove) await removePending(me.email, b.remove);
    else if (b.cosign) await cosign(me.email, b.cosign, !!b.ok);
    else {
      if (!Array.isArray(b.competencies)) b.competencies = []; // the form always sends them; observation needs at least one
      const partners = b.component === 'practice-teaching' ? await currentPartnerEmails(me.email, cleanToday(b.today)) : [];
      if (b.resend) await resendEntry(me.email, b.resend, b, { partners }); else await addPending(me.email, b, { partners });
    }
    return reply(req, await loadWeek(me, { today: b.today, tz: b.tz }));
  } catch (e) {
    const known = /^(Choose|Hours should|Couldn)/.test(e.message);
    if (!known) console.error('this-week hours', e.message);
    return reply(req, { error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, known ? 400 : 502);
  }
}
export const OPTIONS = preflight;
