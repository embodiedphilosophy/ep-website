// /api/member/today signing the student in itself (X-Circle-Identity), so the Today page needs one round trip.
// No network, no database, no Kit (the tier then reads as a free member). Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/today-route.mjs
import crypto from 'crypto';
import assert from 'assert/strict';
process.env.MEMBER_SECRET = 'test-secret'; delete process.env.KIT_API_KEY; delete process.env.DATABASE_URL; delete process.env.CALENDAR_SHEET_ID;
const { _setTestKeys } = await import('../../lib/member/identity.js');
const { readSession } = await import('../../lib/member/session.js');
const { GET } = await import('../../app/api/member/today/route.js');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const kid = 'circle-members-identity-token-test';
_setTestKeys([{ ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256' }]);
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (claims, key = privateKey) => { const h = b64({ alg: 'RS256', typ: 'JWT', kid }), p = b64(claims); return `${h}.${p}.${crypto.sign('RSA-SHA256', Buffer.from(`${h}.${p}`), key).toString('base64url')}`; };
const now = Math.floor(Date.now() / 1000);
const good = { iss: 'https://circle.so', aud: 'b39d9096', type: 'identity_token', sub: '42', email: 'student@example.com', first_name: 'Asha', iat: now, exp: now + 300, roles: { admin: false } };
const call = (headers = {}, qs = '') => GET(new Request('https://x.test/api/member/today?today=2026-10-17' + qs, { headers }));

// first visit: Circle's token alone signs in and loads, in one call
let r = await call({ 'x-circle-identity': token(good) }); let j = await r.json();
assert.equal(r.status, 200); assert.equal(j.firstName, 'Asha'); assert.equal(j.tier, 'none'); assert.equal(j.signin.firstName, 'Asha'); assert.equal(j.signin.tier.tier, 'none');
assert.equal(readSession(j.signin.session).uid, '42'); assert.equal(readSession(j.signin.session).email, 'student@example.com');
assert.ok(j.sacred.length > 0 && Array.isArray(j.locked) && j.locked.length === 4 && j.moon === undefined);
assert.match(r.headers.get('server-timing'), /signin;dur=\d+, today;dur=\d+/); assert.match(r.headers.get('access-control-expose-headers'), /Server-Timing/);
assert.match(r.headers.get('access-control-allow-headers'), /X-Circle-Identity/); assert.equal(r.headers.get('cache-control'), 'no-store');
// next visit: the saved session, no token, no signin block
r = await call({ authorization: 'Bearer ' + j.signin.session }); j = await r.json();
assert.equal(r.status, 200); assert.equal(j.firstName, 'Asha'); assert.equal(j.signin, undefined); assert.doesNotMatch(r.headers.get('server-timing'), /signin/);
// not allowed in: no credentials, a stranger's key, an expired token, a tampered one
const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
for (const [h, why] of [[{}, 'nothing'], [{ 'x-circle-identity': token(good, other) }, 'signed by someone else'], [{ 'x-circle-identity': token({ ...good, exp: now - 600 }) }, 'expired'],
  [{ 'x-circle-identity': (t => { t[1] = b64({ ...good, email: 'someone.else@example.com' }); return t.join('.'); })(token(good).split('.')) }, 'tampered claims'], [{ authorization: 'Bearer nonsense' }, 'bad session']]) {
  const x = await call(h); assert.equal(x.status, 401, why); assert.ok((await x.json()).error, why);
}
// a student cannot preview another membership; only admins can
j = await (await call({ 'x-circle-identity': token(good) }, '&as=mentee')).json(); assert.equal(j.tier, 'none');
j = await (await call({ 'x-circle-identity': token({ ...good, roles: { admin: true } }) }, '&as=mentee')).json(); assert.equal(j.tier, 'mentee'); assert.equal(j.signin.admin, true);
console.log('today route: ok');
