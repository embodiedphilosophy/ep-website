'use client';
import { useEffect, useRef, useState } from 'react';
import { TABS, joinOpen } from '../../../lib/hub/meditation';

// Times show twice: Eastern time, which the session is set in, and the member's own zone once the browser is up (ET until then)
const ET = 'America/New_York';
const parts = (iso, tz, o) => Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, ...o }).formatToParts(new Date(iso)).map(p => [p.type, p.value]));
const dateOf = (iso, tz = ET) => { const p = parts(iso, tz, { weekday: 'short', day: 'numeric', month: 'short' }); return `${p.weekday} ${p.day} ${p.month}`; };
const clock = (iso, tz) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(iso)).replace(/ ([AP])M$/, (m, a) => ` ${a.toLowerCase()}m`);
// "12:00 pm ET · 4:00 pm your time"
const whenOf = (iso, tz) => `${clock(iso, ET)} ET${tz !== ET ? ` · ${clock(iso, tz)} your time` : ''}`;
// The replay's date is a calendar day with no time zone
const dayOf = d => { if (!d) return ''; const p = parts(`${d}T12:00:00Z`, 'UTC', { weekday: 'short', day: 'numeric', month: 'short' }); return `${p.weekday} ${p.day} ${p.month}`; };

// A calendar file for one session (downloaded in the browser; nothing is sent anywhere)
function addToCalendar(e) {
  const f = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = s => String(s || '').replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');
  const text = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Embodied Philosophy//Meditation Mondays//EN', 'BEGIN:VEVENT', `UID:mm-${e.date}@embodiedphilosophy.com`, `DTSTAMP:${f(new Date().toISOString())}`,
    `DTSTART:${f(e.startsAt)}`, `DTEND:${f(e.endsAt)}`, `SUMMARY:${esc(`Meditation Mondays · ${e.title}`)}`, ...(e.url ? [`URL:${e.url}`] : []), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
  a.download = `meditation-monday-${e.date}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export default function MeditationView({ hub, initialTab, initialStream }) {
  const [tab, setTab] = useState(initialTab);
  const [stream, setStream] = useState(hub.streams.some(s => s.key === initialStream) ? initialStream : '');
  const [tz, setTz] = useState(ET);
  const [now, setNow] = useState(hub.now); // the server's clock until the browser takes over
  const [modal, setModal] = useState(null); // the upgrade pop-up: 'pass' | 'ws'
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || ET);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const go = (key, streamKey = '') => {
    setTab(key); setStream(streamKey);
    const u = new URL(window.location.href);
    if (key === 'week') u.searchParams.delete('tab'); else u.searchParams.set('tab', key);
    if (key === 'replays' && streamKey) u.searchParams.set('stream', streamKey); else u.searchParams.delete('stream');
    window.history.replaceState(null, '', u);
    window.scrollTo?.(0, 0);
  };
  const previewAs = plan => { const u = new URL(window.location.href); u.searchParams.set('as', plan); window.location.assign(u); };

  // The hero rolls on by itself when a session ends, without waiting for a new load
  const live = hub.upcoming.filter(s => Date.parse(s.endsAt) > now);
  const ctx = { hub, plan: hub.plan, tz, now, next: live[0] || null, four: live.slice(1, 5), live, up: k => setModal(k), go };

  return (
    <div className="wsh mmh">
      <header className="sch-head wsh-head">
        <div>
          <p className="sch-eyebrow">{hub.kicker}</p>
          <h1>Meditation Mondays</h1>
        </div>
        <div className="wsh-headr">
          <span className={`wsh-pill ${hub.plan === 'none' ? 'none' : ''}`}>{hub.viaWisdom ? 'Wisdom School' : hub.planLabel}</span>
          {hub.admin && (
            <label className="wsh-as">Preview as
              <select value={hub.plan} onChange={e => previewAs(e.target.value)}>
                <option value="pass">Meditation Pass</option><option value="dropin">Drop-in</option><option value="none">Not enrolled</option>
              </select>
            </label>
          )}
        </div>
      </header>

      <div className="sch-tabs" role="group" aria-label="Meditation Mondays sections">
        {TABS.map(t => (
          <button key={t.key} type="button" className={`sch-tab${tab === t.key ? ' on' : ''}`} aria-pressed={tab === t.key} onClick={() => go(t.key)}>{t.label}</button>
        ))}
      </div>

      <Banner ctx={ctx} />
      {hub.unavailable?.length > 0 && <p className="mmh-note" role="status">Some of this page is not loading just now ({hub.unavailable.join(', ')}). Please try again in a few minutes.</p>}
      {tab === 'week' && <Week ctx={ctx} />}
      {tab === 'replays' && <Replays ctx={ctx} stream={stream} setStream={k => go('replays', k)} />}
      {tab === 'upcoming' && <Upcoming ctx={ctx} />}
      {tab === 'teachers' && <Teachers ctx={ctx} />}

      {modal && <UpgradeModal hub={hub} kind={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

// What a locked item offers: open the two-step pop-up, never an error page
function Unlock({ ctx, label, kind = 'pass', ghost = true }) {
  return <button type="button" className={`sch-btn${ghost ? ' ghost' : ''}`} onClick={() => ctx.up(kind)}>{label || 'Start free week'}</button>;
}

function Banner({ ctx }) {
  const { hub, plan } = ctx, L = hub.links;
  if (plan === 'dropin') {
    return (
      <aside className="wsh-banner upsell" aria-label="Your drop-in">
        <div><h2>You’re in for this Monday.</h2><p>Your drop-in opens one live session. The Pass opens every Monday and the whole replay library.</p></div>
        <div className="wsh-actions"><button type="button" className="sch-btn" onClick={() => ctx.up('pass')}>Upgrade · {L.pass_monthly}</button></div>
      </aside>
    );
  }
  if (plan === 'none') {
    return (
      <aside className="wsh-banner preview" aria-label="Preview">
        <div><h2>Sit with us this Monday.</h2><p>A live guided meditation every Monday with EP faculty, and a library of replays.</p></div>
        <div className="wsh-actions"><button type="button" className="sch-btn" onClick={() => ctx.up('pass')}>Start your free week · {L.pass_yearly}</button></div>
      </aside>
    );
  }
  return null;
}

// The Join live / Add to calendar / upgrade buttons for one session, by plan
function SessionActions({ ctx, s, hero }) {
  const { plan, now, hub } = ctx;
  const joinable = s.open && s.url && joinOpen(s, now, hub.joinBeforeMinutes);
  return (
    <>
      {joinable && <a className="sch-btn" href={s.url} target="_top">Join live</a>}
      {plan === 'none' && <Unlock ctx={ctx} label="Start your free week" ghost={!hero} />}
      {plan === 'dropin' && !s.open && <><span className="mmh-only">Pass only</span><Unlock ctx={ctx} label={`Upgrade · ${hub.links.pass_monthly}`} /></>}
      {s.open && <button type="button" className="sch-btn ghost" onClick={() => addToCalendar(s)}>Add to calendar</button>}
    </>
  );
}

function Hero({ ctx }) {
  const { next, tz, now, hub } = ctx;
  if (!next) {
    return (
      <section className="wsh-hero" aria-label="This Monday">
        <p className="wsh-kick">Next session</p><h2>Meditation Mondays</h2>
        <p className="wsh-soon">The next session will appear here once it is scheduled.</p>
      </section>
    );
  }
  const started = now >= Date.parse(next.startsAt);
  return (
    <section className="wsh-hero" aria-label="This Monday">
      <p className="wsh-kick">{started ? 'Live now' : 'Next session'} · {dateOf(next.startsAt)}</p>
      <h2>{next.title}</h2>
      <p className="mmh-when">{whenOf(next.startsAt, tz)}</p>
      <div className="mmh-btns"><SessionActions ctx={ctx} s={next} hero /></div>
      {ctx.plan === 'pass' && !joinOpen(next, now, hub.joinBeforeMinutes) && next.url && <p className="mmh-hint">Join live opens 15 minutes before the start.</p>}
    </section>
  );
}

function Thumb({ r }) {
  return r.thumb ? <img className="mmh-thumb" src={r.thumb} alt="" loading="lazy" /> : <span className="mmh-thumb sage" aria-hidden="true"><i>Meditation Mondays Library</i></span>;
}
const metaOf = r => [r.stream, r.teacher, r.minutes ? `${r.minutes} min` : '', r.date ? dayOf(r.date) : ''].filter(Boolean).join(' · ');

function ReplayCard({ ctx, r, big }) {
  const L = ctx.hub.links;
  const inner = (
    <>
      <Thumb r={r} />
      <span className="mmh-ct">
        <b>{r.title}</b>
        <span className="sch-meta">{metaOf(r)}</span>
        {r.locked ? <span className="mmh-lock">Locked · 5-minute preview</span> : r.done ? <span className="mmh-done">Watched</span> : null}
      </span>
    </>
  );
  // A locked card never links into the lesson; its preview goes to the free 5-minute player
  if (r.locked) return <li className={`mmh-card locked${big ? ' big' : ''}`}>{inner}<a className="sch-btn ghost" href={L.preview} target="_top">Watch 5 minutes</a></li>;
  return <li className={`mmh-card${big ? ' big' : ''}`}><a href={r.url} target="_top" className="mmh-card-a">{inner}</a></li>;
}

// ---------- This week ----------
function Week({ ctx }) {
  const { hub, plan, tz, four } = ctx, L = hub.links, r = hub.latestReplay;
  return (
    <div className="wsh-cols">
      <div className="wsh-main">
        <Hero ctx={ctx} />

        {r && (
          <section aria-labelledby="mm-latest">
            <h2 id="mm-latest" className="sch-sub">Latest replay</h2>
            <ul className="mmh-one"><ReplayCard ctx={ctx} r={r} big /></ul>
            {plan !== 'pass' && <p className="sch-meta mmh-gap">First 5 minutes only. The full replay comes with the Pass.</p>}
          </section>
        )}

        <section aria-labelledby="mm-four">
          <h2 id="mm-four" className="sch-sub">The next four Mondays</h2>
          {four.length ? (
            <ul className="sch-list mmh-four">
              {four.map(s => (
                <li key={s.id} className="sch-card hub wsh-row">
                  <span className="sch-chip">{dateOf(s.startsAt)}</span>
                  <div className="sch-card-main"><h2>{s.teacher || 'Meditation Mondays'}</h2><p className="sch-meta">{s.stream || 'Live guided meditation'} · {whenOf(s.startsAt, tz)}</p></div>
                </li>
              ))}
            </ul>
          ) : <p className="wsh-none">The next Mondays will appear here once they are scheduled.</p>}
        </section>

        <section aria-labelledby="mm-streams">
          <h2 id="mm-streams" className="sch-sub">Five streams</h2>
          <ul className="mmh-streams">
            {hub.streams.map(s => (
              <li key={s.key}><button type="button" className="mmh-stream" onClick={() => ctx.go('replays', s.key)}><b>{s.name}</b><span>{s.teacher}</span></button></li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="wsh-side" aria-label="Your plan">
        {plan === 'pass' && hub.viaWisdom ? (
          <>
            <p className="sch-eyebrow">Your Wisdom School</p>
            <h2>Back to Wisdom School</h2>
            <p className="sch-meta">Meditation Mondays is part of your membership.</p>
            <a className="sch-btn" href={L.ws_hub} target="_top">Open Wisdom School</a>
          </>
        ) : plan === 'pass' ? (
          <>
            <p className="sch-eyebrow">Wisdom School · {L.ws_price}</p>
            <h2>Go further between Mondays</h2>
            <p className="sch-meta">The year’s Pilgrimage Project, the monthly lecture and a learning pathway, on top of your Mondays.</p>
            <button type="button" className="sch-btn" onClick={() => ctx.up('ws')}>See Wisdom School</button>
          </>
        ) : plan === 'dropin' ? (
          <>
            <p className="sch-eyebrow">The Meditation Pass</p>
            <h2>Upgrade to the Pass</h2>
            <p className="sch-meta">Every live Monday and the whole replay library. Your first week is free.</p>
            <button type="button" className="sch-btn" onClick={() => ctx.up('pass')}>Upgrade · {L.pass_monthly}</button>
          </>
        ) : (
          <>
            <p className="sch-eyebrow">The Meditation Pass</p>
            <h2>Your first week is free</h2>
            <p className="sch-meta">Every live Monday and the whole replay library, then {L.pass_yearly}.</p>
            <button type="button" className="sch-btn" onClick={() => ctx.up('pass')}>Start your free week</button>
          </>
        )}
      </aside>
    </div>
  );
}

// ---------- Replays ----------
function Replays({ ctx, stream, setStream }) {
  const { hub, plan } = ctx;
  const keep = r => !stream || r.streamKey === stream;
  const groups = hub.sections.map(s => ({ ...s, lessons: s.kind === 'start' ? s.lessons : s.lessons.filter(keep) })).filter(s => s.lessons.length);
  const starts = groups.filter(s => s.kind === 'start' && !stream);
  const rest = groups.filter(s => s.kind !== 'start');
  return (
    <>
      <div className="mmh-chips" role="group" aria-label="Filter by stream">
        <button type="button" className={`mmh-chip${!stream ? ' on' : ''}`} aria-pressed={!stream} onClick={() => setStream('')}>All</button>
        {hub.streams.map(s => <button key={s.key} type="button" className={`mmh-chip${stream === s.key ? ' on' : ''}`} aria-pressed={stream === s.key} onClick={() => setStream(s.key)}>{s.name}</button>)}
      </div>
      {plan !== 'pass' && <p className="sch-meta mmh-gap">Replays are for Pass members. Watch the first 5 minutes of any session here.</p>}
      {[...starts, ...rest].map(s => (
        <section key={s.id} aria-label={s.name}>
          <h2 className="sch-sub mmh-gap">{s.name}</h2>
          <ul className="mmh-grid">{s.lessons.map(r => <ReplayCard key={r.id} ctx={ctx} r={r} />)}</ul>
        </section>
      ))}
      {!groups.length && <p className="wsh-none">{stream ? 'No replays in this stream yet.' : 'Replays will appear here as they are published.'}</p>}
    </>
  );
}

// ---------- Upcoming ----------
function Upcoming({ ctx }) {
  const { hub, plan, tz, live } = ctx, L = hub.links;
  return (
    <>
      <ul className="sch-list">
        {live.map(s => (
          <li key={s.id} className={`sch-card hub wsh-row${plan !== 'pass' && !s.open ? ' locked' : ''}`}>
            <span className="sch-chip">{dateOf(s.startsAt)}</span>
            <div className="sch-card-main">
              <h2>{s.teacher || 'Meditation Mondays'}{plan === 'dropin' && !s.open && <span className="sch-badge lock">Pass only</span>}{plan === 'dropin' && s.own && <span className="sch-badge new">Your session</span>}</h2>
              <p className="sch-meta">{s.stream || 'Live guided meditation'} · {whenOf(s.startsAt, tz)}</p>
            </div>
            <div className="mmh-act"><SessionActions ctx={ctx} s={s} /></div>
          </li>
        ))}
        <li className="sch-card hub wsh-row">
          <span className="sch-chip">Calendar</span>
          <div className="sch-card-main"><h2>Subscribe to every Monday</h2><p className="sch-meta">Add the whole series to Google, Apple or Outlook calendar. New sessions appear by themselves.</p></div>
          <div className="mmh-act">
            {plan === 'pass'
              ? <a className="sch-btn" href={hub.feed ? hub.feed.replace(/^https:/, 'webcal:') : L.schedule} target={hub.feed ? '_self' : '_top'}>{hub.feed ? 'Subscribe' : 'Open my schedule'}</a>
              : <Unlock ctx={ctx} ghost={false} />}
          </div>
        </li>
      </ul>
      {!live.length && <p className="wsh-none">The next sessions will appear here once they are scheduled.</p>}
    </>
  );
}

// ---------- Teachers & streams ----------
function Teachers({ ctx }) {
  const { hub } = ctx;
  return (
    <ul className="sch-list">
      {hub.streams.map(s => (
        <li key={s.key} className="sch-card hub wsh-row">
          <span className="sch-chip">{s.name}</span>
          <div className="sch-card-main">
            <h2>{s.teacher}</h2>
            {s.approach && <p className="sch-meta">{s.approach}</p>}
            <p className="sch-meta">{s.replays} {s.replays === 1 ? 'replay' : 'replays'}{s.next ? ` · Next: ${dayOf(s.next)}` : ''}</p>
          </div>
          <button type="button" className="sch-btn ghost" onClick={() => ctx.go('replays', s.key)}>See replays</button>
        </li>
      ))}
    </ul>
  );
}

// The second step of an upgrade: an in-page pop-up (the same one as the other hubs) with the Circle checkout and the site page
function UpgradeModal({ hub, kind, onClose }) {
  const ref = useRef(null), L = hub.links;
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const key = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); };
  }, [onClose]);
  const ws = kind === 'ws';
  return (
    <div className="wsh-modal" role="dialog" aria-modal="true" aria-labelledby="mm-up-t" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wsh-modal-c" tabIndex={-1} ref={ref}>
        <h2 id="mm-up-t">{ws ? 'Wisdom School' : 'The Meditation Pass'}</h2>
        {ws
          ? <><p>Wisdom School adds the year’s Pilgrimage Project, the monthly lecture and a learning pathway to your Mondays.</p><p>You keep everything you have now. Join at any time.</p></>
          : <><p>Every live Meditation Monday, in five streams with EP faculty, and the whole replay library, with your progress saved.</p><p>Your first week is free.</p></>}
        <a className="sch-btn wsh-go" href={ws ? L.ws_checkout : L.pass_checkout} target="_top">{ws ? `Join Wisdom School · ${L.ws_price}` : `Start your free week · ${L.pass_yearly}`}</a>
        <a className="wsh-learn" href={ws ? L.ws_learn : L.pass_learn} target="_blank" rel="noopener noreferrer">{ws ? 'Learn more about Wisdom School' : 'Learn more about the Meditation Pass'}</a>
        <button type="button" className="wsh-x" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
