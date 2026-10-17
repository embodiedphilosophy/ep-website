'use client';
import { useEffect, useState } from 'react';

const when = (iso, tz) => iso ? new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: tz }).format(new Date(iso)) : '';
const day = (iso, tz) => iso ? new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: tz }).format(new Date(iso)) : '';
const range = (s, tz) => `${day(`${s.starts_on}T12:00:00Z`, 'UTC')} – ${day(`${s.ends_on}T12:00:00Z`, 'UTC')}`;

export default function HubView({ hub, initialTab }) {
  const [tab, setTab] = useState(initialTab);
  const [tz, setTz] = useState('America/New_York'); // the member's own zone once we are in the browser
  const [cleared, setCleared] = useState({}); // spaces opened in this visit: their "new" count goes at once
  useEffect(() => { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'); }, []);

  const pick = key => {
    setTab(key);
    const u = new URL(window.location.href);
    if (key === 'home') u.searchParams.delete('tab'); else u.searchParams.set('tab', key);
    window.history.replaceState(null, '', u);
  };
  // Remember the visit before the browser leaves for the Circle space; keepalive lets the request finish after the page is gone
  const opened = spaceId => {
    if (!spaceId) return;
    setCleared(c => ({ ...c, [spaceId]: true }));
    fetch('/api/school/seen', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spaceId }) }).catch(() => {});
  };
  const n = c => (cleared[c.spaceId] ? 0 : c.newCount);
  const tabCount = key => hub.cards[key].reduce((s, c) => s + n(c), 0);

  const cards = hub.cards[tab] || [];
  const fresh = hub.newSince.filter(x => !cleared[x.spaceId]);

  return (
    <>
      <div className="sch-tabs" role="group" aria-label="Sādhana School sections">
        {hub.tabs.map(t => {
          const c = tabCount(t.key);
          return (
            <button key={t.key} type="button" className={`sch-tab${tab === t.key ? ' on' : ''}`} aria-pressed={tab === t.key} onClick={() => pick(t.key)}>
              {t.label}
              {c > 0 ? <span className="sch-badge new" aria-label={`${c} new`}>{c}</span>
                : t.badge?.locked ? <span className="sch-badge lock">{t.badge.locked}</span> : null}
            </button>
          );
        })}
      </div>

      {tab === 'home' && hub.banner && <Banner b={hub.banner} tz={tz} onOpen={() => opened(hub.cards.seasons.find(c => c.season?.slug === hub.banner.slug)?.spaceId)} />}
      {tab === 'home' && fresh.length > 0 && (
        <section className="sch-new" aria-label="New since your last visit">
          <h2 className="sch-sub">New since your last visit</h2>
          <ul className="sch-newlist">
            {fresh.map(x => (
              <li key={x.key}><a href={x.href} target="_top" onClick={() => opened(x.spaceId)}>{x.title}</a><span> · {x.count} new{x.last ? ` · latest: ${x.last.title}` : ''}</span></li>
            ))}
          </ul>
        </section>
      )}

      {cards.length === 0
        ? <p className="sch-empty">Nothing here yet. Check back soon.</p>
        : <ul className="sch-list">{cards.map(c => <HubCard key={c.key} c={c} tz={tz} fresh={n(c)} onOpen={() => opened(c.spaceId)} />)}</ul>}

      {tab === 'seasons' && hub.cards.seasons.some(c => c.state === 'locked') && (
        <aside className="sch-upgrade">
          <div><h2>See the whole year</h2><p>Each season stands on its own. The full year gives you all four, one after another.</p></div>
          {hub.upgrade.url && <a className="sch-btn" href={hub.upgrade.url} target="_top">{hub.upgrade.label}</a>}
        </aside>
      )}
    </>
  );
}

function Banner({ b, tz, onOpen }) {
  return (
    <section className="sch-banner" aria-label="Current season">
      <div>
        <p className="sch-eyebrow">{b.state === 'upcoming' ? `Opens ${b.opensIn}` : 'This season'} · {b.short}</p>
        <h2>{b.title}</h2>
        <p className="sch-meta">{b.next ? `Next session: ${b.next.title} · ${when(b.next.at, tz)}` : b.state === 'upcoming' ? 'Your season opens soon.' : 'The next session will appear here once it is scheduled.'}</p>
      </div>
      {b.href && <a className="sch-btn" href={b.href} target="_top" onClick={onOpen}>Go to the season</a>}
    </section>
  );
}

function HubCard({ c, tz, fresh, onOpen }) {
  const locked = c.state === 'locked';
  const line = c.state === 'upcoming' ? `Starts ${range(c.season, tz)}`
    : locked ? c.description
    : c.next ? `Next: ${when(c.next.at, tz)}`
    : c.last ? `Latest: ${c.last.title} · ${day(c.last.at, tz)}`
    : c.description;
  const tag = c.state === 'upcoming' ? `Opens ${c.opensIn}` : c.season?.now && c.state === 'open' ? 'Now' : '';
  return (
    <li className={`sch-card hub${locked ? ' locked' : ''}`}>
      <span className={`sch-chip${c.season?.now && !locked ? ' live' : ''}`}>{c.chip}</span>
      <div className="sch-card-main">
        <h2>{!locked && c.href ? <a href={c.href} target="_top" onClick={onOpen}>{c.title}</a> : c.title}
          {tag && <span className="sch-tag">{tag}</span>}{fresh > 0 && <span className="sch-badge new" aria-label={`${fresh} new`}>{fresh} new</span>}</h2>
        <p className="sch-meta">{line}</p>
        {locked && c.description && line !== c.description && <p className="sch-meta">{c.description}</p>}
        {locked && c.preview && (
          <p className="sch-preview">
            {c.preview.link ? <a href={c.preview.link} target="_blank" rel="noopener noreferrer">Read a short preview</a> : <q>{c.preview.text}</q>}
          </p>
        )}
      </div>
      {locked
        ? (c.cta?.url ? <a className="sch-btn ghost" href={c.cta.url} target="_top">{c.cta.label}</a> : null)
        : c.href ? <a className="sch-btn" href={c.href} target="_top" onClick={onOpen}>{c.state === 'upcoming' ? 'View' : 'Open'}</a> : null}
    </li>
  );
}
