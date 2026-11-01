import raw from '@/data/mentee-year.json';
import { applyOverrides, CONTENT_TAB } from '@/lib/mentee/yearcontent';
import { readTab, TABS } from '@/lib/mentee/content';
import { scheduleFrom, monthFrom } from '@/lib/mentee/year';
import { segments, nextSteps, currentMonth, daysUntil, PROJECTS } from '@/lib/ops/menteeyear';
import { todayET } from '@/lib/events';
import { front as manualFront, partParam, updated as manualUpdated } from '@/lib/school/manual';
import Shell from '../Shell';
import Manual from './Manual';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  return { title: sp?.tab === 'manual' ? 'The formation manual · Sahṛdaya Upāya' : 'The mentee year · Sahṛdaya Upāya', robots: { index: false, follow: false } };
}

const CIRCLE = 'https://ss.embodiedphilosophy.com/c/mentorship';
const dayFmt = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(',', '');
const Rich = ({ text }) => segments(text).map((x, i) => x.t === 'b' ? <b key={i}>{x.s}</b> : x.t === 'i' ? <i key={i}>{x.s}</i> : x.t === 'q' ? <span key={i} className="my-q"><Rich text={x.s} /></span> : x.t === 'd' ? <span key={i} className="my-d">{x.s}</span> : x.s);
const Proj = ({ p }) => <span className={`sch-my-proj ${p}`}><i />{PROJECTS[p]}</span>;
const Back = () => <a className="sch-btn ghost" href={CIRCLE} target="_top">← Back to your page in Circle</a>;

// The mentee year as a plain page (not drawn inside Circle): the rhythm, a typical month, month by month, the dated steps, one-to-ones.
// Anyone with the link can read it: it holds no personal data (your partners and your ticks are on your page in Circle).
const PDF = '/school/sahrdaya-upaya-formation-manual.pdf';
const upd = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const Download = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 8 }}><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" /></svg>;
const Tabs = ({ tab }) => <nav className="my-tabs" aria-label="Page sections"><a href="?tab=manual" aria-current={tab === 'manual' ? 'page' : undefined}>The formation manual</a><a href="?tab=year" aria-current={tab === 'year' ? 'page' : undefined}>The mentee year</a></nav>;

