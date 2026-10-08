import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/ops/auth';
import { listTasks } from '@/lib/ops/motion';
import { visibleTo, bucket, meetingsFor, loadTeam, dedupe, needsOwner } from '@/lib/ops/tasks';
import { longDate } from '@/lib/dates';
import TaskList from './TaskList';
import { onboardingState } from '@/lib/teach';
import { upcomingSocial } from '@/lib/social';
import { teamMeetingsFor } from '@/lib/ops/teamcal';

export const dynamic = 'force-dynamic';

// Staff tools linked from the dashboard header (teachers don't see these)
const SOCIAL_PREVIEW_URL = process.env.OPS_SOCIAL_PREVIEW_URL
  || 'https://script.google.com/a/macros/embodiedphilosophy.com/s/AKfycbwnxnP24WZq9iLSgh-mi6J8qFaLTszXyzvzusoqX7vXPn7Q6bWdEN3nOiCdClUjY4p-iw/exec';
const isStaff = u => !!u && (u.director || (!u.newTeacher && String(u.type || '').toLowerCase() !== 'teacher'));
const shortDate = s => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const shortTime = t => {
  const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  const h = +m[1], ap = h >= 12 ? 'pm' : 'am', h12 = h % 12 || 12;
  return `${h12}${m[2] === '00' ? '' : ':' + m[2]}${ap} ET`;
};

