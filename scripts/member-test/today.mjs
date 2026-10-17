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
// ---- the mentee card's "due this week" line
const PR = await import('../../lib/member/programmes.js');
const sub = due => PR.openCards({ events: [], tier: 'mentee', today: '2026-10-21', formation: { total: 12.5, target: 100 }, due }).find(c => c.key === 'mentor');
assert.equal(sub(2).sub, 'Formation: 12.5 of 100 hours · 2 things due this week.'); assert.equal(sub(1).sub, 'Formation: 12.5 of 100 hours · 1 thing due this week.');
assert.equal(sub(0).sub, 'Formation: 12.5 of 100 hours · nothing due this week.'); assert.equal(sub(null).sub, 'Formation: 12.5 of 100 hours.');
assert.equal(sub(2).links[1].label, 'Due this week'); assert.equal(sub(0).links[1].label, 'This week');
console.log('today (free layer): ok');

// ---- the teaching read from the "Site Teachings" tab (a tiny stand-in for Google), with the shipped file as fallback
import http from 'http';
import crypto from 'crypto';
const T = await import('../../lib/member/teaching.js');
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
let rows = [['week_start', 'source', 'sanskrit_iast', 'translation', 'prompt_sat', 'publish'],
  ['2026-10-12', 'From the sheet', 'x', 'Sheet translation', 'Sheet question', 'TRUE'], ['2026-10-19', 'Hidden', 'y', 'z', '', 'No'], ['soon', 'Bad date', '', '', '', '']];
let status = 200;
let sacredRows = [['date', 'name', 'note', 'publish'], ['2026-11-01', 'From the sheet', 'A note', 'TRUE'], ['2026-11-02', 'Hidden', '', 'no'], ['2026-11-03', '', 'No name', 'TRUE'], ['later', 'Bad date', '', 'TRUE']];
const srv = http.createServer((req, res) => {
  if (req.url.startsWith('/token')) { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ access_token: 't', expires_in: 3600 })); }
  res.statusCode = status; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(status === 200 ? { values: decodeURIComponent(req.url).includes('Sacred') ? sacredRows : rows } : { error: 'nope' }));
}).listen(0);
await new Promise(r => srv.on('listening', r));
const port = srv.address().port;
Object.assign(process.env, { CALENDAR_SHEET_ID: 'sheet', GOOGLE_SERVICE_ACCOUNT_EMAIL: 'a@b.c', GOOGLE_PRIVATE_KEY: privateKey.export({ type: 'pkcs8', format: 'pem' }), GOOGLE_TOKEN_URL: `http://localhost:${port}/token`, SHEETS_BASE: `http://localhost:${port}` });
let w = await T.loadWeeks();
assert.equal(w.length, 1); assert.equal(w[0].source, 'From the sheet'); // hidden and badly dated rows left out
assert.equal((await T.currentTeaching('2026-10-17')).question, 'Sheet question');
rows = [rows[0]]; w = await T.loadWeeks();                              // tab made but empty → shipped file
assert.equal(w[0].source, 'Pratyabhijñāhṛdaya 1');
status = 400; w = await T.loadWeeks();                                  // tab not made yet → shipped file
assert.equal(w[0].source, 'Pratyabhijñāhṛdaya 1');
// the sacred days from their own tab
status = 200;
const SD = await import('../../lib/member/sacred.js');
let sd = await SD.sacredAheadNow('2026-10-17');
assert.equal(sd.length, 1); assert.equal(sd[0].name, 'From the sheet'); assert.equal(sd[0].inDays, 15); // hidden, nameless and badly dated rows left out
sacredRows = [sacredRows[0]]; sd = await SD.sacredAheadNow('2026-10-17');
assert.equal(sd[0].name, 'Dīpāvalī');                                    // empty tab → shipped list
status = 400; assert.equal((await SD.sacredAheadNow('2026-10-17'))[0].name, 'Dīpāvalī');
srv.close();
console.log('teachings sheet: ok');
