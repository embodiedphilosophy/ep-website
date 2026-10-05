'use client';
import { useEffect, useRef, useState } from 'react';
import Collage from './Collage';

// Horizontally sliding feature of Wisdom School's annual themes.
// This year's theme is centred; past years sit to the left, softly blurred, as a glimpse of what
// Wisdom School Plus includes; next year's theme peeks in from the right.
export default function AnnualThemes({ themes, current, plusHref, joinHref }) {
  const track = useRef(null);
  const cards = useRef({});
  const [active, setActive] = useState(current);

  const go = y => {
    const el = cards.current[y], t = track.current;
    if (!el || !t) return;
    t.scrollTo({ left: el.offsetLeft - (t.clientWidth - el.clientWidth) / 2, behavior: 'smooth' });
    setActive(y);
  };
  // Start centred on this year's theme
  useEffect(() => {
    const el = cards.current[current], t = track.current;
    if (el && t) t.scrollLeft = el.offsetLeft - (t.clientWidth - el.clientWidth) / 2;
  }, [current]);
  // Keep the dots in sync while swiping
  const onScroll = () => {
    const t = track.current; if (!t) return;
    const mid = t.scrollLeft + t.clientWidth / 2;
    let best = active, dist = Infinity;
    for (const [y, el] of Object.entries(cards.current)) {
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid);
      if (d < dist) { dist = d; best = Number(y); }
    }
    if (best !== active) setActive(best);
  };
  const years = themes.map(t => t.year);
  const idx = years.indexOf(active);

  return (
    <section className="themes" aria-label="Wisdom School annual themes">
      <div className="wrap themes-head">
        <div><span className="eyebrow">The year’s theme</span><h2>One idea explored from many perspectives.</h2></div>
        <div className="themes-nav">
          <button type="button" aria-label="Previous year" disabled={idx <= 0} onClick={() => go(years[idx - 1])}>←</button>
          <button type="button" aria-label="Next year" disabled={idx >= years.length - 1} onClick={() => go(years[idx + 1])}>→</button>
        </div>
      </div>
      <div className="themes-dots top" aria-hidden="false">
        {themes.map(t => <button key={t.year} type="button" role="tab" aria-selected={t.year === active} aria-label={`${t.year}`} onClick={() => go(t.year)}>{t.year}</button>)}
      </div>
      <div className="themes-track" ref={track} onScroll={onScroll}>
        {themes.map(t => {
          const state = t.year < current ? 'past' : t.year > current ? 'future' : 'now';
          return (
            <article key={t.year} ref={el => { if (el) cards.current[t.year] = el; }} className={`theme-card ${state}${t.year === active ? ' active' : ''}`}
              aria-label={`${t.year}: ${t.title}`}>
              <div className="theme-inner">
                <div className="theme-art"><Collage img={t.image || 'mirror'} ground={t.ground || 'navy'} className="theme-collage" /></div>
                <div className="theme-body">
                  <div className="theme-year">{t.year}{state === 'now' ? ' · This year' : state === 'future' ? ' · Coming next' : ''}</div>
                  <h3>{t.title}</h3>
                  {t.tagline && <p className="theme-tag">{t.tagline}</p>}
                  {t.description && <p className="theme-desc">{t.description}</p>}
                  {t.months.length > 0 && (
                    <ol className="theme-months">
                      {t.months.slice(0, 12).map(m => <li key={m.month + m.title}><b>{m.month}</b> {m.title}{m.question ? <span>“{m.question}”</span> : null}</li>)}
                    </ol>
                  )}
                  {t.book_club && t.book_club !== 'To be chosen' && <p className="theme-book"><b>Book club:</b> {t.book_club}</p>}
                </div>
              </div>
              {state === 'past' && (
                <div className="theme-lock">
                  <p><b>{t.title}</b> is available on demand with Wisdom School Plus.</p>
                  <a className="btn btn-primary" href={plusHref}>Explore Wisdom School Plus</a>
                </div>
              )}
              {state === 'now' && <div className="theme-cta"><a className="btn btn-primary" href={joinHref}>Join this year’s journey</a></div>}
            </article>
          );
        })}
      </div>
      <div className="themes-dots bottom" role="tablist">
        {themes.map(t => <button key={t.year} type="button" role="tab" aria-selected={t.year === active} aria-label={`${t.year}`} onClick={() => go(t.year)}>{t.year}</button>)}
      </div>
    </section>
  );
}
