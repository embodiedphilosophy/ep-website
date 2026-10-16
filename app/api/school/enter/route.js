import { NextResponse } from 'next/server';
import { verifyCircleToken } from '@/lib/member/identity';
import { COOKIE, MAX_AGE, issue, safeNext } from '@/lib/school/session';

// Circle's custom code posts window.circleUser.identityToken here as a form (see docs/school-seasons.md).
// We verify it against Circle's public keys, set our own cookie, and open the season page. A typed email is
// never enough: the headless token can act as anyone, so the identity must come from Circle itself.
export async function POST(req) {
  const form = await req.formData().catch(() => null);
  const next = safeNext(form?.get('next'));
  try {
    const who = await verifyCircleToken(form?.get('identityToken'));
    const res = NextResponse.redirect(new URL(next, req.url), 303);
    res.cookies.set(COOKIE, issue(who), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE });
    return res;
  } catch {
    return NextResponse.redirect(new URL(`/school/sign-in?next=${encodeURIComponent(next)}`, req.url), 303);
  }
}
