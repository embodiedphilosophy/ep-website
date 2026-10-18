// Offline checks for the free layer of Today: sacred days, the teaching of the week, the mentee card's due line. (The pañcāṅga
// has its own tests: npm test.)
// No network, no database. Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/today.mjs
import assert from 'assert/strict';
const { sacredAhead } = await import('../../lib/member/sacred.js');
const { teachingFor } = await import('../../lib/member/teaching.js');

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
