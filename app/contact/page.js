import PageHero from '@/components/PageHero';
import AskEther from '@/components/AskEther';
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
        <div className="card"><h3>Ask Ether</h3><p>Looking for the right course, a session time, or where to find something? Our support assistant answers any time of day.</p><AskEther /></div>
        <div className="card"><h3>Your account</h3><p>Go to your course dashboard to join live sessions, watch replays, update payment details, or manage your membership.</p><a className="btn btn-ghost" href={site.links.signInSadhana}>Sign in</a></div>
      </div></section>
    </>
  );
}
