import { notFound } from 'next/navigation';
import { getCoursePage } from '@/lib/coursepages';
import { longDate } from '@/lib/dates';

// Course pages teachers write in onboarding (ops app). Live once their Course Pages status is "published".
export const revalidate = 300;

const PROGRAM = { wisdom: 'Wisdom School', sadhana: 'Sādhana School', seasonal: 'Seasonal Sādhana', lrl: 'Living Room Lectures' };
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const fmtLong = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
const initials = n => { const a = String(n || '?').trim().split(/\s+/); return (a[0]?.[0] || '?') + (a.length > 1 ? a[a.length - 1][0] : ''); };

export async function generateMetadata({ params }) {
  const d = await getCoursePage((await params).slug).catch(() => null);
  return d ? { title: `${d.page.title} — Embodied Philosophy`, description: d.page.summary } : { title: 'Course — Embodied Philosophy' };
}

export default async function CoursePage({ params }) {
  const d = await getCoursePage((await params).slug).catch(() => null);
  if (!d) notFound();
  const { page, offering: o, teachers } = d;
  const explore = lines(page.explore);
  return (
    <div className="course-page">
      <div className="t-lp-hero">
        <span className="eyebrow">{PROGRAM[o.program] || o.host || 'Embodied Philosophy'} · Live online</span>
        <h1>{page.title}</h1>
        {page.subtitle && <p className="sub">{page.subtitle}</p>}
        <div className="t-lp-meta">
          <b>{o.end && o.end !== o.start ? `${fmtLong(o.start)} – ${fmtLong(o.end)}` : longDate(o.start)}</b>
          {o.time && <span>{o.time}</span>}{o.price && <span>{o.price}</span>}
          <span>With {teachers.map(t => t.name).join(' & ')}</span>
        </div>
        {o.registration_url && <a className="btn btn-primary" href={o.registration_url}>{o.program === 'wisdom' ? 'Join →' : 'Enroll →'}</a>}
      </div>
      <div className="t-lp-body">
        <div className="t-stack">
          <div><h2>About</h2><p>{page.summary}</p></div>
          {explore.length > 0 && <div><h2>What we’ll explore</h2><ul>{explore.map(x => <li key={x}>{x}</li>)}</ul></div>}
          {page.audience && <div><h2>Who it’s for</h2><p>{page.audience}</p></div>}
          {o.sessions.length > 1 && <div><h2>Sessions</h2><ul>{o.sessions.map(s => <li key={s.id}>{longDate(s.date)}{s.time ? `, ${s.time}` : ''}</li>)}</ul></div>}
        </div>
        <aside className="t-stack">
          {teachers.map(t => (
            <div key={t.name} className="t-lp-teacher">
              {t.photo ? <img className="teacher-photo" src={t.photo} alt={t.name} width="64" height="64" /> : <div className="mono-avatar" aria-hidden="true">{initials(t.name)}</div>}
              <h3>{t.name}</h3>{t.role && <div className="role">{t.role}</div>}<p>{t.bio}</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
