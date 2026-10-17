// The moon for the Today page: phase for each day of the week, and the tithi (lunar day) with its pakṣa.
// Worked out here with astronomy-engine, no network. The tithi is the angle between moon and sun, in 12° steps;
// by custom it is counted at local sunrise, so it depends on where you are: the member's time zone is mapped to
// a representative city (TZ_CITY), and a browser may send exact coordinates for a closer answer (never stored).
import { Body, Observer, MoonPhase, SearchRiseSet } from 'astronomy-engine';
import { zonedToUtc } from './schedule';

export const TITHI = ['Pratipadā', 'Dvitīyā', 'Tṛtīyā', 'Caturthī', 'Pañcamī', 'Ṣaṣṭhī', 'Saptamī', 'Aṣṭamī', 'Navamī', 'Daśamī', 'Ekādaśī', 'Dvādaśī', 'Trayodaśī', 'Caturdaśī'];

// One name per tithi number 1–30: Śukla 1–14 + Pūrṇimā (15), Kṛṣṇa 1–14 + Amāvasyā (30)
export function tithiName(n) {
  if (n === 15) return 'Pūrṇimā';
  if (n === 30) return 'Amāvasyā';
  return TITHI[(n - 1) % 15];
}

// Moon phase: 0–360° ahead of the sun (0 new, 90 first quarter, 180 full, 270 last quarter)
export function phaseAngle(date) { return MoonPhase(date); }
const PHASES = [
  ['New moon', '🌑'], ['Waxing crescent', '🌒'], ['First quarter', '🌓'], ['Waxing gibbous', '🌔'],
  ['Full moon', '🌕'], ['Waning gibbous', '🌖'], ['Last quarter', '🌗'], ['Waning crescent', '🌘'],
];
export function phaseOf(angle) {
  const [name, glyph] = PHASES[Math.floor(((angle + 22.5) % 360) / 45)];
  return { name, glyph };
}

// Tithi number 1–30 at a moment
export function tithiAt(date) { return Math.floor(phaseAngle(date) / 12) + 1; }

// Where a time zone's people are, near enough for a sunrise. Anything not listed counts as New York.
const TZ_CITY = {
  'America/New_York': [40.71, -74.01], 'America/Toronto': [43.65, -79.38], 'America/Chicago': [41.88, -87.63],
  'America/Denver': [39.74, -104.99], 'America/Phoenix': [33.45, -112.07], 'America/Los_Angeles': [34.05, -118.24],
  'America/Vancouver': [49.28, -123.12], 'America/Anchorage': [61.22, -149.9], 'Pacific/Honolulu': [21.31, -157.86],
  'America/Mexico_City': [19.43, -99.13], 'America/Sao_Paulo': [-23.55, -46.63], 'America/Argentina/Buenos_Aires': [-34.6, -58.38],
  'Europe/London': [51.51, -0.13], 'Europe/Dublin': [53.35, -6.26], 'Europe/Paris': [48.86, 2.35], 'Europe/Berlin': [52.52, 13.4],
  'Europe/Amsterdam': [52.37, 4.9], 'Europe/Madrid': [40.42, -3.7], 'Europe/Rome': [41.9, 12.5], 'Europe/Athens': [37.98, 23.73],
  'Europe/Istanbul': [41.01, 28.98], 'Europe/Moscow': [55.76, 37.62], 'Africa/Cairo': [30.04, 31.24], 'Africa/Johannesburg': [-26.2, 28.05],
  'Africa/Lagos': [6.52, 3.38], 'Africa/Nairobi': [-1.29, 36.82], 'Asia/Dubai': [25.2, 55.27], 'Asia/Karachi': [24.86, 67.0],
  'Asia/Kolkata': [28.61, 77.21], 'Asia/Calcutta': [28.61, 77.21], 'Asia/Dhaka': [23.81, 90.41], 'Asia/Bangkok': [13.76, 100.5],
  'Asia/Singapore': [1.35, 103.82], 'Asia/Hong_Kong': [22.32, 114.17], 'Asia/Shanghai': [31.23, 121.47], 'Asia/Tokyo': [35.68, 139.69],
  'Asia/Seoul': [37.57, 126.98], 'Australia/Perth': [-31.95, 115.86], 'Australia/Sydney': [-33.87, 151.21], 'Australia/Melbourne': [-37.81, 144.96],
  'Pacific/Auckland': [-36.85, 174.76],
};
const FALLBACK_TZ = 'America/New_York';

export function validZone(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return !!tz; } catch { return false; }
}
export function placeFor(tz) {
  const zone = validZone(tz) ? tz : FALLBACK_TZ;
  const [lat, lon] = TZ_CITY[zone] || TZ_CITY[FALLBACK_TZ];
  return { zone, lat, lon };
}

// Sunrise on a local calendar day at a place, or 6am local when the sun doesn't rise (polar latitudes)
export function sunriseOn(day, { zone, lat, lon }) {
  const midnight = zonedToUtc(day, 0, 0, zone);
  const rise = SearchRiseSet(Body.Sun, new Observer(lat, lon, 0), +1, midnight, 1);
  return rise ? rise.date : zonedToUtc(day, 6, 0, zone);
}

const KIND_LABEL = { 'Śukla': 'waxing moon', 'Kṛṣṇa': 'waning moon' };
export function tithiLabel(n) {
  const paksha = n <= 15 ? 'Śukla' : 'Kṛṣṇa';
  if (n === 15 || n === 30) return { name: tithiName(n), paksha, text: tithiName(n) + (n === 15 ? ' · full moon' : ' · new moon') };
  return { name: tithiName(n), paksha, text: `${paksha} ${tithiName(n)} · ${KIND_LABEL[paksha]}` };
}

// The tithi in force at local sunrise on a day
export function tithiOn(day, place) {
  const n = tithiAt(sunriseOn(day, place));
  return { number: n, ...tithiLabel(n) };
}

const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Seven days from today: the phase at local noon, plus today's tithi. place: { zone, lat, lon } (see placeFor).
export function moonWeek(today, place) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(today, i);
    const ph = phaseOf(phaseAngle(zonedToUtc(day, 12, 0, place.zone)));
    days.push({ day, dow: DAY_NAMES[new Date(day + 'T00:00:00Z').getUTCDay()], today: i === 0, phase: ph.name, glyph: ph.glyph });
  }
  const t = tithiOn(today, place);
  return { place: { zone: place.zone }, tithi: t, phase: days[0].phase, days };
}
