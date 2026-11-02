import { shelfOf, textOf, siblings, rolesOf, TEXT_IDS, TEXTS_SCRIPT } from '@/lib/school/texts';
import { segs } from '@/lib/school/manual';
import { Block, Key } from './Manual';

const Runs = ({ list }) => list.map((g, i) => g.isChip ? <span key={i} className={g.chip}>{g.text}</span> : g.isLink ? <a key={i} href={g.href} style={g.style}>{g.text}</a> : <span key={i} style={g.style}>{g.text}</span>);
// A paragraph gets the look of its part: translation, commentary or note
const Para = ({ b, r }) => {
  return r ? <p className={`mn-p tx-${r}`}><Runs list={segs(b.s)} /></p> : <Block b={b} />; };
const Chev = () => <svg className="tx-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
const Meta = ({ p }) => <span className="tx-pmeta">{p.ref && <span className="tx-ref">{p.ref}</span>}{p.verses > 0 && <span>{p.verses} {p.verses === 1 ? 'verse' : 'verses'}</span>}<span>{p.minutes} min</span>{p.flag && <span className="tx-flag">{p.flag}</span>}</span>;

function Passage({ p }) {
  return (
    <details className="tx-p" id={p.id}>
      <summary><span className="tx-num">{p.num || '·'}</span><span className="tx-ph"><span className="tx-pt">{p.title}</span><Meta p={p} /></span><Chev /></summary>
      <div className="tx-pb">{rolesOf(p.blocks).map((r, i) => <Para key={i} b={p.blocks[i]} r={r} />)}<p className="tx-top"><a href="#top">Back to the top</a></p></div>
    </details>
  );
}
const Notes = ({ list, title, open }) => list.length > 0 && (
  <details className="tx-p tx-notes" open={open}>
    <summary><span className="tx-num">i</span><span className="tx-ph"><span className="tx-pt">{title}</span><span className="tx-pmeta">{list.map(n => n.title).join(' · ')}</span></span><Chev /></summary>
    <div className="tx-pb">{list.map(n => <div key={n.id} id={n.id}><h4 className="tx-nh">{n.title}</h4>{n.blocks.map((b, i) => <Para key={i} b={b} />)}</div>)}</div>
  </details>
);

// The shelf: the three texts, and how to read them
export function Shelf() {
  const shelf = TEXT_IDS.map(shelfOf);
  return (
    <>
      <ol className="tx-how">
        <li><b>Choose a text.</b> Each one opens as a list of short, numbered passages.</li>
        <li><b>Open one passage at a time.</b> Most take five minutes or less. There is no need to read straight through.</li>
        <li><b>Follow the colours.</b> <span className="tx-sw v" /> the Sanskrit, <span className="tx-sw t" /> the translation, <span className="tx-sw c" /> the commentary.</li>
      </ol>
      <div className="tx-shelf">{shelf.map(s => (
        <article key={s.id} className={`tx-book ${s.accent}`}>
          <a className="tx-cover" href={s.href} aria-label={`Open ${s.title}`}><span className="tx-mark" lang="sa">{s.mark}</span><span className="tx-lbl">{s.label}</span></a>
          <div className="tx-bbody">
            <h2><a href={s.href}>{s.title}</a></h2>
            <p className="tx-bsub">{s.sub}</p>
            <p className="tx-babout">{s.about}</p>
            <p className="tx-bmeta"><span>{s.count} passages</span><span>about {Math.round(s.minutes / 5) * 5} min in all</span>{s.flagged && <span className="tx-flag">Some for mentors</span>}</p>
            {s.start && <a className="tx-start" href={s.start.href}><small>A good first passage</small>{s.start.num ? `${s.start.num}. ` : ''}{s.start.title}{s.start.ref ? ` (${s.start.ref})` : ''} →</a>}
            <a className="sch-btn" href={s.href}>Open the text</a>
          </div>
        </article>))}</div>
      <div className="mn-key"><b>Labels you will meet</b><Key /></div>
    </>
  );
}

// One text: its introduction, notes before you begin, the passages as cards, and notes on the text at the end
export function Text({ id }) {
  const t = textOf(id), { prev, next } = siblings(id);
  return (
    <div className={`tx-text ${t.accent}`}>
      <p className="tx-crumb"><a href="?tab=texts">← All texts</a></p>
      <header className="tx-head"><span className="tx-mark" lang="sa">{t.mark}</span><div><p className="lbl">{t.label}</p><h2>{t.title}</h2><p className="tx-bsub">{t.sub}</p><p className="tx-bmeta"><span>{t.count} passages</span><span>about {Math.round(t.minutes / 5) * 5} min in all</span></p></div></header>
      <div className="tx-intro">{t.intro.map((b, i) => <Para key={i} b={b} />)}</div>
      {t.mentors && <p className="mn-mentors"><b>For mentors’ study.</b> {t.mentors}</p>}
      <Notes list={t.front} title="Before you begin" />
      <div className="tx-bar"><h3>The passages</h3><span><button type="button" data-tx-all="open">Open all</button><button type="button" data-tx-all="close">Close all</button></span></div>
      <div className="tx-list">{t.passages.map(p => p.group ? (
        <section key={p.id} className="tx-group" id={p.id}>
          <header><span className="tx-gnum">{p.num}</span><div><h4>{p.title}</h4>{p.blocks.length > 0 && <div className="tx-gintro">{p.blocks.map((b, i) => <Para key={i} b={b} />)}</div>}</div></header>
          {p.items.map(x => <Passage key={x.id} p={x} />)}
        </section>) : <Passage key={p.id} p={p} />)}</div>
      <Notes list={t.back} title="Notes on the text" />
      <nav className="mn-pn" aria-label="Other texts">
        {prev ? <a href={prev.href}><span className="l">← {prev.label}</span><span className="t">{prev.title}</span></a> : <a href="?tab=texts"><span className="l">← All texts</span><span className="t">The shelf</span></a>}
        {next ? <a className="next" href={next.href}><span className="l">{next.label} →</span><span className="t">{next.title}</span></a> : <a className="next" href="?tab=texts"><span className="l">All texts →</span><span className="t">The shelf</span></a>}
      </nav>
      <script dangerouslySetInnerHTML={{ __html: TEXTS_SCRIPT }} />
    </div>
  );
}
