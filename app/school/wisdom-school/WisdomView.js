'use client';
import { useEffect, useRef, useState } from 'react';

// Times show in the member's own time zone: formatted in the browser once it is up (New York until then)
const parts = (iso, tz, o) => Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, ...o }).formatToParts(new Date(iso)).map(p => [p.type, p.value]));
const dateOf = (iso, tz) => { if (!iso) return ''; const p = parts(iso, tz, { weekday: 'short', day: 'numeric', month: 'short' }); return `${p.weekday} ${p.day} ${p.month}`; };
const timeOf = (iso, tz) => (iso ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: tz }).format(new Date(iso)) : '');
const whenOf = (iso, tz) => `${dateOf(iso, tz)} · ${timeOf(iso, tz)}`;

// A calendar file for one session (downloaded in the browser; nothing is sent anywhere)
function addToCalendar(e) {
  const f = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = e.endsAt || new Date(new Date(e.startsAt).getTime() + 60 * 60 * 1000).toISOString();
  const esc = s => String(s || '').replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');
  const text = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Embodied Philosophy//Wisdom School//EN', 'BEGIN:VEVENT', `UID:ws-${e.id}@embodiedphilosophy.com`, `DTSTAMP:${f(new Date().toISOString())}`,
    `DTSTART:${f(e.startsAt)}`, `DTEND:${f(end)}`, `SUMMARY:${esc(e.title)}`, ...(e.teacher ? [`DESCRIPTION:${esc(`With ${e.teacher}`)}`] : []), ...(e.url ? [`URL:${e.url}`] : []), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
  a.download = `${String(e.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'session'}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export default function WisdomView({ hub, initialTab }) {
  const [tab, setTab] = useState(initialTab);
  const [tz, setTz] = useState('America/New_York');
  const [modal, setModal] = useState(false); // the upgrade pop-up
  const [cleared, setCleared] = useState({});
  useEffect(() => { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'); }, []);

  const pick = key => {
    setTab(key);
    const u = new URL(window.location.href);
    if (key === 'month') u.searchParams.delete('tab'); else u.searchParams.set('tab', key);
    window.history.replaceState(null, '', u);
  };
  const seen = id => {
    if (!id) return;
    setCleared(c => ({ ...c, [id]: true }));
    fetch('/api/school/seen', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spaceId: id }) }).catch(() => {});
  };
  const previewAs = plan => { const u = new URL(window.location.href); u.searchParams.set('as', plan); window.location.assign(u); };

  const { plan } = hub;
  const ctx = { hub, tz, plan, seen, cleared, up: () => setModal(true), go: pick };
  const fresh = hub.newSince.filter(n => !cleared[n.seenId]);
  const freshOf = { month: fresh.filter(n => n.source === 'This month’s lecture' || n.source === 'Announcements').length, live: fresh.filter(n => n.source === 'Meditation replays').length, book: fresh.filter(n => n.source === 'Book club').length };

  return (
    <div className="wsh">
      <header className="sch-head wsh-head">
        <div>
          <p className="sch-eyebrow">{hub.kicker}</p>
          <h1>Wisdom School</h1>
        </div>
        <div className="wsh-headr">
          <span className={`wsh-pill ${plan}`}>{hub.planLabel}</span>
          {hub.admin && (
            <label className="wsh-as">Preview as
              <select value={plan} onChange={e => previewAs(e.target.value)}>
                <option value="ws">Wisdom School</option><option value="plus">Wisdom School Plus</option><option value="none">Not enrolled</option>
              </select>
            </label>
          )}
        </div>
      </header>

      <div className="sch-tabs" role="group" aria-label="Wisdom School sections">
        {hub.tabs.map(t => {
          const c = freshOf[t.key] ?? 0;
          return (
            <button key={t.key} type="button" className={`sch-tab${tab === t.key ? ' on' : ''}`} aria-pressed={tab === t.key} onClick={() => pick(t.key)}>
              {t.label}
              {c > 0 ? <span className="sch-badge new" aria-label={`${c} new`}>{c}</span> : t.badge?.locked && t.badge.count == null ? <span className="sch-badge lock">{t.badge.locked}</span> : null}
            </button>
          );
        })}
      </div>

      <Banner ctx={ctx} tab={tab} />
      {tab === 'month' && <Month ctx={ctx} fresh={fresh} />}
      {tab === 'live' && <Live ctx={ctx} />}
      {tab === 'year' && <Year ctx={ctx} />}
      {tab === 'book' && <Book ctx={ctx} />}
      {tab === 'pathways' && <Pathways ctx={ctx} />}
      {tab === 'library' && <Library ctx={ctx} />}
      {tab === 'ce' && <Ce ctx={ctx} />}

      {modal && <UpgradeModal hub={hub} onClose={() => setModal(false)} />}
    </div>
  );
}

// What a locked item offers: Wisdom School members open the upgrade pop-up, visitors go to join. Never an error page.
function Unlock({ ctx, label }) {
  if (ctx.plan === 'ws') return <button type="button" className="sch-btn ghost" onClick={ctx.up}>{label || 'Upgrade to Plus'}</button>;
  return <a className="sch-btn ghost" href={ctx.hub.links.join} target="_top">{label || 'Join'}</a>;
}

function Banner({ ctx, tab }) {
  const { hub, plan } = ctx;
  if (plan === 'none') {
    return (
      <aside className="wsh-banner preview" aria-label="Preview">
        <div><h2>You’re looking at a preview of Wisdom School</h2><p>Join to open the live sessions, the year, the book club and the pathways.</p></div>
        <div className="wsh-actions">
          <a className="sch-btn" href={hub.links.join} target="_top">Join · {hub.links.joinPrice}</a>
          <a className="sch-btn ghost" href={hub.sampleUrl} target="_top">Watch a sample lecture</a>
        </div>
      </aside>
    );
  }
  if (plan === 'ws' && ['pathways', 'library', 'ce', 'year'].includes(tab)) {
    return (
      <aside className="wsh-banner upsell" aria-label="Wisdom School Plus">
        <div><h2>Plus opens the whole archive: every pathway, the Course Library, past years, certificates and CE.</h2><p>You keep everything you have now. Upgrade at any time.</p></div>
        <div className="wsh-actions"><button type="button" className="sch-btn" onClick={ctx.up}>Upgrade to Plus · {hub.links.plusPrice}</button></div>
      </aside>
    );
  }
  return null;
}

function Row({ chip, title, line, extra, locked, badge, action, live, children }) {
  return (
    <li className={`sch-card hub wsh-row${locked ? ' locked' : ''}`}>
      <span className={`sch-chip${live ? ' live' : ''}`}>{chip}</span>
      <div className="sch-card-main">
        <h2>{title}{locked && badge && <span className="sch-badge lock">{badge}</span>}</h2>
        {line && <p className="sch-meta">{line}</p>}
        {extra}
        {children}
      </div>
      {action}
    </li>
  );
}

// ---------- This month ----------
function Month({ ctx, fresh }) {
  const { hub, plan, tz } = ctx;
  const m = hub.month, open = plan !== 'none';
  return (
    <div className="wsh-cols">
      <div className="wsh-main">
        {m.name && (
          <section className="wsh-hero" aria-label="This month">
            <p className="wsh-kick">This month · {m.name} · {m.index} of {m.of}</p>
            <h2>{m.theme || m.name}</h2>
            {m.question && <p className="wsh-q">{m.question}</p>}
            {!open ? <Unlock ctx={ctx} label="Join to watch" />
              : m.lessonUrl ? <a className="sch-btn" href={m.lessonUrl} target="_top" onClick={() => ctx.seen(m.sectionId)}>Watch the lecture</a>
              : <p className="wsh-soon">Recording coming after the lecture</p>}
          </section>
        )}

        <section aria-labelledby="ws-upnext">
          <h2 id="ws-upnext" className="sch-sub">Up next</h2>
          <ul className="wsh-up3">
            {open ? (hub.upNext.length ? hub.upNext.map(e => (
              <li key={e.id} className="wsh-ev">
                <span className="wsh-evd">{dateOf(e.startsAt, tz)}</span><span className="wsh-evt">{timeOf(e.startsAt, tz)}</span>
                <h3>{e.url ? <a href={e.url} target="_top">{e.title}</a> : e.title}</h3>
                {e.teacher && <p className="sch-meta">{e.teacher}</p>}
                <button type="button" className="sch-btn ghost" onClick={() => addToCalendar(e)}>Add to calendar</button>
              </li>
            )) : <li className="wsh-none">The next sessions will appear here once they are scheduled.</li>)
              : hub.live.slice(0, 3).map(r => (
                <li key={r.key} className="wsh-ev locked"><span className="wsh-evd">{r.chip}</span><span className="wsh-evt">{r.cadence}</span>
                  <h3>{r.title}<span className="sch-badge lock">{r.badge}</span></h3><p className="sch-meta">{r.description}</p></li>
              ))}
          </ul>
        </section>

        <section aria-labelledby="ws-year">
          <h2 id="ws-year" className="sch-sub">The year so far</h2>
          <ol className="wsh-tiles">
            {hub.months.map(t => {
              const short = t.name.slice(0, 3);
              const cls = `wsh-tile ${t.state}${t.locked ? ' locked' : ''}`;
              const inner = <><b>{short}</b><span>{t.theme}</span></>;
              return <li key={t.index}>{t.url ? <a className={cls} href={t.url} target="_top" title={`${t.name} · ${t.theme}`}>{inner}</a> : <span className={cls} title={`${t.name} · ${t.theme}`} aria-current={t.state === 'current' ? 'date' : undefined}>{inner}</span>}</li>;
            })}
          </ol>
          <p className="wsh-coming">{hub.comingNext}</p>
        </section>

        {fresh.length > 0 && (
          <section className="sch-new" aria-label="New since your last visit">
            <h2 className="sch-sub">New since your last visit</h2>
            <ul className="sch-newlist">
              {fresh.map(n => (
                <li key={n.source}><a href={n.url || '#'} target="_top" onClick={() => ctx.seen(n.seenId)}>{n.source}</a><span> · {n.count} new · latest: {n.latestTitle}</span></li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="wsh-side" aria-label="Your plan">
        {hub.side.kind === 'plus' || hub.side.kind === 'ce' ? (
          <>
            <p className="sch-eyebrow">Your CE hours</p>
            <h2>{hub.side.hours == null ? 'Your CE record' : `${hub.side.hours} of ${hub.side.of} hours`}</h2>
            <div className="wsh-bar" aria-hidden="true"><i style={{ width: `${hub.side.hours ? Math.min(100, (hub.side.hours / hub.side.of) * 100) : 0}%` }} /></div>
            <p className="sch-meta">Finish a pathway and write a short reflection to earn each certificate.</p>
            <button type="button" className="sch-btn ghost" onClick={() => ctx.go('ce')}>See Certificates &amp; CE</button>
          </>
        ) : hub.side.kind === 'teaser' ? (
          <>
            <p className="sch-eyebrow">Wisdom School Plus</p>
            <h2>{hub.side.title}</h2>
            <p className="sch-meta">Every pathway, the Course Library, past years and your CE record.</p>
            <button type="button" className="sch-btn" onClick={ctx.up}>See Plus</button>
          </>
        ) : (
          <>
            <p className="sch-eyebrow">Free to watch · {hub.side.month}</p>
            <h2>{hub.side.title || 'A sample lecture'}</h2>
            <p className="sch-meta">Start with the January lecture, free.</p>
            <a className="sch-btn" href={hub.side.url} target="_top">Watch it now</a>
          </>
        )}
      </aside>
    </div>
  );
}

// ---------- Live ----------
function Live({ ctx }) {
  const { hub, tz } = ctx;
  return (
    <ul className="sch-list">
      {hub.live.map(r => (
        <Row key={r.key} chip={r.chip} title={r.title} locked={r.locked} badge={r.badge}
          line={`${r.cadence}${r.next ? ` · Next: ${whenOf(r.next.startsAt, tz)}` : ''}`}
          extra={<>
            <p className="sch-meta">{r.description}</p>
            {r.streams && <ul className="wsh-streams">{r.streams.map(s => <li key={s.name}><b>{s.name}</b> {s.teacher}</li>)}</ul>}
            {r.next && <p className="sch-meta wsh-nextt">{r.next.title}{r.next.teacher ? ` · ${r.next.teacher}` : ''}</p>}
          </>}
          action={r.locked ? <Unlock ctx={ctx} /> : r.next ? <button type="button" className="sch-btn" onClick={() => addToCalendar(r.next)}>Add to calendar</button> : null} />
      ))}
    </ul>
  );
}

// ---------- The year ----------
function Year({ ctx }) {
  const y = ctx.hub.year;
  const row = r => (
    <Row key={r.key} chip={r.month} title={r.theme || r.month} locked={r.locked} badge={r.badge} live={r.state === 'current'}
      line={r.state === 'current' ? 'This month' : r.state === 'future' ? `Opens in ${r.month}` : !r.hasLesson ? 'Recording coming after the lecture' : 'Lecture and readings'}
      action={r.locked ? <Unlock ctx={ctx} label={ctx.plan === 'ws' ? 'Upgrade' : 'Join'} /> : r.url ? <a className="sch-btn" href={r.url} target="_top">Open</a> : null} />
  );
  return (
    <>
      {y.course && (
        <ul className="sch-list">
          <Row chip={String(ctx.hub.kicker || '').slice(0, 4) || 'Course'} title={y.course.title} line={y.course.line} locked={y.course.locked} badge={y.course.badge}
            action={y.course.locked ? <Unlock ctx={ctx} /> : y.course.url ? <a className="sch-btn" href={y.course.url} target="_top">Open the course</a> : null} />
        </ul>
      )}
      <ul className={`sch-list${y.course ? ' wsh-gap' : ''}`}>{y.rows.map(row)}</ul>
      {y.ahead.length > 0 && <><h2 className="sch-sub wsh-gap">Still to come</h2><ul className="sch-list">{y.ahead.map(row)}</ul></>}
      <ul className="sch-list wsh-gap">
        <Row chip="Archive" title={y.archive.title} line={y.archive.line} locked={y.archive.locked} badge={y.archive.badge}
          action={y.archive.locked ? <Unlock ctx={ctx} /> : <a className="sch-btn" href={y.archive.url} target="_top">Open the archive</a>} />
        <Row chip="Next year" title={y.closing.title} line={y.closing.line} />
      </ul>
    </>
  );
}

// ---------- Book club ----------
function Book({ ctx }) {
  const { hub, tz } = ctx;
  const b = hub.book;
  return (
    <>
      <ul className="sch-list">
        <Row chip={b.quarter} title={b.current.title} locked={b.locked} badge={b.badge} live={!b.locked}
          line={b.next ? `Meet-up: ${whenOf(b.next.startsAt, tz)}` : 'This quarter’s book'}
          action={b.locked ? <Unlock ctx={ctx} /> : b.next ? <button type="button" className="sch-btn" onClick={() => addToCalendar(b.next)}>Add meet-up to calendar</button> : b.current.url ? <a className="sch-btn" href={b.current.url} target="_top">Open</a> : null} />
      </ul>
      {b.past.length > 0 && (
        <>
          <h2 className="sch-sub wsh-gap">Past quarters</h2>
          <ul className="sch-list">
            {b.past.map(p => <Row key={p.title} chip="Past" title={p.title} action={p.url ? <a className="sch-btn ghost" href={p.url} target="_top">Open</a> : null} />)}
          </ul>
        </>
      )}
    </>
  );
}

// ---------- Pathways ----------
function Pathways({ ctx }) {
  const { hub } = ctx;
  return (
    <ul className="sch-list">
      {hub.pathways.map(p => (
        <Row key={p.key} chip={p.chip} title={p.name} locked={p.locked} badge={p.badge}
          line={[p.teacher, p.note, p.progress && !p.locked ? p.progress.label : ''].filter(Boolean).join(' · ')}
          action={p.locked ? <Unlock ctx={ctx} /> : p.url ? <a className="sch-btn" href={p.url} target="_top">{p.progress ? (p.progress.done === 0 ? 'Start' : p.progress.done >= p.progress.total ? 'Review' : 'Continue') : 'Open'}</a> : null} />
      ))}
    </ul>
  );
}

// ---------- Course Library ----------
function Library({ ctx }) {
  const { library } = ctx.hub;
  const all = [...library.departments, library.archive];
  return (
    <ul className="sch-list">
      {all.map(d => (
        <Row key={d.key} chip={d.key === 'past-years' ? 'Archive' : 'Department'} title={d.title} line={d.line} locked={d.locked} badge={d.badge}
          action={d.locked ? <Unlock ctx={ctx} /> : <a className="sch-btn" href={d.url} target="_top">Open in the Library</a>} />
      ))}
    </ul>
  );
}

// ---------- Certificates & CE ----------
function Ce({ ctx }) {
  const { hub } = ctx;
  const t = hub.ceTeaser;
  if (!hub.ce) {
    return (
      <ul className="sch-list">
        <Row chip="CE record" title="Your CE record" line={`${t.hours} CE hours across ${t.pathways} pathways`} locked badge="Plus" action={<Unlock ctx={ctx} />} />
        {t.certificates.map(c => <Row key={c} chip="Certificate" title={c} locked badge="Plus" action={<Unlock ctx={ctx} />} />)}
      </ul>
    );
  }
  const { ce } = hub;
  return (
    <>
      <ul className="sch-list">
        <Row chip={ce.hours == null ? 'CE record' : `${ce.hours} of ${ce.of}`} title="Your CE record" live
          line={ce.hours == null ? 'Your hours will appear here as you finish pathways.' : `${ce.hours} of ${ce.of} CE hours certified${ce.cycle ? ` · ${ce.cycle.hours} of ${ce.cycle.need} this Yoga Alliance cycle` : ''}`}
          extra={<p className="sch-meta">Finish a pathway’s lessons, write a short reflection, and your certificate is issued under EP’s YACEP credential.</p>}
          action={<a className="sch-btn" href={ce.trackerUrl} target="_top">Open my CE record</a>} />
      </ul>
      <h2 className="sch-sub wsh-gap">Certificates</h2>
      <ul className="sch-list">
        {ce.certificates.map(c => (
          <Row key={c.key} chip="Certificate" title={c.title} line={c.progress ? c.progress.label : ''}
            action={c.url ? <a className="sch-btn" href={c.url} target="_top">{c.progress ? (c.progress.done === 0 ? 'Start' : c.progress.done >= c.progress.total ? 'Review' : 'Continue') : 'Open'}</a> : null} />
        ))}
      </ul>
    </>
  );
}

// The second step of an upgrade: an in-page pop-up (styled like the pañcāṅga explainer) with the Circle checkout and the site page
function UpgradeModal({ hub, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const key = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); };
  }, [onClose]);
  return (
    <div className="wsh-modal" role="dialog" aria-modal="true" aria-labelledby="ws-up-t" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wsh-modal-c" tabIndex={-1} ref={ref}>
        <h2 id="ws-up-t">Wisdom School Plus</h2>
        <p>Plus opens the whole archive: every pathway, the Course Library, past years, certificates and CE. Hundreds of hours of course content.</p>
        <p>You keep everything you have now. Upgrade at any time.</p>
        <a className="sch-btn wsh-go" href={hub.links.plusCheckout} target="_top">Upgrade to Plus · {hub.links.plusPrice}</a>
        <a className="wsh-learn" href={hub.links.plusLearn} target="_blank" rel="noopener noreferrer">Learn more about Wisdom School Plus</a>
        <button type="button" className="wsh-x" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
