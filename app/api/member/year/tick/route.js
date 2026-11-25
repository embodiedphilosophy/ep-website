import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { readTab, TABS } from '@/lib/mentee/content';
import { scheduleFrom, reviewOpen, MARK_RE } from '@/lib/mentee/year';
import { setStatus } from '@/lib/mentee/yearstore';
import { cleanToday } from '@/lib/member/practice';
import { todayET } from '@/lib/events';
import { myMemberId } from '@/lib/school/circle';

export const dynamic = 'force-dynamic';

// A mentee ticks (or un-ticks) one of their own project steps, review checks or tasks (added in Ops → Mentee year): { id, done, today }. Only their own row (from the signed-in session).
// A review check can only be ticked once its review is open. Saved to the Mentee Step Status tab through lib/ops/store.js.
// The rows of "This month" (m:<YYYY-MM>:<key>, this month or last) and tasks can also be skipped: { id, status: 'skipped' }. A skip shows in
// Ops → Mentee year → Progress and on the mentee's report as not completed. { status: 'undone' } puts a row back. auto: true marks a row the
// page saw done on its own (a reflection posted, a buddy session logged), so Ops sees it too.
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const b = await req.json().catch(() => ({}));
  try {
    const sch = scheduleFrom(await readTab(TABS.schedule));
    const id = String(b.id || '');
    const today = cleanToday(b.today || todayET()), status = ['done', 'skipped', 'undone'].includes(b.status) ? b.status : b.done ? 'done' : 'undone';
    const mark = MARK_RE.exec(id), isTask = sch.tasks.some(t => t.id === id);
    const review = mark ? null : sch.reviews.find(r => r.checks.some(c => c.id === id));
    if (mark) { const ym = today.slice(0, 7), [y, m] = ym.split('-').map(Number), prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; if (mark[1] !== ym && mark[1] !== prev) return reply(req, { error: 'That month has closed.' }, 400); }
    else if (!review && !sch.steps.some(s => s.id === id) && !isTask) return reply(req, { error: 'We couldn’t find that step.' }, 400);
    if (status === 'skipped' && !mark && !isTask) return reply(req, { error: 'Only the things on This month can be skipped.' }, 400);
    if (review && !reviewOpen(review, today)) return reply(req, { error: `The ${review.name} review opens on the 1st of its month.` }, 400);
    const memberId = await myMemberId(me.email).catch(() => '');
    await setStatus({ email: me.email, memberId, stepId: id, status, note: b.auto ? 'auto' : '', by: 'mentee' });
    return reply(req, { ok: true });
  } catch (e) { console.error('year tick', e.message); return reply(req, { error: 'That didn’t save. Please try again.' }, 502); }
}
export const OPTIONS = preflight;
