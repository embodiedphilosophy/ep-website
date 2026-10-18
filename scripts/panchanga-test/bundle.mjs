// The browser bundle (public/circle/panchanga.js) must be current and give exactly the same answers as the modules the
// /today/panchanga page and /api/panchanga use. Run: node scripts/panchanga-test/bundle.mjs
import assert from 'assert/strict';
import fs from 'fs';
import vm from 'vm';
import { bundle } from '../build-panchanga.mjs';
import { describeDay, sublineOf } from '../../lib/panchanga/describe.js';
import { PLACES } from '../../lib/panchanga/places.js';

const committed = fs.readFileSync(new URL('../../public/circle/panchanga.js', import.meta.url), 'utf8');
assert.equal(committed, bundle(), 'public/circle/panchanga.js is out of date: run `node scripts/build-panchanga.mjs`');

const win = {}; vm.runInNewContext(committed, { window: win, Intl, Date, Math, Object, Number, String, Array, JSON, isFinite });
const E = win.EPPanchanga;
assert.ok(E && typeof E.describeDay === 'function', 'bundle defines window.EPPanchanga');
const cases = [['America/New_York', 2026, 10, 17], ['Asia/Kolkata', 2026, 4, 2], ['Europe/London', 2026, 3, 29], ['Pacific/Auckland', 2026, 12, 31], ['America/Los_Angeles', 2027, 1, 14]];
for (const [tz, y, m, d] of cases) {
  const pl = PLACES[tz]; assert.ok(pl, 'known place ' + tz);
  const args = { lat: pl[1], lon: pl[2], tz, y, m, d };
  const a = describeDay(args), b = E.describeDay(args);
  assert.deepEqual(JSON.parse(JSON.stringify(b)), JSON.parse(JSON.stringify(a)), `same day for ${tz} ${y}-${m}-${d}`);
  assert.equal(E.sublineOf(b), sublineOf(a));
}
assert.deepEqual(Object.keys(E.PLACES).sort(), Object.keys(PLACES).sort());
console.log('bundle: ok');
