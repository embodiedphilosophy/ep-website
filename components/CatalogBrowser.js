'use client';
import { useEffect, useMemo, useState } from 'react';

// The Course Library: search, filters (counts recalculate against every other active filter), sort, grid / list.
// Phase 1 is signed out. `member` (a membership key, e.g. "wisdom_school") is wired for Phase 3 sign-in; until then it
// is only set by ?preview=member in builds made with NEXT_PUBLIC_COURSES_PREVIEW=1 (the test kit), so the member view can be checked.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = s => { const [, m, d] = s.split('-').map(Number); return `${MONTHS[m - 1]} ${d}`; };
// Search ignores accents and Sanskrit diacritics: "kali" finds Kālī, "siva" finds Śiva
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const initials = n => { const a = String(n || '?').replace(/[\[\]]/g, '').trim().split(/\s+/); return a[0] ? (a[0][0] + (a.length > 1 ? a[a.length - 1][0] : '')).toUpperCase() : '?'; };
const AV = ['#20302A', '#A5432A', '#83341F', '#7D3F52', '#6B6253'];
const avColor = n => /^\[/.test(n) ? '#6B6253' : AV[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % 4];
const SORTS = [['soon', 'Starting soonest'], ['az', 'Title A–Z'], ['prog', 'Programme']];
const EMPTY = { ce: false, incl: false, access: [], programme: [], topics: [], teacher: [], kind: '', format: '', depth: '' };
// What each membership opens (a Wisdom School member also gets the Meditation Pass items)
const OPENS = { wisdom_school: ['meditation_pass', 'wisdom_school'], ws_plus: ['meditation_pass', 'wisdom_school', 'ws_plus'], meditation_pass: ['meditation_pass'], sadhana_school: ['sadhana_school'] };

const Lock = ({ s = 13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>;

function Chip({ on, count, onClick, dot, children }) {
  return (
    <button type="button" aria-pressed={on} className={`cl-chip${on ? ' on' : ''}${!on && count === 0 ? ' dim' : ''}`} onClick={onClick}>
      {dot && <span className="cl-dot" style={{ background: dot }} />}{children}<span className="cnt">{count}</span>
    </button>
  );
}
function Group({ title, mode, children }) {
  return <div className="cl-fgroup"><div className="cl-fh">{title}<span>{mode}</span></div><div className="cl-chips">{children}</div></div>;
}

export default function CatalogBrowser({ items, meta, today, member: memberProp = null }) {
  const [f, setF] = useState(EMPTY);
  const [q, setQ] = useState('');
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('soon');
  const [sheet, setSheet] = useState(false);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_COURSES_PREVIEW === '1' && new URLSearchParams(window.location.search).get('preview') === 'member') setPreview(true);
  }, []);
  const member = memberProp || (preview ? 'wisdom_school' : null);
  const signed = !!member;

  const included = o => signed && (OPENS[member] || []).includes(o.access);
  const locked = o => o.access !== 'pwyc' && !included(o);
  const upcoming = o => (o.next && o.next >= today ? o.next : '');
  const teacherNames = useMemo(() => [...new Set(items.flatMap(o => o.teachers.map(t => t.name)))].filter(n => !n.startsWith('[')).sort((a, b) => a.localeCompare(b)), [items]);

  // Does an offering pass every active filter except the one named in `skip` (used to count that filter's own options)?
  const passes = (o, skip) => {
    const t = fold(q.trim());
    if (t && skip !== 'q' && !fold([o.title, o.label, o.kind, meta.programmes[o.programme].label, ...o.teachers.map(x => x.name), ...o.topics].join(' ')).includes(t)) return false;
    if (f.ce && skip !== 'ce' && !o.ceEligible) return false;
    if (f.incl && signed && skip !== 'incl' && !included(o)) return false;
    if (f.access.length && skip !== 'access' && !f.access.includes(o.access)) return false;
    if (f.programme.length && skip !== 'programme' && !f.programme.includes(o.programme)) return false;
    if (f.topics.length && skip !== 'topics' && !o.topics.some(x => f.topics.includes(x))) return false;
    if (f.teacher.length && skip !== 'teacher' && !o.teachers.some(x => f.teacher.includes(x.name))) return false;
    for (const k of ['kind', 'format', 'depth']) if (f[k] && skip !== k && o[k] !== f[k]) return false;
    return true;
  };
  const count = (skip, test) => items.filter(o => passes(o, skip) && test(o)).length;

  const shown = items.filter(o => passes(o));
  const order = Object.keys(meta.programmes);
  if (sort === 'az') shown.sort((x, y) => x.title.localeCompare(y.title));
  else if (sort === 'prog') shown.sort((x, y) => order.indexOf(x.programme) - order.indexOf(y.programme) || x.order - y.order || x.title.localeCompare(y.title));
  else shown.sort((x, y) => (upcoming(x) || '9999').localeCompare(upcoming(y) || '9999') || x.order - y.order || x.title.localeCompare(y.title));

  const toggle = (k, v) => setF(s => ({ ...s, [k]: s[k].includes(v) ? s[k].filter(x => x !== v) : [...s[k], v] }));
  const single = (k, v) => setF(s => ({ ...s, [k]: s[k] === v ? '' : v }));
  const active = f.ce + (f.incl && signed) + f.access.length + f.programme.length + f.topics.length + f.teacher.length + !!f.kind + !!f.format + !!f.depth;
  const clear = () => { setF(EMPTY); setQ(''); };
  const n = shown.length;
  const inclCount = items.filter(o => (OPENS[member || 'wisdom_school'] || []).includes(o.access)).length;

  const multi = (title, facet, options, test) => (
    <Group title={title} mode="any of">
      {options.map(([v, label, dot]) => <Chip key={v} on={f[facet].includes(v)} count={count(facet, o => test(o, v))} dot={dot} onClick={() => toggle(facet, v)}>{label}</Chip>)}
    </Group>
  );
  const one = (title, facet, options) => (
    <Group title={title} mode="one">
      {options.map(v => <Chip key={v} on={f[facet] === v} count={count(facet, o => o[facet] === v)} onClick={() => single(facet, v)}>{v}</Chip>)}
    </Group>
  );

  const badges = o => (
    <span className="cl-badges">
      {o.liveLabel && <span className="cl-badge b-live"><span className="cl-pulse" />{o.liveLabel}</span>}
      <span className={`cl-badge ${included(o) ? 'b-inc' : o.access === 'pwyc' ? 'b-pwyc' : 'b-acc'}`}>{included(o) ? 'Included' : meta.access[o.access].short}</span>
    </span>
  );
  const lockText = o => (signed && o.access === 'ws_plus' ? 'Upgrade to Wisdom School Plus' : o.unlockLine);
  const when = o => o.whenLabel || (upcoming(o) ? fmtDate(upcoming(o)) : o.format === 'On demand' ? 'On demand' : '');
  const price = o => (included(o) ? 'Included' : o.priceLabel || 'Included');
  const names = o => o.teachers.map(t => t.name).join(' & ');
  const band = o => ({ '--band': meta.programmes[o.programme].color });

  return (
    <div className="cl">
      <div className="cl-wrap">
        <header className="cl-hdr">
          <div>
            <div className="eyebrow">The Catalog</div>
            <h1 className="cl-h1">Course <em>Library</em></h1>
            <p className="cl-sub">Live practice, the schools, pathways and on-demand courses, each with what you need to join it.</p>
          </div>
          <div className="cl-tools">
            <label className="cl-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5346" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input type="search" placeholder="Search title, teacher or tradition" aria-label="Search courses" value={q} onChange={e => setQ(e.target.value)} />
            </label>
            <div className="cl-seg" role="group" aria-label="View">
              <button type="button" aria-pressed={view === 'grid'} className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>Grid</button>
              <button type="button" aria-pressed={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>List</button>
            </div>
            <button type="button" className="cl-btn ghost cl-mob" onClick={() => setSheet(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>{active ? `Filters (${active})` : 'Filters'}</button>
          </div>
        </header>
      </div>

      <div className="cl-band">
        <div className="cl-wrap">
          {signed ? (
            <>
              <span>You’re a <b>{meta.access[member].label}</b> member. <b>{inclCount}</b> items are included in your membership.</span>
              {member !== 'ws_plus' && <a href="/wisdom-school">Upgrade to Wisdom School Plus for every Learning Pathway →</a>}
            </>
          ) : (
            <>
              <span>Everything is listed here. A <b>locked</b> card shows the membership that opens it.</span>
              <a href="/wisdom-school">Compare memberships →</a>
            </>
          )}
        </div>
      </div>

      <div className="cl-wrap">
        <div className="cl-layout">
          <aside className={`cl-filters${sheet ? ' open' : ''}`} aria-label="Filters">
            <div className="cl-sheethead">
              <span className="cl-st">Filters</span>
              <div>
                <button type="button" className="cl-btn" onClick={() => setSheet(false)}>Show {n}</button>
                <button type="button" className="cl-x" onClick={() => setSheet(false)} aria-label="Close filters">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E1A14" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            </div>
            <div className="cl-fhead"><h2>Filter</h2><button type="button" className="cl-clear" onClick={clear}>Clear all</button></div>

            <div className="cl-fgroup">
              <label className={`cl-chk${signed ? '' : ' off'}`}>
                <input type="checkbox" checked={f.incl && signed} disabled={!signed} onChange={() => setF(s => ({ ...s, incl: !s.incl }))} />
                Included in my membership <span className="cnt">{inclCount}</span>
              </label>
              {!signed && <div className="cl-hint">Sign in to see what you already have.</div>}
              <label className="cl-chk">
                <input type="checkbox" checked={f.ce} onChange={() => setF(s => ({ ...s, ce: !s.ce }))} />
                Certificate or CE hours <span className="cnt">{count('ce', o => o.ceEligible)}</span>
              </label>
            </div>
            {multi('Access', 'access', Object.entries(meta.access).map(([k, v]) => [k, v.label]), (o, v) => o.access === v)}
            {multi('Programme', 'programme', Object.entries(meta.programmes).map(([k, v]) => [k, v.label, v.color]), (o, v) => o.programme === v)}
            {one('Kind', 'kind', meta.kinds)}
            {one('Format', 'format', meta.formats)}
            {one('Depth', 'depth', meta.depths)}
            {multi('Tradition & topic', 'topics', meta.topics.map(t => [t, t]), (o, v) => o.topics.includes(v))}
            {multi('Teacher', 'teacher', teacherNames.map(t => [t, t]), (o, v) => o.teachers.some(x => x.name === v))}
            <div className="cl-sheetfoot"><button type="button" className="cl-clear" onClick={clear}>Clear all</button></div>
          </aside>

          <section className="cl-results" aria-label="Results">
            <div className="cl-rbar">
              <span className="cl-rcount" aria-live="polite">{n} {n === 1 ? 'course' : 'courses'}</span>
              <label className="cl-sort">Sort
                <select value={sort} onChange={e => setSort(e.target.value)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </label>
            </div>

            {n === 0 ? (
              <div className="cl-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#BFAE8F" strokeWidth="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M8 11h6" /></svg>
                <h3>Nothing matches those filters</h3>
                <p>Try removing a programme or access type. Pay-what-you-can courses sit under Seasonal Sādhanas and On demand.</p>
                <button type="button" className="cl-btn" onClick={clear}>Clear all filters</button>
              </div>
            ) : view === 'grid' ? (
              <div className="cl-grid">
                {shown.map(o => (
                  <a key={o.id} className="cl-card" href={`/courses/${o.id}`} style={band(o)}>
                    <div className="cl-cband" />
                    <div className="cl-cbody">
                      <div className="cl-ctop"><span className="cl-lbl">{o.label}</span>{badges(o)}</div>
                      <h3 className="cl-ctitle">{o.title}</h3>
                      <div className="cl-teach">
                        <span className="cl-avs">{o.teachers.slice(0, 3).map(t => t.photo
                          ? <img key={t.name} className="cl-av" src={t.photo} alt="" width="26" height="26" />
                          : <span key={t.name} className="cl-av" style={{ background: avColor(t.name) }}>{initials(t.name)}</span>)}</span>
                        <span style={{ marginLeft: 6 }}>{names(o)}</span>
                      </div>
                      {locked(o) && <div className="cl-lock"><Lock />{lockText(o)}</div>}
                      <div className="cl-meta">{[o.length, when(o), price(o)].filter(Boolean).flatMap((x, i, a) => [<span key={i} className={i === a.length - 1 ? 'price' : ''}>{x}</span>, i < a.length - 1 && <span key={'d' + i}>·</span>])}</div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="cl-list">
                {shown.map(o => (
                  <a key={o.id} className="cl-row" href={`/courses/${o.id}`} style={band(o)}>
                    <span className="cl-strip" />
                    <span className="cl-lbl hide">{o.label}</span>
                    <span className="cl-rt"><b>{o.title}</b><span>{names(o)}</span></span>
                    <span className="cl-mono hide">{o.length}</span>
                    <span className="cl-mono hide">{o.format}</span>
                    <span className="cl-rb">
                      {o.liveLabel && <span className="cl-badge b-live"><span className="cl-pulse" />Live</span>}
                      {locked(o) && <span className="cl-rlock" role="img" aria-label="Locked"><Lock /></span>}
                      <span className={`cl-badge ${included(o) ? 'b-inc' : o.access === 'pwyc' ? 'b-pwyc' : 'b-acc'}`}>{included(o) ? 'Included' : meta.access[o.access].short}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
