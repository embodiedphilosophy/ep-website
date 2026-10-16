// The member's sign-in for the season pages: our own signed cookie (lib/member/session.js), issued by
// /api/school/enter after Circle's identity token has been verified. The cookie carries the email, nothing from Circle.
import { cookies } from 'next/headers';
import { readSession, signSession } from '@/lib/member/session';

export const COOKIE = 'ep_school';
export const MAX_AGE = 12 * 60 * 60;

export async function currentMember() {
  const jar = await cookies();
  const s = readSession(jar.get(COOKIE)?.value);
  return s?.email ? { email: s.email, admin: !!s.admin } : null;
}

// Why there is no member: no cookie reached us, or it could not be read (wrong secret, expired)
export async function missingReason() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ? 'your sign-in cookie arrived but could not be read' : 'no sign-in cookie reached the site';
}

// identity.js reports the admin flag as isAdmin
export const issue = ({ email, uid, isAdmin, admin, firstName }) => signSession({ email, uid, admin: !!(admin ?? isAdmin), firstName: String(firstName || '').slice(0, 60) });

// Where "open the season" links may point. Never an outside address.
export const safeNext = n => (/^\/school(\/[a-z0-9-]+){0,2}(\?[a-z0-9=&-]*)?$/i.test(String(n || '')) ? n : '/school/sadhana-school');

// State-changing calls must come from our own pages
export function sameOrigin(req) {
  const o = req.headers.get('origin');
  return !!o && new URL(o).host === req.headers.get('host');
}
