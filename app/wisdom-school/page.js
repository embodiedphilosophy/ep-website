import PageHero from '@/components/PageHero';
import Events from '@/components/Events';
import { getEvents } from '@/lib/events';
import { site } from '@/lib/site';
export const revalidate = 300;
export const metadata = { title: 'Wisdom School — Embodied Philosophy' };
export default async function WisdomSchool() {
  const events = (await getEvents()).filter(e => e.program === 'wisdom');
  return (
    <>
      <PageHero eyebrow="Membership · The Attention Project" title="Wisdom School" img="woman-music" ground="slate"
        lede="A year-long practice of paying attention: a live guided meditation every week, a new lecture every month, and more than 1,000 hours of courses on the world’s contemplative traditions.">
        <div className="btns" style={{ marginTop: 28 }}>
          <a className="btn btn-primary" href={site.links.wisdomJoin}>Become a member — {site.prices.wisdomYear}/yr</a>
          <a className="btn btn-ghost" href={site.links.wisdomCatalog}>Browse the library</a>
        </div>
      </PageHero>
      <section className="sec"><div className="wrap">
        <div className="sec-head"><h2>What membership includes</h2></div>
        <div className="path-grid">
          <div className="tier"><h3>Meditation Mondays</h3><p>A live guided meditation every week with Wisdom School faculty, recorded for anyone who can’t make it live. The simplest way to build a practice that lasts.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--ochre)' }}><h3>Monthly lectures</h3><p>A new teaching each month on a text, a tradition or a question, from scholars and practitioners across the contemplative world.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--pine)' }}><h3>The library</h3><p>More than 1,000 hours of on-demand courses gathered over eleven years, organized into learning pathways so you always know where to go next.</p></div>
        </div>
      </div></section>
      <section className="sec path"><div className="wrap">
        <div className="sec-head"><h2>Coming up for members</h2></div>
        <Events events={events} limit={8} />
      </div></section>
      <section className="sec"><div className="wrap prose">
        <h2>Just want the meditations?</h2>
        <p>The <b>Meditation Pass</b> gets you into Meditation Mondays and their replays for $9.99 a month, or $99 a year, with a free first week. You can upgrade to full membership at any time.</p>
        <p><a className="btn btn-ghost" href={site.links.quiz}>Find your practice with the free Practice Report</a></p>
      </div></section>
    </>
  );
}
