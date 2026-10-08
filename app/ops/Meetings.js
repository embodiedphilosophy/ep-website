import { longDate } from '@/lib/dates';

// "This week": programming and team meetings, side by side
export default function Meetings({ programming, team, director }) {
  return (
    <div className="ops-week">
      <section>
        <h2>Programming <span>{programming.length || ''}</span></h2>
        {programming.length === 0 ? <p className="ops-empty">No programming in the next seven days.</p> : (
          <ul className="ops-meet">
            {programming.map(m => (
              <li key={m.id}>
                <div className="d">{longDate(m.date)}{m.time ? ` · ${m.time}` : ''}</div>
                <div className="t">{m.title}</div>
                <div className="w">{[m.teachers && `Teaching: ${m.teachers}`, m.course_host && `Host: ${m.course_host}`].filter(Boolean).join(' · ') || m.owner}</div>
                {m.join_url
                  ? <div className="z">Zoom: <a href={m.join_url} target="_blank" rel="noopener">{m.join_url}</a></div>
                  : <div className="z">No Zoom link yet{director ? ' (add it in the Event Details Zoom Link column, or set Zoom to one-off or series)' : ''}.</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2>Team meetings <span>{team.meetings.length || ''}</span></h2>
        {team.error ? <p className="ops-empty">Couldn’t load team meetings: {team.error}</p>
          : team.meetings.length === 0 ? <p className="ops-empty">No team meetings you’re invited to this week.</p> : (
          <ul className="ops-meet">
            {team.meetings.map(m => (
              <li key={m.id}>
                <div className="d">{m.day} · {m.time}</div>
                <div className="t">{m.title}</div>
                {m.who && <div className="w">With {m.who}</div>}
                {m.link && <div className="z">Join: <a href={m.link} target="_blank" rel="noopener">{m.link}</a></div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
