'use client';
import { useEffect, useState } from 'react';
import { VIEWS, SETTABLE, colType, PLAN_EDITABLE } from '@/lib/ops/socialengine';

const label = h => h === 'publish_time_ET' ? 'Time (ET)' : h === 'jake_notes' ? 'Notes for the planner' : h.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
const day = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }) : s || 'No date';
const time = t => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/); if (!m) return t || ''; const h = +m[1]; return `${h % 12 || 12}${m[2] === '00' ? '' : ':' + m[2]}${h >= 12 ? 'pm' : 'am'}`; };
const isStory = p => /story/i.test(p.platforms) && !/feed/i.test(p.platforms);
const api = async (body) => {
  const res = await fetch('/api/ops/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const j = await res?.json().catch(() => ({}));
  return { ok: !!res?.ok, status: res?.status, ...j };
};

// Content → Social: the whole EP Social Engine. Make still publishes Approved posts at their date and time.
export default function SocialEngine({ director, initial = 'plan' }) {
  const [view, setView] = useState(initial);
  const views = VIEWS.filter(v => !v.director || director);
  const go = k => { setView(k); try { history.replaceState(null, '', k === 'plan' ? '/ops/content' : `/ops/content?s=${k}`); } catch {} };
  return (
    <section className="ops-se">
      <nav className="ops-filters ops-site-tabs" aria-label="Social">
        {views.map(v => <a key={v.key} href={`/ops/content?s=${v.key}`} aria-current={v.key === view ? 'page' : undefined} onClick={e => { e.preventDefault(); go(v.key); }}>{v.label}</a>)}
      </nav>
      {view === 'plan' ? <Plan /> : view === 'history' ? <History /> : <Library key={view} view={views.find(v => v.key === view)} />}
    </section>
  );
}

function useView(view, q = '', offset = 0) {
  const [data, setData] = useState(null);
  const load = async () => {
    const res = await fetch(`/api/ops/social?view=${view}&q=${encodeURIComponent(q)}&offset=${offset}`).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setData(res?.ok ? j : { error: j?.error || 'Couldn’t load the Social Engine' });
  };
  useEffect(() => { setData(null); const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [view, q, offset]);
  return [data, load];
}

// ---------- Plan ----------
function Plan() {
  const [data, reload] = useView('plan');
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState('');
  if (!data) return <p className="ops-empty">Loading the plan…</p>;
  if (data.error) return <p className="ops-empty">{data.error}</p>;
  const posts = data.rows.map(r => ({ ...r.values, _row: r.row, _thumb: r.thumb, _raw: r.values }));
  const proposed = posts.filter(p => p.status === 'Proposed');
  const feed = posts.filter(p => !isStory(p) && !['Skip', 'Failed'].includes(p.status));
  const weeks = [...new Set(posts.map(p => p.week_of || p.publish_date?.slice(0, 7) || ''))];
  const approveAll = async () => {
    if (!confirm(`Approve all ${proposed.length} proposed posts? Make publishes each at its date and time.`)) return;
    const j = await api({ view: 'plan', approve: proposed.map(p => ({ row: p._row, before: p._raw })) });
    setMsg(j.ok ? `${j.approved} approved.` : j.error); reload();
  };
  const count = s => posts.filter(p => p.status === s).length;
  return (
    <div className="ops-se-plan">
      <p className="ops-empty">Approved posts are published by Make at their date and time. Rows still Proposed at the Sunday 6pm deadline aren’t posted.</p>
      <div className="ops-se-bar">
        <span className="pills">{['Proposed', 'Approved', 'Needs edit', 'Posted', 'Failed'].filter(count).map(s => <span key={s} className={`pill s-${s.replace(/\s/g, '')}`}>{count(s)} {s}</span>)}</span>
        {data.canEdit && proposed.length > 0 && <button className="chip primary" onClick={approveAll}>Approve all proposed ({proposed.length})</button>}
        {msg && <span className="hint">{msg}</span>}
      </div>
      {feed.length > 0 && (<>
        <h3 className="ops-se-h">Feed preview</h3>
        <ul className="ops-se-grid">{feed.slice(0, 12).map(p => (
          <li key={p._row}><button onClick={() => setOpen(p._row)} title={p.caption?.slice(0, 200)}>
            {p._thumb ? <img src={p._thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="none">No image</span>}
            <span className={`st s-${String(p.status).replace(/\s/g, '')}`}>{p.status}</span>
          </button></li>))}</ul>
      </>)}
      {weeks.map(w => (
        <div key={w}>
          <h3 className="ops-se-h">{/^\d{4}-\d{2}-\d{2}$/.test(w) ? `Week of ${day(w)}` : w || 'Undated'}</h3>
          <ul className="ops-se-posts">
            {posts.filter(p => (p.week_of || p.publish_date?.slice(0, 7) || '') === w).map(p => (
              <Post key={p._row} p={p} canEdit={data.canEdit} open={open === p._row} setOpen={setOpen} onSaved={reload} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Post({ p, canEdit, open, setOpen, onSaved }) {
  const [vals, setVals] = useState(p._raw);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const save = async changes => {
    setBusy(true); setErrors({}); setMsg('');
    const j = await api({ view: 'plan', row: p._row, changes, before: p._raw });
    setBusy(false);
    if (j.ok) { onSaved(); return true; }
    if (j.status === 409) { setMsg(`${j.error}. Reloading their version.`); onSaved(); return false; }
    setErrors(j.errors || {}); setMsg(j.error || 'Couldn’t save'); return false;
  };
  const changed = PLAN_EDITABLE.filter(k => String(vals[k] ?? '') !== String(p._raw[k] ?? ''));
  const locked = ['Posted', 'Manual'].includes(p.status);
  return (
    <li className={`ops-se-post${open ? ' is-open' : ''}`}>
      <div className="row1">
        <button className="th" onClick={() => setOpen(open ? null : p._row)} aria-label="Open">
          {p._thumb ? <img src={p._thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="none">No image</span>}
        </button>
        <div className="body">
          <p className="when">{day(p.publish_date)} · {time(p.publish_time_ET)} ET · {isStory(p) ? 'Story' : p.platforms || 'Feed'}{p.pillar ? ` · ${p.pillar}` : ''}
            <span className={`pill s-${String(p.status).replace(/\s/g, '')}`}>{p.status || 'Proposed'}</span></p>
          {p.linked_event && <p className="ev">For: {p.linked_event}</p>}
          <p className={`cap${open ? '' : ' clip'}`}>{p.caption || <i>No caption yet</i>}</p>
          {p.quote_text && <p className="quo">“{p.quote_text}”{p.quote_source ? ` — ${p.quote_source}` : ''} <span className={p.quote_check === 'Verbatim' ? 'ok' : 'warn'}>{p.quote_check || 'not checked'}</span></p>}
          {p.error && <p className="err">Make: {p.error}</p>}
          {p.post_links && <p className="ev"><a href={p.post_links.split(/\s|,/)[0]} target="_blank" rel="noopener">View the post ↗</a></p>}
          {canEdit && !locked && !open && (
            <div className="acts">
              {p.status !== 'Approved' && <button className="chip primary" disabled={busy} onClick={() => save({ status: 'Approved' })}>Approve</button>}
              <button className="chip" disabled={busy} onClick={() => setOpen(p._row)}>Edit</button>
              {p.status !== 'Skip' && <button className="chip" disabled={busy} onClick={() => save({ status: 'Skip' })}>Skip</button>}
              {['Approved', 'Skip', 'Needs edit'].includes(p.status) && <button className="chip" disabled={busy} onClick={() => save({ status: 'Proposed' })}>Back to proposed</button>}
            </div>
          )}
          {msg && !open && <p className="hint">{msg}</p>}
        </div>
      </div>
      {open && (
        <form className="ops-edit" onSubmit={async e => { e.preventDefault(); if (await save(Object.fromEntries(changed.map(k => [k, vals[k]])))) setOpen(null); }}>
          {[['publish_date', 'date'], ['publish_time_ET'], ['platforms'], ['pillar'], ['format'], ['caption'], ['hashtags'], ['link'], ['image_id'], ['jake_notes']].map(([k]) => {
            const type = colType('Weekly Plan', k), dis = !canEdit || locked || busy;
            return (
              <div key={k} className={`row${errors[k] ? ' bad' : ''}${changed.includes(k) ? ' changed' : ''}`}>
                <label htmlFor={`p${p._row}-${k}`}>{k === 'image_id' ? 'Image' : label(k)}</label>
                {k === 'image_id' ? (
                  <div className="inline"><input id={`p${p._row}-${k}`} value={vals[k] || ''} disabled={dis} onChange={e => setVals(s => ({ ...s, [k]: e.target.value }))} />
                    {!dis && <button type="button" className="chip" onClick={() => setPicking(x => !x)}>{picking ? 'Close' : 'Choose…'}</button>}</div>
                ) : type === 'long' ? <textarea id={`p${p._row}-${k}`} rows={k === 'caption' ? 7 : 2} value={vals[k] || ''} disabled={dis} onChange={e => setVals(s => ({ ...s, [k]: e.target.value }))} />
                  : <input id={`p${p._row}-${k}`} type={type === 'date' ? 'date' : 'text'} value={vals[k] || ''} disabled={dis} placeholder={k === 'publish_time_ET' ? '11:00' : ''} onChange={e => setVals(s => ({ ...s, [k]: e.target.value }))} />}
                {errors[k] && <span className="hint">{errors[k]}</span>}
                {k === 'image_id' && picking && <ImagePicker onPick={id => { setVals(s => ({ ...s, image_id: id })); setPicking(false); }} />}
              </div>
            );
          })}
          <div className="bar">
            {canEdit && !locked && <>
              <button type="submit" className="chip primary" disabled={busy || !changed.length}>{changed.length ? `Save ${changed.length} change${changed.length === 1 ? '' : 's'}` : 'No changes'}</button>
              <button type="button" className="chip" disabled={busy || !String(vals.jake_notes || '').trim()} onClick={async () => { if (await save({ ...Object.fromEntries(changed.map(k => [k, vals[k]])), status: 'Needs edit' })) setOpen(null); }}>Send back with my notes</button>
            </>}
            <button type="button" className="chip" onClick={() => { setVals(p._raw); setOpen(null); }}>Close</button>
            {msg && <span className="hint">{msg}</span>}
          </div>
        </form>
      )}
    </li>
  );
}

function ImagePicker({ onPick }) {
  const [q, setQ] = useState('');
  const [data] = useView('images', q);
  return (
    <div className="ops-se-picker">
      <input placeholder="Search images by name, tag, category…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
      {!data ? <p className="hint">Loading…</p> : data.error ? <p className="hint">{data.error}</p> : (
        <ul>{data.rows.filter(r => String(r.values.reuse_ok).toUpperCase() === 'TRUE' && String(r.values.hidden).toUpperCase() !== 'TRUE').slice(0, 30).map(r => (
          <li key={r.row}><button type="button" onClick={() => onPick(r.values.image_id)} title={r.values.file_name}>
            {r.thumb ? <img src={r.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="none">{r.values.file_name}</span>}
          </button></li>))}</ul>
      )}
    </div>
  );
}

// ---------- Published ----------
function History() {
  const [offset, setOffset] = useState(0);
  const [data] = useView('history', '', offset);
  if (!data) return <p className="ops-empty">Loading…</p>;
  if (data.error) return <p className="ops-empty">{data.error}</p>;
  return (
    <div>
      <p className="ops-empty">What went out on Instagram, newest first ({data.total} posts).</p>
      <ul className="ops-se-hist">{data.rows.map(r => { const v = r.values; return (
        <li key={r.row}><span className="d">{day(String(v.posted_at).slice(0, 10))}</span><span className="c">{String(v.caption || '').slice(0, 160)}</span>
          <span className="n">♥ {v.like_count || 0} · 💬 {v.comments_count || 0}</span>{v.permalink && <a href={v.permalink} target="_blank" rel="noopener">↗</a>}</li>); })}</ul>
      <Pager data={data} setOffset={setOffset} />
    </div>
  );
}

function Pager({ data, setOffset }) {
  if (data.total <= 60) return null;
  return (
    <p className="ops-se-pager">
      <button className="chip" disabled={data.offset === 0} onClick={() => setOffset(Math.max(0, data.offset - 60))}>← Newer</button>
      <span className="hint">{data.offset + 1}–{Math.min(data.total, data.offset + 60)} of {data.total}</span>
      <button className="chip" disabled={data.offset + 60 >= data.total} onClick={() => setOffset(data.offset + 60)}>Older →</button>
    </p>
  );
}

// ---------- Libraries: quotes, images, captions, rules, categories, archive folders ----------
function Library({ view }) {
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [data, reload] = useView(view.key, q, offset);
  const [sel, setSel] = useState(null);
  return (
    <div>
      {view.help && <p className="ops-empty">{view.help}</p>}
      <div className="ops-se-bar">
        {view.search && <input className="ops-se-search" placeholder="Search…" value={q} onChange={e => { setQ(e.target.value); setOffset(0); }} />}
        {data?.canEdit && view.add && sel !== 'new' && <button className="chip" onClick={() => setSel('new')}>Add</button>}
        {data && !data.error && <span className="hint">{data.total} {data.total === 1 ? 'row' : 'rows'}</span>}
      </div>
      {!data ? <p className="ops-empty">Loading…</p> : data.error ? <p className="ops-empty">{data.error}</p> : (<>
        {sel === 'new' && <Row view={view} head={data.head} locked={data.locked} row={null} values={{}} canEdit onDone={() => { setSel(null); reload(); }} />}
        {view.key === 'images' ? (
          <ul className="ops-se-imgs">{data.rows.map(r => (
            <li key={r.row} className={String(r.values.hidden).toUpperCase() === 'TRUE' ? 'off' : ''}>
              {sel === r.row ? <Row view={view} head={data.head} locked={data.locked} row={r.row} values={r.values} canEdit={data.canEdit} onDone={c => { setSel(null); if (c) reload(); }} /> : (
                <button onClick={() => setSel(r.row)} title={r.values.file_name}>
                  {r.thumb ? <img src={r.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="none">{r.values.file_name}</span>}
                  <span className="cap">{r.values.category || r.values.type}{String(r.values.reuse_ok).toUpperCase() !== 'TRUE' ? ' · not for reuse' : ''}</span>
                </button>)}
            </li>))}</ul>
        ) : (
          <ul className="ops-site-rows">{data.rows.map(r => (
            <li key={r.row}>{sel === r.row ? <Row view={view} head={data.head} locked={data.locked} row={r.row} values={r.values} canEdit={data.canEdit} onDone={c => { setSel(null); if (c) reload(); }} /> : (
              <button className="ops-site-row" onClick={() => setSel(r.row)}>
                <span className="n">{String(view.name(r.values) || `Row ${r.row}`).slice(0, 160)}</span>
                {view.sub?.(r.values) && <span className="s">{String(view.sub(r.values)).slice(0, 140)}</span>}
              </button>)}</li>))}</ul>
        )}
        <Pager data={data} setOffset={setOffset} />
      </>)}
    </div>
  );
}

function Row({ view, head, locked, row, values, canEdit, onDone }) {
  const [vals, setVals] = useState(values);
  const [orig, setOrig] = useState(values);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const changed = head.filter(h => h && String(vals[h] ?? '') !== String(orig[h] ?? ''));
  const save = async e => {
    e.preventDefault(); setBusy(true); setErrors({}); setMsg('');
    const j = await api(row == null ? { view: view.key, add: true, values: Object.fromEntries(changed.map(h => [h, vals[h]])) }
      : { view: view.key, row, changes: Object.fromEntries(changed.map(h => [h, vals[h]])), before: orig });
    setBusy(false);
    if (j.ok) return onDone(true);
    if (j.status === 409) { setMsg(`${j.error}. Their version is shown now.`); setOrig(j.conflict); setVals(j.conflict); return; }
    setErrors(j.errors || {}); setMsg(j.error || 'Couldn’t save');
  };
  return (
    <form className="ops-edit" onSubmit={save}>
      {head.filter(Boolean).filter(h => !(row == null && locked.includes(h))).map(h => {
        const type = colType(view.tab, h), dis = !canEdit || busy || locked.includes(h), set = x => setVals(s => ({ ...s, [h]: x }));
        return (
          <div key={h} className={`row${errors[h] ? ' bad' : ''}${changed.includes(h) ? ' changed' : ''}`}>
            <label>{label(h)}</label>
            {type === 'bool' ? <select value={String(vals[h] || '').toUpperCase()} disabled={dis} onChange={e => set(e.target.value)}><option value="">—</option><option value="TRUE">Yes</option><option value="FALSE">No</option></select>
              : type === 'long' ? <textarea rows={Math.min(8, Math.max(2, Math.ceil(String(vals[h] || '').length / 80)))} value={vals[h] || ''} disabled={dis} onChange={e => set(e.target.value)} />
              : <input value={vals[h] || ''} disabled={dis} onChange={e => set(e.target.value)} />}
            {errors[h] && <span className="hint">{errors[h]}</span>}
          </div>
        );
      })}
      <div className="bar">
        {canEdit && <button type="submit" className="chip primary" disabled={busy || !changed.length}>{row == null ? 'Add' : changed.length ? `Save ${changed.length} change${changed.length === 1 ? '' : 's'}` : 'No changes'}</button>}
        <button type="button" className="chip" onClick={() => onDone(false)}>{canEdit ? 'Cancel' : 'Close'}</button>
        {msg && <span className="hint">{msg}</span>}
      </div>
    </form>
  );
}
