import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/ops/auth';
import { listTasks } from '@/lib/ops/motion';
import { dedupe, needsOwner } from '@/lib/ops/tasks';
import { navFor, isTeacher } from '@/lib/ops/nav';

// The signed-in user for an ops page, or off to sign in. `allow` narrows who may open the page.
export async function opsUser(allow = () => true) {
  const user = await currentUser();
  if (!user) redirect('/ops/login');
  if (!allow(user)) redirect('/ops');
  return user;
}

// Director's Admin count: open tasks nobody owns
async function adminCount() {
  try { return dedupe(await listTasks()).filter(needsOwner).length; } catch { return 0; }
}

const initials = name => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
const roleOf = u => u.director ? 'Director' : isTeacher(u) ? 'Teacher' : (String(u.type || '').replace(/^./, c => c.toUpperCase()) || 'Team');

// Sidebar and page header shared by every ops page. A terra count shows only when something needs action.
// eyebrow: the small line over the page title (a date, a range, what the page covers).
export default async function Shell({ user, current, title, eyebrow, head, children }) {
  const items = navFor(user);
  const badges = user.director ? { admin: await adminCount() } : {};
  const link = i => (
    <a key={i.key} href={i.href} aria-current={i.key === current ? 'page' : undefined}>
      {i.label}
      {badges[i.key] ? <span className="ops-badge" aria-label={`${badges[i.key]} need action`}>{badges[i.key]}</span> : null}
    </a>
  );
  const main = items.filter(i => i.group !== 'more'), more = items.filter(i => i.group === 'more');
  return (
    <div className="ops-shell">
      <aside className="ops-side">
        <a href="/ops" className="ops-brand"><img src="/brand/ep-mark-black.png" alt="" width="26" height="27" /><span>EP Ops</span></a>
        {items.length > 1 && <nav className="ops-nav" aria-label="Dashboard">{main.map(link)}</nav>}
        {more.length > 0 && <nav className="ops-nav more" aria-label="More">{more.map(link)}</nav>}
        <div className="ops-me">
          <span className="av" aria-hidden="true">{initials(user.name)}</span>
          <span><b>{user.name}</b><small>{roleOf(user)} · <a href="/api/ops/logout">Sign out</a></small></span>
        </div>
      </aside>
      <main className="ops">
        {(title || head) && (
          <div className="ops-head">
            {title && <div className="ttl">{eyebrow && <span className="ops-eyebrow">{eyebrow}</span>}<h1>{title}</h1></div>}
            {head}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
