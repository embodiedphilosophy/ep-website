// Offline checks for the member Today strip: Circle sign-in verification and practice streak logic.
// No network, no database. Run: node scripts/member-test/check.mjs
import crypto from 'crypto';
import assert from 'assert/strict';

process.env.MEMBER_SECRET = 'test-secret';
const { verifyCircleToken, _setTestKeys } = await import('../../lib/member/identity.js');
const { signSession, readSession } = await import('../../lib/member/session.js');
const { summarise, cleanToday } = await import('../../lib/member/practice.js');

// ---- identity: sign a token like Circle's with a throwaway key
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const kid = 'circle-members-identity-token-test';
_setTestKeys([{ ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256' }]);
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function token(claims, key = privateKey, k = kid) {
  const h = b64({ alg: 'RS256', typ: 'JWT', kid: k });
  const p = b64(claims);
  const sig = crypto.sign('RSA-SHA256', Buffer.from(`${h}.${p}`), key).toString('base64url');
  return `${h}.${p}.${sig}`;
}
const now = Math.floor(Date.now() / 1000);
const good = { iss: 'https://circle.so', aud: 'b39d9096', type: 'identity_token', sub: '42', email: 'Student@Example.com', first_name: 'Asha', iat: now, exp: now + 300, roles: { admin: false } };

const who = await verifyCircleToken(token(good));
assert.equal(who.uid, '42'); assert.equal(who.email, 'student@example.com'); assert.equal(who.firstName, 'Asha');
const rejects = async (t, why) => { await assert.rejects(() => verifyCircleToken(t), undefined, why); };
await rejects(token({ ...good, exp: now - 600 }), 'expired');
await rejects(token({ ...good, aud: 'other' }), 'other community');
await rejects(token({ ...good, iss: 'https://evil.example' }), 'wrong issuer');
const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
await rejects(token(good, other), 'signed by someone else');
await rejects(token(good, privateKey, 'unknown-kid'), 'unknown key');
const t = token(good).split('.'); t[1] = b64({ ...good, email: 'someone.else@example.com' });
await rejects(t.join('.'), 'tampered claims');
await rejects('', 'empty');
console.log('identity: ok');

// ---- session
const s = signSession({ uid: '42', email: 'student@example.com', tier: 'ss_year' });
assert.equal(readSession(s).uid, '42');
assert.equal(readSession(s.slice(0, -2) + 'xx'), null);
assert.equal(readSession('nonsense'), null);
console.log('session: ok');

// ---- practice summary (Wed 21 Oct 2026)
const today = '2026-10-21';
const days = []; for (let i = 1; i <= 39; i++) { const d = new Date('2026-10-21T00:00:00Z'); d.setUTCDate(d.getUTCDate() - i); days.push(d.toISOString().slice(0, 10)); }
let r = summarise(days, today);
assert.equal(r.streak, 39); assert.equal(r.loggedToday, false); assert.equal(r.weekCount, 2); assert.equal(r.nextMilestone, 40); assert.equal(r.reached, null);
assert.equal(r.grid.length, 8); assert.equal(r.grid[7][2].state, 'today'); assert.equal(r.grid[7][3].state, 'future');
r = summarise([...days, today], today);
assert.equal(r.streak, 40); assert.equal(r.reached, 40); assert.equal(r.weekCount, 3); assert.equal(r.nextMilestone, 108);
r = summarise(['2026-10-19'], today); // missed yesterday
assert.equal(r.streak, 0);
r = summarise([], today); assert.equal(r.streak, 0); assert.equal(r.nextMilestone, 7);
assert.equal(cleanToday('1999-01-01'), new Date().toISOString().slice(0, 10));
console.log('practice: ok');

// ---- mentor view: cohort summary (Wed 21 Oct 2026)
const { cohortSummary } = await import('../../lib/member/practice.js');
const mk = n => Array.from({ length: n }, (_, i) => { const d = new Date('2026-10-21T00:00:00Z'); d.setUTCDate(d.getUTCDate() - i); return { day: d.toISOString().slice(0, 10), minutes: 30 }; });
const c = cohortSummary(
  [{ name: 'Bea', email: 'BEA@x.com' }, { name: 'Ana', email: 'ana@x.com' }, { name: 'Cy', email: 'cy@x.com' }, { name: 'Di', email: 'di@x.com' }],
  { 'bea@x.com': mk(21), 'ana@x.com': mk(10).slice(5), 'di@x.com': mk(3) },
  '2026-10-21');
assert.deepEqual(c.rows.map(r => r.name), ['Ana', 'Bea', 'Cy', 'Di']);
const by = Object.fromEntries(c.rows.map(r => [r.name, r]));
assert.equal(by.Bea.streak, 21); assert.equal(by.Bea.days8w, 21); assert.equal(by.Bea.minutes8w, 630); assert.equal(by.Bea.daysSince, 0);
assert.equal(by.Ana.streak, 0); assert.equal(by.Ana.daysSince, 5); assert.equal(by.Cy.last, null);
assert.deepEqual(c.attention.map(a => a.name + ':' + (a.good ? 'good' : 'check')), ['Ana:check', 'Bea:good', 'Cy:check']);
console.log('cohort: ok');

// ---- seasonal sādhana credits
const { parseAmount, creditsFromFields, samcartCredits } = await import('../../lib/member/credits.js');
assert.equal(parseAmount('$79.00'), 79); assert.equal(parseAmount('149.5'), 149.5); assert.equal(parseAmount(''), 0);
assert.deepEqual(creditsFromFields({ navaratri_credit: '79' }, '2026-10-25'), { navaratri_2026: { name: 'Navarātri', amount: 79, until: '2026-11-03' } });
assert.deepEqual(creditsFromFields({ navaratri_credit: '79' }, '2026-11-04'), {}, 'offer over');
assert.deepEqual(creditsFromFields({ navaratri_credit: '' }, '2026-10-25'), {});
assert.deepEqual(creditsFromFields(undefined, '2026-10-25'), {});
assert.deepEqual(samcartCredits({ products: [{ id: '999', name: 'Navarātri & the Devī Gītā', price: '149.00' }], order: { total: '149.00' } }), { navaratri_credit: 149 });
assert.deepEqual(samcartCredits({ product: { name: 'Navaratri 2026' }, order: { total: 35 } }), { navaratri_credit: 35 });
assert.deepEqual(samcartCredits({ products: [{ id: '1117471', name: 'Sadhana School Fall 2026', price: 497 }] }), {});
console.log('credits: ok');

// ---- year pricing: step-down price, what's paid counts, $797 floor
const { yearQuote, memberOffer, stageOn, couponFor, STAGES } = await import('../../lib/member/pricing.js');
const C = Object.fromEntries([10, 20, 30, 40, 50, 60, 79, 100, 149, 200, 250, 297, 497, 650, 697, 900].map(a => [a, 'C' + a]));
STAGES.find(s => s.key === 'spring').from ||= '2027-04-07'; // a Spring date for the test only
const q = (seasons, day, credit = 0) => yearQuote({ seasons, credit }, day, C);
assert.equal(stageOn('2026-10-15').year, 1797); assert.equal(stageOn('2026-10-21').year, 1997);
assert.equal(stageOn('2027-02-01').year, 1697); assert.equal(stageOn('2027-04-10').year, 1447);
assert.equal(q(['fall'], '2026-10-15').price, 1300);   // before term: the early $1,797
assert.equal(q(['fall'], '2026-11-01').price, 1300);   // Fall term: Fall students keep $1,797 − $497
assert.equal(q(['fall'], '2026-11-01').href.endsWith('coupon_code=C697'), true);
assert.equal(q([], '2026-11-01', 85).price, 1918);    // a credit alone still starts from $1,997
assert.equal(q(['winter'], '2027-02-01').price, 1200);
assert.equal(q(['fall', 'winter'], '2027-02-01').price, 797);           // floor
assert.equal(q(['spring'], '2027-04-10').price, 950);
assert.equal(q(['winter', 'spring'], '2027-04-10').price, 797);         // floor
assert.equal(q(['fall', 'winter', 'spring'], '2027-04-10').price, 797); // floor
assert.equal(q(['fall', 'winter'], '2027-04-10').price, 797);           // floor (453 would undercut Summer)
assert.ok(q(['fall', 'winter', 'spring'], '2027-04-10').href.endsWith('coupon_code=C650'));
assert.equal(q([], '2026-11-01', 85).price, 1918);     // Navarātri $85 → $79 rung
assert.equal(q([], '2026-11-01', 85).exact, false);
assert.equal(yearQuote({ seasons: ['fall'] }, '2026-11-01', {}), null, 'no coupon yet → no offer');
assert.deepEqual(couponFor(85, C), { amount: 79, code: 'C79' });
// offers
assert.equal(memberOffer({ tier: 'ss_year' }, '2026-11-01', C), null);
let o = memberOffer({ tier: 'ss_season', seasons: ['fall'] }, '2026-11-01', C);
assert.equal(o.kind, 'upgrade'); assert.equal(o.options[0].price, 1300); assert.match(o.body, /Winter, Spring and the online summer immersion are yours for \$1,300/);
o = memberOffer({ tier: 'ss_season', seasons: ['spring'] }, '2027-04-10', C);
assert.match(o.body, /The online summer immersion, with Fall and Winter on demand, is yours for \$950/);
o = memberOffer({ tier: 'none', seasons: [], credits: { navaratri_2026: { name: 'Navarātri', amount: 149, until: '2026-11-03' } } }, '2026-11-01', C);
assert.equal(o.kind, 'credit'); assert.equal(o.options.length, 1); assert.equal(o.options[0].price, 1848);
assert.equal(memberOffer({ tier: 'wisdom', seasons: [] }, '2026-11-01', C), null);
console.log('pricing: ok');

// ---- Kit purchases → credit; Vercel pricing settings
const { kitCredits } = await import('../../lib/member/credits.js');
assert.deepEqual(kitCredits({ purchase: { status: 'paid', email_address: 'A@x.com', total: 35, products: [{ pid: 9, name: 'Navarātri 2027', unit_price: 35, quantity: 1 }] } }), [{ email: 'a@x.com', name: '', fields: { navaratri_credit: 35 } }]);
assert.deepEqual(kitCredits({ events: [{ type: 'purchase.purchase_create', data: { purchase: { email_address: 'b@x.com', products: [{ name: 'Navaratri', unit_price: '79.00' }] } } }] })[0].fields, { navaratri_credit: 79 });
assert.deepEqual(kitCredits({ purchase: { email_address: 'c@x.com', products: [{ name: 'Wisdom School', unit_price: 27 }] } })[0].fields, {});
assert.equal(kitCredits({ purchase: { status: 'refunded', email_address: 'd@x.com', products: [{ name: 'Navaratri', unit_price: 5 }] } }).length, 0);
const pricing = await import('../../lib/member/pricing.js');
assert.equal(pricing.applySettings('not json'), false);
assert.equal(pricing.applySettings({ coupons: { 697: ' FALLYEAR ' }, checkout: { fall: 'sadhana-school-fall', winter: 'https://ss.embodiedphilosophy.com/checkout/w' }, spring: '2027-04-07' }), true);
assert.equal(pricing.COUPONS['697'], 'FALLYEAR');
assert.equal(pricing.CHECKOUT.fall, 'https://ss.embodiedphilosophy.com/checkout/sadhana-school-fall');
assert.equal(pricing.CHECKOUT.winter, 'https://ss.embodiedphilosophy.com/checkout/w');
assert.equal(pricing.yearQuote({ seasons: ['fall'] }, '2026-11-01').href, 'https://ss.embodiedphilosophy.com/checkout/sadhana-school-year?coupon_code=FALLYEAR');
console.log('kit purchases + settings: ok');

// ---- schedule: times in New York across the clock change, who sees what, one-to-ones, calendar feed
const SC = await import('../../lib/member/schedule.js');
assert.deepEqual(SC.parseTime('9am ET'), { h: 9, m: 0, zone: 'America/New_York' });
assert.deepEqual(SC.parseTime('7:30 pm UK'), { h: 19, m: 30, zone: 'Europe/London' });
assert.equal(SC.parseTime('12pm').h, 12); assert.equal(SC.parseTime('12am ET').h, 0); assert.equal(SC.parseTime(''), null);
assert.equal(SC.zonedToUtc('2026-10-28', 9, 0, 'America/New_York').toISOString(), '2026-10-28T13:00:00.000Z', 'EDT');
assert.equal(SC.zonedToUtc('2026-11-04', 9, 0, 'America/New_York').toISOString(), '2026-11-04T14:00:00.000Z', 'EST after 1 Nov');
assert.equal(SC.zonedToUtc('2026-03-08', 9, 0, 'America/New_York').toISOString(), '2026-03-08T13:00:00.000Z', 'spring forward day');
const EV = [
  { id: 'a', date: '2026-10-21', time: '9am ET', program: 'sadhana', series: 'sadhana-fall-2026', title: 'The Heart of Recognition: Session 1' },
  { id: 'b', date: '2026-11-04', time: '9am ET', program: 'sadhana', series: 'sadhana-fall-2026', title: 'The Heart of Recognition' },
  { id: 'c', date: '2026-12-05', time: '', program: 'sadhana', series: '', title: 'SS Weekend Workshop — Winter on-ramp' },
  { id: 'd', date: '2026-10-19', time: '12pm ET', program: 'wisdom', series: 'meditation-mondays', title: 'Meditation Mondays' },
  { id: 'e', date: '2026-10-11', end_date: '2026-10-20', time: '9am ET', program: 'seasonal', title: 'Navarātri' },
  { id: 'f', date: '2026-10-01', time: '9am ET', program: 'sadhana', series: 'sadhana-fall-2026', title: 'Past' },
];
let sch = SC.buildSchedule(EV, 'ss_year', '2026-10-15');
assert.deepEqual(sch.map(i => i.id), ['a', 'b', 'c']);
assert.equal(sch[0].kind, 'session'); assert.equal(sch[0].start, '2026-10-21T13:00:00.000Z'); assert.equal(sch[0].end, '2026-10-21T15:30:00.000Z');
assert.equal(sch[1].start, '2026-11-04T14:00:00.000Z'); assert.equal(sch[2].kind, 'immersion'); assert.equal(sch[2].allDay, true);
assert.equal(sch[0].live, '/c/fall-live-sessions');
assert.deepEqual(SC.buildSchedule(EV, 'meditation', '2026-10-15').map(i => i.id), ['d']);
assert.deepEqual(SC.buildSchedule(EV, 'none', '2026-10-15').map(i => i.id), ['e', 'd', 'a', 'b', 'c']);
sch = SC.buildSchedule(EV, 'mentee', '2026-10-15');
const ones = sch.filter(i => i.kind === 'one');
assert.deepEqual(ones.map(o => [o.date, o.end_date, !!o.book]), [['2026-10-25', '2026-10-31', true], ['2026-11-24', '2026-11-30', false], ['2026-12-25', '2026-12-31', false]]);
assert.equal(ones[0].title, 'October one-to-one with Jacob');
process.env.MEMBER_SECRET = 'test-secret';
const tok = SC.feedToken({ uid: 'u1', email: 'maya@x.com', tier: 'mentee' });
assert.deepEqual(SC.readFeedToken(tok), { k: 'feed', uid: 'u1', email: 'maya@x.com', tier: 'mentee' });
assert.equal(SC.readFeedToken(tok.slice(0, -2) + 'xx'), null); assert.equal(SC.readFeedToken('nope'), null);
const ics = SC.toIcs(sch, { now: new Date('2026-10-15T12:00:00Z') });
assert.match(ics, /^BEGIN:VCALENDAR\r\n/); assert.match(ics, /END:VCALENDAR\r\n$/);
assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, sch.length);
assert.match(ics, /DTSTART:20261021T130000Z\r\nDTEND:20261021T153000Z/);
assert.match(ics, /DTSTART;VALUE=DATE:20261205\r\nDTEND;VALUE=DATE:20261206/);
assert.match(ics, /DTSTART;VALUE=DATE:20261025\r\nDTEND;VALUE=DATE:20261101/);
assert.ok(ics.split('\r\n').every(l => Buffer.byteLength(l) <= 75), 'lines folded');
assert.match(ics, /SUMMARY:SS Weekend Workshop — Winter on-ramp/);
console.log('schedule: ok');
