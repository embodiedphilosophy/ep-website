import PageHero from '@/components/PageHero';
import Events from '@/components/Events';
import { getSite } from '@/lib/content';
import EventSignup from '@/components/EventSignup';
import ReplayPlayer from '@/components/ReplayPlayer';
import { getEvents, getPastEvents } from '@/lib/events';
import { longDate } from '@/lib/dates';

export const revalidate = 300;
export const metadata = {
  title: 'Living Room Lectures — Embodied Philosophy',
  description: 'Free monthly talks on the meeting point of the contemplative traditions and contemporary life.',
};
const FORM = process.env.NEXT_PUBLIC_KIT_FORM_LRL || process.env.NEXT_PUBLIC_KIT_FORM_LETTER;
const names = t => String(t || '').split(',').map(s => s.trim()).filter(Boolean);
const withLine = t => { const n = names(t); return n.length ? 'With ' + (n.length > 1 ? n.slice(0, -1).join(', ') + ' & ' + n.at(-1) : n[0]) : ''; };

export default async function LivingRoomLectures() {
  const site = await getSite();
  const upcoming = (await getEvents()).filter(e => e.program === 'lrl');
  const past = (await getPastEvents()).filter(e => e.program === 'lrl' && e.video_id);
  const next = upcoming[0];
  return (
    <>
      <PageHero eyebrow="Free · Live & online" title="Living Room Lectures" img="lady-hair" ground="vermilion" ring="#F2E9D8"
        lede="A free monthly gathering where we explore the meeting point of the contemplative traditions and contemporary life. No commitment: come, think, and practice with us.">
        {next && <p className="upnext" style={{ marginTop: 18 }}><b>Next lecture:</b> {next.title.replace(/^Living Room Lecture:\s*/, '')}, {longDate(next.date)}{next.time ? `, ${next.time}` : ''}</p>}
        <div className="capture" id="signup" style={{ marginTop: 22 }}>
          <EventSignup formId={FORM} eventId={next?.zoom?.toUpperCase?.() === 'TRUE' ? next.id : undefined}
            success={next?.zoom?.toUpperCase?.() === 'TRUE' ? 'You’re signed up. Your personal Zoom link is on its way from Zoom.' : 'You’re signed up. We’ll email you before each lecture.'} />
          <div className="hint">Get the link for every upcoming lecture, and full access to the replays.</div>
        </div>
      </PageHero>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Upcoming</span><h2>Join us live</h2></div>
        <Events events={upcoming} limit={12} hideFilters links={site.links} />
      </div></section>

      <section className="sec path" id="past"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Replays</span><h2>Past lectures</h2>
          <p>Watch the first 15 minutes of any lecture free. Sign up once to unlock every replay in full.</p></div>
        {past.length === 0 ? (
          <div className="events-empty">Replays of past lectures will appear here soon. <a href="#signup">Sign up</a> to hear when they’re available.</div>
        ) : (
          <div className="past-grid">
            {past.map(e => (
              <article className="past" key={e.id || e.title + e.date}>
                <ReplayPlayer videoId={e.video_id} title={e.title} previewMinutes={Number(e.preview_minutes) || 15} formId={FORM} />
                <div className="past-meta">{longDate(e.date)}</div>
                <h3>{e.title.replace(/^Living Room Lecture:\s*/, '')}</h3>
                {e.teachers && <div className="past-with">{withLine(e.teachers)}</div>}
                {e.summary && <p>{e.summary}</p>}
              </article>
            ))}
          </div>
        )}
      </div></section>
    </>
  );
}
