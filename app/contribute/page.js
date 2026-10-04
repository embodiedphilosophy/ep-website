import PageHero from '@/components/PageHero';
export const metadata = { title: 'Contribute — Embodied Philosophy' };
export default function Contribute() {
  return (
    <>
      <PageHero eyebrow="Get involved" title="Contribute to Embodied Philosophy." img="lady-pitcher" ground="navy"
        lede="We are always looking for writers, teachers, scholars, activists and researchers to help shape our school, our journal and our podcast." />
      <section className="sec"><div className="wrap prose">
        <h2>Where you can contribute</h2>
        <ul className="plain">
          <li><b>Tarka Journal.</b> Essays, translations and reflections on yoga philosophy and the contemplative traditions.</li>
          <li><b>Chitheads.</b> Guest suggestions and conversation ideas for the podcast.</li>
          <li><b>Teaching.</b> Courses for Wisdom School, guest sessions in Sādhana School, and new educational offerings.</li>
          <li><b>Behind the scenes.</b> Course hosts, facilitators, proofreaders, editors, and podcast quote-finders.</li>
        </ul>
        <h2>How to get in touch</h2>
        <p>Tell us a little about yourself and what you’d like to contribute, with links to your work, at <a href="mailto:hello@embodiedphilosophy.com?subject=Contributing%20to%20Embodied%20Philosophy">hello@embodiedphilosophy.com</a>.</p>
        <p><a className="btn btn-primary" href="mailto:hello@embodiedphilosophy.com?subject=Contributing%20to%20Embodied%20Philosophy">Get in touch</a></p>
      </div></section>
    </>
  );
}
