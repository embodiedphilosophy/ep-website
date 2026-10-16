'use client';
import { useEffect, useState } from 'react';
import { TABS, EMPTY, joinOpen } from '@/lib/school/tabs';

const clock = (iso, tz) => iso ? new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: tz }).format(new Date(iso)) : '';
const dateOnly = (iso, tz) => iso ? new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: tz }).format(new Date(iso)) : '';
const length = s => { const m = Math.round(Number(s) / 60); return m ? (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`) : ''; };

export default function SeasonView({ programme, slug, lists, initialTab, canReflect }) {
  const [tab, setTab] = useState(initialTab);
  const [tz, setTz] = useState('America/New_York'); // swapped for the member's own zone once we are in the browser
  const [now, setNow] = useState(Date.now());
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
  const list = lists[tab] || [];

  return (
    <>
      <div className="sch-tabs" role="group" aria-label="Season sections">
        {TABS.map(t => (
          <button key={t.key} type="button" className={`sch-tab${tab === t.key ? ' on' : ''}`} aria-pressed={tab === t.key} onClick={() => pick(t.key)}>
            {t.label} <span className="sch-count">{lists[t.key].length}</span>
          </button>
        ))}
      </div>
      {tab === 'reflections' && canReflect && <Composer programme={programme} slug={slug} />}
      {list.length === 0
        ? <p className="sch-empty">{EMPTY[tab]}</p>
        : <ul className="sch-list">{list.map((it, i) => <Card key={`${it.kind}${it.id}`} it={it} tz={tz} now={now} pinned={tab === 'all' && i === 0 && it.kind === 'event' && !it.ended} />)}</ul>}
    </>
  );
}

function Card({ it, tz, now, pinned }) {
  const [going, setGoing] = useState(it.rsvped);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const live = it.kind === 'event' && !it.ended;
  const href = it.kind === 'event' ? (it.replayUrl || it.pageUrl) : it.url;
  const opens = live && !joinOpen(it, now) ? 'Live room opens 10 minutes before' : '';
  const replies = it.replies ? `${it.replies} ${it.replies === 1 ? 'reply' : 'replies'}` : '';
  const meta = it.kind === 'event'
    ? [opens || (live ? 'Live now' : ''), it.ended && it.replayUrl && ['Replay', length(it.duration)].filter(Boolean).join(' · '), it.teacher].filter(Boolean)
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
        <h2>{href ? <a href={href}>{it.title}</a> : it.title}{when && <span className="sch-when"> · {when}</span>}</h2>
        <p className="sch-meta">{meta.join(' · ')}</p>
        {err && <p className="sch-err" role="alert">{err}</p>}
      </div>
      {live && (
        joinOpen(it, now) && it.url
          ? <a className="sch-btn" href={it.url}>Join</a>
          : going ? <span className="sch-going">You are going</span>
          : <button type="button" className="sch-btn ghost" onClick={rsvp} disabled={busy}>{busy ? 'Saving…' : 'RSVP'}</button>
      )}
    </li>
  );
}

function Composer({ programme, slug }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState({ busy: false, msg: '', ok: false });
  async function post(e) {
    e.preventDefault();
    setState({ busy: true, msg: '', ok: false });
    const r = await fetch('/api/school/reflection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ programme, season: slug, title, body }) }).catch(() => null);
    if (r?.ok) { setTitle(''); setBody(''); setState({ busy: false, ok: true, msg: 'Posted. It will show here in a moment.' }); }
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
