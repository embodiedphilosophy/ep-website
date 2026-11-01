import data from '@/data/mentee-year.json';
import { segments, nextSteps, currentMonth, daysUntil, PROJECTS } from '@/lib/ops/menteeyear';
import { todayET } from '@/lib/events';
import Shell from '../Shell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'The mentee year · Sahṛdaya Upāya', robots: { index: false, follow: false } };

const CIRCLE = 'https://ss.embodiedphilosophy.com/c/mentorship';
const dayFmt = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(',', '');
const Rich = ({ text }) => segments(text).map((x, i) => x.t === 'b' ? <b key={i}>{x.s}</b> : x.t === 'i' ? <i key={i}>{x.s}</i> : x.t === 'q' ? <span key={i} className="my-q"><Rich text={x.s} /></span> : x.t === 'd' ? <span key={i} className="my-d">{x.s}</span> : x.s);
const Proj = ({ p }) => <span className={`sch-my-proj ${p}`}><i />{PROJECTS[p]}</span>;
const Back = () => <a className="sch-btn ghost" href={CIRCLE} target="_top">← Back to your page in Circle</a>;

// The mentee year as a plain page (not drawn inside Circle): the rhythm, a typical month, month by month, the dated steps, one-to-ones.
// Anyone with the link can read it: it holds no personal data (your partners and your ticks are on your page in Circle).
export default function MenteeYearPage() {
  const today = todayET(), month = currentMonth(data.months, today), next = nextSteps(data.steps, today, 3);
  return (
    <Shell>
      <div className="sch-my">
        <p className="sch-eyebrow">Sahṛdaya Upāya · 2026–27 cohort</p>
        <h1>The mentee year</h1>
        <p className="sch-my-lede">{data.lede}</p>
        <p><Back /></p>
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
              {m.steps.length > 0 && <><h4>Project steps due this month</h4><ul className="steps">{m.steps.map((s, i) => <li key={i}><span className="d">{dayFmt(s.date)}</span> <Proj p={s.project} /> {s.text}</li>)}</ul></>}
            </article>))}</div></section>

        <section id="projects"><h2>Final projects, built from November</h2><p className="sch-my-sub">Two separate pieces, prepared side by side. The talk tests you as a teacher; the offering is what certifies you to teach Sahṛdaya Meditation. Each step is small and dated so nothing waits for July.</p>
          <p className="sch-my-note">{data.spacing}</p>
          <ul className="sch-my-steplist">{data.steps.map((s, i) => <li key={i} className={s.date < today ? 'past' : ''}><span className="d">{dayFmt(s.date)} {s.date.slice(0, 4)}</span><span><Proj p={s.project} /><b>{s.title}</b><span className="det">{s.detail}</span><span className="ev">Evidence: {s.evidence}</span></span></li>)}</ul></section>

        <section id="one-to-ones"><h2>One-to-ones</h2>
          <div className="sch-my-weeks two"><div className="sch-my-card"><h3>How to book</h3><ol>{data.oneToOne.howTo.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ol></div>
            <div className="sch-my-card"><h3>Booking summary</h3><pre className="sch-my-tpl">{data.oneToOne.template.join('\n')}</pre><p className="sch-my-sub">{data.oneToOne.note}</p></div></div></section>

        <p><Back /></p>
        <p className="sch-my-sub">{data.footer}</p>
      </div>
    </Shell>
  );
}
