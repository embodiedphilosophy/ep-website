'use client';
import { useEffect, useState } from 'react';
import { SITE_TABLES, ADMIN_TABLES, tableOf, typeOf, RULE_OPTIONS, TYPE_OPTIONS, NEWSLETTER_OPTIONS } from '@/lib/ops/sitetables';

const SELECTS = { rule: RULE_OPTIONS, teamtype: TYPE_OPTIONS, newsletter: NEWSLETTER_OPTIONS };
const RULE_LABEL = { '': 'Worked out from the wording', bio: 'Bio and headshot are in', title: 'Public title and summary are in', blurbs: 'Promo blurbs are in', readings: 'Readings shared up front', video_id: 'Video ID is in', manual: 'Only by hand' };

const label = h => h.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
const yes = v => String(v).toUpperCase() !== 'FALSE';

// Content → Website (scope 'site') and Admin → Settings (scope 'admin'): sheet tabs as lists, each row
// edited as a short form. base: the page's own address, for the tab links.
export default function SiteEditor({ initial = 'links', scope = 'site', base = '/ops/content?tab=website&' }) {
  const TABLES = scope === 'admin' ? ADMIN_TABLES : SITE_TABLES;
  const [tab, setTab] = useState(initial);
  const [data, setData] = useState(null);     // { head, rows, locked, canEdit } | { error }
  const [sel, setSel] = useState(null);       // row number, 'new', or null
  const t = tableOf(tab);

  const load = async (k = tab) => {
    setData(null);
    const res = await fetch(`/api/ops/site?tab=${k}`).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setData(res?.ok ? j : { ...j, error: j?.error || 'Couldn’t load this tab' });
  };
  useEffect(() => { load(tab); }, [tab]);
  const go = k => { setTab(k); setSel(null); try { history.replaceState(null, '', `${base}t=${k}`); } catch {} };
  const create = async () => {
    setData(null);
    const res = await fetch('/api/ops/site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tab, create: true }) }).catch(() => null);
    if (!res?.ok) setData({ error: 'Couldn’t create the tab. Try again.' }); else load();
  };

  return (
    <section className="ops-site">
      <nav className="ops-filters ops-site-tabs" aria-label="Website content">
        {TABLES.map(x => <a key={x.key} href={`${base}t=${x.key}`} aria-current={x.key === tab ? 'page' : undefined} onClick={e => { e.preventDefault(); go(x.key); }}>{x.label}</a>)}
      </nav>
      <p className="ops-empty">{t.help}</p>
      {!data ? <p className="ops-empty">Loading…</p> : data.error ? <p className="ops-empty">{data.error} {data.canCreate && <button className="chip" onClick={create}>Create it</button>}</p> : (<>
        {data.canEdit && t.add && sel !== 'new' && <p><button className="chip" onClick={() => setSel('new')}>Add a row</button></p>}
        {sel === 'new' && <RowForm t={t} head={data.head} locked={data.locked} row={null} values={{}} onDone={() => { setSel(null); load(); }} />}
        <ul className="ops-site-rows">
          {data.rows.map(r => (
            <li key={r.row} className={'publish' in r.values && !yes(r.values.publish) ? 'is-hidden' : ''}>
              {sel === r.row ? <RowForm t={t} head={data.head} locked={data.locked} row={r.row} values={r.values} canEdit={data.canEdit} onDone={changed => { setSel(null); if (changed) load(); }} /> : (
                <button className="ops-site-row" onClick={() => setSel(r.row)}>
                  <span className="n">{t.name(r.values) || `Row ${r.row}`}{'publish' in r.values && !yes(r.values.publish) && <span className="off"> · hidden</span>}</span>
                  {t.sub(r.values) && <span className="s">{String(t.sub(r.values)).slice(0, 140)}</span>}
                </button>
              )}
            </li>
          ))}
        </ul>
      </>)}
    </section>
  );
}

function RowForm({ t, head, locked = [], row, values, canEdit = true, onDone }) {
  const [vals, setVals] = useState(values);
  const [orig, setOrig] = useState(values);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const changed = head.filter(h => h && String(vals[h] ?? '') !== String(orig[h] ?? ''));
  const ro = h => !canEdit || locked.includes(h) || (t.locked || []).includes(h);

  const save = async () => {
    setBusy(true); setErrors({}); setMsg('');
    const changes = Object.fromEntries(changed.map(h => [h, vals[h] ?? '']));
    const res = await fetch('/api/ops/site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tab: t.key, row, changes, before: row == null ? {} : orig }) }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok) return onDone(true);
    if (res?.status === 409) { setMsg(`${j.error}. Their version is shown now; make your change again.`); setOrig(j.conflict); setVals(j.conflict); return; }
    setErrors(j?.errors || {}); setMsg(j?.error || 'Couldn’t save. Try again.');
  };
  const input = h => {
    const v = vals[h] ?? '', type = typeOf(t.key, h, vals), id = `s-${h.replace(/\W+/g, '-')}`, set = x => setVals(s => ({ ...s, [h]: x }));
    if (type === 'bool') return <select id={id} value={String(v).toUpperCase()} disabled={ro(h) || busy} onChange={e => set(e.target.value)}><option value="">{['website', 'teachers'].includes(h) ? 'No (blank)' : 'Yes (blank)'}</option><option value="TRUE">Yes</option><option value="FALSE">No</option></select>;
    if (SELECTS[type]) return <select id={id} value={v} disabled={ro(h) || busy} onChange={e => set(e.target.value)}>{[...new Set([...(type === 'rule' ? [] : ['']), ...SELECTS[type], v])].map(o => <option key={o} value={o}>{type === 'rule' ? RULE_LABEL[o] || o : o || '—'}</option>)}</select>;
    if (type === 'color') return <input id={id} value={v} disabled={ro(h) || busy} onChange={e => set(e.target.value)} placeholder="#1E4772" style={{ borderLeft: /^#[0-9a-f]{6}$/i.test(v) ? `14px solid ${v}` : undefined }} />;
    if (type === 'long') return <textarea id={id} rows={Math.min(8, Math.max(3, Math.ceil(String(v).length / 70)))} value={v} disabled={ro(h) || busy} onChange={e => set(e.target.value)} />;
    return <input id={id} value={v} disabled={ro(h) || busy} type={type === 'date' ? 'date' : 'text'} inputMode={type === 'number' ? 'decimal' : undefined} onChange={e => set(e.target.value)} />;
  };
  return (
    <form className="ops-edit" onSubmit={e => { e.preventDefault(); save(); }}>
      <p className="ops-edit-title">{row == null ? `New ${t.label.toLowerCase().replace(/s$/, '')}` : t.name(orig) || `Row ${row}`}</p>
      {head.filter(Boolean).map(h => (
        <div key={h} className={`row${errors[h] ? ' bad' : ''}${changed.includes(h) ? ' changed' : ''}`}>
          <label htmlFor={`s-${h.replace(/\W+/g, '-')}`}>{h === 'publish' ? 'Show on the website' : h === 'done_when' ? 'Done when' : label(h)}</label>
          {input(h)}
          {errors[h] && <span className="hint">{errors[h]}</span>}
        </div>
      ))}
      <div className="bar">
        {canEdit && <button type="submit" className="chip primary" disabled={busy || !changed.length}>{busy ? 'Saving…' : row == null ? 'Add' : changed.length ? `Save ${changed.length} change${changed.length === 1 ? '' : 's'}` : 'No changes'}</button>}
        <button type="button" className="chip" disabled={busy} onClick={() => onDone(false)}>{canEdit ? 'Cancel' : 'Close'}</button>
        {msg && <span className="hint">{msg}</span>}
      </div>
    </form>
  );
}
