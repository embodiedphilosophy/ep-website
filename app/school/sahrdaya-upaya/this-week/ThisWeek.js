'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { joinOpen } from '@/lib/school/tabs';

const CIRCLE = 'https://ss.embodiedphilosophy.com';
const zone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'; } catch { return 'America/New_York'; } };
const localDay = () => new Date().toLocaleDateString('en-CA');
const fmt = (iso, tz, o) => iso ? new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...o }).format(new Date(iso)) : '';
const dayName = (day, o) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o }).format(new Date(day + 'T12:00:00Z'));
const hello = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

// UK clocks change on the last Sunday of October, US clocks on the first Sunday of November
function clockChangeNote(today) {
  const y = Number(today.slice(0, 4));
  const sunday = (yy, m, last) => { const d = last ? new Date(Date.UTC(yy, m + 1, 0)) : new Date(Date.UTC(yy, m, 1)); while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + (last ? -1 : 1)); return d.toISOString().slice(0, 10); };
  const uk = sunday(y, 9, true), us = sunday(y, 10, false);
  return today >= uk && today <= us ? `UK clocks changed on ${dayName(uk, { day: 'numeric', month: 'long' })} and US clocks change on ${dayName(us, { day: 'numeric', month: 'long' })}, so a session may start an hour earlier or later than usual where you are. Times below are in your own time zone.` : '';
}

// Links into Circle open in the whole window, so members stay in Circle with its sidebar
const A = ({ href, children, className, circle = true }) => href
  ? <a className={className} href={href} target={circle ? '_top' : '_blank'} rel="noopener noreferrer">{children}</a>
  : <span className={className}>{children}</span>;

