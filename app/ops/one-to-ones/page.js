import { oneToOnes } from '@/lib/ops/onetoones';
import Shell, { opsUser } from '../Shell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'One-to-ones — Embodied Philosophy', robots: { index: false, follow: false } };

const when = iso => new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// The booked one-to-ones with what each mentee wrote to prepare (from Calendly's question when they booked).
export default async function OneToOnes() {
  const user = await opsUser(u => !!u.director);
  const r = await oneToOnes({ days: 90 }).catch(e => ({ configured: true, items: [], error: e.message }));
  const without = r.items.filter(x => !x.summary.length).length;
  return (
    <Shell user={user} current="home" eyebrow="Sahṛdaya Upāya" title="One-to-ones">
      {!r.configured && <p className="ops-note">Calendly isn’t connected here yet (CALENDLY_TOKEN). Once it is, each booking appears with what the mentee wrote.</p>}
      {r.error && <p className="ops-note" role="alert">Couldn’t read Calendly just now. Try again shortly.</p>}
      {r.configured && !r.error && (
        <section className="ops-col">
          <h2>Booked <span>{r.items.length}</span></h2>
          <p className="ops-empty">Times are New York. Each mentee is asked, when they book, what they want to work on, discuss or are finding hard.{without ? ` ${without} ${without === 1 ? 'booking has' : 'bookings have'} nothing yet.` : ''}</p>
          {r.items.length === 0 ? <p className="ops-empty">Nothing is booked in the next three months.</p> : (
            <ul className="ops-o2o">{r.items.map(x => (
              <li key={x.uuid} className={x.summary.length ? '' : 'none'}>
                <div className="h"><b>{x.name || x.email}</b><span>{when(x.start)}</span>{x.joinUrl && <a href={x.joinUrl} target="_blank" rel="noopener">Zoom</a>}</div>
                {x.summary.length ? x.summary.map((s, i) => <p key={i}><em>{s.q}</em><br />{s.a}</p>) : <p className="late">No summary yet. Ask them to add a few lines before you meet.</p>}
              </li>
            ))}</ul>
          )}
        </section>
      )}
    </Shell>
  );
}
