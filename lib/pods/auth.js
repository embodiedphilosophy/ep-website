// The signed-in student for the pods API: our own cookie (issued after a verified Circle sign-in), then Kit for the tier.
import { cookies } from 'next/headers';
import { readSession } from '../member/session';
import { COOKIE } from '../school/session';
import { tierFor } from '../member/tier';
import { eligible } from './logic';

// → { me: { uid, email, name, admin } } or { error: 'signin' | 'tier' }
export async function podMember() {
  const s = readSession((await cookies()).get(COOKIE)?.value);
  if (!s?.email || !s.uid) return { error: 'signin' };
  const t = s.admin ? null : await tierFor(s.email).catch(() => null);
  if (!eligible(t?.tier, !!s.admin)) return { error: 'tier' };
  const name = String(s.firstName || '').trim() || String(s.email).split('@')[0];
  return { me: { uid: s.uid, email: s.email, name, admin: !!s.admin } };
}
