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
assert.deepEqual(creditsFromFields({ navaratri_2026_paid: '79' }, '2026-10-25'), { navaratri_2026: { name: 'Navarātri', amount: 79, until: '2026-11-03' } });
assert.deepEqual(creditsFromFields({ navaratri_2026_paid: '79' }, '2026-11-04'), {}, 'offer over');
assert.deepEqual(creditsFromFields({ navaratri_2026_paid: '' }, '2026-10-25'), {});
assert.deepEqual(creditsFromFields(undefined, '2026-10-25'), {});
assert.deepEqual(samcartCredits({ products: [{ id: '999', name: 'Navarātri & the Devī Gītā', price: '149.00' }], order: { total: '149.00' } }), { navaratri_2026_paid: 149 });
assert.deepEqual(samcartCredits({ product: { name: 'Navaratri 2026' }, order: { total: 35 } }), { navaratri_2026_paid: 35 });
assert.deepEqual(samcartCredits({ products: [{ id: '1117471', name: 'Sadhana School Fall 2026', price: 497 }] }), {});
console.log('credits: ok');
