import { upcomingSocial } from '@/lib/social';
import { getEpisodes, placeholder } from '@/lib/podcast';
import { isStaff } from '@/lib/ops/nav';
import { loadCalendar, loadTemplates } from '@/lib/calendar';
import { todayET } from '@/lib/events';
import { addDays } from '@/lib/ops/tasks';
import { longDate } from '@/lib/dates';
import Shell, { opsUser } from '../Shell';
import SiteEditor from './SiteEditor';
import { tableOf } from '@/lib/ops/sitetables';
import SocialGrid, { SOCIAL_PREVIEW_URL, flagOf } from '../SocialGrid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Content — Embodied Philosophy', robots: { index: false, follow: false } };

const TABS = [['social', 'Social'], ['email', 'Email'], ['media', 'Media'], ['website', 'Website']];

// Is everything we publish moving? Social, Email and Media sub-tabs, and Website: the site's own content.
export default async function Content({ searchParams }) {
  const user = await opsUser(isStaff);
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp?.tab) ? sp.tab : 'social';
  return (
    <Shell user={user} current="content" title="Content"
      head={<nav className="ops-filters" aria-label="Content">{TABS.map(([k, l]) => <a key={k} href={k === 'social' ? '/ops/content' : `/ops/content?tab=${k}`} aria-current={k === tab ? 'page' : undefined}>{l}</a>)}</nav>}>
      {tab === 'social' && <Social />}
      {tab === 'email' && <Email />}
      {tab === 'email' && <SiteEditor scope="email" initial="scaffolding" base="/ops/content?tab=email&" />}
      {tab === 'media' && <Media />}
      {tab === 'website' && <SiteEditor initial={tableOf(sp?.t) ? sp.t : 'links'} />}
    </Shell>
  );
}

async function Social() {
  const social = await upcomingSocial(9).catch(e => ({ posts: [], error: e.message }));
  const flagged = social.posts.filter(p => flagOf(p)).length;
  return (
    <section className="ops-social">
      <div className="ops-social-head">
        <h2 className="ops-sub">Next {social.posts.length || 9} posts{flagged ? <span className="late"> · {flagged} need images</span> : null}</h2>
        <a href={SOCIAL_PREVIEW_URL} target="_blank" rel="noopener">Open EP Social Preview ↗</a>
      </div>
      <div className="ops-social-wide"><SocialGrid social={social} /></div>
    </section>
  );
}

function Email() {
  return (
    <section>
      <h2 className="ops-sub">The Weekly Scaffolding</h2>
      <p className="ops-empty" style={{ maxWidth: 640 }}>Promo emails per event come next: Kit broadcasts scheduled or missing for each event, checked against the Promo Engine. This needs every broadcast to carry its event ID in the subject or name, e.g. “[E047] Promo #2”.</p>
    </section>
  );
}

// Sessions from the last 30 days whose track has a replay task, still without a Video ID
async function waitingReplays() {
  const [cal, tpls] = await Promise.all([loadCalendar(), loadTemplates()]);
  const tracks = new Set(tpls.filter(t => /vimeo|replay/i.test(t.task)).map(t => t.track.toUpperCase()));
  const today = todayET(), from = addDays(today, -30);
  return cal.filter(e => tracks.has(e.track) && e.date >= from && e.date < today && !e.video_id && !/cancel/i.test(e.status))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function Media() {
  const [episodes, replays] = await Promise.all([getEpisodes(5).then(eps => eps.filter(e => !placeholder.includes(e))).catch(() => []), waitingReplays().catch(() => null)]);
  return (
    <section>
      <h2 className="ops-sub">Replays waiting for Vimeo <span>{replays?.length || ''}</span></h2>
      {replays === null ? <p className="ops-empty">Couldn’t read the calendar.</p>
        : replays.length === 0 ? <p className="ops-empty">Every session from the last 30 days has its Video ID.</p> : (
        <ul className="ops-meet">
          {replays.map(e => <li key={e.id}><div className="d">{longDate(e.date)}</div><div className="t">{e.title}</div><div className="w">Add the Video ID in Event Details once the replay is on Vimeo.</div></li>)}
        </ul>
      )}
      <h2 className="ops-sub">CHITHEADS: latest episodes</h2>
      {episodes.length === 0 ? <p className="ops-empty">Couldn’t read the podcast feed.</p> : (
        <ul className="ops-meet">
          {episodes.map(ep => (
            <li key={ep.title}>
              <div className="d">{ep.num ? `Ep. ${ep.num}` : 'Episode'}{ep.duration ? ` · ${ep.duration}` : ''}</div>
              <div className="t"><a href={ep.url} target="_blank" rel="noopener">{ep.title}</a></div>
              {ep.guest && <div className="w">{ep.guest}</div>}
            </li>
          ))}
        </ul>
      )}
      <p className="ops-empty" style={{ maxWidth: 640, marginTop: 16 }}>Coming next: Tarka milestones.</p>
    </section>
  );
}
