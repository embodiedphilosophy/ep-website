// Pañcāṅga engine: pure functions, no DOM, no dependencies. Runs in the browser, in a serverless function and
// (later) in the native app. Everything is worked out from the Sun's and Moon's positions, so there is no feed.
//
//   Sun   apparent longitude, Meeus, Astronomical Algorithms ch. 25 (about 0.01°)
//   Moon  apparent longitude, Meeus ch. 47: the full 60-term series, the A1/A2 terms and nutation (about 10″)
//   Ayanāṃśa  Lahiri (Chitrapakṣa): 23.853° at J2000 plus 50.28″ a year. Time to TT with a fixed ΔT of 69 s.
//   tithi = floor(elongation / 12°) (0–29)      nakṣatra = floor(sidereal Moon / 13°20′) (0–26)
//   yoga = floor((sidereal Sun + sidereal Moon) / 13°20′) (0–26)      karaṇa = floor(elongation / 6°) (0–59)
//   The day is read at local sunrise (the traditional rule, udaya tithi); each limb's end time is found by stepping
//   forward 30 minutes until its index changes, then bisecting to 20 seconds.
export const RAD = Math.PI / 180;
export const norm = x => ((x % 360) + 360) % 360;
const jdOf = ms => ms / 864e5 + 2440587.5;

export function sunLon(T) { // apparent tropical longitude (Meeus ch. 25)
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const om = (125.04 - 1934.136 * T) * RAD;
  return norm(L0 + C - 0.00569 - 0.00478 * Math.sin(om));
}

// [D, M, M′, F, longitude coefficient (millionths of a degree)]
const MOON_TERMS = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116],
  [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758],
  [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720], [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036], [2, 0, 2, 0, 3994],
  [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665], [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
  [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120], [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048],
  [2, 0, 1, -2, -1773], [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110], [3, 0, -1, 0, -892],
  [2, 1, 1, 0, -810], [4, -1, -2, 0, 759], [0, 2, -1, 0, -713], [2, 2, -1, 0, -700], [2, 1, -2, 0, 691],
  [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537], [4, -1, 0, 0, 520], [1, 0, -2, 0, -487],
  [2, 1, 0, -2, -399], [0, 0, 2, -2, -381], [1, 1, 1, 0, 351], [3, 0, -2, 0, -340], [4, 0, -3, 0, 330],
  [2, -1, 2, 0, 327], [0, 2, 1, 0, -323], [1, 1, -1, 0, 299], [2, 0, 3, 0, 294]];

export function moonLon(T) { // apparent tropical longitude (Meeus ch. 47)
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  let s = 0;
  for (const [d, m, mp, f, c] of MOON_TERMS) {
    let k = c;
    if (Math.abs(m) === 1) k *= E; else if (Math.abs(m) === 2) k *= E * E;
    s += k * Math.sin((d * D + m * M + mp * Mp + f * F) * RAD);
  }
  const A1 = (119.75 + 131.849 * T) * RAD, A2 = (53.09 + 479264.290 * T) * RAD;
  s += 3958 * Math.sin(A1) + 1962 * Math.sin((Lp - F) * RAD) + 318 * Math.sin(A2);
  const om = (125.04 - 1934.136 * T) * RAD;
  return norm(Lp + s / 1e6 - 0.00478 * Math.sin(om));
}

export const ayanamsa = T => 23.853 + 1.39663 * T; // Lahiri, about 50.28″ a year

// Sun and Moon at a moment (ms since 1970): tropical and sidereal longitudes and the elongation
export function state(ms) {
  const T = (jdOf(ms) + 69 / 86400 - 2451545) / 36525; // about TT
  const sun = sunLon(T), moon = moonLon(T), ay = ayanamsa(T);
  return { sun, moon, elong: norm(moon - sun), sSun: norm(sun - ay), sMoon: norm(moon - ay) };
}

export const LIMBS = {
  tithi: s => Math.floor(s.elong / 12),                       // 0..29 (14 Pūrṇimā, 29 Amāvāsyā)
  nakshatra: s => Math.floor(s.sMoon / (360 / 27)),           // 0..26
  yoga: s => Math.floor(norm(s.sSun + s.sMoon) / (360 / 27)), // 0..26
  karana: s => Math.floor(s.elong / 6),                       // 0..59
  rashi: s => Math.floor(s.sMoon / 30),                       // the Moon's sign, 0..11
};

