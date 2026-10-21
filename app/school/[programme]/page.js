import { redirect, notFound } from 'next/navigation';
import { currentMember, missingReason } from '@/lib/school/session';
import { headlessConfigured, joinedSpaces, weekEvents, latestPosts } from '@/lib/school/circle';
import { PROGRAMMES, nyDay } from '@/lib/school/config';
import { hubItems, hubSettings, hubSeasons } from '@/lib/school/hubconfig';
import { buildHub, hubTabKey, planOf, postSpaces, resolveItems } from '@/lib/school/hub';
import { seenOf } from '@/lib/school/seen';
import { podsEnabled } from '@/lib/pods/logic';
import Shell from '../Shell';
import HubView from './HubView';

export const dynamic = 'force-dynamic';

// The Sādhana School hub: one sidebar row in Circle, everything else in tabs. Circle still decides who can open what;
// this page only reads which spaces the member belongs to (docs/school-hub.md).
export default async function Page({ params, searchParams }) {
  const { programme } = await params;
  const { tab } = await searchParams;
  if (!PROGRAMMES[programme]) notFound();
  const me = await currentMember();
  const here = `/school/${programme}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`;
  if (!me) redirect(`/school/sign-in?next=${encodeURIComponent(here)}&why=${encodeURIComponent(await missingReason())}`);

  const notice = (title, text, cta) => (
    <Shell><div className="sch-empty-page"><h1>{title}</h1><p>{text}</p>{cta}</div></Shell>
  );
  const title = PROGRAMMES[programme].title;
  if (!headlessConfigured()) return notice(title, 'The school hub is being set up. It will open here soon.');

  const items = hubItems(), seasons = hubSeasons(), settings = hubSettings(), today = nyDay(), now = Date.now();
  let hub;
  try {
    const recs = await joinedSpaces(me.email);
    const member = new Set(recs.map(s => String(s.id)));
    const spaceUrls = Object.fromEntries(recs.filter(s => s.url).map(s => [String(s.id), s.url]));
    const plan = planOf(resolveItems(items, seasons), member);
    if (plan.key === 'none') {
      return notice(title, 'This hub is for Sādhana School students. When you join a season, everything opens here.',
        settings.join_url ? <a className="sch-btn" href={settings.join_url} target="_top">See how to join</a> : null);
    }
    // Reads that fail one by one (a space that is slow or private) only blank that card's line, never the page
    const ids = postSpaces(items, seasons, member, plan, today);
    const [events, postLists, seen] = await Promise.all([
      weekEvents(me.email).catch(() => []),
      Promise.all(ids.map(id => latestPosts(me.email, id).catch(() => undefined))),
      seenOf(me.email),
    ]);
    const posts = {}; ids.forEach((id, i) => { if (postLists[i]) posts[id] = postLists[i]; });
    hub = buildHub({ items, seasons, settings, member, spaceUrls, events, posts, seen, today, now });
    if (!podsEnabled()) hub.tabs = hub.tabs.filter(t => t.key !== 'pods'); // Study pods stay hidden until STUDY_PODS=on
  } catch (e) {
    return notice(title, e.status === 429 ? 'Circle is busy right now. Please try again in a minute.' : 'We could not reach Circle just now. Please try again in a moment.');
  }

  return (
    <Shell>
      <header className="sch-head">
        <p className="sch-eyebrow">{hub.plan.label || 'Sādhana School'}</p>
        <h1>{title}</h1>
      </header>
      <HubView hub={hub} initialTab={hubTabKey(tab, hub.tabs)} />
    </Shell>
  );
}
