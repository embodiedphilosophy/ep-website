import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/ops/auth';
import { listTasks } from '@/lib/ops/motion';
import { dedupe, needsOwner } from '@/lib/ops/tasks';
import { navFor } from '@/lib/ops/nav';

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

// Header and top nav shared by every ops page. A red count shows only when something needs action.
export default async function Shell({ user, current, title, head, children }) {
  const items = navFor(user);
  const badges = user.director ? { admin: await adminCount() } : {};
  return (
    <main className="ops">
      <header className="ops-top">
        <a href="/ops" className="ops-logo"><img src="/brand/ep-mark-black.png" alt="Embodied Philosophy" width="34" height="36" /></a>
        {items.length > 1 && (
          <nav className="ops-nav" aria-label="Dashboard">
            {items.map(i => (
              <a key={i.key} href={i.href} aria-current={i.key === current ? 'page' : undefined}>
                {i.label}{badges[i.key] ? <span className="ops-badge" aria-label={`${badges[i.key]} need action`}>{badges[i.key]}</span> : null}
              </a>
            ))}
          </nav>
        )}
        <div className="ops-who">{user.name}{user.director && ' · Director'} · <a href="/api/ops/logout">Sign out</a></div>
      </header>
      {(title || head) && (
        <div className="ops-head">
          {title && <h1>{title}</h1>}
          {head}
        </div>
      )}
      {children}
    </main>
  );
}
