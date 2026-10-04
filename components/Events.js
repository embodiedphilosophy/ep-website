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

function Action({ e }) {
  if (e.registration_url) return <a className="reg" href={e.registration_url}>{e.program === 'sadhana' && lower(e.price) === 'enroll' ? 'Enroll →' : 'Register →'}</a>;
  if (e.program === 'wisdom') return <a className="reg" href="/#wisdom">Become a member →</a>;
  if (e.program === 'sadhana') return lower(e.price) === 'enroll'
    ? <a className="reg" href="/#sadhana">Enroll →</a>
    : <a className="reg" href={site.links.signIn}>Sign in →</a>;
  return <a className="reg" href="/#join">Get updates →</a>;
}

export default function Events({ events, limit = 6 }) {
  const [filter, setFilter] = useState('all');
  const seen = new Set();
  const list = events
    .filter(e => filter === 'all' ? true : filter === 'free' ? isFree(e) : e.program === filter)
    .filter(e => !e.series || (!seen.has(e.series) && seen.add(e.series)))
    .slice(0, limit);
  return (
    <>
      <div className="filters" role="group" aria-label="Filter events">
        {FILTERS.map(([k, label]) => (
          <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>
      <div className="events-grid" aria-live="polite">
        {list.length === 0 ? (
          <div className="events-empty">{EMPTY[filter]} <a href="/#join">Get the Living Room Letter</a> to hear about new dates first.</div>
        ) : list.map(e => (
          <div className="evt" key={e.id || e.title + e.date}>
            <div className="date-chip"><div className="m">{month(e.date)}</div><div className="d">{day(e.date)}</div></div>
            <div>
              <div className="ttl">{e.title}</div>
              {e.host && <div className="host">{e.host}</div>}
              <div className="meta"><Pill price={e.price} /> {[e.time, e.note].filter(Boolean).join(', ')}</div>
            </div>
            <Action e={e} />
          </div>
        ))}
      </div>
    </>
  );
}
