import { redirect, notFound } from 'next/navigation';
import { currentMember } from '@/lib/school/session';
import { headlessConfigured, memberSpaceIds, eventList, spacePosts } from '@/lib/school/circle';
import { PROGRAMMES, programmeSeasons, findSeason, isWired, seasonState } from '@/lib/school/config';
import { buildItems, tabLists, TABS } from '@/lib/school/tabs';
import Shell from '../../Shell';
import SeasonView from './SeasonView';

export const dynamic = 'force-dynamic';

const fmt = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export default async function Page({ params, searchParams }) {
  const { programme, season: slug } = await params;
  const { tab } = await searchParams;
  const season = findSeason(programme, slug);
  if (!PROGRAMMES[programme] || !season) notFound();
  const me = await currentMember();
  if (!me) redirect(`/school/sign-in?next=${encodeURIComponent(`/school/${programme}/${slug}`)}`);

  const all = programmeSeasons(programme);
  const notice = (title, text, cta) => (
    <Shell programme={programme} seasons={all.filter(isWired)} active={slug}>
      <div className="sch-empty-page"><h1>{title}</h1><p>{text}</p>{cta}</div>
    </Shell>
  );
  if (!headlessConfigured() || !isWired(season)) return notice(season.title, 'This season space is being set up. It will open here soon.');

  let spaces, events, posts;
  try {
    spaces = await memberSpaceIds(me.email);
    if (spaces.has(String(season.hub_space_id))) [events, posts] = await Promise.all([eventList(me.email), spacePosts(me.email, season.hub_space_id)]);
  } catch (e) {
    return notice(season.title, e.status === 429 ? 'Circle is busy right now. Please try again in a minute.' : 'We could not reach Circle just now. Please try again in a moment.');
  }

  // Single-season students see only their own season; annual students see all of them
  const visible = all.filter(s => isWired(s) && spaces.has(String(s.hub_space_id)));
  if (!spaces.has(String(season.hub_space_id))) {
    return (
      <Shell programme={programme} seasons={visible} active={slug}>
        <div className="sch-empty-page">
          <p className="sch-eyebrow">{PROGRAMMES[programme].title} · {season.short}</p>
          <h1>{season.title}</h1>
          <p>{season.subtitle}. This season is open to students enrolled in it.</p>
          <a className="sch-btn" href={season.enrol_url}>See how to join</a>
        </div>
      </Shell>
    );
  }

  const lists = tabLists(buildItems(season, events, posts));
  const view = TABS.some(t => t.key === tab) ? tab : 'all';
  return (
    <Shell programme={programme} seasons={visible} active={slug}>
      <header className="sch-head">
        <div>
          <p className="sch-eyebrow">{PROGRAMMES[programme].title} · {season.short}</p>
          <h1>{season.title}</h1>
          <p className="sch-dek">{season.subtitle}</p>
          <p className="sch-dates">{fmt(season.starts_on)}{seasonState(season) === 'now' && <span className="sch-now">Now</span>}</p>
        </div>
        {season.cover_image && <img className="sch-cover" src={season.cover_image} alt="" />}
      </header>
      <SeasonView programme={programme} slug={slug} lists={lists} initialTab={view} canReflect={season.topic_ids?.reflections != null} />
    </Shell>
  );
}
