'use client';
import { useEffect, useState } from 'react';

const LOCK = <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="5.5" width="8" height="5.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>;
const STATUS = { new: 'Not started', progress: 'In progress', reflect: 'Reflection to write', held: 'Being checked by staff', certified: 'Certificate issued', locked: '' };

function Bar({ pct }) { return <span className="wsh-bar" role="img" aria-label={`${pct}% done`}><span style={{ width: `${pct}%` }} /></span>; }

function Banner({ b, onClose }) {
  return (
    <aside className="sch-upgrade" aria-label="Wisdom School Plus">
      <div><p>{b.text}</p></div>
      <div className="wsh-row"><a className="sch-btn" href={b.url} target="_top">Upgrade to Plus</a><button type="button" className="sch-btn ghost" onClick={onClose}>Not now</button></div>
    </aside>
  );
}

export default function WisdomView({ hub, settings, initialTab }) {
  const [tab, setTab] = useState(initialTab);
  const [hidden, setHidden] = useState(true); // until we have read the member's choice, so the banner never flashes
  useEffect(() => { try { setHidden(!!hub.banner && localStorage.getItem(hub.banner.key) === '1'); } catch { setHidden(false); } }, [hub.banner]);
  const close = () => { setHidden(true); try { localStorage.setItem(hub.banner.key, '1'); } catch {} };
  const pick = key => {
    setTab(key);
    const u = new URL(window.location.href);
    if (key === 'month') u.searchParams.delete('tab'); else u.searchParams.set('tab', key);
    window.history.replaceState(null, '', u);
  };
  const banner = hub.banner && !hidden && ['pathways', 'certificates', 'ce'].includes(tab) ? <Banner b={hub.banner} onClose={close} /> : null;
  const p = settings.project, L = settings.live;

  return (
    <>
      <div className="sch-tabs" role="group" aria-label="Wisdom School sections">
        {hub.tabs.map(t => (
          <button key={t.key} type="button" className={`sch-tab${tab === t.key ? ' on' : ''}`} aria-pressed={tab === t.key} onClick={() => pick(t.key)}>
            {t.label}{t.locked && <span className="sch-badge lock">Plus</span>}
          </button>
        ))}
      </div>

      {tab === 'month' && (
        <section className="sch-card wsh-one">
          <div><p className="sch-eyebrow">{p.stage}</p><h2>{p.title}</h2><p className="sch-preview">{p.summary}</p>
            {p.readings.length > 0 && <ul className="wsh-list">{p.readings.map(r => <li key={r.title}>{r.href ? <a href={r.href} target="_top">{r.title}</a> : r.title}</li>)}</ul>}
            {p.next_project && <p className="sch-preview">{p.next_project}</p>}</div>
          <a className="sch-btn" href={p.space_url} target="_top">Open the project</a>
        </section>
      )}

      {tab === 'live' && (
        <section className="sch-list">
          <div className="sch-card wsh-one"><div><h2>{L.title}</h2><p className="sch-preview">{L.line}</p></div>
            <div className="wsh-row"><a className="sch-btn" href={L.live_url} target="_top">Live sessions</a><a className="sch-btn ghost" href={L.replays_url} target="_top">Replays</a></div></div>
          <p className="sch-preview">{L.mondays_line}</p>
        </section>
      )}

      {tab === 'pathways' && (
        <>
          <ul className="sch-list">
            {hub.pathways.map(x => (
              <li key={x.slug} className={`sch-card wsh-card${x.state === 'locked' ? ' locked' : ''}`}>
                <div>
                  <h2>{x.state === 'locked' && <span className="wsh-lock">{LOCK}</span>}{x.title}{x.sample && <span className="sch-tag">Sample Pathway</span>}</h2>
                  <p className="sch-preview">{x.hours} CE hours{x.category ? ` · ${x.category}` : ''}{x.modules.length ? ` · ${x.modules.join(', ')}` : ''}</p>
                  {x.state === 'open' && <><Bar pct={x.percent} />{x.lessons && x.lessons.total > 0 && <p className="sch-preview">{x.lessons.done} of {x.lessons.total} lessons</p>}</>}
                </div>
                {x.state === 'open'
                  ? (x.href ? <a className="sch-btn" href={x.href} target="_top">{x.action}</a> : <span className="sch-preview">Opens soon</span>)
                  : <a className="sch-btn ghost" href={x.cta} target="_top">{x.action}</a>}
              </li>
            ))}
          </ul>
          {banner}
        </>
      )}

      {tab === 'certificates' && (
        <>
          <ul className="sch-list">
            {hub.certificates.map(c => (
              <li key={c.slug} className={`sch-card wsh-card${c.state === 'locked' ? ' locked' : ''}`}>
                <div>
                  <h2>{c.state === 'locked' && <span className="wsh-lock">{LOCK}</span>}{c.title}</h2>
                  {c.state === 'open' ? <><Bar pct={c.percent} /><p className="sch-preview">{STATUS[c.status] || ''} · {c.hours} hours</p></> : <p className="sch-preview">{c.note}</p>}
                </div>
                {c.state === 'open' ? (c.cert && c.cert.pdf ? <a className="sch-btn" href={c.cert.pdf}>Download</a> : null) : <a className="sch-btn ghost" href={c.cta} target="_top">Take this one</a>}
              </li>
            ))}
          </ul>
          {banner}
        </>
      )}

      {tab === 'ce' && (
        <>
          <section className="sch-card wsh-one">
            <div><h2>Yoga Alliance CE hours</h2>
              <p className="wsh-big">{hub.ce.dashboard.cycle.hours} <span>of {hub.ce.dashboard.cycle.need} hours this cycle</span></p>
              <p className="sch-preview">{hub.ce.open ? `${hub.ce.dashboard.certifiedHours} hours certified so far, out of ${hub.ce.dashboard.availableHours} available across all Pathways.` : hub.ce.explain}</p>
              {hub.ce.open && hub.ce.ready > 0 && <p className="sch-preview">{hub.ce.ready} certificate{hub.ce.ready === 1 ? '' : 's'} ready to download.</p>}
              {hub.ce.owed.length > 0 && <p className="sch-preview"><strong>A short reflection is still owed on:</strong> {hub.ce.owed.map(o => o.title).join('; ')}.</p>}
              {Object.keys(hub.ce.dashboard.byCategory || {}).length > 0 && <ul className="wsh-list">{Object.entries(hub.ce.dashboard.byCategory).map(([k, v]) => <li key={k}>{k}: {v} h</li>)}</ul>}
            </div>
            {hub.ce.open && <a className="sch-btn" href={settings.ce_page} target="_top">Open your CE tracker</a>}
          </section>
          {banner}
        </>
      )}
    </>
  );
}
