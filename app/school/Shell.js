import Link from 'next/link';
import { PROGRAMMES, seasonState } from '@/lib/school/config';

// Sidebar (one group, one row per season) beside the page content
export default function Shell({ programme, seasons, active, children }) {
  return (
    <div className="sch-shell">
      <nav className="sch-side" aria-label={PROGRAMMES[programme]?.title}>
        <p className="sch-group">{PROGRAMMES[programme]?.title}</p>
        <ul>
          {seasons.map(s => (
            <li key={s.slug}>
              <Link href={`/school/${programme}/${s.slug}`} className={`sch-row${s.slug === active ? ' on' : ''}`} aria-current={s.slug === active ? 'page' : undefined}>
                <span>{s.title}</span>
                {seasonState(s) === 'now' && <span className="sch-now">Now</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="sch-main">{children}</main>
    </div>
  );
}
