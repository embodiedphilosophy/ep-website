import PageHero from '@/components/PageHero';
import Events from '@/components/Events';
import ReplayPlayer from '@/components/ReplayPlayer';
import PricingCards from '@/components/PricingCards';
import { getEvents, getPastEvents } from '@/lib/events';
import { getSite } from '@/lib/content';
import { longDate } from '@/lib/dates';

export const revalidate = 300;
export const metadata = {
  title: 'Meditation Pass — Meditation Mondays — Embodied Philosophy',
  description: 'A live guided meditation every Monday, rooted in the contemplative traditions. Drop in, or join with the Meditation Pass.',
};

const BENEFITS = [
  ['A steadier attention', 'Returning to the breath again and again trains the very capacity that distraction wears down.'],
  ['More room around difficult feelings', 'Practice builds a little distance from anger, fear or grief, enough to feel them without being run by them.'],
  ['Rest for the nervous system', 'Slow breathing and stillness give the body a regular chance to settle out of constant alertness.'],
  ['Clarity in the rest of your week', 'A weekly sitting becomes a reference point you can return to in ordinary moments.'],
  ['A practice that actually lasts', 'Sitting with others at a set time is one of the most reliable ways to keep practicing when motivation fades.'],
  ['A way into the traditions', 'Each session draws on teachings from yoga, Tantra and the wider contemplative world, so practice and understanding grow together.'],
];

const names = t => String(t || '').split(',').map(s => s.trim()).filter(Boolean);
const withLine = t => { const n = names(t); return n.length ? 'With ' + (n.length > 1 ? n.slice(0, -1).join(', ') + ' & ' + n.at(-1) : n[0]) : ''; };

export default async function MeditationPass() {
  const site = await getSite();
  const upcoming = (await getEvents()).filter(e => e.series === 'meditation-mondays');
  const replays = (await getPastEvents()).filter(e => e.series === 'meditation-mondays' && e.video_id).slice(0, 3);
  const offer = {
    href: site.links.meditationMonthly,
    label: `Start your free week — ${site.prices.meditationMonthly}/month`,
    heading: 'Keep sitting with us',
    text: 'You’ve watched the free preview. The Meditation Pass gives you every live Meditation Monday plus the full replay library. Your first week is free.',
  };
  return (
    <>
      <PageHero eyebrow="Meditation Mondays" title="The Meditation Pass" img="rui-fish" ground="navy"
        lede="A live guided meditation every Monday with Wisdom School faculty, rooted in yoga, Tantra and the wider contemplative traditions. Sit with a community from around the world, and build a practice that lasts.">
        <div className="btns" style={{ marginTop: 28 }}>
          <a className="btn btn-primary" href={site.links.meditationMonthly}>Start your free week — {site.prices.meditationMonthly}/mo</a>
          <a className="btn btn-ghost" href={site.links.dropinMeditation || '#pricing'}>Drop in for {site.prices.dropin}</a>
        </div>
      </PageHero>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Upcoming</span><h2>Sit with us this Monday</h2>
          <p>Drop in for a single session, or join the Meditation Pass for every week.</p></div>
        <Events events={upcoming} limit={4} hideFilters links={site.links} allSessions />
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Replays</span><h2>Recent sessions</h2>
          <p>Watch the first five minutes of any recent session free. The full replays come with the Meditation Pass.</p></div>
        {replays.length === 0 ? (
          <div className="events-empty">Recent session replays will appear here soon.</div>
        ) : (
          <div className="past-grid three">
            {replays.map(e => (
              <article className="past" key={e.id || e.date}>
                <ReplayPlayer videoId={e.video_id} title={e.title} previewMinutes={Number(e.preview_minutes) || 5} offer={offer} />
                <div className="past-meta">{longDate(e.date)}</div>
                <h3>{e.summary ? e.title : 'Meditation Monday'}</h3>
                {e.teachers && <div className="past-with">{withLine(e.teachers)}</div>}
                {e.summary && <p>{e.summary}</p>}
              </article>
            ))}
          </div>
        )}
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Why practice</span><h2>The benefits of meditation</h2></div>
        <div className="benefits">
          {BENEFITS.map(([h, t]) => <div className="benefit" key={h}><h3>{h}</h3><p>{t}</p></div>)}
        </div>
      </div></section>

      <section className="sec path" id="pricing"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Choose your way in</span><h2>Plans and pricing</h2></div>
        <PricingCards prices={site.prices} links={site.links} hours={site.libraryHours} />
      </div></section>
    </>
  );
}
