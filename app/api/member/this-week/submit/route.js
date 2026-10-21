import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { loadWeek } from '@/lib/mentee/load';
import { saveSubmission, menteeAvailable } from '@/lib/mentee/store';
import { formationAvailable, addPending, SELF_LOGGED } from '@/lib/member/formation';
import { cleanToday } from '@/lib/member/practice';

export const dynamic = 'force-dynamic';

// Hand in (or save a draft of) a written assignment: { id, text, fileName, filePath, status: 'draft'|'submitted', logHours, today, tz }.
// Only this week's hand-in assignments can be handed in. "Also log hours" adds a pending entry for Jacob to confirm.
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!menteeAvailable()) return reply(req, { error: 'Hand-ins aren’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  try {
    const current = await loadWeek(me, { today: b.today, tz: b.tz });
    const a = current.due.items.find(x => x.id === b.id && x.type === 'handin');
    if (!a) return reply(req, { error: 'That assignment isn’t open for hand-in this week.' }, 400);
    await saveSubmission(me, { assignmentId: a.id, title: a.title, text: b.text, fileUrl: b.filePath, fileName: b.fileName, status: b.status });
    const wasIn = a.submission && a.submission.status !== 'draft';
    if (b.status === 'submitted' && b.logHours && !wasIn && formationAvailable() && SELF_LOGGED.includes(a.hoursComponent) && a.hours > 0) {
      await addPending(me.email, { component: a.hoursComponent, hours: a.hours, day: cleanToday(b.today), note: a.title });
    }
    return reply(req, await loadWeek(me, { today: b.today, tz: b.tz }));
  } catch (e) {
    const known = /^(Write a response|Unknown)/.test(e.message);
    if (!known) console.error('this-week submit', e.message);
    return reply(req, { error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, known ? 400 : 502);
  }
}
export const OPTIONS = preflight;
