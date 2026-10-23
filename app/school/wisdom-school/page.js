import { redirect } from 'next/navigation';
import { currentMember, missingReason } from '@/lib/school/session';
import { loadWisdomHub } from '@/lib/hub/wisdom-load';
import { tabKey } from '@/lib/hub/wisdom';
import Shell from '../Shell';
import WisdomView from './WisdomView';
import './wisdom.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wisdom School · Embodied Philosophy', robots: { index: false, follow: false } };

// The Wisdom School hub, drawn inside Circle's content area at /c/wisdom-school (public/circle/season-loader.js frames this page,
// the same way it frames the Sādhana School hub). The data is the same one call as GET /api/hub/wisdom-school. Docs: docs/wisdom-hub.md.
export default async function Page({ searchParams }) {
  const { tab, as } = await searchParams;
  const me = await currentMember();
  if (!me) redirect(`/school/sign-in?next=${encodeURIComponent(`/school/wisdom-school${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`)}&why=${encodeURIComponent(await missingReason())}`);

  const notice = text => <Shell><div className="sch-empty-page"><h1>Wisdom School</h1><p>{text}</p></div></Shell>;
  let hub;
  try { hub = await loadWisdomHub({ email: me.email, admin: me.admin, as: as || '' }); }
  catch (e) {
    return notice(e.status === 503 ? 'The Wisdom School hub is being set up. It will open here soon.'
      : e.status === 429 ? 'Circle is busy right now. Please try again in a minute.' : 'We could not reach Circle just now. Please try again in a moment.');
  }
  return <Shell><WisdomView hub={hub} initialTab={tabKey(tab)} /></Shell>;
}
