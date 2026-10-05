import PageHero from '@/components/PageHero';
import Collage from '@/components/Collage';
import Events from '@/components/Events';
import { getEvents } from '@/lib/events';
import { getSeasons } from '@/lib/seasons';
import { getSite, getTestimonials } from '@/lib/content';
import { longDate, month, day } from '@/lib/dates';

export const revalidate = 300;
export const metadata = {
  title: 'Sādhana School — Embodied Philosophy',
  description: 'A year of guided study and daily practice in the non-dual Śākta-Śaiva tradition, in three eight-week seasons and a summer immersion.',
};

const statusLabel = s => s.status === 'live' ? `In session · week ${s.week} of ${s.total}` : s.status === 'done' ? 'Completed · recordings available' : null;

const FAQ = [
  ['Do I have to attend live?', 'No. Each season meets live once a week for two hours, and recordings are posted within one or two business days. Live attendance is only required for those pursuing teacher training.'],
  ['Who is Sādhana School for?', 'Seekers, practitioners, scholars, and new and seasoned yoga teachers who want to study the tradition deeply and commit to a daily practice. No Sanskrit or prior study is needed; the fall season is designed as a starting point.'],
  ['Can I join for just one season?', 'Yes. Each season stands on its own, and you can join any of them. The full year includes all three seasons and the summer immersion, at a saving.'],
  ['Can I earn continuing education credits?', 'If you hold a certification as a yoga teacher, therapist or counselor, Sādhana School hours may count toward continuing education. Check with your certifying body.'],
  ['What if it isn’t right for me?', 'Refund requests within 30 days of purchase are honored in full. Write to hello@embodiedphilosophy.com.'],
];