// When a limb that is in force at startMs next changes: { index, endMs, next }
export function findChange(key, startMs) {
  const f = ms => LIMBS[key](state(ms));
  const i0 = f(startMs);
  let a = startMs, b = startMs;
  while (f(b) === i0 && b - startMs < 72 * 3600e3) { a = b; b += 30 * 60e3; }
  while (b - a > 20e3) { const m = (a + b) / 2; if (f(m) === i0) a = m; else b = m; }
  return { index: i0, endMs: b, next: f(b + 60e3) };
}

function sunAlt(ms, lat, lon) {
  const d = jdOf(ms) - 2451545, T = d / 36525;
  const lam = sunLon(T) * RAD, eps = (23.439291 - 0.0130042 * T) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const H = (280.46061837 + 360.98564736629 * d + lon) * RAD - ra;
  return Math.asin(Math.sin(lat * RAD) * Math.sin(dec) + Math.cos(lat * RAD) * Math.cos(dec) * Math.cos(H)) / RAD;
}

// Sunrise: the Sun's centre reaching −0.833° altitude, scanning from local midnight (6:00 in polar conditions)
export function sunrise(midnightMs, lat, lon) {
  const h0 = -0.833;
  let prev = sunAlt(midnightMs, lat, lon);
  for (let t = midnightMs + 10 * 60e3; t <= midnightMs + 16 * 3600e3; t += 10 * 60e3) {
    const cur = sunAlt(t, lat, lon);
    if (prev < h0 && cur >= h0) {
      let a = t - 10 * 60e3, b = t;
      while (b - a > 15e3) { const m = (a + b) / 2; if (sunAlt(m, lat, lon) < h0) a = m; else b = m; }
      return b;
    }
    prev = cur;
  }
  return midnightMs + 6 * 3600e3;
}

function newMoonNear(ms) { // refine to the nearest conjunction
  let t = ms;
  for (let i = 0; i < 8; i++) {
    let e = state(t).elong; if (e > 180) e -= 360;
    t -= (e / 12.19) * 864e5;
  }
  return t;
}

// Month names follow the Sun's sidereal sign at the previous new moon (amānta: new moon to new moon). If two
// consecutive new moons fall in the same sign the month is "Adhika". Kṣaya months are not handled (very rare).
export const SIGN_TO_MONTH = ['Vaiśākha', 'Jyeṣṭha', 'Āṣāḍha', 'Śrāvaṇa', 'Bhādrapada', 'Āśvina', 'Kārttika', 'Mārgaśīrṣa', 'Pauṣa', 'Māgha', 'Phālguna', 'Caitra'];
export function lunarMonth(ms) {
  const e = state(ms).elong;
  const prev = newMoonNear(ms - (e / 12.19) * 864e5);
  const next = newMoonNear(prev + 29.53 * 864e5);
  const s1 = Math.floor(state(prev).sSun / 30), s2 = Math.floor(state(next).sSun / 30);
  return { index: s1, name: SIGN_TO_MONTH[s1], adhika: s1 === s2 };
}

// ---- time zones ----
export function tzParts(tz, ms) {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(new Date(ms)).forEach(x => { p[x.type] = +x.value; });
  return p;
}
export function tzOffset(tz, ms) { const p = tzParts(tz, ms); return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000; }
export function localMidnight(tz, y, m, d) { const g = Date.UTC(y, m - 1, d); const t = g - tzOffset(tz, g); return g - tzOffset(tz, t); }

// The day's limbs at local sunrise. opts: { lat, lon, tz, y, m, d }
export function computeDay(opts) {
  const mid = localMidnight(opts.tz, opts.y, opts.m, opts.d);
  const rise = sunrise(mid, opts.lat, opts.lon);
  const s = state(rise);
  return {
    midnight: mid, sunrise: rise, elong: s.elong, weekday: new Date(Date.UTC(opts.y, opts.m - 1, opts.d)).getUTCDay(),
    tithi: findChange('tithi', rise), nakshatra: findChange('nakshatra', rise), yoga: findChange('yoga', rise),
    karana: findChange('karana', rise), rashi: findChange('rashi', rise), month: lunarMonth(rise),
  };
}

// ---- display helpers (times in the viewer's zone) ----
export function fmtTime(tz, ms) { return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(ms)); }
// '' on the same local day as base ({y,m,d}), ' tomorrow' the next day, otherwise the weekday name
export function relDay(tz, ms, base) {
  const a = tzParts(tz, ms), d1 = Date.UTC(a.year, a.month - 1, a.day), d0 = Date.UTC(base.y, base.m - 1, base.d);
  const diff = Math.round((d1 - d0) / 864e5);
  if (diff === 0) return '';
  if (diff === 1) return ' tomorrow';
  return ' ' + new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(new Date(ms));
}
