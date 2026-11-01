'use client';
import { useEffect, useState } from 'react';
import { joinOpen } from '@/lib/school/tabs';
import Pods from '../Pods';

// The one page of a season: header with the Season menu, six tabs (This week, Sessions, Readings, Reflections, Kula, Resources).
// Data comes from lib/school/season.js. Times are shown in the viewer's own time zone, never a fixed one.
const fmt = (iso, tz, o) => (iso ? new Intl.DateTimeFormat('en-US', { timeZone: tz, ...o }).format(new Date(iso)) : '');
const clock = (iso, tz) => fmt(iso, tz, { hour: 'numeric', minute: '2-digit' }).replace(/\s?([AP])M/, (_, x) => ` ${x.toLowerCase()}m`);
const dayShort = (iso, tz) => (iso ? new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso)).replace(',', '') : '');
const hrs = m => (m ? (m < 60 ? `${m} min` : m % 30 === 0 ? `${+(m / 60).toFixed(1)} hrs` : `${Math.floor(m / 60)} hrs ${m % 60} min`) : '');
const place = tz => String(tz || '').split('/').pop().replace(/_/g, ' ');
const ago = (iso, now) => { const h = Math.round((now - Date.parse(iso)) / 3600000); return h < 1 ? 'just now' : h < 24 ? `${h} hr${h === 1 ? '' : 's'} ago` : `${Math.round(h / 24)} days ago`; };

