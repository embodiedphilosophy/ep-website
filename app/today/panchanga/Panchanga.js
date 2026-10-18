'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { describeDay } from '../../../lib/panchanga/describe.js';
import { tzOffset, tzParts, fmtTime, relDay } from '../../../lib/panchanga/engine.js';
import { PLACES } from '../../../lib/panchanga/places.js';
import { RASHI_EN, ABOUT } from '../../../lib/panchanga/content.js';
import { moonPath, iconTithi, iconVara, iconNak, iconYoga, iconKarana } from '../../../lib/panchanga/icons.js';

const KEY = 'ep-panchanga-place';
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };
const validTz = tz => { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return !!tz; } catch { return false; } };
const num = (s, lo, hi) => { const n = Number(s); return s !== null && s !== '' && Number.isFinite(n) && n >= lo && n <= hi ? n : null; };

// Where to read the day: the address first (?lat=&lon=&tz=&place=, to fix a place for a whole Circle embed), then the
// viewer's saved choice, then a city matched from the device's time zone, then an estimate from its offset.
function initialPlace(params, deviceTz) {
  const lat = num(params.get('lat'), -90, 90), lon = num(params.get('lon'), -180, 180);
  if (lat !== null && lon !== null) {
    const tz = validTz(params.get('tz')) ? params.get('tz') : deviceTz;
    return { label: (params.get('place') || 'this location').slice(0, 60), lat, lon, tz, key: 'url' };
  }
  const saved = store(KEY);
  if (saved) { try { const p = JSON.parse(saved); if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && validTz(p.tz)) return p; } catch {} }
  if (PLACES[deviceTz]) { const [label, la, lo] = PLACES[deviceTz]; return { label, lat: la, lon: lo, tz: deviceTz, key: deviceTz }; }
  return { label: 'your time zone', lat: 30, lon: (tzOffset(deviceTz, Date.now()) / 36e5) * 15, tz: deviceTz, key: 'approx' };
}

const Icon = ({ html }) => <div className="pn-icon" dangerouslySetInnerHTML={{ __html: html }} />;
const Row = ({ icon, label, name, desc, whens }) => (
  <li>
    <Icon html={icon} />
    <div>
      <p className="pn-label">{label}</p>
      <p className="pn-name">{name}</p>
      <p className="pn-desc">{desc}</p>
      {whens.map((w, i) => <p className="pn-when" key={i}>{w}</p>)}
    </div>
  </li>
);

