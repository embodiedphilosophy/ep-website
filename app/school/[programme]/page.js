import { redirect, notFound } from 'next/navigation';
import { currentMember, missingReason } from '@/lib/school/session';
import { headlessConfigured, joinedSpaces, memberSpaces } from '@/lib/school/circle';
import { confirmSpaces } from '@/lib/school/access';
import { PROGRAMMES, defaultSeason, nyDay } from '@/lib/school/config';
import { hubSeasons } from '@/lib/school/hubconfig';
import { landingSeason, seasonTabKey } from '@/lib/school/season';
import { podsEnabled } from '@/lib/pods/logic';
import Shell from '../Shell';

export const dynamic = 'force-dynamic';

// The sidebar row opens the current season directly: there is no hub page any more. Old addresses (/school/sadhana-school and its ?tab=)
// land here and move on. The season is the one running now among the seasons the member is in, else the next one.
export default async function Page({ params, searchParams }) {
  const { programme } = await params;
  const { tab } = await searchParams;
  if (!PROGRAMMES[programme]) notFound();
  const me = await currentMember();
  const here = `/school/${programme}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`;
  if (!me) redirect(`/school/sign-in?next=${encodeURIComponent(here)}&why=${encodeURIComponent(await missingReason())}`);

  const seasons = hubSeasons().filter(s => s.programme === programme), today = nyDay();
  let target = defaultSeason(seasons, today);
  if (headlessConfigured()) {
    try {
      const member = new Set((await joinedSpaces(me.email)).map(s => String(s.id)));
      // Same second opinion as the season page, so the sidebar row opens the season the member is really in
      if (!seasons.some(s => s.hub_space_id && member.has(String(s.hub_space_id)))) await confirmSpaces(me.email, member, seasons.map(s => s.hub_space_id), await memberSpaces(me.email).catch(() => []));
      target = landingSeason(seasons, member, today) || target;
    } catch (e) {
      if (e.status === 429) return <Shell><div className="sch-empty-page"><h1>{PROGRAMMES[programme].title}</h1><p>Circle is busy right now. Please try again in a minute.</p></div></Shell>;
    }
  }
  if (!target) notFound();
  const t = seasonTabKey(tab, podsEnabled() ? ['pods'] : []); // keep ?tab=pods (the Study pods links) instead of falling back to This week
  redirect(`/school/${programme}/${target.slug}${t === 'week' ? '' : `?tab=${t}`}`);
}
