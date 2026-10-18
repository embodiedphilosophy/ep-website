// The day as a student reads it: the engine's result joined with the words in content.js. One shape, used by the
// page (/today/panchanga) and by the JSON endpoint (/api/panchanga).
import { computeDay } from './engine.js';
import { tithiText, tithiOf, VARA, NAKSHATRA, YOGA, karanaOf, RASHI, RASHI_EN } from './content.js';

// opts: { lat, lon, tz, y, m, d } → plain data (times as ms since 1970)
export function describeDay(opts) {
  const r = computeDay(opts);
  const t = tithiText(r.tithi.index);
  const v = VARA[r.weekday];
  const rs = r.rashi.index, enters = r.rashi.endMs - r.sunrise < 864e5; // a sign change within the day
  return {
    sunrise: r.sunrise,
    elongation: r.elong, // degrees ahead of the Sun: 0 new moon, 180 full moon (draws the Moon in the header)
    month: { name: r.month.name, adhika: r.month.adhika },
    paksha: r.tithi.index < 15 ? 'bright' : 'dark',
    tithi: { index: r.tithi.index, name: t.name, description: t.desc, endMs: r.tithi.endMs, next: tithiOf(r.tithi.next)[0],
      dayInFortnight: r.tithi.index < 15 ? r.tithi.index + 1 : r.tithi.index - 14 },
    vara: { index: r.weekday, name: v[0], english: v[1], description: v[2] },
    nakshatra: { index: r.nakshatra.index, name: NAKSHATRA[r.nakshatra.index][0], description: NAKSHATRA[r.nakshatra.index][1], endMs: r.nakshatra.endMs, next: NAKSHATRA[r.nakshatra.next][0],
      moonSign: { index: rs, name: RASHI[rs], english: RASHI_EN[rs], enters: enters ? { name: RASHI[r.rashi.next], atMs: r.rashi.endMs } : null } },
    yoga: { index: r.yoga.index, name: YOGA[r.yoga.index][0], description: YOGA[r.yoga.index][1], endMs: r.yoga.endMs, next: YOGA[r.yoga.next][0] },
    karana: { index: r.karana.index, name: karanaOf(r.karana.index)[0], description: karanaOf(r.karana.index)[1], endMs: r.karana.endMs, next: karanaOf(r.karana.next)[0] },
  };
}