export default async function MenteeYearPage({ searchParams }) {
  const sp = await searchParams, tab = sp?.tab === 'manual' ? 'manual' : 'year';
  if (tab === 'manual') {
    return (
      <Shell>
        <div className="sch-my" id="top">
          <p className="sch-eyebrow">Sahṛdaya Upāya · 2026–27 cohort</p>
          <h1>The formation manual</h1>
          <p className="sch-my-lede">The working handbook for apprentices and mentors: the program, the year, the ajapā-haṃsa practice, the three-session process and certification, with the Sanskrit sources on haṃsa in full.</p>
          <p className="mn-meta">{manualFront.edition.replace('First Edition', 'First edition')} · a first draft{manualUpdated ? ` · Updated ${upd(manualUpdated)}` : ''}</p>
          <div className="mn-acts" id="pdf"><Back /><a className="sch-btn" href={PDF} download><Download />Download the PDF</a><span className="mn-pdfnote">PDF · first edition, Nov 2026</span></div>
          <Tabs tab={tab} />
          <Manual part={partParam(sp?.part)} />
        </div>
      </Shell>
    );
  }
  // Staff edit the steps, each month's theme and focus, and the wording in Ops → Mentee year; those edits live in sheet tabs and are laid over data/mentee-year.json
  const [textRows, schedRows, monthRows] = await Promise.all([readTab(CONTENT_TAB).catch(() => []), readTab(TABS.schedule).catch(() => []), readTab(TABS.months).catch(() => [])]);
  const data = applyOverrides(raw, textRows), steps = scheduleFrom(schedRows).steps;
  data.months = data.months.map(m => { const f = monthFrom(monthRows, m.id); return f ? { ...m, theme: f.theme, focus: f.focus } : m; });
  const today = todayET(), month = currentMonth(data.months, today), next = nextSteps(steps, today, 3);
  return (
    <Shell>
      <div className="sch-my" id="top">
        <p className="sch-eyebrow">Sahṛdaya Upāya · 2026–27 cohort</p>
        <h1>The mentee year</h1>
        <p className="sch-my-lede">{data.lede}</p>
        <p><Back /></p>
        <Tabs tab={tab} />
        <nav className="sch-my-toc" aria-label="Sections"><a href="#rhythm">The rhythm</a><a href="#week">A typical month</a><a href="#months">Month by month</a><a href="#projects">Final projects</a><a href="#one-to-ones">One-to-ones</a></nav>
        {next.length > 0 && <div className="sch-my-now"><b>Next three project steps</b><ul>{next.map((s, i) => <li key={i}><span className="d">{dayFmt(s.date)}</span> <Proj p={s.project} /> {s.title} <small>({daysUntil(s.date, today) === 0 ? 'today' : `in ${daysUntil(s.date, today)} days`})</small></li>)}</ul><p><small>Tick them off on your page in Circle.</small></p></div>}

        <section id="rhythm"><h2>The rhythm</h2><p className="sch-my-sub">Five layers, from the daily sit to certification. The lower layers are what keep the upper ones from piling up.</p>
          <div className="sch-my-ladder">{data.rhythm.map(r => <div key={r.level} className="row"><div className="lvl">{r.level}<small>{r.note}</small></div><ul>{r.items.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul></div>)}</div></section>

        <section id="week"><h2>A typical month, week by week</h2><p className="sch-my-sub">The same four-week shape repeats each month. Move the immersion weekend to wherever it falls; everything else stays put.</p>
          <div className="sch-my-weeks">{data.week.map(w => <div key={w.title} className="sch-my-card"><h3>{w.title}</h3><ul>{w.items.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul></div>)}</div></section>

        <section id="months"><h2>Month by month</h2><p className="sch-my-sub">Each card gives the month’s focus, its fixed points and the project steps due. Immersion dates follow the cohort calendar.</p>
          <div className="sch-my-months">{data.months.map(m => (
            <article key={m.id} id={`m-${m.id}`} className={`sch-my-card${month && m.id === month.id ? ' current' : ''}`}>
              <header><div><h3>{m.title}</h3><p className="theme">{m.theme}</p></div>{m.tag && <span className="tag">{m.tag}</span>}</header>
              <p className="focus">{m.focus}</p>
              <ul>{m.items.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul>
              {steps.some(s => s.date.slice(0, 7) === m.id) && <><h4>Project steps due this month</h4><ul className="steps">{steps.filter(s => s.date.slice(0, 7) === m.id).map(s => <li key={s.id}><span className="d">{dayFmt(s.date)}</span> <Proj p={s.project} /> {s.title}</li>)}</ul></>}
            </article>))}</div></section>

        <section id="projects"><h2>Final projects, built from November</h2><p className="sch-my-sub">Two separate pieces, prepared side by side. The talk tests you as a teacher; the offering is what certifies you to teach Sahṛdaya Meditation. Each step is small and dated so nothing waits for July.</p>
          <p className="sch-my-note">{data.spacing}</p>
          <ul className="sch-my-steplist">{steps.map((s, i) => <li key={i} className={s.date < today ? 'past' : ''}><span className="d">{dayFmt(s.date)} {s.date.slice(0, 4)}</span><span><Proj p={s.project} /><b>{s.title}</b><span className="det">{s.detail}</span><span className="ev">Evidence: {s.evidence}</span></span></li>)}</ul></section>

        <section id="one-to-ones"><h2>One-to-ones</h2>
          <div className="sch-my-weeks two"><div className="sch-my-card"><h3>How to book</h3><ol>{data.oneToOne.howTo.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ol></div>
            <div className="sch-my-card"><h3>Booking summary</h3><pre className="sch-my-tpl">{data.oneToOne.template.join('\n')}</pre><p className="sch-my-sub">{data.oneToOne.note}</p></div></div></section>

        <p><Back /></p>
        <p className="sch-my-sub">{data.footer.split('Sahṛdaya Upāya Training Manual (draft)').flatMap((x, i, a) => (i < a.length - 1 ? [x, <a key={i} href="?tab=manual">Sahṛdaya Upāya Training Manual (draft)</a>] : [x]))}</p>
      </div>
    </Shell>
  );
}
