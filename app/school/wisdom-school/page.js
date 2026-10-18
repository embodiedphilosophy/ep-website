import { redirect } from 'next/navigation';
import { currentMember, missingReason } from '@/lib/school/session';
import { tierFor } from '@/lib/member/tier';
import { loadPathways, memberSummary, ceReady } from '@/lib/ce/service';
import { nyToday } from '@/lib/member/credits';
import { buildWisdomHub, wisdomPlan, tabKey } from '@/lib/school/wisdom';
import settings from '@/data/wisdom-hub.json';
import Shell from '../Shell';
import WisdomView from './WisdomView';

export const dynamic = 'force-dynamic';

// The Wisdom School hub: one sidebar row in Circle, tabs inside. Plus content shows as locked previews to Wisdom School
// members. The plan comes from the member's Kit tags, the same as Today; Circle itself still guards the spaces.
export default async function Page({ searchParams }) {
  const { tab } = await searchParams;
  const me = await currentMember();
  const here = `/school/wisdom-school${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`;
  if (!me) redirect(`/school/sign-in?next=${encodeURIComponent(here)}&why=${encodeURIComponent(await missingReason())}`);
  const tier = await tierFor(me.email);
  const plan = wisdomPlan(me.admin && wisdomPlan(tier).key === 'none' ? { wisdomPlus: true } : tier);
  if (plan.key === 'none') {
    return (
      <Shell><div className="sch-empty-page"><h1>Wisdom School</h1>
        <p>This hub is for Wisdom School members. When you join, the year’s project, the live sessions and your Learning Pathways open here.</p>
        <a className="sch-btn" href={settings.join_url} target="_top">See what’s inside</a></div></Shell>
    );
  }
  let rows = [], ce = null;
  try {
    if (ceReady()) { ce = await memberSummary(me.email, tier.wisdomPlus || plan.key === 'plus' ? { ...tier, wisdomPlus: true } : tier, nyToday()); rows = ce.rows; }
    else rows = (await loadPathways()).map(p => ({ ...p, percent: 0, status: 'new' }));
  } catch { rows = (await loadPathways().catch(() => [])).map(p => ({ ...p, percent: 0, status: 'new' })); }
  const hub = buildWisdomHub({ tier: plan.key === 'plus' ? { wisdomPlus: true } : tier, rows, ce, settings });
  return (
    <Shell>
      <header className="sch-head"><p className="sch-eyebrow">{hub.plan.label}</p><h1>Wisdom School</h1></header>
      <WisdomView hub={hub} settings={settings} initialTab={tabKey(tab)} />
    </Shell>
  );
}
