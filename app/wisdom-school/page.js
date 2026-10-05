import PageHero from '@/components/PageHero';
import PricingCards from '@/components/PricingCards';
import AnnualThemes from '@/components/AnnualThemes';
import { getThemes } from '@/lib/themes';
import { getEvents } from '@/lib/events';
import { getSeasons } from '@/lib/seasons';
import { getSite, getPathways, getTeachers } from '@/lib/content';
import { longDate } from '@/lib/dates';

export const revalidate = 300;
export const metadata = {
  title: 'Wisdom School — Embodied Philosophy',
  description: 'A weekly live meditation, a monthly lecture, seasonal workshops and, with Wisdom School Plus, a library of learning pathways and certificate programs.',
};

const isMM = e => e.series === 'meditation-mondays';
const isLecture = e => e.track === 'WSML' || (!isMM(e) && /lecture/i.test(e.title));
const isWorkshop = e => e.track === 'WSQ' || /workshop|seminar|book club|quarterly/i.test(e.title);
const withNames = t => String(t || '').split(',').map(s => s.trim()).filter(n => n && !/^\[/.test(n)).join(' & ');

function Rhythm({ title, cadence, items, empty, cta }) {
  return (
    <div className="rhythm">
      <div className="rhythm-head"><h3>{title}</h3><span>{cadence}</span></div>
      {items.length === 0 ? <p className="ops-empty">{empty}</p> : (
        <ul>
          {items.map(e => (
            <li key={e.id || e.date + e.title}>
              <div className="d">{longDate(e.date)}{e.time ? ` · ${e.time}` : ''}</div>
              <div className="t">{e.title}</div>
              {withNames(e.teachers) && <div className="w">With {withNames(e.teachers)}</div>}
            </li>
          ))}
        </ul>
      )}
      {cta}
    </div>
  );
}

export default async function WisdomSchool() {
  const site = await getSite();
  const events = (await getEvents()).filter(e => e.program === 'wisdom');
  const [pathways, teachers, ss, th] = await Promise.all([getPathways(), getTeachers(), getSeasons('sadhana'), getThemes()]);
  const mm = events.filter(isMM).slice(0, 4);
  const lectures = events.filter(e => isLecture(e) && !isWorkshop(e)).slice(0, 2);
  const workshops = events.filter(isWorkshop).slice(0, 2);
  const faculty = teachers.filter(t => !/^jacob kyle$/i.test(t.name)).slice(0, 4);

  return (
    <>
      <PageHero eyebrow="Membership" title="Wisdom School" img="woman-music" ground="slate"
        lede="Contemplative study for modern life. A live meditation every week, a lecture every month, and seasonal workshops. With Wisdom School Plus, add every learning pathway, our certificate programs and continuing-education certificates.">
        <div className="btns" style={{ marginTop: 28 }}>
          <a className="btn btn-primary" href="#pricing">Join Wisdom School — from {site.prices.wisdomYear}/yr</a>
          <a className="btn btn-ghost" href="/meditation-pass">Just the meditations — {site.prices.meditationMonthly}/mo</a>
        </div>
      </PageHero>

      {th.themes.length > 0 && <AnnualThemes themes={th.themes} current={th.current} joinHref="#pricing" plusHref="#pricing" />}

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The live rhythm</span><h2>What’s happening in Wisdom School</h2>
          <p>Three live threads run through the year. Every session is recorded, so you can join live or catch up when it suits you.</p></div>
        <div className="rhythm-grid">
          <Rhythm title="Meditation Mondays" cadence="Every week" items={mm} empty="New sessions are posted soon."
            cta={<a className="go" href="/meditation-pass">Drop in or get the Meditation Pass <span className="arw">→</span></a>} />
          <Rhythm title="Monthly lecture" cadence="Once a month" items={lectures} empty="The next lecture will be announced soon." />
          <Rhythm title="Workshops & book club" cadence="Each season" items={workshops} empty="The next workshop will be announced soon." />
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Learning pathways</span><h2>Start with your question</h2>
          <p>With Wisdom School Plus, the library holds {site.libraryHours} hours of teaching gathered over a decade. Pathways turn it into a guided route: pick the question you’re living with, and follow a sequence of courses chosen to answer it.</p></div>
        <div className="pathways">
          {pathways.map(p => (
            <article key={p.title} className="pathway">
              {Number(p.ce_hours) > 0 && <div className="ce-badges"><span className="ce-hours">{p.ce_hours} CE hours</span></div>}
              <div className="pq">{p.question}</div>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              {p.courseList.length > 0 && <ol>{p.courseList.map(c => <li key={c}>{c}</li>)}</ol>}
              {p.link && <a className="go" href={p.link}>Open the pathway <span className="arw">→</span></a>}
            </article>
          ))}
        </div>
        <p style={{ marginTop: 26 }}><a className="btn btn-ghost" href={site.links.wisdomCatalog}>Browse the full library</a></p>
        <p style={{ marginTop: 14 }}><b>Yoga teachers:</b> pathways earn continuing education hours. <a href="/continuing-education">How CE works →</a></p>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Two ways to join</span><h2>Wisdom School and Wisdom School Plus</h2>
          <p>Both include the full live rhythm of the year. Plus adds the library: every pathway, our certificate programs and past programming.</p></div>
        <div className="tier-compare">
          <div className="tier"><h3>Wisdom School</h3><div className="tc-price">{site.prices.wisdomYear}/year{site.prices.wisdomMonthly ? ` · or ${site.prices.wisdomMonthly}/month` : ''}</div>
            <ul className="plain">
              <li>Meditation Mondays, live every week, with replays</li>
              <li>The monthly lecture and seasonal workshops</li>
              <li>This year’s programming, on demand</li>
              <li>A starter learning pathway</li>
            </ul></div>
          <div className="tier tier-plus"><h3>Wisdom School Plus</h3><div className="tc-price">{site.prices.wisdomPlusYear}/year{site.prices.wisdomPlusMonthly ? ` · or ${site.prices.wisdomPlusMonthly}/month` : ''}</div>
            <ul className="plain">
              <li>Everything in Wisdom School</li>
              <li>Every learning pathway ({site.libraryHours} hours)</li>
              <li>Certificate programs: Yoga Philosophy, Embodied Therapy, Buddhist Psychology and more</li>
              <li>Past years of programming</li>
              <li>Continuing-education certificates for yoga teachers</li>
            </ul></div>
        </div>
        <p style={{ marginTop: 18 }}>Upgrade from Wisdom School to Plus at any time; the remaining value of your plan is credited.</p>
      </div></section>

      {faculty.length > 0 && (
        <section className="sec path"><div className="wrap">
          <div className="sec-head"><span className="eyebrow">Faculty</span><h2>Who you’ll learn with</h2></div>
          <div className="faculty">
            {faculty.map(t => <div key={t.name} className="fac"><h3>{t.name}</h3><div className="r">{t.role}</div><p>{t.bio}</p></div>)}
          </div>
          <p style={{ marginTop: 22 }}><a href="/teachers">Meet all our teachers →</a></p>
        </div></section>
      )}

      <section className="sec" id="pricing"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Choose your way in</span><h2>Plans and pricing</h2></div>
        <PricingCards prices={site.prices} links={site.links} hours={site.libraryHours} />
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="ascend">
          <div>
            <span className="eyebrow">Ready to go deeper?</span>
            <h2>Sādhana School</h2>
            <p>When study becomes a path, Sādhana School offers a year of close reading and daily practice in the non-dual Śākta-Śaiva tradition{ss.next ? `. ${ss.next.key}, ${ss.next.title}, begins ${longDate(ss.next.start)}.` : '.'}</p>
          </div>
          <a className="btn btn-primary" href="/sadhana-school">Explore Sādhana School</a>
        </div>
      </div></section>
    </>
  );
}
