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

/* List layout (events page): one event per line; hovering, focusing or tapping a row opens its details below. */
.events-list{display:flex;flex-direction:column;border-top:1px solid var(--line)}
.events-list .events-empty{padding:28px 0}
.erow{border-bottom:1px solid var(--line);transition:background .2s ease,box-shadow .2s ease}
.erow-line{display:grid;grid-template-columns:64px minmax(0,1fr) auto auto 18px;gap:24px;align-items:center;padding:18px 12px;cursor:pointer}
.erow .when{text-align:center;line-height:1}
.erow .when .m{font-size:11.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--terra);font-weight:700}
.erow .when .d{font-family:var(--font-serif),serif;font-size:30px;font-weight:600;margin-top:3px}
.erow .erow-btn{all:unset;cursor:pointer;display:block}
.erow .erow-btn:focus-visible{outline:2px solid var(--terra);outline-offset:3px}
.erow .ttl{font-family:var(--font-serif),serif;font-size:21px;font-weight:600;line-height:1.2}
.erow .host{font-size:13px;color:var(--ink-soft);margin-top:3px}
.erow .tags{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.erow .tags .pill{white-space:nowrap}
.erow .reg{font-size:14px;font-weight:600;color:var(--terra);white-space:nowrap}
.erow .reg-stack{align-items:flex-end;text-align:right}
.erow .chev{width:18px;height:18px;color:var(--ink-soft);transition:transform .3s ease}
.erow-more{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .32s ease,opacity .32s ease}
.erow-more > div{overflow:hidden;min-height:0}
.erow-more .inner{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:12px 40px;padding:2px 54px 24px 100px}
.erow-more .facts{display:flex;flex-direction:column;gap:10px;font-size:14px;line-height:1.5;color:var(--ink)}
.erow-more .facts .lbl{display:block;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700;color:var(--ink-soft);margin-bottom:2px}
.erow-more .teachers{display:flex;align-items:center;gap:12px;font-size:13.5px;line-height:1.4;color:var(--ink);margin-top:4px}
.erow-more .faces{display:flex;flex:none}
.erow-more .face{width:36px;height:36px;flex:none;margin-left:-10px;font-size:12px;border:2px solid var(--ivory)}
.erow-more .face:first-child{margin-left:0}
.erow-more .sum{margin:0;font-size:14.5px;line-height:1.65;color:var(--ink-soft);max-width:60ch}
.erow.open{background:var(--ivory);box-shadow:inset 3px 0 0 var(--ochre)}
.erow.open .erow-more{grid-template-rows:1fr;opacity:1}
.erow.open .chev{transform:rotate(180deg)}
@media (hover:hover){
  .erow:hover,.erow:focus-within{background:var(--ivory);box-shadow:inset 3px 0 0 var(--ochre)}
  .erow:hover .erow-more,.erow:focus-within .erow-more{grid-template-rows:1fr;opacity:1}
  .erow:hover .chev,.erow:focus-within .chev{transform:rotate(180deg)}
}
@media (max-width:820px){
  .erow-line{grid-template-columns:52px minmax(0,1fr) 18px;gap:6px 14px;align-items:start;padding:16px 4px}
  .erow .when{grid-row:1 / span 3;padding-top:2px}
  .erow .when .d{font-size:26px}
  .erow .ttl{font-size:19px}
  .erow .chev{grid-column:3;grid-row:1;margin-top:4px}
  .erow .tags{grid-column:2;justify-content:flex-start}
  .erow .act{grid-column:2}
  .erow .reg-stack{align-items:flex-start;text-align:left}
  .erow-more .inner{grid-template-columns:1fr;padding:0 4px 20px 70px;gap:14px}
}
`;
import { month, day, longDate } from '@/lib/dates';
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

export default function Events({ events, limit = 6, hideFilters = false, links = site.links, allSessions = false, photos = {}, layout = 'grid' }) {
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
      <div className={layout === 'list' ? 'events-list' : 'events-grid'} aria-live="polite">
        {list.length === 0 ? (
          <div className="events-empty">{EMPTY[filter]} <a href="/#join">Get the Weekly Scaffolding</a> to hear about new dates first.</div>
        ) : list.map(e => layout === 'list'
          ? <EventRow key={e.id || e.title + e.date} e={e} links={links} photos={photos} />
          : <EventCard key={e.id || e.title + e.date} e={e} links={links} photos={photos} />)}
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

// One event per line. The details panel opens on hover or keyboard focus (desktop) and on tap (phones).
function EventRow({ e, links, photos }) {
  const [open, setOpen] = useState(false);
  const summary = String(e.summary || '').trim();
  const when = [longDate(e.date), e.time].filter(Boolean).join(' · ');
  const toggle = ev => { if (!ev.target.closest('a')) setOpen(o => !o); };
  return (
    <div className={`erow${open ? ' open' : ''}`}>
      <div className="erow-line" onClick={toggle}>
        <div className="when"><div className="m">{month(e.date)}</div><div className="d">{day(e.date)}</div></div>
        <div>
          <button type="button" className="ttl erow-btn" aria-expanded={open} onClick={ev => { ev.stopPropagation(); setOpen(o => !o); }}>{e.title}</button>
          {e.host && <div className="host">{e.host}</div>}
        </div>
        <div className="tags"><Pill price={e.price} />{hasDropIn(e) && <span className="pill dropin">Drop-In</span>}</div>
        <div className="act"><Action e={e} links={links} /></div>
        <svg className="chev" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className="erow-more"><div><div className="inner">
        <div className="facts">
          <div><span className="lbl">When</span>{when}{e.note ? <><br />{e.note}</> : null}</div>
          <Teachers list={e.teachers} photos={photos} />
        </div>
        {summary ? <p className="sum">{summary}</p> : <span />}
      </div></div></div>
    </div>
  );
}
