import PageHero from '@/components/PageHero';
import { getSite, getPathways } from '@/lib/content';

export const revalidate = 300;
export const metadata = {
  title: 'Continuing Education for Yoga Teachers — Embodied Philosophy',
  description: 'Earn Yoga Alliance continuing education training hours studying yoga philosophy, the subtle body, mantra and meditation with leading scholars and practitioners. Certificates included.',
};

const YA_URL = 'https://help.yogaalliance.org/s/article/Does-Yoga-Alliance-have-any-Continuing-Education-requirements-for-Registered-Yoga-Teachers-What-happens-if-I-cannot-complete-them';
const FAQ = [
  ['Do these hours count toward my Yoga Alliance requirement?', 'Registered teachers complete continuing education in Yoga Alliance’s educational categories and log the hours themselves. Each pathway lists its category and hours, and your certificate records both, so you can log them as training hours. Yoga Alliance sets the rules and can change them, so check the current requirements for your credential.'],
  ['Can I study entirely online, at my own pace?', 'Yes. Yoga Alliance currently allows all continuing-education training hours to be earned through online learning, and every pathway is self-paced. Live sessions are a bonus, not a requirement.'],
  ['How do I get my certificate?', 'When you complete a pathway, you receive a certificate of completion with your name, the pathway, the hours, the educational category and the date, ready to keep for your records.'],
  ['I’m not registered with Yoga Alliance. Is this still useful?', 'Yes. Many teachers study with us simply to deepen their teaching, and other credentialing bodies may accept the hours. Check with yours.'],
  ['What if I’m already a Wisdom School member?', 'Wisdom School Plus members already have every pathway and CE certificates. If you’re on Wisdom School, you can upgrade to Plus at any time and the remaining value of your plan is credited.'],
];

export default async function ContinuingEducation() {
  const site = await getSite();
  const pathways = (await getPathways()).filter(p => Number(p.ce_hours) > 0);
  const total = pathways.reduce((n, p) => n + Number(p.ce_hours || 0), 0);
  const yacep = String(site.yacep || '').toUpperCase() === 'TRUE';
  // CE certificates come with Wisdom School Plus (ce_price / ce_join in the sheet can override)
  const ceYear = site.prices.ce || site.prices.wisdomPlusYear;
  const joinHref = site.links.ceJoin || site.links.wisdomPlusJoin || site.links.wisdomJoin;
  const priceLine = `${ceYear}/yr`;

  return (
    <>
      <PageHero eyebrow="For yoga teachers" title="Continuing education that deepens your teaching" img="maid-hookah" ground="vermilion" ring="#F2E9D8"
        lede="Earn your Yoga Alliance training hours studying the sources of yoga with leading scholars and practitioners: the Yoga Sūtras, the subtle body, mantra, meditation and more. Self-paced, online, with a certificate for every pathway you complete.">
        {yacep && <p className="upnext" style={{ marginTop: 18 }}><b>Embodied Philosophy is a Yoga Alliance Continuing Education Provider (YACEP).</b></p>}
        <div className="btns" style={{ marginTop: 26 }}>
          <a className="btn btn-primary" href={joinHref}>Start earning hours — {priceLine}</a>
          <a className="btn btn-ghost" href="#pathways">See the pathways</a>
        </div>
      </PageHero>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">How it works</span><h2>Your hours, without the busywork</h2></div>
        <div className="path-grid">
          <div className="tier"><h3>What you need</h3><p>Yoga Alliance currently asks registered teachers for 75 hours of continuing education every three years: 45 teaching and 30 training hours in its educational categories. <a href={YA_URL}>Check the current rules</a>.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--ochre)' }}><h3>Study what matters</h3><p>Choose a pathway, study at your own pace, and bring what you learn straight into your classes. Every pathway lists its hours and category up front.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--pine)' }}><h3>Get your certificate</h3><p>Complete a pathway and receive a certificate of completion with your hours and category, ready to log with Yoga Alliance and keep for your records.</p></div>
        </div>
      </div></section>

      <section className="sec path" id="pathways"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">CE pathways</span><h2>{total > 0 ? `${total} hours across ${pathways.length} pathways` : 'Pathways that count'}</h2>
          <p>Enough to cover your 30 training hours several times over, so you can follow what interests you rather than what’s available.</p></div>
        <div className="pathways">
          {pathways.map(p => (
            <article key={p.title} className="pathway">
              <div className="ce-badges"><span className="ce-hours">{p.ce_hours} CE hours</span>{p.ya_category && <span className="ce-cat">{p.ya_category}</span>}</div>
              <div className="pq">{p.question}</div>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              {p.courseList.length > 0 && <ol>{p.courseList.map(c => <li key={c}>{c}</li>)}</ol>}
            </article>
          ))}
        </div>
      </div></section>

      <section className="sec" id="join"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Join</span><h2>Included with Wisdom School Plus</h2></div>
        <div className="ss-plans" style={{ gridTemplateColumns: '1fr', maxWidth: 520 }}>
          <article className="plan featured">
            <h3>Wisdom School Plus</h3>
            <div className="amt">{ceYear}<span> / year</span></div>
            {site.prices.wisdomPlusMonthly && <p className="plan-sub">or {site.prices.wisdomPlusMonthly} / month</p>}
            <ul className="feat">
              <li className="on"><span aria-hidden="true">✓</span>Every CE pathway, with certificates</li>
              <li className="on"><span aria-hidden="true">✓</span>{total > 0 ? `${total}+ hours of CE-eligible study` : 'CE-eligible study across every pathway'}</li>
              <li className="on"><span aria-hidden="true">✓</span>Meditation Mondays, live every week</li>
              <li className="on"><span aria-hidden="true">✓</span>Monthly lectures and seasonal workshops</li>
              <li className="on"><span aria-hidden="true">✓</span>Certificate programs</li>
            </ul>
            <a className="btn btn-primary" href={joinHref}>Start earning hours</a>
          </article>
        </div>
      </div></section>

      <section className="sec path"><div className="wrap prose">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
        <p style={{ marginTop: 26 }}>Ready for something deeper than CE hours? <a href="/sadhana-school">Sādhana School</a> offers a full year of study and practice.</p>
      </div></section>
    </>
  );
}
