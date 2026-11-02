import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { readTab, TABS } from '@/lib/mentee/content';
import { scheduleFrom, reviewOpen } from '@/lib/mentee/year';
import { setStatus } from '@/lib/mentee/yearstore';
import { cleanToday } from '@/lib/member/practice';
import { todayET } from '@/lib/events';
import { myMemberId } from '@/lib/school/circle';

export const dynamic = 'force-dynamic';

// A mentee ticks (or un-ticks) one of their own project steps, review checks or tasks (added in Ops → Mentee year): { id, done, today }. Only their own row (from the signed-in session).
// A review check can only be ticked once its review is open. Saved to the Mentee Step Status tab through lib/ops/store.js.
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const b = await req.json().catch(() => ({}));
  try {
    const sch = scheduleFrom(await readTab(TABS.schedule));
    const id = String(b.id || '');
    const review = sch.reviews.find(r => r.checks.some(c => c.id === id));
    if (!review && !sch.steps.some(s => s.id === id) && !sch.tasks.some(t => t.id === id)) return reply(req, { error: 'We couldn’t find that step.' }, 400);
    if (review && !reviewOpen(review, cleanToday(b.today || todayET()))) return reply(req, { error: `The ${review.name} review opens on the 1st of its month.` }, 400);
    const memberId = await myMemberId(me.email).catch(() => '');
    await setStatus({ email: me.email, memberId, stepId: id, status: b.done ? 'done' : 'undone', by: 'mentee' });
    return reply(req, { ok: true });
  } catch (e) { console.error('year tick', e.message); return reply(req, { error: 'That didn’t save. Please try again.' }, 502); }
}
export const OPTIONS = preflight;