export default function Panchanga() {
  const [params, setParams] = useState(null);
  const [deviceTz, setDeviceTz] = useState('UTC');
  const [place, setPlace] = useState(null);
  const [geoMsg, setGeoMsg] = useState('');
  const [tick, setTick] = useState(0); // bumps when the tab comes back or the local day changes
  const about = useRef(null);
  const lastKey = useRef('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } })();
    const theme = p.get('theme');
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
    setParams(p); setDeviceTz(tz); setPlace(initialPlace(p, tz));
  }, []);

  // The day to read: ?date=YYYY-MM-DD for testing, otherwise today in the chosen place's time zone
  const base = useMemo(() => {
    if (!place || !params) return null;
    const q = params.get('date');
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) { const [y, m, d] = q.split('-').map(Number); return { y, m, d }; }
    const p = tzParts(place.tz, Date.now()); return { y: p.year, m: p.month, d: p.day };
  }, [place, params, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const day = useMemo(() => (place && base ? describeDay({ lat: place.lat, lon: place.lon, tz: place.tz, ...base }) : null), [place, base]);

  // Re-read when the local date changes, and when the tab becomes visible again
  useEffect(() => {
    if (!place) return;
    const check = () => { const p = tzParts(place.tz, Date.now()), k = `${p.year}-${p.month}-${p.day}`; if (lastKey.current && k !== lastKey.current) setTick(t => t + 1); lastKey.current = k; };
    check();
    const id = setInterval(check, 60e3);
    const vis = () => { if (!document.hidden) setTick(t => t + 1); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, [place]);

  // Framed (inside Circle's Today page): tell the parent how tall the panel is, so the frame fits with no inner scrollbar
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return;
    const card = document.querySelector('.pn-card'); if (!card) return;
    const send = () => { try { window.parent.postMessage({ ep: 'panchanga-height', h: Math.ceil(card.getBoundingClientRect().height) }, '*'); } catch {} };
    send();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(send) : null;
    ro?.observe(card);
    return () => ro?.disconnect();
  }, [day]);

  const choose = useCallback(e => {
    const v = e.target.value;
    setGeoMsg('');
    if (v === 'geo') {
      navigator.geolocation.getCurrentPosition(pos => {
        const p = { label: 'your location', lat: pos.coords.latitude, lon: pos.coords.longitude, tz: deviceTz, key: 'geo-result' };
        store(KEY, JSON.stringify(p)); setPlace(p);
      }, () => setGeoMsg('Location access was blocked. Choose a city from the list instead.'), { timeout: 10000, maximumAge: 864e5 });
      return;
    }
    if (PLACES[v]) { const [label, lat, lon] = PLACES[v]; const p = { label, lat, lon, tz: v, key: v }; store(KEY, JSON.stringify(p)); setPlace(p); }
  }, [deviceTz]);

  const options = useMemo(() => {
    if (!place) return [];
    const list = Object.entries(PLACES).sort((a, b) => a[1][0].localeCompare(b[1][0])).map(([tz, p]) => [tz, p[0]]);
    if (!PLACES[place.key]) list.unshift(['current', place.label.charAt(0).toUpperCase() + place.label.slice(1)]);
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) list.push(['geo', 'Use my location']);
    return list;
  }, [place]);

  const tz = place?.tz;
  const until = ms => `Until ${fmtTime(tz, ms)}${relDay(tz, ms, base)}`;
  const dateMs = base ? Date.UTC(base.y, base.m - 1, base.d, 12) : 0;
  const closeAbout = () => about.current?.close?.() ?? about.current?.removeAttribute('open');
  const openAbout = () => {
    const d = about.current; if (!d) return;
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    const body = d.querySelector('.pn-dlg'); if (body) body.scrollTop = 0; // the browser focuses Close, at the bottom: start from the top
  };

  return (
    <div className="pn">
      <article className="pn-card" aria-live="polite">
        <header className="pn-sky">
          <svg viewBox="0 0 100 100" role="img" aria-label="Moon phase">
            <circle cx="50" cy="50" r="44" fill="var(--moon-dark)" />
            {day && <path d={moonPath(day.elongation, 50, 50, 44)} fill="var(--moon)" />}
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--moon)" strokeOpacity=".45" strokeWidth="1" />
          </svg>
          <div>
            <h1>{base ? new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(dateMs)) : 'Today'}</h1>
            <p className="pn-month">{day ? `${day.month.adhika ? 'Adhika ' : ''}${day.month.name}, ${day.paksha} fortnight` : ' '}</p>
            <div className="pn-place">
              <label htmlFor="pn-loc">Times for</label>
              <select id="pn-loc" value={place ? (PLACES[place.key] ? place.key : 'current') : ''} onChange={choose} disabled={!place}>
                {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
            {geoMsg && <p className="pn-geo" role="status">{geoMsg}</p>}
            <button className="pn-info" type="button" onClick={openAbout}>How to read this</button>
          </div>
        </header>

        <ol>
          {day && <>
            <Row icon={iconTithi(day.tithi.dayInFortnight)} label="Tithi (lunar day)" name={day.tithi.name} desc={day.tithi.description} whens={[`${until(day.tithi.endMs)}, then ${day.tithi.next}`]} />
            <Row icon={iconVara(day.vara.index)} label="Vāra (weekday)" name={day.vara.name} desc={day.vara.description} whens={[`Sunrise to sunrise, from ${fmtTime(tz, day.sunrise)}`]} />
            <Row icon={iconNak()} label="Nakṣatra (lunar mansion)" name={day.nakshatra.name} desc={day.nakshatra.description} whens={[
              `${until(day.nakshatra.endMs)}, then ${day.nakshatra.next}`,
              `Moon in ${day.nakshatra.moonSign.name} (${RASHI_EN[day.nakshatra.moonSign.index]})${day.nakshatra.moonSign.enters ? `, entering ${day.nakshatra.moonSign.enters.name} at ${fmtTime(tz, day.nakshatra.moonSign.enters.atMs)}${relDay(tz, day.nakshatra.moonSign.enters.atMs, base)}` : ''}`]} />
            <Row icon={iconYoga()} label="Yoga (Sun and Moon together)" name={day.yoga.name} desc={day.yoga.description} whens={[`${until(day.yoga.endMs)}, then ${day.yoga.next}`]} />
            <Row icon={iconKarana()} label="Karaṇa (half lunar day)" name={day.karana.name} desc={day.karana.description} whens={[`${until(day.karana.endMs)}, then ${day.karana.next}`]} />
          </>}
        </ol>

        <footer>{day ? `Read at sunrise in ${place.label} (${fmtTime(tz, day.sunrise)}), the traditional start of the day. Sidereal zodiac (Lahiri); months run new moon to new moon.` : ' '}</footer>
      </article>

      <dialog ref={about} className="pn-about" aria-labelledby="pn-about-title" onClick={e => { if (e.target === e.currentTarget) closeAbout(); }}>
        <div className="pn-dlg">
          <h2 id="pn-about-title">{ABOUT.title}</h2>
          {ABOUT.intro.map((t, i) => <p key={i} dangerouslySetInnerHTML={{ __html: t }} />)}
          <h3>{ABOUT.limbsTitle}</h3>
          <dl>{ABOUT.limbs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <h3>{ABOUT.readTitle}</h3>
          {ABOUT.read.map((t, i) => <p key={i}>{t}</p>)}
          <button className="pn-close" type="button" onClick={closeAbout}>Close</button>
        </div>
      </dialog>
    </div>
  );
}
