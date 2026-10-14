// Our own member session, issued after a verified Circle sign-in so the browser doesn't have to
// re-verify every 5 minutes. Signed with MEMBER_SECRET (falls back to OPS_SECRET). No database.
import crypto from 'crypto';

const secret = () => {
  const s = process.env.MEMBER_SECRET || process.env.OPS_SECRET;
  if (!s) throw new Error('MEMBER_SECRET is not set');
  return s;
};
const TTL = 12 * 60 * 60 * 1000; // 12 hours

export function signSession(data) {
  const body = Buffer.from(JSON.stringify({ ...data, kind: 'member', exp: Date.now() + TTL })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function readSession(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const good = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  let data;
  try { data = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
  return data.kind === 'member' && data.exp > Date.now() ? data : null;
}

// From a request's "Authorization: Bearer <session>" header
export function sessionFrom(req) {
  const h = req.headers.get('authorization') || '';
  return readSession(h.replace(/^Bearer\s+/i, ''));
}

// CORS for calls from the Circle community
const ALLOWED = ['https://ss.embodiedphilosophy.com', 'https://embodied-philosophy.circle.so'];
export function cors(req, methods = 'GET, POST, OPTIONS') {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}
