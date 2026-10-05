import PageHero from '@/components/PageHero';
import PricingCards from '@/components/PricingCards';
import { getEvents } from '@/lib/events';
import { getSeasons } from '@/lib/seasons';
import { getSite, getPathways, getTeachers } from '@/lib/content';
import { longDate } from '@/lib/dates';

export const revalidate = 300;
export const metadata = {
  title: 'Wisdom School — Embodied Philosophy',
  description: 'A weekly live meditation, a monthly lecture, seasonal workshops, and a 1,000-hour library arranged into guided learning pathways.',
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
  const [pathways, teachers, ss] = await Promise.all([getPathways(), getTeachers(), getSeasons('sadhana')]);
  const mm = events.filter(isMM).slice(0, 4);
  const lectures = events.filter(e => isLecture(e) && !isWorkshop(e)).slice(0, 2);
  const workshops = events.filter(isWorkshop).slice(0, 2);
  const faculty = teachers.filter(t => !/^jacob kyle$/i.test(t.name)).slice(0, 4);

  return (
    <>
      <PageHero eyebrow="Membership" title="Wisdom School" img="woman-music" ground="slate"
        lede="Contemplative study for modern life. A live meditation every week, a lecture every month, seasonal workshops, and a 1,000-hour library arranged into guided learning pathways, so you always know where to go next.">
        <div className="btns" style={{ marginTop: 28 }}>
          <a className="btn btn-primary" href={site.links.wisdomJoin}>Join Wisdom School — {site.prices.wisdomYear}/yr</a>
          <a className="btn btn-ghost" href="/meditation-pass">Just the meditations — {site.prices.meditationMonthly}/mo</a>
        </div>
      </PageHero>

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
          <p>The library holds more than 1,000 hours of courses gathered over a decade. Pathways turn it into a guided route: pick the question you’re living with, and follow a sequence of courses chosen to answer it.</p></div>
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
        <div className="sec-head"><span className="eyebrow">One membership</span><h2>Everything is included</h2></div>
        <div className="path-grid">
          <div className="tier"><h3>The live rhythm</h3><p>Weekly Meditation Mondays, the monthly lecture and seasonal workshops, live on Zoom and recorded.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--ochre)' }}><h3>The whole library</h3><p>Every course, lecture and workshop in the archive, from classical yoga philosophy to somatics, Tantra and the wider contemplative world.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--pine)' }}><h3>Guided pathways</h3><p>Curated routes through the library, organized around the questions people actually bring to practice.</p></div>
        </div>
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
        <PricingCards prices={site.prices} links={site.links} />
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
