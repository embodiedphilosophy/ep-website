import './help.css';
import PageHero from '@/components/PageHero';
import HelpCentre from '@/components/HelpCentre';
import { getHelpTopics } from '@/lib/kb';

export const revalidate = 3600;
export const metadata = {
  title: 'Help Centre — Embodied Philosophy',
  description: 'Answers about your Course Dashboard, live sessions, memberships, billing and the legacy platform.',
};

export default async function Help() {
  const topics = await getHelpTopics();
  return (
    <>
      <PageHero eyebrow="Help Centre" title="How can we help?" img="lady-kohl" ground="slate"
        lede="Answers about your Course Dashboard, live sessions, memberships and billing. Can’t find it here? Ether, our support assistant, is in the chat bubble any time." />
      <section className="help-notice">
        <div className="wrap">
          <span className="eyebrow">We’ve moved</span>
          <p>Courses and memberships now live on our new platform. Courses you bought before October 2026 stay on the legacy platform for at least three months: choose <strong>Sign in → Legacy Platform</strong>.</p>
        </div>
      </section>
      <section className="sec"><div className="wrap">
        <HelpCentre topics={topics} />
      </div></section>
    </>
  );
}
