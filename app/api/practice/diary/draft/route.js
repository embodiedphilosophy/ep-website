import { gate, isResponse, reply, options } from '@/lib/practice/route';
import { saveDraft } from '@/lib/practice/store';
import { readTab } from '@/lib/mentee/content';
import { WEEKLY_TAB, weekPlan } from '@/lib/practice/readings';

export const dynamic = 'force-dynamic';

// Autosave: { body, today } → the member's single open draft. The page sends it ~1.5s after typing stops.
export async function PUT(req) {
  const b = await req.json().catch(() => ({}));
  const g = await gate(req, { today: b.today });
  if (isResponse(g)) return g;
  try {
    const { season, week } = g.access;
    const plan = weekPlan(await readTab(WEEKLY_TAB), season.slug, g.today, week);
    const d = await saveDraft(g.s.uid, b.body, { season: season.slug, week, prompt: plan?.prompt || '' });
    return reply(req, { draft: d });
  } catch (e) { console.error('diary draft', e.message); return reply(req, { error: 'Couldn’t save just now. Your words are still on the page.' }, 502); }
}
export const OPTIONS = options;
