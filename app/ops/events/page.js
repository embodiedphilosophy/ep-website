import { listTasks } from '@/lib/ops/motion';
import { loadTeam, dedupe, bucket, visibleTo } from '@/lib/ops/tasks';
import { loadCalendar } from '@/lib/calendar';
import { emailsOf, todayET } from '@/lib/events';
import { longDate } from '@/lib/dates';
import { joinUrlFor, seriesLinksOf, upcomingMeetings } from '@/lib/ops/joinurl';
import { readinessRows, WEEKS } from '@/lib/ops/readiness';
import { isTeacher, canEditEvents } from '@/lib/ops/nav';
import { whereOf } from '@/lib/ops/eventfields';
import EventEditor from './EventEditor';
import { AddEvent, Restore } from './EventActions';
import { readRange, toObjects } from '@/lib/google';
import Shell, { opsUser } from '../Shell';
import TaskList from '../TaskList';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Events — Embodied Philosophy', robots: { index: false, follow: false } };

const LABEL = { red: 'At risk', amber: 'Due soon', green: 'On track', grey: 'Nothing due yet' };
const short = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const qs = (sp, extra) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ all: sp?.all, show: sp?.show, ...extra })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/ops/events?${s}` : '/ops/events';
};

// Is each offering ready? One row per event, worst first; its checklist opens in a side drawer.
export default async function Events({ searchParams }) {
  const user = await opsUser();
  const sp = await searchParams;
  const teacherView = isTeacher(user);
  let tasks = [], error = '';
  // Teachers: their own events, and only their own tasks on them
  try { tasks = dedupe(await listTasks()); if (teacherView) tasks = visibleTo(user, tasks); } catch (e) { error = e.message; }
  const rows = await readinessRows(user, tasks, { teacherView }).catch(e => { error ||= e.message; return []; });
  const showAll = sp?.all === '1';
  const shown = showAll ? rows : rows.filter(r => r.status !== 'grey');
  const hidden = rows.length - shown.length;
  const open = rows.find(r => r.key === sp?.event);
  const today = todayET();
  const allTeam = await loadTeam().catch(() => []);
  const roleNames = {};
  for (const m of allTeam) for (const r of m.roles) (roleNames[r] ||= []).push(m.name);
  const teamNames = allTeam.filter(m => String(m.type).toLowerCase() !== 'teacher').map(m => m.name);

  const editor = canEditEvents(user);
  const tracks = editor ? await readRange(process.env.CALENDAR_SHEET_ID, "'Track Defaults'!A1:A50").then(v => toObjects(v).map(r => String(r.track).toUpperCase()).filter(Boolean)).catch(() => []) : [];
  const head = <Filters sp={sp} hidden={hidden} editor={editor} tracks={tracks} />;

  // Cancelled sessions from the last month on, to restore one
  if (sp?.show === 'cancelled' && editor) {
    const from = todayET();
    const gone = (await loadCalendar({ includeCancelled: true }).catch(() => [])).filter(e => /cancel/i.test(e.status) && (e.end_date || e.date) >= from).sort((a, b) => a.date.localeCompare(b.date));
    return (
      <Shell user={user} current="events" title="Events" head={head}>
        <h2 className="ops-sub">Cancelled</h2>
        {gone.length === 0 ? <p className="ops-empty">No upcoming sessions are cancelled.</p> : (
          <ul className="ops-cancelled">{gone.map(e => <li key={e.sched_id}><span>{short(e.date)} · {e.title} <span className="trk">{e.track}</span></span><Restore id={e.sched_id} /></li>)}</ul>
        )}
      </Shell>
    );
  }

  // "Recently done" lives here now, as a filter
  if (sp?.show === 'done') {
    const done = bucket(tasks).done;
    return (
      <Shell user={user} current="events" title="Events" head={head}>
        <h2 className="ops-sub">Recently done</h2>
        <TaskList tasks={done} showWho={!teacherView} done empty="Nothing completed recently." />
      </Shell>
    );
  }

  let links = null;
  if (open) {
    const cal = await loadCalendar().catch(() => []);
    const upcoming = await upcomingMeetings();
    const zoom = await joinUrlFor(open.events[0], seriesLinksOf(cal), upcoming);
    links = { zoom, registration: open.events[0].registration_url, emails: [...new Set(open.events.flatMap(emailsOf))] };
  }

  return (
    <Shell user={user} current="events" title="Events" head={head}>
      {error && <p className="ops-note">Couldn’t load everything right now ({error}).</p>}
      <p className="ops-empty">The next {WEEKS} weeks{teacherView ? ', your events only' : ''}. Readiness comes from each event’s details and its tasks: open one to see what’s missing{canEditEvents(user) ? ' and fix it' : ''}.</p>
      {shown.length === 0 ? <p className="ops-empty" style={{ marginTop: 16 }}>No events in the next {WEEKS} weeks.</p> : (
        <ul className="ops-events">
          {shown.map(r => (
            <li key={r.key} className={r.key === open?.key ? 'is-open' : ''}>
              <a href={qs(sp, { event: r.key })}>
                <span className={`dot ${r.status}`} title={LABEL[r.status]} aria-label={LABEL[r.status]} />
                <span className="date">{short(r.date)}</span>
                <span className="ttl">{r.title}<span className="trk">{r.track}</span></span>
                <span className="ppl">{r.teachers || <i>No teacher yet</i>}</span>
                <span className="cnt">{r.checks.length ? `${r.ready} of ${r.checks.length} ready` : '—'}{r.total ? <><br />{r.done} of {r.total} tasks</> : null}</span>
                <span className="nxt">{r.nextCheck ? `Missing: ${r.nextCheck.label}${r.nextCheck.detail ? ` (${r.nextCheck.detail})` : ''}, due ${short(r.nextCheck.due)}`
                  : r.next ? `Next: ${r.next.name.split(' — ')[0]}${r.next.due ? ` (${short(r.next.due)})` : ''}` : ''}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <aside className="ops-drawer" aria-label={open.title}>
          <a className="close" href={qs(sp)} aria-label="Close">×</a>
          <span className={`pill ${open.status}`}>{LABEL[open.status]}</span>
          <h2>{open.title}</h2>
          <p className="when">{open.events.length > 1 ? open.events.map(e => short(e.date)).join(' · ') : `${longDate(open.date)}${open.end_date && open.end_date !== open.date ? ` – ${longDate(open.end_date)}` : ''}${open.events[0].time ? ` · ${open.events[0].time}` : ''}`}</p>
          {open.checks.length > 0 && (<>
            <h3>Ready <span>{open.ready} of {open.checks.length}</span></h3>
            <ul className="ops-checks">
              {open.checks.map((c, i) => (
                <li key={i} className={c.ready ? 'ok' : c.due < today ? 'late' : 'todo'}>
                  <span className="mk" aria-hidden="true">{c.ready ? '✓' : '○'}</span>
                  <span>{c.label}{open.events.length > 1 && <span className="sub"> · {short(c.event.date)}</span>}
                    {!c.ready && <span className="sub"> · {c.detail ? `${c.detail}, ` : ''}due {short(c.due)}{c.field && canEditEvents(user) ? ` · fix in Edit details` : ''}</span>}</span>
                </li>
              ))}
            </ul>
          </>)}
          {canEditEvents(user) && (
            <EventEditor key={open.key} sessions={open.events.filter(e => e.sched_id).map(e => ({ id: e.sched_id, date: e.date, track: e.track, label: `${short(e.date)} · ${e.title}` }))} />
          )}

          <h3>People</h3>
          <dl>
            <dt>Teaching</dt><dd>{open.teachers || 'Not assigned yet'}</dd>
            <dt>Course host</dt><dd>{open.course_host || '—'}</dd>
            {!teacherView && links.emails.length > 0 && (<><dt>Reminders go to</dt><dd>{links.emails.join(', ')}</dd></>)}
          </dl>

          <h3>Links</h3>
          <dl>
            <dt>Join</dt><dd>{links.zoom ? <a href={links.zoom} target="_blank" rel="noopener">{links.zoom}</a>
              : whereOf(open.events[0].zoom, open.track) === 'circle' ? 'Circle live stream' : 'Zoom link not set yet'}</dd>
            <dt>Registration</dt><dd>{links.registration ? <a href={links.registration} target="_blank" rel="noopener">{links.registration}</a> : '—'}</dd>
            <dt>Website</dt><dd>{open.events[0].website ? <a href="/events" target="_blank" rel="noopener">Listed on /events</a> : 'Not on the website'}</dd>
          </dl>

          <h3>Tasks <span>{open.done} of {open.total} done</span></h3>
          <TaskList tasks={open.tasks.filter(t => !t.completed).sort((a, b) => (a.due || '9').localeCompare(b.due || '9'))}
            showWho={!teacherView} team={teamNames} roleNames={roleNames} short empty={open.total ? 'Everything is done.' : 'No tasks yet. The daily job makes them about four weeks ahead.'} />
          {open.done > 0 && (
            <details className="ops-done">
              <summary>Done ({open.done})</summary>
              <TaskList tasks={open.tasks.filter(t => t.completed)} showWho={!teacherView} short done empty="" />
            </details>
          )}
        </aside>
      )}
    </Shell>
  );
}

function Filters({ sp, hidden, editor, tracks }) {
  const done = sp?.show === 'done', cancelled = sp?.show === 'cancelled';
  return (<>
    <nav className="ops-filters" aria-label="Filter">
      <a href={qs({ all: sp?.all })} aria-current={!done && !cancelled ? 'page' : undefined}>Upcoming</a>
      <a href={qs({}, { show: 'done' })} aria-current={done ? 'page' : undefined}>Recently done</a>
      {editor && <a href={qs({}, { show: 'cancelled' })} aria-current={cancelled ? 'page' : undefined}>Cancelled</a>}
      {!done && !cancelled && (sp?.all === '1'
        ? <a href={qs({})}>Hide events with nothing due</a>
        : hidden > 0 ? <a href={qs({}, { all: '1' })}>Show {hidden} with nothing due yet</a> : null)}
    </nav>
    {editor && <div className="ops-add-wrap"><AddEvent tracks={tracks} /></div>}
  </>);
}
