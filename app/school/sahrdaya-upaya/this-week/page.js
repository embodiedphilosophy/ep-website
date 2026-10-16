import { redirect } from 'next/navigation';
import { menteeFromCookie } from '@/lib/mentee/load';
import { missingReason } from '@/lib/school/session';
import ThisWeek from './ThisWeek';
import './this-week.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'This week · Sahṛdaya Upāya', robots: { index: false, follow: false } };

// "This week" for Sahṛdaya Upāya mentees, drawn inside Circle's own page by the head snippet
// (docs/circle-season-loader.js). Who may see it is checked here and again on every call the page makes.
export default async function Page() {
  const { me, error } = await menteeFromCookie();
  if (!me && error === 'signin') redirect(`/school/sign-in?next=${encodeURIComponent('/school/sahrdaya-upaya/this-week')}&why=${encodeURIComponent(await missingReason())}`);
  if (!me) {
    return (
      <main className="sch-main tw-away">
        <p className="sch-eyebrow">Sahṛdaya Upāya</p>
        <h1>This page is for mentees</h1>
        <p>“This week” is part of the Sahṛdaya Upāya mentorship. If you are a mentee and see this, write to us and we will sort it out.</p>
        <a className="sch-btn" href="https://ss.embodiedphilosophy.com" target="_top">Back to Circle</a>
      </main>
    );
  }
  return <main className="tw"><ThisWeek /></main>;
}
