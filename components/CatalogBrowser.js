'use client';
import { useMemo, useState } from 'react';

// The Course Library: search, filters (counts recalculate against every other active filter), sort, grid / list.
// Phase 1 is signed out only: every membership item is "locked" and says which membership opens it.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = s => { const [, m, d] = s.split('-').map(Number); return `${MONTHS[m - 1]} ${d}`; };
// Search ignores accents and Sanskrit diacritics: "kali" finds Kālī, "siva" finds Śiva
const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const initials = n => { const a = String(n || '?').trim().split(/\s+/); return (a[0]?.[0] || '?') + (a.length > 1 ? a[a.length - 1][0] : ''); };
const SORTS = [['soonest', 'Starting soonest'], ['title', 'Title A–Z'], ['programme', 'Programme']];
const EMPTY = { q: '', ce: false, member: false, access: [], programme: [], topics: [], teacher: [], kind: '', format: '', depth: '' };

function Avatars({ teachers }) {
  return (
    <span className="cl-avs">
      {teachers.slice(0, 3).map(t => t.photo
        ? <img key={t.name} className="cl-av" src={t.photo} alt="" width="26" height="26" />
        : <span key={t.name} className="cl-av" aria-hidden="true">{initials(t.name)}</span>)}
    </span>
  );
}

