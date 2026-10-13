import { notFound } from 'next/navigation';
import BuyPanel from '@/components/BuyPanel';
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
const ART = { meditation_mondays: 'yogi-shiva', wisdom_school: 'holyman-tigers', learning_pathways: 'mirror', sadhana_school: 'woman-music', seasonal: 'holyman-tigers', on_demand: 'yogi-shiva' };

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
  const img = ART[o.programme];
  const promise = o.promise || o.description.split(/(?<=[.!?])\s/)[0];
  const pwyc = o.access === 'pwyc';
  const lock = unlockLine(o);
  const plus = site?.links?.wisdomPlusJoin;
  const signIn = site?.links?.signInSadhana || 'https://ss.embodiedphilosophy.com/sign_in';
  const names = o.teachers.map(t => t.name);
  const t0 = o.teachers[0];
  const meta = [o.length, o.format, o.topics.join(' · '), pwyc ? 'Pay what you can' : o.priceLabel].filter(Boolean);
  return (
    <div className="cl" style={{ '--band': prog.color }}>
      <div className="cl-wrap">
        <nav className="cl-crumb" aria-label="Breadcrumb"><a href="/courses">Course Library</a><span aria-hidden="true">/</span><span>{prog.label}</span><span aria-hidden="true">/</span><span aria-current="page" style={{ color: '#1E1A14' }}>{o.title}</span></nav>

        <section className="cl-hero">
          <div className="cl-hero-l">
            <div className="cl-dbar" />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="eyebrow">{o.label || prog.label}</span>
              <span className={`cl-badge ${pwyc ? 'b-pwyc' : 'b-acc'}`}>{acc.short}</span>
            </div>
            <h1 className="cl-dh1">{o.title}</h1>
            {promise && <p className="cl-dek">{promise}</p>}
            <div className="cl-dt">
              {t0.photo ? <img className="cl-av" src={t0.photo} alt="" width="34" height="34" /> : <span className="cl-av" style={{ background: /^\[/.test(t0.name) ? '#6B6253' : '#20302A' }}>{/^\[/.test(t0.name) ? '?' : initials(t0.name)}</span>}
              <span>with <b>{names.join(' & ')}</b></span>
            </div>
            <div className="cl-dmeta">{meta.flatMap((x, i) => [<span key={i} className={i === meta.length - 1 ? 'price' : ''}>{x}</span>, i < meta.length - 1 && <span key={'d' + i}>·</span>])}</div>
          </div>
          <div className="cl-hero-r">{/* Kalighat cut-out on sand, from the site image set */}
            <img src={o.cover || `/kalighat/${img}.webp`} alt="" width="520" height="440" />
          </div>
        </section>

        <section className="cl-dbody">
          <div className="cl-main">
            <div><h2 className="cl-h2">About this {o.kind === 'Live practice' ? 'practice' : 'course'}</h2><p className="cl-p">{o.description}</p></div>
            <div>
              <h2 className="cl-h2">What’s included</h2>
              <ul className="cl-incl">{o.included.map(x => <li key={x}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A5432A" strokeWidth="2" aria-hidden="true"><path d="M5 12l5 5L19 7" /></svg><span>{x}</span></li>)}</ul>
            </div>
            {o.sessions.length > 0 && (
              <div>
                <h2 className="cl-h2">Sessions</h2>
                <ol className="cl-sess">{o.sessions.map((s, i) => <li key={i}><span className="n">{String(i + 1).padStart(2, '0')}</span><span className="t">{s.title}</span><span className="d">{/^\d{4}-\d{2}-\d{2}$/.test(s.when) ? longDate(s.when) : s.when}</span></li>)}</ol>
              </div>
            )}
          </div>

          <aside className="cl-side" aria-label="Enrol">
            <BuyPanel eyebrow={pwyc ? 'Pay what you can' : acc.label} heading={pwyc ? 'Choose your contribution' : o.priceLabel || 'Join'}
              note={pwyc ? 'Every amount opens the full course. Paying more keeps it open to those who can pay less.' : lock}
              checkout={o.checkout} pwyc={pwyc} amounts={o.amounts.length ? o.amounts : [10, 25, 50]} cta={pwyc ? 'Continue to checkout' : o.label === 'MEMBERSHIP' ? 'Join' : 'Enrol'} signIn={signIn} />
            {(o.access === 'pwyc' || o.access === 'meditation_pass' || o.access === 'wisdom_school') && (
              <div className="cl-pine">
                <span className="k">Go further</span>
                <span className="t">Every Learning Pathway, with <em>Wisdom School Plus</em></span>
                <span className="d">The learning pathways, live study groups and CE hours, on top of Wisdom School.</span>
                <a href={plus || '/wisdom-school'}>See Wisdom School Plus →</a>
              </div>
            )}
            <a className="cl-back" href="/courses">← Back to the Course Library</a>
          </aside>
        </section>
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
