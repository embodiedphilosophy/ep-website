import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { currentMember, missingReason, COOKIE } from '@/lib/school/session';
import { readSession } from '@/lib/member/session';
import { loadMeditationHub } from '@/lib/hub/meditation-load';
import { tabKey } from '@/lib/hub/meditation';
import Shell from '../Shell';
import MeditationView from './MeditationView';
import '../wisdom-school/wisdom.css';
import './meditation.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Meditation Mondays · Embodied Philosophy', robots: { index: false, follow: false } };

// The Meditation Pass hub, drawn inside Circle's content area at /c/meditation-pass (public/circle/season-loader.js frames this page,
// the same way it frames the Wisdom School hub). Only the course's landing page: lesson pages stay Circle's own. The data is the same
// one call as GET /api/hub/meditation. Docs: docs/meditation-hub.md.
export default async function Page({ searchParams }) {
  const { tab, stream, as } = await searchParams;
  const me = await currentMember();
  const want = `/school/meditation-pass${tab ? `?tab=${encodeURIComponent(tab)}${stream ? `&stream=${encodeURIComponent(stream)}` : ''}` : ''}`;
  if (!me) redirect(`/school/sign-in?next=${encodeURIComponent(want)}&why=${encodeURIComponent(await missingReason())}`);

  const notice = text => <Shell><div className="sch-empty-page"><h1>Meditation Mondays</h1><p>{text}</p></div></Shell>;
  let hub;
  try {
    const uid = readSession((await cookies()).get(COOKIE)?.value)?.uid || '';
    hub = await loadMeditationHub({ email: me.email, admin: me.admin, uid, as: as || '' });
  } catch (e) {
    return notice(e.status === 503 ? 'The Meditation Pass hub is being set up. It will open here soon.'
      : e.status === 429 ? 'Circle is busy right now. Please try again in a minute.' : 'We could not reach Circle just now. Please try again in a moment.');
  }
  return <Shell><MeditationView hub={hub} initialTab={tabKey(tab)} initialStream={String(stream || '')} /></Shell>;
}
