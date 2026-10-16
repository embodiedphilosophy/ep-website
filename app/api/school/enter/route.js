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
    // Quiet sign-in ahead of time (from any Circle page): set the cookie and stop, no season page to load
    const warm = /[?&]warm=1(&|$)/.test(next);
    // Not a redirect: browsers drop the cookie when the redirect comes straight from a cross-site form post.
    // A small page that moves on by itself makes the next step a normal visit to our own site.
    const html = `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${next}"><title>Opening your season</title><style>html,body{margin:0;height:100%;background:#F0E8D8}.s{position:fixed;left:50%;top:120px;width:26px;height:26px;margin-left:-13px;border:3px solid #D8C9AE;border-top-color:#20302A;border-radius:50%;animation:r .9s linear infinite}@keyframes r{to{transform:rotate(360deg)}}</style><div class="s" role="status" aria-label="Loading your season"></div><noscript><a href="${next}">Continue</a></noscript><script>location.replace(${JSON.stringify(next)})</script>`;
    const res = new NextResponse(warm ? '<!doctype html><meta charset="utf-8"><title>ok</title>' : html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    res.cookies.set(COOKIE, issue(who), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE });
    return res;
  } catch (e) {
    // Plain reasons from lib/member/identity.js ("Circle sign-in has expired"...), shown on the sign-in page
    const why = encodeURIComponent(String(e.message || 'Sign-in failed').slice(0, 120));
    return NextResponse.redirect(new URL(`/school/sign-in?next=${encodeURIComponent(next)}&why=${why}`, req.url), 303);
  }
}
