'use client';
import { useEffect, useState } from 'react';
import { TABS, EMPTY, joinOpen } from '@/lib/school/tabs';

const clock = (iso, tz) => iso ? new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: tz }).format(new Date(iso)) : '';
const dateOnly = (iso, tz) => iso ? new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: tz }).format(new Date(iso)) : '';
const length = s => { const m = Math.round(Number(s) / 60); return m ? (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`) : ''; };

export default function SeasonView({ programme, slug, lists, initialTab, canReflect, readings = null, readingNow = null }) {
  const [tab, setTab] = useState(initialTab);
  const [tz, setTz] = useState('America/New_York'); // swapped for the member's own zone once we are in the browser
  const [now, setNow] = useState(Date.now());
  const [mine, setMine] = useState([]); // reflections posted in this visit, shown at once
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const pick = key => {
    setTab(key);
    const u = new URL(window.location.href);
    if (key === 'all') u.searchParams.delete('tab'); else u.searchParams.set('tab', key);
    window.history.replaceState(null, '', u);
  };
  const justPosted = mine.map(m => ({ kind: 'post', id: m.id, title: m.title, at: new Date(m.at).toISOString(), chip: 'Reflection', teacher: 'You', replies: 0 }));
  const list = [...(tab === 'reflections' || tab === 'all' ? justPosted : []), ...(lists[tab] || [])];

  return (
    <>
      <div className="sch-tabs" role="group" aria-label="Season sections">
        {TABS.map(t => (
          <button key={t.key} type="button" className={`sch-tab${tab === t.key ? ' on' : ''}`} aria-pressed={tab === t.key} onClick={() => pick(t.key)}>
            {t.label} <span className="sch-count">{lists[t.key].length + (t.key === 'readings' && readings ? readings.weeks.length : 0)}</span>
          </button>
        ))}
      </div>
      {tab === 'reflections' && canReflect && <Composer programme={programme} slug={slug} onPosted={m => setMine(x => [{ ...m, id: `new${x.length}`, at: Date.now() }, ...x])} />}
      {tab === 'readings' && readings && <ReadingPlan plan={readings} now={readingNow} tz={tz} />}
      {list.length === 0
        ? (tab === 'readings' && readings ? null : <p className="sch-empty">{EMPTY[tab]}</p>)
        : <ul className="sch-list">{list.map((it, i) => <Card key={`${it.kind}${it.id}`} it={it} tz={tz} now={now} pinned={tab === 'all' && i === 0 && it.kind === 'event' && !it.ended} />)}</ul>}
    </>
  );
}

function Card({ it, tz, now, pinned }) {
  const [going, setGoing] = useState(it.rsvped);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [playing, setPlaying] = useState(false);
  const live = it.kind === 'event' && !it.ended;
  const href = it.kind === 'event' ? (it.replayUrl || it.pageUrl || it.url) : it.url;
  const opens = live && !joinOpen(it, now) ? 'Live room opens 10 minutes before' : '';
  const replies = it.replies ? `${it.replies} ${it.replies === 1 ? 'reply' : 'replies'}` : '';
  const meta = it.kind === 'event'
    ? [opens || (live ? 'Live room is open' : ''), it.ended && (it.replayUrl ? ['Replay', length(it.duration)].filter(Boolean).join(' · ') : now - it.endedAt < 2 * 3600 * 1000 ? 'Replay is being prepared' : 'Replay on the session page'), it.teacher].filter(Boolean)
    : [it.chip === 'Recording' && ['Replay', length(it.duration)].filter(Boolean).join(' · '), it.teacher && (it.chip === 'Reflection' ? `Started by ${it.teacher}` : it.teacher), replies, dateOnly(it.at, tz)].filter(Boolean);
  const when = it.kind === 'event' ? clock(it.at, tz) : '';

  async function rsvp() {
    setBusy(true); setErr('');
    const r = await fetch('/api/school/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: it.id }) }).catch(() => null);
    setBusy(false);
    if (r?.ok) setGoing(true); else setErr((await r?.json().catch(() => ({})))?.error || 'We could not save your RSVP. Please try again.');
  }

  return (
    <li className={`sch-card${pinned ? ' pinned' : ''}`}>
      <span className={`sch-chip${it.chip === 'Live session' ? ' live' : ''}`}>{it.chip === 'Live session' ? 'Live sessions' : it.chip + 's'}</span>
      <div className="sch-card-main">
        <h2>{href ? <a href={href} target="_top">{it.title}</a> : it.title}{when && <span className="sch-when"> · {when}</span>}</h2>
        <p className="sch-meta">{meta.join(' · ')}</p>
        {err && <p className="sch-err" role="alert">{err}</p>}
        {it.video && !live && (playing
          ? <div className="sch-player" style={{ position: 'relative', paddingTop: '56.25%', marginTop: 12, borderRadius: 8, overflow: 'hidden', background: '#000' }}>
              <iframe src={`${it.video}&autoplay=1`} title={it.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
            </div>
          : <button type="button" className="sch-btn ghost" style={{ marginTop: 10 }} onClick={() => setPlaying(true)}>▶ Watch here</button>)}
      </div>
      {live && (
        joinOpen(it, now) && (it.url || it.pageUrl)
          ? <a className="sch-btn" href={it.url || it.pageUrl} target="_top">Join the livestream</a>
          : going ? <span className="sch-going">You are going</span>
          : <button type="button" className="sch-btn ghost" onClick={rsvp} disabled={busy}>{busy ? 'Saving…' : 'RSVP'}</button>
      )}
    </li>
  );
}

function Composer({ programme, slug, onPosted }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState({ busy: false, msg: '', ok: false });
  async function post(e) {
    e.preventDefault();
    setState({ busy: true, msg: '', ok: false });
    const r = await fetch('/api/school/reflection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ programme, season: slug, title, body }) }).catch(() => null);
    if (r?.ok) { onPosted({ title: title.trim() || 'Reflection' }); setTitle(''); setBody(''); setState({ busy: false, ok: true, msg: 'Posted. It is now in Circle too.' }); }
    else setState({ busy: false, ok: false, msg: (await r?.json().catch(() => ({})))?.error || 'We could not post your reflection. Please try again.' });
  }
  return (
    <form className="sch-composer" onSubmit={post}>
      <label htmlFor="sch-t">Share a reflection</label>
      <input id="sch-t" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)" maxLength={120} />
      <textarea aria-label="Your reflection" value={body} onChange={e => setBody(e.target.value)} placeholder="What has been alive for you this week?" rows={4} />
      <div className="sch-composer-row">
        <button className="sch-btn" disabled={state.busy || !body.trim()}>{state.busy ? 'Posting…' : 'Post reflection'}</button>
        {state.msg && <span className={state.ok ? 'sch-ok' : 'sch-err'} role="status">{state.msg}</span>}
      </div>
    </form>
  );
}

// The season's reading assignments (lib/school/readings.js), at the top of the Readings tab
const weekday = (iso, tz) => iso ? new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(new Date(iso)) : '';
function ReadingPlan({ plan, now, tz }) {
  useEffect(() => {
    if (now) document.getElementById(`week-${now}`)?.scrollIntoView({ block: 'start' });
  }, [now]);
  const Item = ({ r }) => (
    <li>
      <span className="rd-book">{r.title}</span>
      {r.detail && <span className="rd-what">{r.detail}</span>}
      {(r.pages || r.file || r.link) && (
        <span className="rd-side">
          {r.pages && <span className="rd-pg">{r.pages}</span>}
          {r.file && <a className="sch-btn" href={r.file} target="_blank" rel="noopener" download>↓ Download</a>}
          {r.link && <a className="sch-btn ghost" href={r.link} target="_blank" rel="noopener">Open ↗</a>}
        </span>
      )}
    </li>
  );
  return (
    <div className="rd">
      {plan.intro && <p className="rd-lead">{plan.intro}</p>}
      {plan.needs.length > 0 && (
        <section className="rd-sources" aria-labelledby="rd-src">
          <h2 id="rd-src">What you’ll need</h2>
          <ul>{plan.needs.map(n => <Item key={n.title} r={n} />)}</ul>
        </section>
      )}
      <div className="rd-weeks">
        {plan.weeks.map(w => (
          <article key={w.session} id={`week-${w.session}`} className={`rd-week${w.session === now ? ' now' : ''}`}>
            <header>
              <p className="rd-eye">Week {w.session}{w.at && ` · ${weekday(w.at, tz)}`}{w.session === now && <span className="rd-now">Read for this week</span>}</p>
              {w.title && <h3>{w.title}</h3>}
              <p className="rd-meta">{w.focus && <span className="rd-focus">{w.focus}</span>}{w.teacher && <span>Taught by {w.teacher}</span>}{w.time && <span>{w.time}</span>}</p>
            </header>
            {w.core.length > 0 && <><h4>Core reading</h4><ul className="rd-core">{w.core.map((r, i) => <Item key={i} r={r} />)}</ul></>}
            {w.suggested.length > 0 && <><h4>Suggested</h4><ul className="rd-sugg">{w.suggested.map((r, i) => <Item key={i} r={r} />)}</ul></>}
          </article>
        ))}
      </div>
      {plan.footer && <p className="rd-foot">{plan.footer}</p>}
    </div>
  );
}
