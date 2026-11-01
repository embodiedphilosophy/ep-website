import { chapterOf, chapterBlocks, tocFor, prevNext, cardOf, segs, plainOf, labelOf, titleOf, MENTORS_NOTE } from '@/lib/school/manual';

const Runs = ({ list }) => list.map((g, i) => g.isChip ? <span key={i} className={g.chip}>{g.text}</span> : g.isLink ? <a key={i} href={g.href} style={g.style}>{g.text}</a> : <span key={i} style={g.style}>{g.text}</span>);

function Block({ b }) {
  if (b.t === 'p') return <p className="mn-p"><Runs list={segs(b.s)} /></p>;
  if (b.t === 'note') return <p className="mn-note"><Runs list={segs(b.s)} /></p>;
  if (b.t === 'verse') return (
    <div className={`mn-verse${b.n ? ' hasn' : ''}`}>{b.n ? <span className="n">{b.n}</span> : null}<span lang="sa-Latn">{b.lines.map((t, i) => <span key={i} className="ln">{t}</span>)}</span></div>
  );
  if (b.t === 'ul' || b.t === 'ol') { const L = b.t === 'ol' ? 'ol' : 'ul'; return <L className="mn-list" style={{ listStyle: b.t === 'ol' ? 'decimal' : 'disc' }}>{b.items.map((s, i) => <li key={i}><Runs list={segs(s)} /></li>)}</L>; }
  if (b.t === 'checks') return <ul className="mn-checks">{b.items.map((s, i) => <li key={i}><span className="mn-box" aria-hidden="true" /><span><Runs list={segs(s)} /></span></li>)}</ul>;
  if (b.t === 'lines') return <pre className="sch-my-tpl">{b.items.map(plainOf).join('\n')}</pre>;
  if (b.t === 'table') return (
    <div className={`mn-table${b.head.length >= 4 ? ' wide' : ''}`}><table style={{ '--cols': b.head.length }}><thead><tr>{b.head.map((h, i) => <th key={i} scope="col">{plainOf(h)}</th>)}</tr></thead>
      <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={j === 0 ? { fontWeight: 500 } : undefined}><Runs list={segs(c)} /></td>)}</tr>)}</tbody></table></div>
  );
  if (b.t === 'h3') return <div className="mn-sec" id={b.id}><h3>{b.title}</h3></div>;
  if (b.t === 'h4') return <div className="mn-sec h4" id={b.id}><h4 className="sub">{b.title}</h4></div>;
  return null;
}

const Key = () => <><span><span className="mn-chip text">[Text]</span> the root verse says it</span><span><span className="mn-chip uddyota">[Uddyota]</span> Kṣemarāja says it</span><span><span className="mn-chip interp">[Interpretation]</span> the school’s reading</span></>;
const Card = ({ c }) => <a className="mn-card" href={c.href}><span className="l">{c.label}</span><span className="t">{c.title}</span><span className="s">{c.sub}</span><span className="c">{c.count}</span></a>;

// The formation manual: contents column (a <details> on phones) and one part at a time. Server-rendered, no client code.
export default function Manual({ part }) {
  const front = part === 'front', ch = chapterOf(part), toc = tocFor(part), { prev, next } = prevNext(part);
  const blocks = chapterBlocks(part);
  return (
    <>
      <details className="mn-phone-toc"><summary><span>Contents · {labelOf(part)}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary>
        <div className="in mn-side" style={{ position: 'static' }}><ol>{toc.map(c => <li key={c.id} className={c.grp ? 'grpwrap' : undefined}>{c.grp ? <div className="grp">{c.grp}</div> : null}<a href={c.href} aria-current={c.cur ? 'page' : undefined}><span className="l">{c.label}</span>{c.title}</a></li>)}</ol></div></details>
      <div className="mn-wrap">
        <aside className="mn-side mn-desk" aria-label="Contents"><h2>Contents</h2>
          <ol>{toc.map(c => (
            <li key={c.id}>{c.grp ? <div className="grp">{c.grp}</div> : null}<a href={c.href} aria-current={c.cur ? 'page' : undefined}><span className="l">{c.label}</span>{c.title}</a>
              {c.subs.length > 0 && <ul>{c.subs.map(x => <li key={x.href} style={{ border: 0 }}><a href={x.href} className={x.h4 ? 'h4' : undefined}>{x.title}</a></li>)}</ul>}</li>))}</ol>
          <div style={{ marginTop: 18, display: 'grid', gap: 6, fontSize: 12.5, color: '#5A5346' }}><Key /></div>
        </aside>
        <article className="mn-read">
          <header><p className="lbl">{front ? 'Start here' : labelOf(part).toUpperCase()}</p><h2>{front ? 'How to use this manual' : titleOf(part)}</h2></header>
          {part === 'part-ii' && <div className="mn-x"><span>This part is the year in brief. Month-by-month detail, with this month highlighted, is on the other tab.</span><a href="?tab=year#months">The mentee year →</a></div>}
          {MENTORS_NOTE[part] && <p className="mn-mentors"><b>For mentors’ study.</b> {MENTORS_NOTE[part]}</p>}
          {blocks.map((b, i) => <Block key={i} b={b} />)}
          {front && (<>
            <div className="mn-key"><b>Reading the labels</b><Key /></div>
            <section style={{ marginTop: 36 }}><h3 style={{ fontSize: 25, margin: '0 0 12px' }}>The five parts</h3><div className="mn-cards">{['part-i', 'part-ii', 'part-iii', 'part-iv', 'part-v'].map(id => <Card key={id} c={cardOf(id)} />)}</div></section>
            <section style={{ marginTop: 32 }}><h3 style={{ fontSize: 25, margin: '0 0 4px' }}>The translations</h3><p className="sch-my-sub" style={{ fontSize: 14.5 }}>Given in full, so every verse a mentor quotes can be checked against its source.</p><div className="mn-cards">{['appendix-a', 'appendix-b', 'appendix-c'].map(id => <Card key={id} c={cardOf(id)} />)}</div></section>
          </>)}
          <nav className="mn-pn" aria-label="Previous and next">
            {prev ? <a href={prev.href}><span className="l">← {prev.label}</span><span className="t">{prev.title}</span></a> : <span />}
            {next ? <a className="next" href={next.href}><span className="l">{next.label} →</span><span className="t">{next.title}</span></a> : <span />}
          </nav>
          <p style={{ marginTop: 28 }}><a href="/school/sahrdaya-upaya-formation-manual.pdf" download>Download the whole manual as a PDF</a> · <a href="#top">Back to the top</a></p>
        </article>
      </div>
    </>
  );
}
