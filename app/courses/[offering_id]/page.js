import { notFound } from 'next/navigation';
import BuyPanel from '@/components/BuyPanel';
import Collage from '@/components/Collage';
import { getCoursePage } from '@/lib/coursepages';
import { getCatalog, getOffering, ACCESS, PROGRAMMES, unlockLine } from '@/lib/catalog';
import { getSite } from '@/lib/content';
import { longDate } from '@/lib/dates';

// A Course Library offering (the Catalog tab), or, failing that, a course page a teacher wrote in onboarding.
export const revalidate = 300;

const PROGRAM = { wisdom: 'Wisdom School', sadhana: 'Sādhana School', seasonal: 'Seasonal Sādhana', lrl: 'Living Room Lectures' };
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const fmtLong = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
const initials = n => { const a = String(n || '?').trim().split(/\s+/); return (a[0]?.[0] || '?') + (a.length > 1 ? a[a.length - 1][0] : ''); };
const ART = { meditation_mondays: ['yogi-shiva', 'navy'], wisdom_school: ['holyman-tigers', 'vermilion'], learning_pathways: ['mirror', 'black'], sadhana_school: ['woman-music', 'slate'], seasonal: ['holyman-tigers', 'vermilion'], on_demand: ['yogi-shiva', 'navy'] };

export async function generateStaticParams() {
  return (await getCatalog().catch(() => [])).map(o => ({ offering_id: o.id }));
}

export async function generateMetadata({ params }) {
  const id = (await params).offering_id;
  const o = await getOffering(id).catch(() => null);
  if (o) return { title: `${o.title} — Embodied Philosophy`, description: o.promise || o.description.slice(0, 160) };
  const d = await getCoursePage(id).catch(() => null);
  return d ? { title: `${d.page.title} — Embodied Philosophy`, description: d.page.summary } : { title: 'Course — Embodied Philosophy' };
}

export default async function CoursePage({ params }) {
  const id = (await params).offering_id;
  const o = await getOffering(id).catch(() => null);
  if (o) return <Offering o={o} />;
  const d = await getCoursePage(id).catch(() => null);
  if (!d) notFound();
  return <Legacy d={d} />;
}

async function Offering({ o }) {
  const site = await getSite().catch(() => null);
  const prog = PROGRAMMES[o.programme], acc = ACCESS[o.access];
  const [img, ground] = ART[o.programme];
  const promise = o.promise || o.description.split(/(?<=[.!?])\s/)[0];
  const pwyc = o.access === 'pwyc';
  const lock = unlockLine(o);
  const nextShown = o.next && o.next >= new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const plus = site?.links?.wisdomPlusJoin;
  return (
    <div className="cl cl-detail" style={{ '--band': prog.color }}>
      <div className="cl-wrap">
        <nav className="cl-crumb" aria-label="Breadcrumb"><a href="/courses">Course Library</a><span>/</span><a href="/courses">{prog.label}</a><span>/</span><span aria-current="page">{o.title}</span></nav>
        <div className="cl-dgrid">
          <article>
            <div className="cl-dtop"><i className="cl-dband" />{o.label && <span className="cl-label">{o.label}</span>}<span className={`cl-badge a-${o.access}`}>{pwyc ? 'Pay what you can' : acc.short}</span></div>
            <h1>{o.title}</h1>
            {promise && <p className="cl-promise">{promise}</p>}
            <p className="cl-teachers">With {o.teachers.map(t => t.name).join(' & ')}</p>
            <p className="cl-meta cl-dmeta">{[o.length, o.format, nextShown && `Starts ${fmtLong(o.next)}`, o.ce && `${o.ce} CE hours`].filter(Boolean).map(x => <span key={x}>{x}</span>)}</p>
            <div className="cl-art"><Collage img={o.cover || img} ground={ground} ring="#EBA329" alt="" className="art" /></div>
            <section><h2>About</h2><p>{o.description}</p></section>
            <section><h2>What’s included</h2><ul className="cl-incl">{o.included.map(x => <li key={x}>{x}</li>)}</ul></section>
            {o.sessions.length > 0 && <section><h2>Sessions</h2><ol className="cl-sessions">{o.sessions.map((s, i) => <li key={i}>{s.date && <time className="cl-meta">{longDate(s.date)}</time>}<span>{s.title}</span></li>)}</ol></section>}
          </article>
          <div className="cl-side">
            <BuyPanel price={pwyc ? 'Pay what you can' : o.priceLabel || ''} note={o.requires === 'year_long' ? lock : !pwyc ? lock : ''}
              checkout={o.checkout} pwyc={pwyc} amounts={o.amounts} cta={o.label === 'MEMBERSHIP' ? 'Join' : 'Enrol'} />
            {(o.access === 'wisdom_school' || o.access === 'ws_plus') && (
              <aside className="cl-upsell">
                <span className="eyebrow light">Wisdom School Plus</span>
                <h3>Study this live, in a small group</h3>
                <p>Plus adds live study groups, the learning pathways and CE hours to your Wisdom School membership.</p>
                <a className="btn btn-light" href={plus || '/wisdom-school'}>See Wisdom School Plus →</a>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legacy({ d }) {
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
