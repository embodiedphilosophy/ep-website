import crypto from 'crypto';
import { cookies } from 'next/headers';
import { loadTeam } from '../calendar';

// Signed tokens (no database). Vercel: OPS_SECRET
const secret = () => { if (!process.env.OPS_SECRET) throw new Error('OPS_SECRET is not set'); return process.env.OPS_SECRET; };
export const COOKIE = 'ep_ops';

export function sign(data, ttlSeconds) {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlSeconds * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function verify(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const good = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  const data = JSON.parse(Buffer.from(body, 'base64url').toString());
  return data.exp > Date.now() ? data : null;
}

// The signed-in team member, or null
export async function currentUser() {
  const c = (await cookies()).get(COOKIE);
  const data = verify(c?.value);
  if (!data?.email) return null;
  const team = await loadTeam();
  return team.find(t => t.email === data.email) || null;
}