export default function ThisWeek() {
  const [w, setW] = useState(null);
  const [err, setErr] = useState('');
  const [gone, setGone] = useState('');
  const tz = useRef('America/New_York');
  const [now, setNow] = useState(Date.now());
  const root = useRef(null);

  const send = useCallback(async (path, body) => {
    const r = await fetch(path, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify({ ...body, today: localDay(), tz: tz.current }) : undefined, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 || r.status === 403) { setGone(j.code === 'tier' ? 'tier' : 'signin'); if (j.code !== 'tier') window.parent.postMessage({ ep: 'need-signin' }, CIRCLE); throw new Error(j.error); }
    if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
    return j;
  }, []);

  useEffect(() => {
    tz.current = zone();
    send(`/api/mentee/week?today=${localDay()}&tz=${encodeURIComponent(tz.current)}`).then(setW).catch(e => setErr(e.message));
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [send]);

  // Tell Circle how tall the page is. Circle's frame may ignore it; the loader then just lets the page scroll inside.
  useEffect(() => {
    const post = () => window.parent !== window && window.parent.postMessage({ ep: 'height', height: document.documentElement.scrollHeight }, CIRCLE);
    const ro = new ResizeObserver(post); ro.observe(document.documentElement); post();
    return () => ro.disconnect();
  }, []);

  if (gone) return <p className="tw-note">{gone === 'tier' ? 'This page is for Sahṛdaya Upāya mentees.' : 'Please open “This Week” again from Circle to sign in.'}</p>;
  if (err && !w) return <p className="tw-note" role="alert">{err}</p>;
  if (!w) return <div className="tw-skel" aria-busy="true" aria-label="Loading this week"><div className="sk" /><div className="sk" /><div className="sk" /></div>;

  const change = clockChangeNote(w.today);
  const apply = p => p.then(setW);
  return (
    <div ref={root} className="tw-wrap">
      <header className="tw-head">
        <div>
          <h1>{hello()}{w.greeting.firstName ? `, ${w.greeting.firstName}` : ''}</h1>
          <p className="tw-sub">{dayName(w.today, { weekday: 'long', day: 'numeric', month: 'long' })} · Week {w.greeting.week} of {w.greeting.seasonTitle}</p>
        </div>
        <span className="tw-badge">{w.greeting.badge}</span>
      </header>
      {w.unavailable.length > 0 && <p className="tw-warn" role="status">Some things couldn’t be loaded just now ({w.unavailable.join(', ')}). The rest is up to date.</p>}
      {change && <p className="tw-warn" role="note">{change}</p>}

      <div className="tw-row3">
        <Practice w={w} log={m => apply(send('/api/mentee/practice', { minutes: m }))} />
        <NextLive w={w} now={now} tz={tz.current} />
        <Count w={w} />
      </div>

      <div className="tw-cols">
        <div className="tw-col">
          <WeekAhead w={w} tz={tz.current} />
          <Reading w={w} />
          <Due w={w} tick={(id, done) => apply(send('/api/mentee/assignment', { id, done }))} />
          <Mentorship w={w} />
        </div>
        <div className="tw-col">
          <OneToOne w={w} />
          <Mala w={w} />
          <Hours w={w} />
          <Travelogue w={w} add={t => send('/api/mentee/travelogue', { text: t }).then(r => setW(x => ({ ...x, travelogue: r.travelogue })))} />
          <Launches w={w} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, className = '' }) {
  return <section className={`tw-card ${className}`}><h2>{title}</h2>{children}</section>;
}

function Practice({ w, log }) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState('20');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go(e) { e.preventDefault(); setBusy(true); setErr(''); try { await log(min); setOpen(false); } catch (x) { setErr(x.message); } setBusy(false); }
  const p = w.practice;
  return (
    <Card title="Practice">
      <p className="tw-big">{p.streak}<span> day{p.streak === 1 ? '' : 's'} in a row</span></p>
      {p.reached && <p className="tw-ok">{p.reached} days. Beautifully done.</p>}
      {p.loggedToday && !open
        ? <p className="tw-ok">Logged for today. <button type="button" className="tw-link" onClick={() => setOpen(true)}>Change</button></p>
        : !open && <button type="button" className="sch-btn" onClick={() => setOpen(true)}>Log today’s practice</button>}
      {open && (
        <form onSubmit={go} className="tw-form">
          <label htmlFor="tw-min">Minutes you sat today</label>
          <input id="tw-min" type="number" inputMode="numeric" min="1" max="600" value={min} onChange={e => setMin(e.target.value)} required />
          <div className="tw-actions"><button className="sch-btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="sch-btn ghost" onClick={() => setOpen(false)}>Cancel</button></div>
          {err && <p className="sch-err" role="alert">{err}</p>}
        </form>
      )}
    </Card>
  );
}

