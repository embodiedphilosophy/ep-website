'use client';
import { useState } from 'react';
import { month, day } from '@/lib/dates';
import { site } from '@/lib/site';

const FILTERS = [
  ['all', 'All'], ['free', 'Free'], ['lrl', 'Living Room Lectures'],
  ['wisdom', 'Wisdom School'], ['sadhana', 'Sādhana School'], ['seasonal', 'Seasonal'],
];
const EMPTY = {
  all: 'Nothing is scheduled right now.', free: 'No free events are scheduled yet.',
  lrl: 'The next Living Room Lecture hasn’t been announced yet.', wisdom: 'No member sessions are scheduled yet.',
  sadhana: 'No Sādhana School dates are scheduled yet.', seasonal: 'No seasonal immersions are scheduled yet.',
};
const lower = s => String(s || '').toLowerCase();
const isFree = e => ['free', 'pay what you can', 'by donation'].includes(lower(e.price));

function Pill({ price }) {
  const p = lower(price);
  const cls = p === 'free' ? 'free' : p === 'by donation' ? 'don' : p === 'pay what you can' ? 'pwyc'
    : (p === 'members' || p === 'enrolled') ? 'mem' : 'paid';
  return <span className={`pill ${cls}`}>{price}</span>;
}

const initials = n => { const w = n.replace(/[\[\]]/g, '').split(' ').filter(Boolean); return ((w[0]?.[0] || '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); };
const hasDropIn = e => e.series === 'meditation-mondays' || !!e.dropin_url;

function Teachers({ list }) {
  const names = String(list || '').split(',').map(t => t.trim()).filter(Boolean);
  if (!names.length) return null;
  return (
    <div className="teachers">
      <span className="faces" aria-hidden="true">{names.map(n => <span className="face" key={n}>{initials(n)}</span>)}</span>
      <span>With {names.length > 1 ? names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1] : names[0]}</span>
    </div>
  );
}

function Action({ e, links }) {
  const price = lower(e.price);
  if (hasDropIn(e)) {
    return (
      <div className="reg-stack">
        <a className="reg" href={e.dropin_url || links.meditationMonthly}>Drop-in Access →</a>
        <a className="reg reg-sub" href="/wisdom-school">Become a member →</a>
      </div>
    );
  }
  if (price === 'free') return <a className="reg" href={e.registration_url || (e.program === 'lrl' ? '/living-room-lectures#signup' : '/#join')}>Sign up for Free →</a>;
  if (e.registration_url) return <a className="reg" href={e.registration_url}>{price === 'enroll' ? 'Enroll →' : 'Register →'}</a>;
  if (e.program === 'sadhana') return price === 'enroll'
    ? <a className="reg" href="/sadhana-school">Enroll →</a>
    : <a className="reg" href={links.signIn}>Sign in →</a>;
  return <a className="reg" href="/#join">Get updates →</a>;
}

export default function Events({ events, limit = 6, hideFilters = false, links = site.links }) {
  const [filter, setFilter] = useState('all');
  const seen = new Set();
  const list = events
    .filter(e => filter === 'all' ? true : filter === 'free' ? isFree(e) : e.program === filter)
    .filter(e => !e.series || (!seen.has(e.series) && seen.add(e.series)))
    .slice(0, limit);
  return (
    <>
      {!hideFilters && <div className="filters" role="group" aria-label="Filter events">
        {FILTERS.map(([k, label]) => (
          <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>}
      <div className="events-grid" aria-live="polite">
        {list.length === 0 ? (
          <div className="events-empty">{EMPTY[filter]} <a href="/#join">Get the Living Room Letter</a> to hear about new dates first.</div>
        ) : list.map(e => (
          <div className="evt" key={e.id || e.title + e.date}>
            <div className="date-chip"><div className="m">{month(e.date)}</div><div className="d">{day(e.date)}</div></div>
            <div>
              <div className="ttl">{e.title}</div>
              {e.host && <div className="host">{e.host}</div>}
              <div className="meta"><Pill price={e.price} />{hasDropIn(e) && <span className="pill dropin">Drop-In</span>} {[e.time, e.note].filter(Boolean).join(', ')}</div>
              <Teachers list={e.teachers} />
            </div>
            <Action e={e} links={links} />
          </div>
        ))}
      </div>
    </>
  );
}