export default async function SadhanaSchool() {
  const site = await getSite();
  const { seasons, current, next, featured } = await getSeasons('sadhana');
  const events = (await getEvents()).filter(e => e.program === 'sadhana');
  const quotes = (await getTestimonials('sadhana')).slice(0, 3);
  const year = featured?.school_year || '';
  const enrollHref = featured?.registration_url || site.links.sadhanaSemester;

  return (
    <>
      <PageHero eyebrow={`Sādhana School${year ? ` · ${year}` : ''}`} title="Sādhana School" img="holyman-tigers" ground="vermilion" ring="#F2E9D8"
        lede="A year of guided study and daily practice in the non-dual Śākta-Śaiva tradition of Kashmir. Three eight-week seasons and a summer immersion, with a community of serious practitioners walking the path together.">
        {current && <p className="upnext" style={{ marginTop: 18 }}><b>Now in session:</b> {current.key}, {current.title} (week {current.week} of {current.total})</p>}
        {next && <p className="upnext" style={{ marginTop: current ? 6 : 18 }}><b>Now enrolling:</b> {next.key}, {next.title}. Begins {longDate(next.start)}</p>}
        <div className="btns" style={{ marginTop: 22 }}>
          <a className="btn btn-primary" href={site.links.sadhanaYear}>Enroll for the year — {site.prices.sadhanaYear}</a>
          <a className="btn btn-ghost" href={enrollHref}>Join {next ? next.key : 'a season'} — {featured?.price || site.prices.sadhanaSemesterFrom}</a>
        </div>
      </PageHero>

      {featured && (
        <section className="sec" id="season"><div className="wrap season-feature">
          <div className="season-art"><Collage img={featured.image || 'mirror'} ground={featured.ground || 'slate'} className="season-collage" /></div>
          <div>
            <span className="eyebrow">{featured.status === 'live' ? 'Now in session' : 'Next season'} · {featured.key}</span>
            <h2 className="season-title">{featured.title}</h2>
            {featured.texts && <p className="season-texts">{featured.texts}</p>}
            <p className="season-desc">{featured.description}</p>
            <ul className="season-facts">
              <li><b>Dates</b>{longDate(featured.start)} – {longDate(featured.end)}</li>
              {featured.meeting && <li><b>Meets</b>{featured.meeting}</li>}
              {featured.format && <li><b>Format</b>{featured.format}</li>}
              {featured.teachers && <li><b>With</b>{featured.teachers}</li>}
            </ul>
            {featured.sessions.length > 1 && (
              <div className="season-sessions" aria-label="Session dates">
                {featured.sessions.map((d, i) => <span key={d} className={featured.status === 'live' && i < featured.week ? 'past' : ''}><b>{month(d)}</b> {day(d)}</span>)}
              </div>
            )}
            <div className="btns" style={{ marginTop: 24 }}>
              <a className="btn btn-primary" href={enrollHref}>Enroll in {featured.key}{featured.price ? ` — ${featured.price}` : ''}</a>
              <a className="btn btn-ghost" href={site.links.sadhanaYear}>Or the full year — {site.prices.sadhanaYear}</a>
            </div>
          </div>
        </div></section>
      )}

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The year at a glance</span><h2>{year ? `${year}: ` : ''}{site.sadhanaTheme}</h2>
          <p>Take the whole arc, or step in wherever you’re called. Every season stands on its own, and past seasons stay available on demand.</p></div>
        <div className="season-grid">
          {seasons.map(s => (
            <article key={s.key} className={`season-card ${s.status}`}>
              <div className="season-when">{s.key}</div>
              {statusLabel(s) ? <span className={`season-badge ${s.status}`}>{statusLabel(s)}</span>
                : s === next ? <span className="season-badge next">Enrolling now</span> : <span className="season-badge">Begins {longDate(s.start)}</span>}
              <h3>{s.title}</h3>
              <p className="season-texts">{s.texts}</p>
              <p className="season-meta">{longDate(s.start)} – {longDate(s.end)}{s.meeting ? ` · ${s.meeting}` : ''}</p>
            </article>
          ))}
        </div>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">How it works</span><h2>Study, practice, community</h2></div>
        <div className="path-grid">
          <div className="tier"><h3>Daily practice</h3><p>Sahṛdaya Meditation, with the haṃsa breath-mantra at its heart, is the spine of the year. The practice imperative is simple: sit every day, and let the study feed the sitting.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--ochre)' }}><h3>Close study</h3><p>Each season is anchored in a primary text, read in fresh translation with its commentaries, in weekly two-hour sessions that move between philosophy, practice and discussion.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--pine)' }}><h3>Community</h3><p>Live weekend workshops, recordings of every session, and a member community in Circle where questions, insights and friendships continue between classes.</p></div>
        </div>
        <div className="resources">
          <h3>Your companions for the year</h3>
          <ul className="plain">
            <li><b>The Practice Portfolio</b>: a simple record of your daily practice, so you can see your sādhana take shape.</li>
            <li><b>The Inner Travelogue</b>: reflection prompts for each week, to turn experience into understanding.</li>
            <li><b>The Sādhaka’s Sourcebook</b>: the companion volume of texts, translations and practices for the year.</li>
          </ul>
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Coming up</span><h2>Sessions and workshops</h2></div>
        <Events events={events} limit={8} links={site.links} photos={site.photos} hideFilters allSessions />
      </div></section>

      {quotes.length > 0 && (
        <section className="sec"><div className="wrap">
          <div className="sec-head"><span className="eyebrow">From students</span><h2>What practitioners say</h2></div>
          <div className="quotes">
            {quotes.map(q => <div className="q" key={q.quote}><div className="mark">“</div><p>{q.quote}</p><div className="who">{q.name}</div><div className="role">{q.role}</div></div>)}
          </div>
        </div></section>
      )}

      <section className="sec path" id="enroll"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Enroll</span><h2>Join for a season or the year</h2></div>
        <div className="ss-plans">
          <article className="plan featured">
            <span className="badge-top">Best value</span>
            <h3>The full year</h3>
            <div className="amt">{site.prices.sadhanaYear}</div>
            <ul className="feat">
              {seasons.map(s => <li key={s.key} className="on"><span aria-hidden="true">✓</span>{s.key}: {s.title}</li>)}
              <li className="on"><span aria-hidden="true">✓</span>Live weekend workshops</li>
              <li className="on"><span aria-hidden="true">✓</span>Recordings of every session</li>
            </ul>
            <a className="btn btn-primary" href={site.links.sadhanaYear}>Enroll for the year</a>
          </article>
          <article className="plan">
            <h3>A single season</h3>
            <div className="amt">{featured?.price || site.prices.sadhanaSemesterFrom}</div>
            <ul className="feat">
              <li className="on"><span aria-hidden="true">✓</span>One eight-week season of your choice</li>
              <li className="on"><span aria-hidden="true">✓</span>Weekly live sessions with recordings</li>
              <li className="on"><span aria-hidden="true">✓</span>The season’s practice materials</li>
            </ul>
            <a className="btn btn-ghost" href={enrollHref}>Join {next ? next.key : 'a season'}</a>
          </article>
        </div>
      </div></section>

      <section className="sec"><div className="wrap prose">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
        <p style={{ marginTop: 28 }}>Not ready for a year of study? Start with <a href="/wisdom-school">Wisdom School</a> or the free <a href={site.links.quiz}>Practice Report</a>.</p>
      </div></section>
    </>
  );
}