function NextLive({ w, now, tz }) {
  const s = w.nextLive;
  const [going, setGoing] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => setGoing(!!s?.rsvped), [s?.id, s?.rsvped]);
  if (!s) return <Card title="Next live"><p className="tw-muted">{w.unavailable.includes('sessions') ? 'We couldn’t reach Circle just now.' : 'The next session will appear here.'}</p></Card>;
  const open = joinOpen(s, now);
  async function remind() {
    setErr('');
    const r = await fetch('/api/school/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: s.id }) });
    if (r.ok) setGoing(true); else setErr((await r.json().catch(() => ({}))).error || 'Please try again.');
  }
  return (
    <Card title="Next live">
      <p className="tw-strong">{s.title}</p>
      <p className="tw-muted">{fmt(s.start, tz, { weekday: 'short', day: 'numeric', month: 'short' })}, {fmt(s.start, tz, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}</p>
      <div className="tw-actions">
        {open && <A className="sch-btn" href={s.url}>Join</A>}
        {!open && (going ? <span className="tw-ok">You’ll be reminded</span> : <button type="button" className="sch-btn" onClick={remind}>Remind me</button>)}
        {!open && <A className="sch-btn ghost" href={s.url}>Open in Circle</A>}
      </div>
      {err && <p className="sch-err" role="alert">{err}</p>}
    </Card>
  );
}

function Count({ w }) {
  const d = w.due;
  return (
    <Card title="Due this week">
      <p className="tw-big">{d.done}<span> of {d.total} done</span></p>
      <div className="tw-bar" role="progressbar" aria-valuemin="0" aria-valuemax={d.total} aria-valuenow={d.done} aria-label="Assignments done this week"><i style={{ width: d.total ? `${(d.done / d.total) * 100}%` : 0 }} /></div>
    </Card>
  );
}

function WeekAhead({ w, tz }) {
  return (
    <Card title="The week ahead">
      <ol className="tw-days">
        {w.week.map(d => (
          <li key={d.day} className={d.day === w.today ? 'today' : ''}>
            <div className="tw-dayhead"><span className="tw-dn">{dayName(d.day, { weekday: 'short' })} {dayName(d.day, { day: 'numeric' })}</span><i className={`tw-dot ${d.dot}`} title={d.dot === 'done' ? 'Practised' : ''} aria-label={d.dot === 'done' ? 'Practised' : d.dot === 'missed' ? 'No practice logged' : ''} /></div>
            <div>
              {d.items.length === 0 && <span className="tw-muted">—</span>}
              {d.items.map((it, i) => <p key={i} className="tw-item"><A href={it.url} circle={it.circle}>{it.title}</A>{it.start && <span className="tw-muted"> · {fmt(it.start, tz, { hour: 'numeric', minute: '2-digit' })}</span>}</p>)}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Reading({ w }) {
  const r = w.reading;
  return (
    <Card title="This week’s reading">
      {!r ? <p className="tw-muted">This week’s reading will be here before the session.</p> : (
        <>
          {r.sanskrit && <p className="tw-sanskrit" lang="sa">{r.sanskrit}</p>}
          {r.translation && <p className="tw-translation">{r.translation}</p>}
          {r.citation && <p className="tw-muted">{r.citation}</p>}
          <div className="tw-actions">{r.url && <A className="sch-btn" href={r.url}>Open reading</A>}{w.workbookUrl && <A className="sch-btn ghost" href={w.workbookUrl}>Apprentice Workbook</A>}</div>
        </>
      )}
    </Card>
  );
}

function Due({ w, tick }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const go = async (a) => { setBusy(a.id); setErr(''); try { await tick(a.id, !a.done); } catch (e) { setErr(e.message); } setBusy(''); };
  return (
    <Card title="Due this week">
      {w.due.items.length === 0 && <p className="tw-muted">Nothing is due this week.</p>}
      <ul className="tw-tasks">
        {w.due.items.map(a => (
          <li key={a.id} className={a.done ? 'done' : ''}>
            <button type="button" className="tw-tick" role="checkbox" aria-checked={a.done} aria-label={`${a.title}: ${a.done ? 'done' : 'not done'}`} disabled={busy === a.id} onClick={() => go(a)}>{a.done ? "✓" : ""}</button>
            <div><A href={a.url} className="tw-strong">{a.title}</A><p className="tw-muted">{[a.where, a.due && `due ${dayName(a.due, { weekday: 'short', day: 'numeric', month: 'short' })}`].filter(Boolean).join(' · ')}</p></div>
          </li>
        ))}
      </ul>
      {err && <p className="sch-err" role="alert">{err}</p>}
    </Card>
  );
}

function Mentorship({ w }) {
  const m = w.mentorship;
  return (
    <Card title="Mentorship">
      {m.feedback.map((f, i) => <blockquote key={i} className="tw-quote"><p>{f.notes}</p><cite>Jacob{f.date ? `, ${dayName(f.date, { day: 'numeric', month: 'short' })}` : ''}</cite></blockquote>)}
      {m.posts.length > 0 && <ul className="tw-threads">{m.posts.map(p => <li key={p.id}><A href={p.url} className="tw-strong">{p.title}</A><p className="tw-muted">{[p.who, p.replies ? `${p.replies} ${p.replies === 1 ? 'reply' : 'replies'}` : ''].filter(Boolean).join(' · ')}</p></li>)}</ul>}
      {m.feedback.length === 0 && m.posts.length === 0 && <p className="tw-muted">Threads from the Mentorship Circle and Jacob’s notes will gather here.</p>}
      <div className="tw-actions"><A className="sch-btn ghost" href={m.circleUrl}>Open the Mentorship Circle</A><A className="sch-btn" href={m.messageUrl} circle={false}>Message Jacob</A></div>
    </Card>
  );
}

function OneToOne({ w }) {
  const o = w.oneToOne;
  const range = o && `${dayName(o.from, { day: 'numeric' })}–${dayName(o.to, { day: 'numeric', month: 'long' })}`;
  return (
    <Card title="One-to-one with Jacob">
      <p className="tw-muted">45 minutes, in the last week of the month, in the UK evening.</p>
      {o ? <><p className="tw-strong">Book for {range}</p><A className="sch-btn" href={o.url} circle={false}>Choose a time</A></> : <p className="tw-muted">Booking opens about three weeks before the last week of the month.</p>}
    </Card>
  );
}

function Mala({ w }) {
  const m = w.mala;
  return (
    <Card title="Your mālā">
      <div className="tw-beads" role="img" aria-label={`${m.filled} of 108 beads filled`}>{Array.from({ length: 108 }, (_, i) => <i key={i} className={i < m.filled ? 'on' : ''} />)}</div>
      <p className="tw-muted">{m.days} practice day{m.days === 1 ? '' : 's'}{m.round > 1 ? ` · round ${m.round}` : ''} · next milestone {m.next}</p>
    </Card>
  );
}

function Hours({ w }) {
  const [open, setOpen] = useState(false);
  const f = w.formation;
  if (!f) return <Card title="Formation hours"><p className="tw-muted">Your hours record isn’t available just now.</p></Card>;
  return (
    <Card title="Formation hours">
      <p className="tw-big">{f.total}<span> of {f.target} hours</span></p>
      <ul className="tw-types">{f.byType.map(t => <li key={t.type}><span>{t.type}</span><b>{t.hours} h</b></li>)}</ul>
      <button type="button" className="tw-link" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide record' : 'View record'}</button>
      {open && (f.entries.length === 0 ? <p className="tw-muted">No hours have been credited yet.</p> : <ul className="tw-record">{f.entries.map(e => <li key={e.id}><span>{dayName(e.day, { day: 'numeric', month: 'short' })}</span><span>{e.note || e.component}</span><b>{e.hours} h</b></li>)}</ul>)}
    </Card>
  );
}

function Travelogue({ w, add }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go(e) { e.preventDefault(); setBusy(true); setErr(''); try { await add(text); setText(''); } catch (x) { setErr(x.message); } setBusy(false); }
  return (
    <Card title="Inner Travelogue">
      <p className="tw-muted">One private line before the day begins. Only you can see this.</p>
      <form onSubmit={go} className="tw-form">
        <label htmlFor="tw-line" className="tw-sr">Today’s line</label>
        <textarea id="tw-line" rows="2" maxLength="1000" value={text} onChange={e => setText(e.target.value)} placeholder="What is moving in you today?" />
        <div className="tw-actions"><button className="sch-btn" disabled={busy || !text.trim()}>{busy ? 'Saving…' : 'Add a line'}</button></div>
        {err && <p className="sch-err" role="alert">{err}</p>}
      </form>
      {w.travelogue.length > 0 && <ul className="tw-lines">{w.travelogue.map(l => <li key={l.id}><span className="tw-muted">{dayName(l.day, { day: 'numeric', month: 'short' })}</span> {l.text}</li>)}</ul>}
    </Card>
  );
}

function Launches({ w }) {
  if (!w.launches.length) return null;
  return (
    <Card title="Coming soon at EP">
      <ul className="tw-threads">{w.launches.map((l, i) => <li key={i}><A href={l.url} className="tw-strong" circle={false}>{l.title}</A><p className="tw-muted">{[l.date && (/^\d{4}-\d\d-\d\d$/.test(l.date) ? dayName(l.date, { day: 'numeric', month: 'long' }) : l.date), l.line].filter(Boolean).join(' · ')}</p></li>)}</ul>
    </Card>
  );
}