function Check({ checked, onChange, disabled, children, c, hint }) {
  return (
    <label className={`cl-opt${disabled ? ' off' : ''}${c === 0 && !checked ? ' dim' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} />
      <span className="cl-box" aria-hidden="true" />
      <span className="cl-opt-l">{children}{hint && <small>{hint}</small>}</span>
      {c != null && <span className="cl-n">{c}</span>}
    </label>
  );
}
function Multi({ title, facet, options, test, x }) {
  return (
    <fieldset className="cl-group"><legend>{title}</legend>
      {options.map(([v, label, color]) => (
        <Check key={v} checked={x.f[facet].includes(v)} onChange={() => x.toggle(facet, v)} c={x.count(facet, o => test(o, v))}>
          {color && <i className="cl-dot" style={{ background: color }} />}{label}</Check>
      ))}
    </fieldset>
  );
}
function Chips({ title, facet, options, x }) {
  return (
    <fieldset className="cl-group"><legend>{title}</legend>
      <div className="cl-chips">
        {options.map(v => {
          const c = x.count(facet, o => o[facet] === v), on = x.f[facet] === v;
          return <button key={v} type="button" aria-pressed={on} className={`cl-chip${on ? ' on' : ''}${c === 0 && !on ? ' dim' : ''}`} onClick={() => x.single(facet, v)}>
            {v} <span className="cl-n">{c}</span></button>;
        })}
      </div>
    </fieldset>
  );
}

export default function CatalogBrowser({ items, meta, today, signedIn = false }) {
  const [f, setF] = useState(EMPTY);
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('soonest');
  const [sheet, setSheet] = useState(false);

  const locked = o => !signedIn && o.access !== 'pwyc';
  const upcoming = o => (o.next && o.next >= today ? o.next : '');

  const teacherNames = useMemo(() => [...new Set(items.flatMap(o => o.teachers.map(t => t.name)))].sort((a, b) => a.localeCompare(b)), [items]);

  // Does an offering pass every active filter, except the one named in `skip` (used to count that filter's own options)?
  const passes = (o, skip) => {
    const q = fold(f.q.trim());
    if (q && skip !== 'q' && !fold([o.title, o.label, ...o.teachers.map(t => t.name), ...o.topics].join(' ')).includes(q)) return false;
    if (f.ce && skip !== 'ce' && !o.ce) return false;
    if (f.member && skip !== 'member') return false; // signed out: nothing is in "my membership"
    if (f.access.length && skip !== 'access' && !f.access.includes(o.access)) return false;
    if (f.programme.length && skip !== 'programme' && !f.programme.includes(o.programme)) return false;
    if (f.topics.length && skip !== 'topics' && !o.topics.some(t => f.topics.includes(t))) return false;
    if (f.teacher.length && skip !== 'teacher' && !o.teachers.some(t => f.teacher.includes(t.name))) return false;
    for (const k of ['kind', 'format', 'depth']) if (f[k] && skip !== k && o[k] !== f[k]) return false;
    return true;
  };
  const count = (facet, test) => items.filter(o => passes(o, facet) && test(o)).length;

  const shown = useMemo(() => {
    const a = items.filter(o => passes(o));
    const order = Object.keys(meta.programmes);
    if (sort === 'title') a.sort((x, y) => x.title.localeCompare(y.title));
    else if (sort === 'programme') a.sort((x, y) => order.indexOf(x.programme) - order.indexOf(y.programme) || x.title.localeCompare(y.title));
    else a.sort((x, y) => (upcoming(x) || '9999').localeCompare(upcoming(y) || '9999') || x.title.localeCompare(y.title));
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, f, sort]);

  const toggle = (k, v) => setF(s => ({ ...s, [k]: s[k].includes(v) ? s[k].filter(x => x !== v) : [...s[k], v] }));
  const single = (k, v) => setF(s => ({ ...s, [k]: s[k] === v ? '' : v }));
  const active = f.ce + f.access.length + f.programme.length + f.topics.length + f.teacher.length + !!f.kind + !!f.format + !!f.depth;
  const clear = () => setF(EMPTY);
  const x = { f, count, toggle, single };
  const n = shown.length;

  const badges = o => (
    <span className="cl-badges">
      {o.format === 'Live' && <span className="cl-live"><i />{/weekly/i.test(o.length) ? 'Live weekly' : 'Live'}</span>}
      <span className={`cl-badge a-${o.access}`}>{meta.access[o.access].short}</span>
    </span>
  );
  const when = o => upcoming(o) ? fmtDate(upcoming(o)) : o.format === 'On demand' ? 'On demand' : o.next ? 'Underway' : o.format || 'On demand';
  const price = o => o.priceLabel || 'Included';

  const filters = (
    <>
      <div className="cl-group flags">
        <Check checked={f.member} disabled onChange={() => {}} hint="Sign in to see what your membership includes">Included in my membership</Check>
        <Check checked={f.ce} onChange={() => setF(s => ({ ...s, ce: !s.ce }))} c={count('ce', o => o.ce > 0)}>Certificate or CE hours</Check>
      </div>
      <Multi x={x} title="Access" facet="access" options={Object.entries(meta.access).map(([k, v]) => [k, v.label])} test={(o, v) => o.access === v} />
      <Multi x={x} title="Programme" facet="programme" options={Object.entries(meta.programmes).map(([k, v]) => [k, v.label, v.color])} test={(o, v) => o.programme === v} />
      <Chips x={x} title="Kind" facet="kind" options={meta.kinds} />
      <Chips x={x} title="Format" facet="format" options={meta.formats} />
      <Chips x={x} title="Depth" facet="depth" options={meta.depths} />
      <Multi x={x} title="Tradition & topic" facet="topics" options={meta.topics.map(t => [t, t])} test={(o, v) => o.topics.includes(v)} />
      <Multi x={x} title="Teacher" facet="teacher" options={teacherNames.map(t => [t, t])} test={(o, v) => o.teachers.some(t => t.name === v)} />
    </>
  );

  return (
    <div className="cl">
      <header className="cl-head">
        <div className="cl-wrap">
          <div>
            <span className="eyebrow">The Catalog</span>
            <h1>Course Library</h1>
          </div>
          <div className="cl-tools">
            <label className="cl-search">
              <span className="sr">Search courses</span>
              <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="M13 13l5 5" /></svg>
              <input type="search" placeholder="Search title, teacher or tradition" value={f.q} onChange={e => setF(s => ({ ...s, q: e.target.value }))} />
            </label>
            <div className="cl-switch" role="group" aria-label="View">
              {['grid', 'list'].map(v => <button key={v} type="button" aria-pressed={view === v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v === 'grid' ? 'Grid' : 'List'}</button>)}
            </div>
          </div>
        </div>
      </header>
      <div className="cl-pine"><div className="cl-wrap"><p>{signedIn ? 'Everything your membership opens is marked Included.' : 'A locked card shows the membership that opens it'}</p></div></div>

      <div className="cl-wrap cl-body">
        <aside className={`cl-filters${sheet ? ' open' : ''}`} aria-label="Filters">
          <div className="cl-sheet-top"><b>Filters{active ? ` (${active})` : ''}</b><button type="button" onClick={() => setSheet(false)} aria-label="Close filters">×</button></div>
          <div className="cl-filters-in">{filters}</div>
          <div className="cl-sheet-foot">
            <button type="button" className="cl-clear" onClick={clear}>Clear all</button>
            <button type="button" className="btn btn-primary" onClick={() => setSheet(false)}>Show {n}</button>
          </div>
        </aside>

        <section className="cl-results" aria-live="polite">
          <div className="cl-bar">
            <button type="button" className="cl-fbtn" onClick={() => setSheet(true)}>Filters ({active})</button>
            <span className="cl-count"><b>{n}</b> {n === 1 ? 'course' : 'courses'}</span>
            <label className="cl-sort">Sort
              <select value={sort} onChange={e => setSort(e.target.value)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
          </div>

          {n === 0 ? (
            <div className="cl-empty">
              <h2>Nothing matches those filters</h2>
              <p>Try removing one, or start again.</p>
              <button type="button" className="btn btn-ghost" onClick={clear}>Clear all</button>
            </div>
          ) : view === 'grid' ? (
            <ul className="cl-grid">
              {shown.map(o => (
                <li key={o.id}>
                  <a className="cl-card" href={`/courses/${o.id}`} style={{ '--band': meta.programmes[o.programme].color }}>
                    <span className="cl-band" />
                    <span className="cl-top"><span className="cl-label">{o.label}</span>{badges(o)}</span>
                    <h3>{o.title}</h3>
                    <span className="cl-by"><Avatars teachers={o.teachers} /><span>{o.teachers.map(t => t.name).join(', ')}</span></span>
                    {locked(o) && <span className="cl-lock"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" /><path d="M5 7V5a3 3 0 016 0v2" /></svg>{o.unlockLine}</span>}
                    <span className="cl-meta"><span>{o.length}</span><span>{when(o)}</span><span>{price(o)}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="cl-list">
              {shown.map(o => (
                <li key={o.id}>
                  <a className="cl-row" href={`/courses/${o.id}`} style={{ '--band': meta.programmes[o.programme].color }}>
                    <span className="cl-strip" />
                    <span className="cl-label">{o.label}</span>
                    <span className="cl-rt"><b>{o.title}</b><small>{o.teachers.map(t => t.name).join(', ')}{locked(o) ? ` · ${o.unlockLine}` : ''}</small></span>
                    <span className="cl-len">{o.length}</span>
                    <span className="cl-fmt">{o.format}</span>
                    {badges(o)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
