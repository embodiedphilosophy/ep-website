import { redirect, notFound } from 'next/navigation';
import { currentMember, missingReason } from '@/lib/school/session';
import { headlessConfigured, joinedSpaces, eventList, spacePosts, latestPosts } from '@/lib/school/circle';
import { PROGRAMMES, findSeason, isWired, nyDay } from '@/lib/school/config';
import { hubItems, hubSettings, hubSeasons } from '@/lib/school/hubconfig';
import { readingPlan, sessionDatesOf, READINGS_TAB } from '@/lib/school/readings';
import { buildItems } from '@/lib/school/tabs';
import { buildSeasonPage, seasonTabKey, wantedSpaces } from '@/lib/school/season';
import { seenOf } from '@/lib/school/seen';
import { podsEnabled } from '@/lib/pods/logic';
import { readTab } from '@/lib/mentee/content';
import mentee from '@/data/mentee.json';
import Shell from '../../Shell';
import SeasonView from './SeasonView';

export const dynamic = 'force-dynamic';

// One page per season: the sidebar row opens the current one, the Season menu moves between them (docs/school-seasons.md).
export default async function Page({ params, searchParams }) {
  const { programme, season: slug } = await params;
  const { tab, write } = await searchParams;
  const season = findSeason(programme, slug);
  if (!PROGRAMMES[programme] || !season) notFound();
  const me = await currentMember();
  if (!me) redirect(`/school/sign-in?next=${encodeURIComponent(`/school/${programme}/${slug}`)}&why=${encodeURIComponent(await missingReason())}`);

  const notice = (title, text, cta) => (
    <Shell>
      <div className="sch-empty-page"><h1>{title}</h1><p>{text}</p>{cta}</div>
    </Shell>
  );
  if (!headlessConfigured() || !isWired(season)) return notice(season.title, 'This season space is being set up. It will open here soon.');

  const items = hubItems(), seasons = hubSeasons(), settings = hubSettings(), today = nyDay(), now = Date.now();
  let member, spaceUrls, events, posts;
  try {
    const recs = await joinedSpaces(me.email);
    member = new Set(recs.map(s => String(s.id)));
    spaceUrls = Object.fromEntries(recs.filter(s => s.url).map(s => [String(s.id), s.url]));
    if (member.has(String(season.hub_space_id))) [events, posts] = await Promise.all([eventList(me.email), spacePosts(me.email, season.hub_space_id)]);
  } catch (e) {
    return notice(season.title, e.status === 429 ? 'Circle is busy right now. Please try again in a minute.' : 'We could not reach Circle just now. Please try again in a moment.');
  }

  if (!member.has(String(season.hub_space_id))) {
    return (
      <Shell>
        <div className="sch-empty-page">
          <p className="sch-eyebrow">{PROGRAMMES[programme].title} · {season.short}</p>
          <h1>{season.title}</h1>
          <p>{season.subtitle}. This season is open to students enrolled in it.</p>
          <a className="sch-btn" href={season.enrol_url} target="_top">See how to join</a>
        </div>
      </Shell>
    );
  }

  // The latest posts of the spaces behind the announcement line, Kula and Resources: one read each, and one that fails only blanks its card
  const ids = wantedSpaces(items, seasons, member, today);
  const [lists, seen, rows] = await Promise.all([
    Promise.all(ids.map(id => latestPosts(me.email, id).catch(() => undefined))),
    seenOf(me.email),
    readTab(READINGS_TAB).catch(() => []),
  ]);
  const byId = {}; ids.forEach((id, i) => { if (lists[i]) byId[id] = lists[i]; });
  const readings = readingPlan(rows, season.slug, sessionDatesOf(buildItems(season, events, posts, now)));
  const page = buildSeasonPage({ season, seasons, items, settings, member, spaceUrls, events, posts, spacePosts: byId, seen, readings, weekends: (mentee.immersions || []).map(i => ({ day: i.sat, title: i.title })), today, now });

  const extra = podsEnabled() ? ['pods'] : [];
  const view = seasonTabKey(tab, extra);
  return (
    <Shell>
      <SeasonView programme={programme} slug={slug} page={page} readings={readings} initialTab={view} extraTabs={extra} openComposer={write === '1'} seasonId={season.hub_space_id} />
    </Shell>
  );
}
