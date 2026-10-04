import PageHero from '@/components/PageHero';
import { getSite } from '@/lib/content';
export const metadata = { title: 'Contact — Embodied Philosophy' };
export default async function Contact() {
  const site = await getSite();
  return (
    <>
      <PageHero eyebrow="Contact" title="We’d love to hear from you." img="lady-kohl" ground="slate"
        lede="Questions about a course, your membership, or something else? Write to us and a member of the team will reply within two working days." />
      <section className="sec"><div className="wrap contact-grid">
        <div className="card"><h3>General questions</h3><p>Courses, programs, partnerships and press.</p><a className="btn btn-primary" href="mailto:hello@embodiedphilosophy.com">hello@embodiedphilosophy.com</a></div>
        <div className="card"><h3>Your account</h3><p>Sign in to your courses, update payment details, or manage your membership.</p><a className="btn btn-ghost" href={site.links.signIn}>Sign in</a></div>
        <div className="card"><h3>Need a lower price?</h3><p>We offer a sliding scale and a BIPOC rate for most programs. Just ask.</p><a className="btn btn-ghost" href="mailto:hello@embodiedphilosophy.com?subject=Sliding%20scale">Ask about the sliding scale</a></div>
      </div></section>
    </>
  );
}
