'use client';
import { useState } from 'react';

// Event cards: hovering (or keyboard-focusing) a card reveals its summary from the Master Schedule.
// Touch screens have no hover, so there the summary simply shows under the teachers.
// The card styles live here (EVT_CSS) so this one file carries the whole look.
const EVT_CSS = `
.events-grid{align-items:start}
.events-grid .evt{align-items:start}
.events-grid .evt .date-chip{padding-top:4px}
.events-grid .evt > .reg,.events-grid .evt > .reg-stack{align-self:start;padding-top:6px}
.events-grid .evt .host{margin-top:6px}
.events-grid .evt .meta{margin-top:10px}
.events-grid .teachers{display:flex;align-items:center;gap:12px;margin-top:14px;font-size:13.5px;line-height:1.4;color:var(--ink)}
.events-grid .faces{display:flex;flex:none}
.events-grid .face{width:40px;height:40px;flex:none;margin-left:-10px;font-size:13px;border:2px solid var(--ivory)}
.events-grid .face:first-child{margin-left:0}
.events-grid .teachers > span:last-child{min-width:0}
.events-grid .sum{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .3s ease,opacity .3s ease}
.events-grid .sum > div{overflow:hidden;min-height:0}
.events-grid .sum > div > div{padding-top:16px}
.events-grid .sum p{margin:0;padding-top:14px;border-top:1px solid var(--line);font-size:14px;line-height:1.6;color:var(--ink-soft);max-width:46ch}
@media (hover:hover){.events-grid .evt.has-sum:hover .sum,.events-grid .evt.has-sum:focus-within .sum{grid-template-rows:1fr;opacity:1}}
@media (hover:none){.events-grid .sum{grid-template-rows:1fr;opacity:1}}
`;
import { month, day } from '@/lib/dates';
import { site } from '@/lib/site';

const FILTERS = [
  ['all', 'All'], ['free', 'Free'], ['lrl', 'Living Room Lectures'],
  ['wisdom', 'Wisdom School'], ['sadhana', 'Sādhana School'], ['seasonal', 'Seasonal'], ['chitheads', 'CHITHEADS Live'],
];
const EMPTY = {
  all: 'Nothing is scheduled right now.', free: 'No free events are scheduled yet.',
  lrl: 'The next Living Room Lecture hasn’t been announced yet.', wisdom: 'No member sessions are scheduled yet.',
  sadhana: 'No Sādhana School dates are scheduled yet.', seasonal: 'No seasonal immersions are scheduled yet.', chitheads: 'No CHITHEADS Live dates are scheduled yet.',
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

const pkey = n => String(n || '').toLowerCase().replace(/^dr\.?\s+/, '').replace(/[^a-z]+/g, ' ').trim();
function Teachers({ list, photos = {} }) {
  const names = String(list || '').split(',').map(t => t.trim()).filter(Boolean);
  if (!names.length) return null;
  return (
    <div className="teachers">
      <span className="faces" aria-hidden="true">{names.map(n => photos[pkey(n)] ? <img className="face" key={n} src={photos[pkey(n)]} alt="" /> : <span className="face" key={n}>{initials(n)}</span>)}</span>
      <span>With {names.length > 1 ? names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1] : names[0]}</span>
    </div>
  );
}

function Action({ e, links }) {
  const price = lower(e.price);
  if (hasDropIn(e)) {
    return (
      <div className="reg-stack">
        <a className="reg" href={e.dropin_url || links.dropinMeditation || links.meditationMonthly}>Drop-in Access →</a>
        <a className="reg reg-sub" href="/meditation-pass#pricing">Join the Meditation Pass →</a>
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

export default function Events({ events, limit = 6, hideFilters = false, links = site.links, allSessions = false, photos = {} }) {
  const [filter, setFilter] = useState('all');
  const seen = new Set();
  const list = events
    .filter(e => filter === 'all' ? true : filter === 'free' ? isFree(e) : e.program === filter)
    .filter(e => allSessions || !e.series || (!seen.has(e.series) && seen.add(e.series)))
    .slice(0, limit);
  return (
    <>
      {!hideFilters && <div className="filters" role="group" aria-label="Filter events">
        {FILTERS.map(([k, label]) => (
          <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>}
      <style dangerouslySetInnerHTML={{ __html: EVT_CSS }} />
      <div className="events-grid" aria-live="polite">
        {list.length === 0 ? (
          <div className="events-empty">{EMPTY[filter]} <a href="/#join">Get the Weekly Scaffolding</a> to hear about new dates first.</div>
        ) : list.map(e => <EventCard key={e.id || e.title + e.date} e={e} links={links} photos={photos} />)}
      </div>
    </>
  );
}

function EventCard({ e, links, photos }) {
  const summary = String(e.summary || '').trim();
  return (
          <div className={`evt${summary ? ' has-sum' : ''}`}>
            <div className="date-chip"><div className="m">{month(e.date)}</div><div className="d">{day(e.date)}</div></div>
            <div>
              <div className="ttl">{e.title}</div>
              {e.host && <div className="host">{e.host}</div>}
              <div className="meta"><Pill price={e.price} />{hasDropIn(e) && <span className="pill dropin">Drop-In</span>} {[e.time, e.note].filter(Boolean).join(', ')}</div>
              <Teachers list={e.teachers} photos={photos} />
              {summary && <>
                <div className="sum"><div><div><p>{summary}</p></div></div></div>
              </>}
            </div>
            <Action e={e} links={links} />
          </div>
  );
}