export default function SeasonView({ programme, slug, page, readings, initialTab, extraTabs = [], openComposer = false, seasonId }) {
  const [tab, setTab] = useState(initialTab);
  const [tz, setTz] = useState('America/New_York'); // swapped for the member's own zone once we are in the browser
  const [now, setNow] = useState(Date.now());
  const [cleared, setCleared] = useState({}); // new-counts cleared in this visit
  const [composer, setComposer] = useState(openComposer);
  const [mine, setMine] = useState([]); // reflections posted in this visit, shown at once
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const markSeen = id => {
    setCleared(c => ({ ...c, [id]: true }));
    fetch('/api/school/seen', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spaceId: id }) }).catch(() => {});
  };
  const pick = (key, opts = {}) => {
    setTab(key);
    if (opts.write) setComposer(true);
    const u = new URL(window.location.href);
    if (key === 'week') u.searchParams.delete('tab'); else u.searchParams.set('tab', key);
    u.searchParams.delete('write');
    window.history.replaceState(null, '', u);
    if (key === 'reflections' && page.reflections.count && !cleared[`refl-${seasonId}`]) markSeen(`refl-${seasonId}`);
  };
  useEffect(() => { if (initialTab === 'reflections' && page.reflections.count) markSeen(`refl-${seasonId}`); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const h = page.header;
  const firstWed = page.rows.find(r => r.kind === 'session');
  const rhythm = firstWed ? `${fmt(firstWed.at, tz, { weekday: 'long' })}s ${clock(firstWed.at, tz)} your time` : '';
  const sub = [h.short, h.subtitle, h.started ? (h.ended ? 'season complete' : `week ${h.week} of ${h.of}`) : `starts ${fmt(`${h.startsOn}T12:00:00Z`, 'UTC', { day: 'numeric', month: 'long' })}`, rhythm].filter(Boolean).join(' · ');
  const tabs = [...page.tabs, ...extraTabs.map(k => ({ key: k, label: 'Study pods', count: 0 }))];
  const count = t => (t.key === 'reflections' && cleared[`refl-${seasonId}`] ? 0 : t.key === 'kula' ? page.kula.cards.reduce((n, c) => n + (cleared[c.spaceId] ? 0 : c.newCount), 0) : t.count);
  const ctx = { page, tz, now, pick, markSeen, cleared };

  return (
    <>
      {page.announcement && (
        <div className="ss-ann" role="note">
          <span className="ss-eye">Announcement · {dayShort(page.announcement.at, tz)}</span>
          {page.announcement.url ? <a href={page.announcement.url} target="_top"><b>{page.announcement.title}</b></a> : <b>{page.announcement.title}</b>}
          {page.announcement.allUrl && <a className="ss-quiet" href={page.announcement.allUrl} target="_top">All announcements →</a>}
        </div>
      )}
      <header className="sch-head ss-head">
        <div>
          <p className="sch-eyebrow">{h.eyebrow}</p>
          <h1>{h.title}</h1>
          <p className="ss-sub">{sub}</p>
        </div>
        <label className="ss-season"><span>Season</span>
          <select value={slug} onChange={e => { window.location.href = `/school/${programme}/${e.target.value}`; }} aria-label="Season">
            {page.seasonsMenu.map(s => <option key={s.slug} value={s.slug} disabled={s.state === 'locked'}>{s.label}{s.note ? ` · ${s.note}` : ''}</option>)}
          </select>
        </label>
      </header>

      <div className="sch-tabs ss-tabs" role="group" aria-label="Season sections">
        {tabs.map(t => {
          const c = count(t);
          return (
            <button key={t.key} type="button" className={`sch-tab${tab === t.key ? ' on' : ''}`} aria-pressed={tab === t.key} onClick={() => pick(t.key)}>
              {t.label}{c > 0 && <span className="sch-badge new" aria-label={`${c} new`}>{c}</span>}
            </button>
          );
        })}
      </div>

      {tab === 'week' && <WeekTab {...ctx} />}
      {tab === 'sessions' && <SessionsTab {...ctx} />}
      {tab === 'readings' && <ReadingsTab plan={readings} now={page.readingNow} tz={tz} />}
      {tab === 'reflections' && <ReflectionsTab {...ctx} programme={programme} slug={slug} composer={composer} setComposer={setComposer} mine={mine} setMine={setMine} />}
      {tab === 'kula' && <KulaTab {...ctx} />}
      {tab === 'resources' && <ResourcesTab {...ctx} />}
      {tab === 'pods' && <Pods />}

      {page.fullYear && (
        <aside className="ss-full">
          <div><span className="ss-eye">With the full year</span><p>{page.fullYear.text}</p></div>
          {page.fullYear.url && <a className="sch-btn ghost" href={page.fullYear.url} target="_top">{page.fullYear.label}</a>}
        </aside>
      )}
    </>
  );
}

// One RSVP button (existing /api/school/rsvp)
function Rsvp({ row, dark }) {
  const [going, setGoing] = useState(row.rsvped);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go() {
    setBusy(true); setErr('');
    const r = await fetch('/api/school/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: row.id }) }).catch(() => null);
    setBusy(false);
    if (r?.ok) setGoing(true); else setErr((await r?.json().catch(() => ({})))?.error || 'We could not save your RSVP. Please try again.');
  }
  return (
    <>
      {going ? <span className={`sch-going${dark ? ' ss-goingd' : ''}`}>Going ✓</span> : <button type="button" className={dark ? 'sch-btn ss-gold' : 'sch-btn ghost'} onClick={go} disabled={busy}>{busy ? 'Saving…' : 'RSVP'}</button>}
      {err && <span className="sch-err" role="alert">{err}</span>}
    </>
  );
}

function WeekTab({ page, tz, now, pick, markSeen, cleared }) {
  const w = page.week, n = w.next, live = n && joinOpen({ start: n.at, end: n.end }, now);
  const rows = page.rows;
  const nextRow = n && rows.find(r => r.id === n.id);
  return (
    <>
      <div className="ss-four">
        <section className="ss-card pine">
          <span className="ss-eye">Next live{n?.n ? ` · Session ${n.n}` : n?.weekend ? ' · Open Session' : ''}</span>
          {n ? (
            <>
              <h2>{dayShort(n.at, tz)} · {clock(n.at, tz)}</h2>
              <p>Your time{n.minutes ? ` · ${hrs(n.minutes)}` : ''}{n.teacher ? ` · with ${n.teacher}` : ''}</p>
              <div className="ss-acts">
                {live && (n.joinUrl) ? <a className="sch-btn ss-gold" href={n.joinUrl} target="_top">Join now</a> : nextRow && <Rsvp row={nextRow} dark />}
                {n.cal && <a className="ss-quiet light" href={n.cal} target="_blank" rel="noopener">Add to calendar</a>}
              </div>
            </>
          ) : <p>{page.header.ended ? 'The season’s live sessions are complete.' : 'The next session will appear here once it is scheduled.'}</p>}
        </section>
        <section className="ss-card">
          <span className="ss-eye">This week’s reading</span>
          {w.reading ? (<><h2>{w.reading.title}</h2><p>{w.reading.source}</p>{w.reading.url ? <a className="sch-btn ghost" href={w.reading.url} target="_blank" rel="noopener">Open the reading</a> : <button type="button" className="sch-btn ghost" onClick={() => pick('readings')}>Open the reading</button>}</>) : <p>Readings appear here before Session 1.</p>}
        </section>
        <section className="ss-card">
          <span className="ss-eye">Latest recording</span>
          {w.recording ? (<><h2>{w.recording.title} · {dayShort(w.recording.at, tz)}</h2><p>{[w.recording.teacher && `With ${w.recording.teacher}`, hrs(w.recording.minutes)].filter(Boolean).join(' · ')}</p><a className="sch-btn ghost" href={w.recording.url} target="_top">Watch</a></>) : <p>Recordings appear here a few minutes after each live session ends.</p>}
        </section>
        <section className="ss-card">
          <span className="ss-eye">Reflect this week</span>
          {w.reflect ? (<><h2 className="ss-ital">{w.reflect.prompt || (w.reflect.focus ? `What did ${w.reflect.focus} bring up for you?` : 'What has been alive for you this week?')}</h2>{page.reflections.canPost && <button type="button" className="sch-btn ghost" onClick={() => pick('reflections', { write: true })}>Write a reflection</button>}</>) : <p>This week’s prompt will appear here.</p>}
        </section>
      </div>

      <div className="ss-cols">
        <section className="ss-card wide">
          <div className="ss-hd"><h2>The eight weeks</h2><button type="button" className="ss-link" onClick={() => pick('sessions')}>Full schedule</button></div>
          {w.weeks.length === 0 ? <p className="sch-meta">The weekly plan will appear here once the readings are set.</p> : (
            <ul className="ss-weeks">
              {w.weeks.map(k => (
                <li key={k.n} className={k.now ? 'now' : ''}>
                  <span className="ss-mono">W{k.n}</span>
                  <span>{k.at ? dayShort(k.at, tz) : ''}</span>
                  <span><b>{k.focus}</b>{k.teacher ? ` · ${k.teacher}` : ''}</span>
                  <span className={k.recording ? 'ss-ok' : k.next ? 'ss-next' : ''}>{k.recording ? 'Recording ✓' : k.next ? `Next · ${fmt(k.at, tz, { weekday: 'short' })}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="ss-side">
          <section className="ss-card">
            <div className="ss-hd"><h2>New in Reflections</h2><button type="button" className="ss-link" onClick={() => pick('reflections')}>All</button></div>
            {page.reflections.latest.length === 0 ? <p className="sch-meta">Be the first to share a reflection.</p> : page.reflections.latest.map(p => (
              <div key={p.id} className="ss-mini"><b>{p.who}</b><h3>{p.title}</h3><span className="sch-meta">{p.replies ? `${p.replies} ${p.replies === 1 ? 'reply' : 'replies'}` : 'No replies yet'}</span></div>
            ))}
          </section>
          {page.kula.cards.length > 0 && (() => {
            const chat = page.kula.cards.find(c => c.key === 'kula-chat') || page.kula.cards[0], fresh = cleared[chat.spaceId] ? 0 : chat.newCount;
            return (
              <section className="ss-card">
                <h2>Kula</h2>
                <p className="sch-meta">{fresh ? `${fresh} new in the kula chat` : 'Nothing new in the kula chat'}{chat.last ? ` · latest ${ago(chat.last.at, now)}` : ''}</p>
                {chat.href && <a className="sch-btn ghost" href={chat.href} target="_top" onClick={() => markSeen(chat.spaceId)}>Open the kula</a>}
              </section>
            );
          })()}
        </div>
      </div>
    </>
  );
}

function SessionsTab({ page, tz, now }) {
  const upgrade = page.fullYear?.url;
  return (
    <section className="ss-card wide">
      <div className="ss-hd"><h2>Sessions and recordings</h2><span className="sch-meta">Times in your time zone ({place(tz)}) · Wednesday sessions and the season’s weekend Open Sessions</span></div>
      {page.rows.length === 0 ? <p className="sch-empty">The live sessions for this season will appear here.</p> : (
        <ul className="ss-rows">
          {page.rows.map(r => {
            const live = !r.ended && !r.locked && joinOpen({ start: r.at, end: r.end }, now);
            const replay = r.replayUrl || r.pageUrl;
            let act;
            if (r.locked) act = upgrade ? <a className="sch-btn ghost quiet" href={upgrade} target="_top">Full year only</a> : <span className="sch-meta">Full year only</span>;
            else if (r.tbd) act = <span className="sch-meta">Time to be announced</span>;
            else if (r.ended) act = r.replayUrl ? <a className="sch-btn" href={r.replayUrl} target="_top">Watch the recording</a>
              : now - Date.parse(r.end || r.at) < 2 * 3600 * 1000 + 30 * 60 * 1000 ? <span className="sch-meta">Replay is being prepared</span> : r.pageUrl ? <a className="sch-btn ghost" href={replay} target="_top">Open the session page</a> : null;
            else if (live && r.joinUrl) act = <a className="sch-btn" href={r.joinUrl} target="_top">Join now</a>;
            else act = <Rsvp row={r} />;
            return (
              <li key={`${r.kind}${r.id}`} className={r.state === 'next' ? 'next' : ''}>
                <div className="ss-when"><b>{r.tbd ? dayShort(r.at, 'UTC') : dayShort(r.at, tz)}</b><span>{r.tbd ? 'Weekend' : [clock(r.at, tz), hrs(r.minutes)].filter(Boolean).join(' · ')}</span></div>
                <div className="ss-what">
                  <b>{r.kind === 'weekend' ? r.title : `Session ${r.n || ''}`.trim()}{r.focus ? ` · ${r.focus}` : ''}</b>
                  {r.tag && <span className="ss-tag">{r.tag}</span>}
                  <span>{r.kind === 'weekend' ? 'Immersion weekend' : r.teacher ? `With ${r.teacher}` : ''}</span>
                </div>
                <div className="ss-act">{act}</div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function KulaTab({ page, now, markSeen, cleared }) {
  if (!page.kula.cards.length) return <p className="sch-empty">The kula spaces will appear here soon.</p>;
  return (
    <div className="ss-two">
      {page.kula.cards.map(c => {
        const fresh = cleared[c.spaceId] ? 0 : c.newCount;
        return (
          <section key={c.key} className={`ss-card${c.state === 'locked' ? ' dashed' : ''}`}>
            <span className="ss-eye">{c.key === 'kula-chat' ? 'Chat' : 'Commentary'}</span>
            <h2>{c.title}</h2>
            <p>{c.line}</p>
            <p className="sch-meta">{c.state === 'locked' ? 'Not open to you yet.' : c.key === 'kula-chat' ? (fresh ? `${fresh} new` : 'Nothing new') + (c.last ? ` · latest ${ago(c.last.at, now)}` : '') : c.last ? `Latest: ${c.last.title}` : 'No commentary yet.'}</p>
            {c.href && c.state !== 'locked' && <a className="sch-btn ghost" href={c.href} target="_top" onClick={() => markSeen(c.spaceId)}>{c.action}</a>}
          </section>
        );
      })}
    </div>
  );
}

function ResourcesTab({ page }) {
  if (!page.resources.length) return <p className="sch-empty">The resource spaces will appear here soon.</p>;
  return (
    <div className="ss-three">
      {page.resources.map(c => (
        <section key={c.key} className={`ss-card${c.state === 'locked' ? ' dashed' : ''}`}>
          <span className="ss-eye">{c.eyebrow}</span>
          <h2>{c.href && c.state !== 'locked' ? <a href={c.href} target="_top">{c.title}</a> : c.title}</h2>
          <p>{c.line}</p>
          {c.state === 'locked' && <p className="sch-meta">Not open to you yet.</p>}
        </section>
      ))}
    </div>
  );
}

// Reflections: the existing list and composer for now (the threaded view comes next)
function ReflectionsTab({ page, tz, programme, slug, composer, setComposer, mine, setMine }) {
  const list = [...mine.map(m => ({ id: m.id, title: m.title, who: 'You', at: new Date(m.at).toISOString(), replies: 0, url: '' })), ...page.reflections.list];
  return (
    <>
      {page.reflections.canPost && (composer ? <Composer programme={programme} slug={slug} onPosted={m => setMine(x => [{ ...m, id: `new${x.length}`, at: Date.now() }, ...x])} /> : <p><button type="button" className="sch-btn" onClick={() => setComposer(true)}>Write a reflection</button></p>)}
      {list.length === 0 ? <p className="sch-empty">Be the first to share a reflection for this season.</p> : (
        <ul className="sch-list">
          {list.map(p => (
            <li key={p.id} className="sch-card" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
              <div className="sch-card-main">
                <h2>{p.url ? <a href={p.url} target="_top">{p.title}</a> : p.title}</h2>
                <p className="sch-meta">{[p.who && `Started by ${p.who}`, p.replies ? `${p.replies} ${p.replies === 1 ? 'reply' : 'replies'}` : '', fmt(p.at, tz, { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
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

// The season's reading assignments (lib/school/readings.js)
const weekday = (iso, tz) => iso ? new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(new Date(iso)) : '';
function ReadingsTab({ plan, now, tz }) {
  useEffect(() => {
    if (now) document.getElementById(`week-${now}`)?.scrollIntoView({ block: 'start' });
  }, [now]);
  if (!plan) return <p className="sch-empty">Readings for this season will appear here before Session 1.</p>;
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
