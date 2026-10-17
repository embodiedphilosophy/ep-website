// Offline checks for the free layer of Today: moon, tithi, sacred days, the teaching of the week, place handling.
// No network, no database. Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/today.mjs
import assert from 'assert/strict';
const M = await import('../../lib/member/moon.js');
const { sacredAhead } = await import('../../lib/member/sacred.js');
const { teachingFor } = await import('../../lib/member/teaching.js');
const { cleanPlace } = await import('../../lib/member/today.js');

// ---- tithi names
assert.equal(M.tithiName(1), 'Pratipadā'); assert.equal(M.tithiName(14), 'Caturdaśī'); assert.equal(M.tithiName(15), 'Pūrṇimā');
assert.equal(M.tithiName(16), 'Pratipadā'); assert.equal(M.tithiName(29), 'Caturdaśī'); assert.equal(M.tithiName(30), 'Amāvasyā');
assert.equal(M.tithiLabel(6).text, 'Śukla Ṣaṣṭhī · waxing moon');
assert.equal(M.tithiLabel(21).text, 'Kṛṣṇa Ṣaṣṭhī · waning moon');
assert.equal(M.tithiLabel(15).text, 'Pūrṇimā · full moon'); assert.equal(M.tithiLabel(30).text, 'Amāvasyā · new moon');

// ---- phases against known moons (UTC): new 2026-11-09 ~07:00, full 2026-10-26 04:12
const near = (a, b, tol) => Math.abs(((a - b + 540) % 360) - 180) <= tol;
assert.ok(near(M.phaseAngle(new Date('2026-10-26T04:12:00Z')), 180, 1), 'full moon 26 Oct 2026');
assert.ok(near(M.phaseAngle(new Date('2026-11-09T07:00:00Z')), 0, 1.5), 'new moon 9 Nov 2026');
assert.equal(M.phaseOf(0).name, 'New moon'); assert.equal(M.phaseOf(359).name, 'New moon');
assert.equal(M.phaseOf(180).name, 'Full moon'); assert.equal(M.phaseOf(90).name, 'First quarter'); assert.equal(M.phaseOf(270).name, 'Last quarter');
assert.equal(M.phaseOf(45).name, 'Waxing crescent'); assert.equal(M.phaseOf(315).name, 'Waning crescent');

// ---- tithi at sunrise on days whose tithi is fixed by tradition (sacred days that fall on a named tithi),
// in the US time zones the observances are reckoned for. Sharad Navarātri 2026 begins 11 Oct, so Vijayadaśamī is 20 Oct.
const ny = M.placeFor('America/New_York'), tx = { zone: 'America/Chicago', lat: 29.76, lon: -95.37 };
const t = (d, p = tx) => M.tithiOn(d, p);
assert.equal(t('2026-10-20').number, 10); assert.equal(t('2026-10-20').name, 'Daśamī');   // Vijayadaśamī
assert.equal(t('2026-11-08').number, 30);                                                  // Dīpāvalī, new moon
assert.equal(t('2027-03-06').number, 29); assert.equal(t('2027-03-06').paksha, 'Kṛṣṇa');   // Mahāśivarātri, Kṛṣṇa Caturdaśī
assert.equal(t('2027-07-18').number, 15);                                                  // Guru Pūrṇimā
assert.equal(t('2026-10-17', ny).text, 'Śukla Saptamī · waxing moon');

// ---- a week of moons
const wk = M.moonWeek('2026-10-17', ny);
assert.equal(wk.days.length, 7); assert.equal(wk.days[0].today, true); assert.equal(wk.days[0].dow, 'Sat'); assert.equal(wk.days[6].day, '2026-10-23');
assert.equal(wk.phase, 'First quarter'); assert.ok(wk.days[4].glyph); assert.equal(wk.days[6].phase, 'Waxing gibbous');
assert.equal(wk.tithi.number, 7);
assert.equal(M.moonWeek('2026-10-26', ny).days[0].phase, 'Full moon'); assert.equal(M.moonWeek('2026-10-26', ny).days[6].phase, 'Last quarter');

// ---- places: unknown or invalid zones fall back; exact coordinates are rounded and never kept
assert.equal(M.placeFor('Nowhere/Land').zone, 'America/New_York');
assert.equal(M.placeFor('Asia/Kolkata').lat, 28.61);
assert.deepEqual(cleanPlace('Europe/London', '51.5074', '-0.1278'), { zone: 'Europe/London', lat: 51.5, lon: -0.1 });
assert.deepEqual(cleanPlace('Europe/London', '', ''), M.placeFor('Europe/London'));
assert.deepEqual(cleanPlace('Europe/London', 'abc', '3'), M.placeFor('Europe/London'));
assert.deepEqual(cleanPlace('Europe/London', '91', '3'), M.placeFor('Europe/London'));
assert.deepEqual(cleanPlace(null, null, null), M.placeFor('America/New_York'));
// polar latitude: no sunrise, still answers (6am local)
assert.ok(M.tithiOn('2026-12-21', { zone: 'Europe/Oslo', lat: 80, lon: 15 }).number >= 1);

// ---- sacred days
const s = sacredAhead('2026-10-17');
assert.equal(s.length, 4); assert.equal(s[0].name, 'Dīpāvalī'); assert.equal(s[0].date, '2026-11-08'); assert.equal(s[0].inDays, 22);
assert.equal(s[3].name, 'Caitra Navarātri');
assert.equal(sacredAhead('2026-11-08')[0].inDays, 0);   // on the day itself
assert.equal(sacredAhead('2027-10-29').length, 0);      // none left
assert.equal(sacredAhead('2026-10-17', 2).length, 2);

// ---- the teaching: this week's sūtra, the day's question (blank until written), nothing once the week is over
const weeks = [{ week_start: '2026-10-12', source: 'Pratyabhijñāhṛdaya 1', sanskrit_iast: 'citiḥ svatantrā', translation: 'Consciousness, free.', prompt_sat: 'What is free in you today?', prompt_sun: '' }];
assert.equal(teachingFor('2026-10-17', weeks).question, 'What is free in you today?');
assert.equal(teachingFor('2026-10-18', weeks).question, null);
assert.equal(teachingFor('2026-10-18', weeks).source, 'Pratyabhijñāhṛdaya 1');
assert.equal(teachingFor('2026-10-11', weeks), null);  // before the week starts
assert.equal(teachingFor('2026-10-19', weeks), null);  // a week later, no stale sūtra
assert.equal(teachingFor('2026-10-17').source, 'Pratyabhijñāhṛdaya 1'); // the shipped data covers the week of 12 Oct
console.log('today (free layer): ok');
