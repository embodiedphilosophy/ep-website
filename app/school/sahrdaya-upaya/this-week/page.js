import { redirect } from 'next/navigation';
import { menteeFromCookie } from '@/lib/mentee/load';
import { missingReason } from '@/lib/school/session';
import ThisWeek from './ThisWeek';
import './this-week.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'This week · Sahṛdaya Upāya', robots: { index: false, follow: false } };

// Stand-alone view of "This week" for Sahṛdaya Upāya mentees. Inside Circle the page is drawn natively by
// public/circle/this-week.js (no frame); this route is only the direct link. Who may see it is checked here and again on every call the page makes.
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
  return (
    <main className="tw">
      {/* Runs as soon as the page arrives, before React: tells Circle's loader (?epdebug=1 badge) what happened inside the frame */}
      <script dangerouslySetInnerHTML={{ __html: "(function(){var P=window.parent;if(P===window)return;function s(m){try{P.postMessage(m,'https://ss.embodiedphilosophy.com')}catch(e){}}s({ep:'html'});window.addEventListener('error',function(e){var t=e.target&&(e.target.src||e.target.href);s({ep:'error',msg:(e.message||'failed to load')+(t?' '+String(t).split('/').pop().slice(0,40):'')})},true);window.addEventListener('unhandledrejection',function(e){s({ep:'error',msg:'promise: '+String((e.reason&&e.reason.message)||e.reason).slice(0,80)})});setTimeout(function(){s({ep:'drew',ok:!!document.querySelector('.tw-wrap'),text:String(document.body.innerText||'').replace(/\\s+/g,' ').slice(0,60)})},4000)})();" }} />
      <ThisWeek />
    </main>
  );
}
