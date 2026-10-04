import PageHero from '@/components/PageHero';
import Events from '@/components/Events';
import { getEvents } from '@/lib/events';
import { longDate } from '@/lib/dates';
import { site } from '@/lib/site';
export const revalidate = 300;
export const metadata = { title: 'Sādhana School 2026–27 — Embodied Philosophy' };
export default async function SadhanaSchool() {
  const events = (await getEvents()).filter(e => e.program === 'sadhana');
  const start = events.find(e => /begins/i.test(e.title));
  return (
    <>
      <PageHero eyebrow="The Flagship · 2026–2027" title="Sādhana School" img="holyman-tigers" ground="vermilion" ring="#F2E9D8"
        lede={`“${site.sadhanaTheme}.” A year of guided study and daily practice in the non-dual Tantra of Kashmir, with a community of serious practitioners walking the path together.`}>
        {start && <p className="upnext" style={{ marginTop: 18 }}><b>Classes begin:</b> {longDate(start.date)}</p>}
        <div className="btns" style={{ marginTop: 22 }}>
          <a className="btn btn-primary" href={site.links.sadhanaYear}>Enroll for the year — {site.prices.sadhanaYear}</a>
          <a className="btn btn-ghost" href={site.links.sadhanaSemester}>Join a single semester — from {site.prices.sadhanaSemesterFrom}</a>
        </div>
      </PageHero>
      <section className="sec"><div className="wrap">
        <div className="sec-head"><h2>The shape of the year</h2>
          <p>Four eight-week semesters move through the philosophy of recognition (Pratyabhijñā), rasa theory and Tantric meditation, each with live teaching, guided practice and reflection.</p></div>
        <div className="path-grid">
          <div className="tier"><h3>Daily practice</h3><p>Sahṛdaya Meditation with the haṃsa breath-mantra as the spine of the year, supported by a practice portfolio and reflection prompts.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--ochre)' }}><h3>Study</h3><p>Close reading of primary texts in fresh translation, with the Sādhaka’s Sourcebook as your companion volume.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--pine)' }}><h3>Community</h3><p>Eight weekend workshops included in tuition, a member community, and recordings of every session.</p></div>
        </div>
      </div></section>
      <section className="sec path"><div className="wrap">
        <div className="sec-head"><h2>Key dates</h2></div>
        <Events events={events} limit={12} />
      </div></section>
      <section className="sec"><div className="wrap prose">
        <h2>Questions before you enroll?</h2>
        <p>Write to us at <a href="mailto:hello@embodiedphilosophy.com">hello@embodiedphilosophy.com</a>. Sliding-scale places and a BIPOC rate are available.</p>
      </div></section>
    </>
  );
}
