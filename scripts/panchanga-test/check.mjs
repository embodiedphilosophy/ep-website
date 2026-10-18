// Pañcāṅga engine against published values (New Delhi, 18 October 2026) plus structural checks.
// No network, no dependencies. Run: npm test   (or node scripts/panchanga-test/check.mjs)
import assert from 'assert/strict';
import { describeDay } from '../../lib/panchanga/describe.js';
import { computeDay, state, sunrise, localMidnight, fmtTime, norm } from '../../lib/panchanga/engine.js';
import * as C from '../../lib/panchanga/content.js';

const delhi = { lat: 28.61, lon: 77.21, tz: 'Asia/Kolkata', y: 2026, m: 10, d: 18 };
const ist = (h, m) => Date.UTC(2026, 9, 18, h, m) - 5.5 * 3600e3; // wall-clock IST on 18 Oct → ms
const within = (ms, want, mins, what) => assert.ok(Math.abs(ms - want) <= mins * 60e3, `${what}: got ${fmtTime('Asia/Kolkata', ms)}, wanted about ${fmtTime('Asia/Kolkata', want)}`);

// ---- published values, within 3 minutes
const d = describeDay(delhi);
assert.equal(d.tithi.name, 'Saptamī'); within(d.tithi.endMs, ist(8, 28), 3, 'Saptamī ends');
assert.equal(d.nakshatra.name, 'Pūrvāṣāḍhā'); within(d.nakshatra.endMs, ist(12, 49), 3, 'Pūrvāṣāḍhā ends');
assert.equal(d.yoga.name, 'Sukarman'); within(d.yoga.endMs, ist(23, 55), 3, 'Sukarman ends');
assert.equal(d.karana.name, 'Vaṇija'); within(d.karana.endMs, ist(8, 28), 3, 'Vaṇija ends');
assert.equal(d.nakshatra.moonSign.name, 'Dhanu'); assert.equal(d.nakshatra.moonSign.enters.name, 'Makara'); within(d.nakshatra.moonSign.enters.atMs, ist(19, 33), 3, 'Moon enters Makara');
assert.equal(d.month.name, 'Āśvina'); assert.equal(d.month.adhika, false); assert.equal(d.paksha, 'bright');
assert.equal(d.vara.english, 'Sunday'); assert.equal(d.tithi.dayInFortnight, 7);
const rise = d.sunrise; assert.ok(rise > ist(6, 0) && rise < ist(6, 30), 'Delhi sunrise about 6:20 IST in mid-October: ' + fmtTime('Asia/Kolkata', rise));
// what comes next
assert.equal(d.tithi.next, 'Aṣṭamī'); assert.equal(d.nakshatra.next, 'Uttarāṣāḍhā'); assert.equal(d.yoga.next, 'Dhṛti'); assert.equal(d.karana.next, 'Viṣṭi');
console.log('published values (New Delhi 18 Oct 2026): ok');

// ---- known moons: full moon 26 Oct 2026 04:12 UTC is a Pūrṇimā (tithi 14); new moon 9 Nov 2026 ~07:00 UTC is Amāvāsyā (29)
const s1 = state(Date.UTC(2026, 9, 26, 4, 12)); assert.ok(Math.abs(norm(s1.elong - 180 + 180) - 180) < 1.2, 'full moon elongation ' + s1.elong);
assert.equal(Math.floor(state(Date.UTC(2026, 9, 26, 3)).elong / 12), 14);
assert.equal(Math.floor(state(Date.UTC(2026, 10, 9, 6)).elong / 12), 29);
// Dīpāvalī (8 Nov 2026), Mahāśivarātri (6 Mar 2027), Guru Pūrṇimā (18 Jul 2027) at Houston sunrise
const hou = { lat: 29.76, lon: -95.37, tz: 'America/Chicago' };
assert.equal(describeDay({ ...hou, y: 2026, m: 11, d: 8 }).tithi.name, 'Amāvāsyā');
assert.equal(describeDay({ ...hou, y: 2027, m: 3, d: 6 }).tithi.name, 'Caturdaśī'); assert.equal(describeDay({ ...hou, y: 2027, m: 3, d: 6 }).paksha, 'dark');
assert.equal(describeDay({ ...hou, y: 2027, m: 7, d: 18 }).tithi.name, 'Pūrṇimā');
assert.equal(describeDay({ ...hou, y: 2026, m: 10, d: 20 }).tithi.name, 'Daśamī'); // Vijayadaśamī
console.log('known moons and observances: ok');

// ---- structure: every index has words, karaṇa cycle, month names
assert.equal(C.TITHI.length, 15); assert.equal(C.NAKSHATRA.length, 27); assert.equal(C.YOGA.length, 27); assert.equal(C.VARA.length, 7); assert.equal(C.RASHI.length, 12);
assert.equal(C.tithiOf(14)[0], 'Pūrṇimā'); assert.equal(C.tithiOf(29)[0], 'Amāvāsyā'); assert.equal(C.tithiOf(15)[0], 'Pratipadā'); assert.equal(C.tithiOf(28)[0], 'Caturdaśī');
assert.equal(C.karanaOf(0)[0], 'Kiṃstughna'); assert.equal(C.karanaOf(1)[0], 'Bava'); assert.equal(C.karanaOf(7)[0], 'Viṣṭi'); assert.equal(C.karanaOf(8)[0], 'Bava');
assert.equal(C.karanaOf(56)[0], 'Viṣṭi'); assert.equal(C.karanaOf(57)[0], 'Śakuni'); assert.equal(C.karanaOf(58)[0], 'Catuṣpada'); assert.equal(C.karanaOf(59)[0], 'Nāga');
assert.match(C.tithiText(28).desc, /Śivarātri/); assert.match(C.tithiText(2).desc, /^Day 3 of the waxing moon\./); assert.match(C.tithiText(16).desc, /^Day 2 of the waning moon\./);
for (let i = 0; i < 60; i++) assert.ok(C.karanaOf(i)[1]);
for (let i = 0; i < 30; i++) assert.ok(C.tithiText(i).desc);
console.log('content: ok');

// ---- the whole day is read at the viewer's sunrise: a different place gives a different day boundary
const syd = describeDay({ lat: -33.87, lon: 151.21, tz: 'Australia/Sydney', y: 2026, m: 10, d: 18 });
assert.ok(syd.sunrise !== d.sunrise);
// time zones with daylight saving: sunrise in London on the clocks-change day (25 Oct 2026) is the morning after the change
const lon = describeDay({ lat: 51.51, lon: -0.13, tz: 'Europe/London', y: 2026, m: 10, d: 25 });
assert.match(fmtTime('Europe/London', lon.sunrise), /^6:\d\d AM$/);
// polar fallback: no sunrise at 80°N in December, the engine falls back to 6:00 local and still answers
const polar = describeDay({ lat: 80, lon: 15, tz: 'Europe/Oslo', y: 2026, m: 12, d: 21 });
assert.ok(polar.tithi.name && polar.nakshatra.name); assert.equal(fmtTime('Europe/Oslo', polar.sunrise), '6:00 AM');
// an Adhika month exists in 2026: 17 May – 15 June (Adhika Jyeṣṭha)
const adhika = describeDay({ lat: 28.61, lon: 77.21, tz: 'Asia/Kolkata', y: 2026, m: 6, d: 1 }); assert.equal(adhika.month.adhika, true);
assert.equal(describeDay({ lat: 28.61, lon: 77.21, tz: 'Asia/Kolkata', y: 2026, m: 7, d: 1 }).month.adhika, false);
console.log('places, daylight saving, polar, adhika: ok');
