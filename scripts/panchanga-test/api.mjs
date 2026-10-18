// The /api/panchanga endpoint, called directly (no server). Run: node --import ./scripts/ce-test/register.mjs scripts/panchanga-test/api.mjs
import assert from 'assert/strict';
const { GET, OPTIONS } = await import('../../app/api/panchanga/route.js');
const call = qs => GET(new Request('https://x.test/api/panchanga' + qs));

let r = await call('?date=2026-10-18&lat=28.61&lon=77.21&tz=Asia/Kolkata'); let j = await r.json();
assert.equal(r.status, 200); assert.equal(r.headers.get('access-control-allow-origin'), '*'); assert.match(r.headers.get('cache-control'), /s-maxage/);
assert.equal(j.date, '2026-10-18'); assert.equal(j.tithi.name, 'Saptamī'); assert.equal(j.tithi.next, 'Aṣṭamī'); assert.equal(j.tithi.index, 6); assert.equal(j.tithi.dayInFortnight, 7);
assert.equal(j.tithi.endsAt, '2026-10-18T02:58:' + j.tithi.endsAt.slice(17)); // 8:28 IST = 02:58 UTC
assert.equal(j.nakshatra.name, 'Pūrvāṣāḍhā'); assert.equal(j.nakshatra.moonSign.name, 'Dhanu'); assert.equal(j.nakshatra.moonSign.enters.name, 'Makara');
assert.equal(j.yoga.name, 'Sukarman'); assert.equal(j.karana.name, 'Vaṇija'); assert.equal(j.vara.english, 'Sunday');
assert.equal(j.month.name, 'Āśvina'); assert.equal(j.month.adhika, false); assert.equal(j.paksha, 'bright'); assert.match(j.sunrise, /^2026-10-18T00:5\d:/);
for (const k of ['tithi', 'nakshatra', 'yoga', 'karana']) assert.ok(j[k].description && j[k].endsAt && j[k].next, k);

// today when no date is given; tz is optional
j = await (await call('?lat=40.71&lon=-74.01&tz=America/New_York')).json(); assert.match(j.date, /^\d{4}-\d{2}-\d{2}$/);
j = await (await call('?lat=0&lon=0')).json(); assert.equal(j.place.tz, 'UTC');

// bad input is refused in plain words
for (const [qs, re] of [['', /lat/], ['?lat=91&lon=0', /lat/], ['?lat=abc&lon=0', /lat/], ['?lat=0&lon=181', /lon/], ['?lat=0&lon=0&tz=Mars/Base', /time zone/],
  ['?lat=0&lon=0&date=18-10-2026', /date/], ['?lat=0&lon=0&date=2026-02-31', /exist/], ['?lat=0&lon=0&date=1800-01-01', /1900/]]) {
  const x = await call(qs); assert.equal(x.status, 400, qs); assert.match((await x.json()).error, re, qs);
}
assert.equal((await OPTIONS()).status, 204);
console.log('api: ok');
