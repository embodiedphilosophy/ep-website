import { redirect } from 'next/navigation';
import { listTasks } from '@/lib/ops/motion';
import { loadCalendar } from '@/lib/calendar';
import { bucket, meetingsFor, loadTeam, dedupe, needsOwner, forHome, groupByEvent, addDays } from '@/lib/ops/tasks';
import { todayET } from '@/lib/events';
import { onboardingState } from '@/lib/teach';
import { upcomingSocial } from '@/lib/social';
import { teamMeetingsFor } from '@/lib/ops/teamcal';
import { getNote } from '@/lib/ops/note';
import { isStaff, isTeacher } from '@/lib/ops/nav';
import { readinessRows } from '@/lib/ops/readiness';
import Shell, { opsUser } from './Shell';
import TaskList from './TaskList';
import Note from './Note';
import Meetings from './Meetings';
import { flagOf } from './SocialGrid';

const dayLong = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).replace(',', '');
const shortDate = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

export const dynamic = 'force-dynamic';

// Home: only what needs you this week. Everything else is one click away.
export default async function Home({ searchParams }) {
  const user = await opsUser();
  const sp = await searchParams;
  // Teachers finish onboarding first (bio, headshot, course page, Circle, dashboard tour)
  if (isTeacher(user) && !sp?.skip) {
    const st = await onboardingState(user.email).catch(() => null);
    if (st?.needed) redirect('/teach');
  }
  const allTeam = await loadTeam().catch(() => []);
  // Directors can look at Home as any one person
  const viewing = user.director && sp?.person ? allTeam.find(t => t.name === sp.person) || user : user;
  const asUser = viewing === user ? user : { ...viewing, director: false };

  let all = [], error = '';
  try { all = dedupe(await listTasks()); } catch (e) { error = e.message; }
  const mine = forHome(asUser, all).filter(t => !needsOwner(t));
  const b = bucket(mine);
  // Someone is waiting on this person: on their Home whatever the due date
  const blocked = mine.filter(t => !t.completed && t.blockedOn && t.blockedOn === viewing.name && t.due > addDays(todayET(), 7));
  const needsYou = [...b.pastDue, ...b.thisWeek, ...blocked];
  const later = b.upcoming.filter(t => t.due <= addDays(todayET(), 35) && !blocked.includes(t)).length;
  const cal = await loadCalendar().catch(() => []);
  const groups = groupByEvent(needsYou, cal);

  const roleNames = {};
  for (const m of allTeam) for (const r of m.roles) (roleNames[r] ||= []).push(m.name);
  const teamNames = allTeam.filter(m => String(m.type).toLowerCase() !== 'teacher').map(m => m.name);
  const listProps = { showWho: false, team: teamNames, roleNames, short: true };

  const [programming, meetings, note, social] = await Promise.all([
    meetingsFor(asUser, 6, { all: isStaff(asUser) }).catch(() => []),
    teamMeetingsFor(asUser, 7).catch(e => ({ meetings: [], error: e.message })),
    getNote(),
    isStaff(asUser) ? upcomingSocial(9).catch(() => null) : null,
  ]);
  const director = allTeam.find(m => m.director);
  const first = (viewing.name || 'there').split(' ')[0];

  // Director's glance: three counts, each linking to where the detail lives
  let glance = null;
  if (user.director && viewing === user) {
    const rows = await readinessRows(user, all).catch(() => []);
    glance = {
      atRisk: rows.filter(r => r.status === 'red').length,
      unowned: all.filter(needsOwner).length,
    };
  }
  const socialLine = social && !social.error && social.posts.length
    ? (() => { const n = social.posts.filter(p => flagOf(p)).length; return n ? `Social: ${n} of ${social.posts.length} posts still need images` : `Social: the next ${social.posts.length} posts are ready`; })()
    : '';

  const head = user.director && (
    <form className="ops-view" action="/ops">
      <label>View as{' '}
        <select name="person" defaultValue={sp?.person || ''}>
          <option value="">Me</option>
          {allTeam.filter(t => t.email !== user.email).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
        </select>
      </label>
      <button className="chip">Show</button>
    </form>
  );

  return (
    <Shell user={user} current="home" eyebrow={viewing === user ? dayLong(todayET()) : 'Viewing as'} title={viewing === user ? `Hello, ${first}` : viewing.name} head={head}>
      <Note note={note} editable={user.director && viewing === user} author={(director?.name || 'Jacob').split(' ')[0]} />
      {error && <p className="ops-note">Couldn’t load tasks from Motion right now ({error}).</p>}

      {glance && (
        <div className="ops-glance">
          <a href="/ops/events" className={glance.atRisk ? 'is-bad' : ''}><b>{glance.atRisk}</b> event{glance.atRisk === 1 ? '' : 's'} at risk</a>
          <a href="/ops/admin" className={glance.unowned ? 'is-bad' : ''}><b>{glance.unowned}</b> unowned task{glance.unowned === 1 ? '' : 's'}</a>
          <a href="/ops/admin"><b>–</b> automation errors <span className="hint">(not tracked yet)</span></a>
        </div>
      )}

      <div className="ops-grid">
      <section className="ops-col">
        <h2 className={b.pastDue.length ? 'late' : ''}>Needs you <span>{needsYou.length}</span></h2>
        {needsYou.length === 0 ? <p className="ops-empty">Nothing overdue or due this week.</p> : groups.map(g => (
          <div className="ops-group" key={g.key || 'other'}>
            <h3>{g.title} <span>{g.date ? `· ${shortDate(g.date)} ` : ''}— {g.tasks.length} task{g.tasks.length === 1 ? '' : 's'}</span></h3>
            <TaskList tasks={g.tasks} {...listProps} short={!!g.key} empty="" />
          </div>
        ))}
        {later > 0 && <p className="ops-more"><a href="/ops/events">{later} more in the next 4 weeks →</a></p>}
        {socialLine && <p className="ops-more"><a href="/ops/content">{socialLine} →</a></p>}
      </section>

      <aside className="ops-col">
        <Meetings programming={programming} team={meetings} director={user.director} stacked />
        {isTeacher(user) && <p className="ops-more"><a href="/ops/team">Contacts and your teacher guide →</a></p>}
      </aside>
      </div>
    </Shell>
  );
}
