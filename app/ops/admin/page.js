import { listTasks } from '@/lib/ops/motion';
import { loadTeam, dedupe, needsOwner, ESCALATE_DAYS, addDays } from '@/lib/ops/tasks';
import { todayET } from '@/lib/events';
import Shell, { opsUser } from '../Shell';
import TaskList from '../TaskList';
import SiteEditor from '../content/SiteEditor';
import { tableOf } from '@/lib/ops/sitetables';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Embodied Philosophy', robots: { index: false, follow: false } };

// What is broken or unowned? Director only.
export default async function Admin({ searchParams }) {
  const user = await opsUser(u => u.director);
  const sp = await searchParams;
  const settings = tableOf(sp?.t)?.scope === 'admin' ? sp.t : 'templates';
  let tasks = [], error = '';
  try { tasks = dedupe(await listTasks()); } catch (e) { error = e.message; }
  const allTeam = await loadTeam().catch(() => []);
  const roleNames = {};
  for (const m of allTeam) for (const r of m.roles) (roleNames[r] ||= []).push(m.name);
  const teamNames = allTeam.filter(m => String(m.type).toLowerCase() !== 'teacher').map(m => m.name);
  const byDue = (a, b) => (a.due || '9').localeCompare(b.due || '9');
  const triage = tasks.filter(needsOwner).sort(byDue);
  const cutoff = addDays(todayET(), -ESCALATE_DAYS);
  const late = tasks.filter(t => !t.completed && !needsOwner(t) && t.due && t.due <= cutoff).sort(byDue);
  const listProps = { showWho: true, team: teamNames, roleNames };

  return (
    <Shell user={user} current="admin" eyebrow="Triage and settings · director only" title="Admin">
      {error && <p className="ops-note">Couldn’t load tasks from Motion right now ({error}).</p>}
      <div className="ops-grid">
        <section className="ops-col">
          <h2 className={triage.length ? 'late' : ''}>Needs an owner <span>{triage.length}</span></h2>
          <p className="ops-empty">Tasks with no one named yet. Assign them here, or name the teacher or host on the Master Schedule and the next sync moves the task to them.</p>
          <TaskList tasks={triage} {...listProps} assign empty="Every open task has an owner." />
          <h2>{ESCALATE_DAYS}+ days overdue <span>{late.length}</span></h2>
          <p className="ops-empty">These also show on your Home. Owners get one reminder email at 3 days overdue.</p>
          <TaskList tasks={late} {...listProps} empty="Nothing is a week or more overdue." />
        </section>
        <aside className="ops-col">
          <h2>Automation health</h2>
          <p className="ops-empty">Coming later: Make runs, reminder sends and social posts. For now, run the daily job’s preview by hand: <code>/api/ops/daily?preview=7&amp;key=…</code></p>
          <h2>Settings</h2>
          <p className="ops-empty">Task templates, track defaults, the team and resources are edited below. Changes to templates apply on the next daily sync.</p>
        </aside>
      </div>
      <h2 className="ops-sub" id="settings">Settings</h2>
      <SiteEditor scope="admin" initial={settings} base="/ops/admin?" />
    </Shell>
  );
}