export default async function Ops({ searchParams }) {
  const user = await currentUser();
  const sp0 = await searchParams;
  if (!user) redirect('/ops/login');
  // Teachers finish onboarding first (bio, headshot, course page, Circle, dashboard tour)
  if (!user.director && (user.newTeacher || String(user.type).toLowerCase() === 'teacher') && !sp0?.skip) {
    const st = await onboardingState(user.email).catch(() => null);
    if (st?.needed) redirect('/teach');
  }
  const sp = await searchParams;
  const allTeam = await loadTeam().catch(() => []);
  const team = user.director ? allTeam : [];
  // Directors can look at the dashboard as any one person
  const viewing = user.director && sp?.person ? team.find(t => t.name === sp.person) || user : user;
  const asUser = viewing === user ? user : { ...viewing, director: false };

  let tasks = [], error = '';
  try { tasks = dedupe(visibleTo(asUser, await listTasks())); } catch (e) { error = e.message; }
  // Director's own view: tasks nobody owns go to a triage list instead of the main lists
  const triageView = user.director && viewing === user;
  const triage = triageView ? tasks.filter(needsOwner).sort((a, b) => (a.due || '9').localeCompare(b.due || '9')) : [];
  const b = bucket(triageView ? tasks.filter(t => !needsOwner(t)) : tasks);
  // Who's behind a role label (Marketing → Jacob, Rebecka), and who you can hand a task to
  const roleNames = {};
  for (const m of allTeam) for (const r of m.roles) (roleNames[r] ||= []).push(m.name);
  const teamNames = allTeam.filter(m => String(m.type).toLowerCase() !== 'teacher').map(m => m.name);
  const listProps = { showWho: user.director && viewing === user, team: teamNames, roleNames };
  // Programming this week: staff see everything on the Master Schedule, teachers see their own events
  const programming = await meetingsFor(asUser, 6, { all: isStaff(asUser) }).catch(() => []);
  // Team meetings: Google Calendar events this person is a guest on (next two weeks)
  const team2 = await teamMeetingsFor(asUser, 14).catch(e => ({ meetings: [], error: e.message }));
  const first = (user.name || 'there').split(' ')[0];
  // Staff see the next nine social posts (read-only; edits happen in the social dashboard)
  const social = isStaff(user) ? await upcomingSocial(9).catch(e => ({ posts: [], error: e.message })) : null;

  return (
    <main className="ops">
      <header className="ops-top">
        <a href="/ops" className="ops-logo"><img src="/brand/ep-mark-black.png" alt="Embodied Philosophy" width="34" height="36" /></a>
        {isStaff(user) && (
          <nav className="ops-nav" aria-label="Staff tools">
            <a href="/ops" aria-current="page">Tasks</a>
            <a href={SOCIAL_PREVIEW_URL} target="_blank" rel="noopener">Social preview ↗</a>
          </nav>
        )}
        <div className="ops-who">{user.name}{user.director && ' · Director'} · <a href="/api/ops/logout">Sign out</a></div>
      </header>

      <div className="ops-head">
        <h1>{viewing === user ? `Hello, ${first}` : viewing.name}</h1>
        {user.director && (
          <form className="ops-view" action="/ops">
            <label>View as{' '}
              <select name="person" defaultValue={sp?.person || ''}>
                <option value="">Everyone</option>
                {team.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </label>
            <button className="btn btn-ghost">Show</button>
          </form>
        )}
      </div>
      {error && <p className="ops-note">Couldn’t load tasks from Motion right now ({error}).</p>}

      <div className="ops-grid">
        <section className="ops-col">
          {triage.length > 0 && (
            <details className="ops-triage">
              <summary><h2>Needs an owner <span>{triage.length}</span></h2></summary>
              <p className="ops-empty">Tasks with no one named yet. Assign them here, or name the teacher or host on the Master Schedule.</p>
              <TaskList tasks={triage} {...listProps} assign empty="" />
            </details>
          )}
          <h2 className="late">Past due <span>{b.pastDue.length}</span></h2>
          <TaskList tasks={b.pastDue} {...listProps} empty="Nothing past due." />
          <h2>This week <span>{b.thisWeek.length}</span></h2>
          <TaskList tasks={b.thisWeek} {...listProps} empty="Nothing due this week." />
          <h2>Coming up</h2>
          <TaskList tasks={b.upcoming} {...listProps} empty="Nothing scheduled yet." />
          {b.done.length > 0 && (<><h2>Recently done</h2><TaskList tasks={b.done} {...listProps} done /></>)}
        </section>
        <aside className="ops-col">
          <h2>Programming this week <span>{programming.length || ''}</span></h2>
          {programming.length === 0 ? <p className="ops-empty">No programming in the next seven days.</p> : (
            <ul className="ops-meet">
              {programming.map(m => (
                <li key={m.id}>
                  <div className="d">{longDate(m.date)}{m.time ? ` · ${m.time}` : ''}</div>
                  <div className="t">{m.title}</div>
                  <div className="w">{[m.teachers && `Teaching: ${m.teachers}`, m.course_host && `Host: ${m.course_host}`].filter(Boolean).join(' · ') || m.owner}</div>
                  {m.join_url
                    ? <div className="z">Zoom: <a href={m.join_url} target="_blank" rel="noopener">{m.join_url}</a></div>
                    : <div className="z">No Zoom link yet{user.director ? ' (add it in the Event Details Zoom Link column, or set Zoom to one-off or series)' : ''}.</div>}
                </li>
              ))}
            </ul>
          )}
          <h2>Team meetings <span>{team2.meetings.length || ''}</span></h2>
          {team2.error ? <p className="ops-empty">Couldn’t load team meetings: {team2.error}</p>
            : team2.meetings.length === 0 ? <p className="ops-empty">No team meetings you’re invited to in the next two weeks.</p> : (
            <ul className="ops-meet">
              {team2.meetings.map(m => (
                <li key={m.id}>
                  <div className="d">{m.day} · {m.time}</div>
                  <div className="t">{m.title}</div>
                  {m.who && <div className="w">With {m.who}</div>}
                  {m.link && <div className="z">Join: <a href={m.link} target="_blank" rel="noopener">{m.link}</a></div>}
                </li>
              ))}
            </ul>
          )}
          {social && (
            <section className="ops-social" aria-labelledby="ops-social-h">
              <div className="ops-social-head">
                <h2 id="ops-social-h">Social: next {social.posts.length || 9} posts</h2>
                <a href={SOCIAL_PREVIEW_URL} target="_blank" rel="noopener">Open social dashboard ↗</a>
              </div>
              {social.error ? <p className="ops-empty">Couldn’t load the social plan: {social.error}</p>
                : social.posts.length === 0 ? <p className="ops-empty">No posts scheduled yet.</p> : (
                <ul className="ops-social-grid">
                  {social.posts.map(p => {
                    const story = /story/i.test(p.platforms) && !/feed/i.test(p.platforms);
                    const flag = !p.thumb ? 'No image yet' : p.review !== 'Kept' ? 'Image not reviewed' : '';
                    return (
                      <li key={p.id}>
                        <a href={SOCIAL_PREVIEW_URL} target="_blank" rel="noopener" title={(p.caption || p.event || '').slice(0, 220)}>
                          <span className="img">
                            {p.thumb ? <img src={p.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="none">No image</span>}
                            <span className="tag">{story ? 'Story' : 'Feed'}</span>
                          </span>
                          <span className="when">{shortDate(p.date)} · {shortTime(p.time)}</span>
                          <span className={`meta${flag ? ' flag' : ''}`}>{[p.status, flag].filter(Boolean).join(' · ')}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
