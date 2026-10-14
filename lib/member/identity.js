// Who is signed in to Circle? Circle's custom code gets window.circleUser.identityToken: a short-lived (5 min)
// RS256 JWT signed by circle.so. We check its signature against Circle's public keys, so a member can only ever
// act as themselves. Optional env: CIRCLE_IDENTITY_AUD (our community's audience, default below),
// CIRCLE_JWKS_URL.
import crypto from 'crypto';

const JWKS_URL = () => process.env.CIRCLE_JWKS_URL || 'https://app.circle.so/.well-known/jwks.json';
const AUD = () => process.env.CIRCLE_IDENTITY_AUD || 'b39d9096';
const ISS = 'https://circle.so';

let keyCache = null; // { at, keys: { kid: KeyObject } }
let testKeys = null; // tests only

export function _setTestKeys(jwks) { testKeys = jwks; keyCache = null; }

async function publicKey(kid) {
  const fresh = keyCache && Date.now() - keyCache.at < 60 * 60 * 1000;
  if (!fresh || !keyCache.keys[kid]) {
    const jwks = testKeys || await fetch(JWKS_URL(), { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(`Circle keys: ${r.status}`); return r.json(); });
    const list = Array.isArray(jwks) ? jwks : (jwks.keys || []);
    const keys = {};
    for (const k of list) if (k.kid && k.kty === 'RSA') keys[k.kid] = crypto.createPublicKey({ key: k, format: 'jwk' });
    keyCache = { at: Date.now(), keys };
  }
  return keyCache.keys[kid] || null;
}

const part = s => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));

// Returns { uid, email, name, firstName, isAdmin } or throws with a plain message.
export async function verifyCircleToken(token) {
  const [h, p, sig] = String(token || '').split('.');
  if (!h || !p || !sig) throw new Error('No Circle sign-in');
  const header = part(h);
  if (header.alg !== 'RS256') throw new Error('Unexpected sign-in format');
  const key = await publicKey(header.kid);
  if (!key) throw new Error('Unknown Circle key');
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), key, Buffer.from(sig, 'base64url'));
  if (!ok) throw new Error('Circle sign-in could not be verified');
  const c = part(p);
  const now = Math.floor(Date.now() / 1000);
  if (c.iss !== ISS) throw new Error('Not a Circle sign-in');
  if (String(c.aud) !== AUD()) throw new Error('Sign-in is for a different community');
  if (c.type && c.type !== 'identity_token') throw new Error('Wrong kind of sign-in');
  if (!c.exp || c.exp < now - 30) throw new Error('Circle sign-in has expired');
  if (!c.email || !c.sub) throw new Error('Sign-in has no member');
  return {
    uid: String(c.sub),
    email: String(c.email).trim().toLowerCase(),
    name: c.name || '',
    firstName: c.first_name || '',
    isAdmin: !!(c.roles && c.roles.admin),
  };
}
