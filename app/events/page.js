import Events from '@/components/Events';
import { getEvents } from '@/lib/events';
export const revalidate = 300;
export const metadata = { title: 'Upcoming events — Embodied Philosophy' };
export default async function EventsPage() {
  const events = await getEvents();
  return (
    <>
      <section className="page-head"><div className="wrap">
        <h1>Upcoming events</h1>
        <p>Free lectures, seasonal immersions, and live sessions inside Wisdom School and Sādhana School.</p>
      </div></section>
      <section className="sec" style={{ paddingTop: 56 }}><div className="wrap">
        <Events events={events} limit={100} />
      </div></section>
    </>
  );
}
