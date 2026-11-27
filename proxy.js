import { NextResponse } from 'next/server';

// Password gate for the teachers' supplement (public/samyama/). The password lives only in the
// SAMYAMA_PASSWORD environment variable (Vercel); if it isn't set the page stays locked.
// Runs before the static files, so the page, its assets and the PDF are all covered.
const COOKIE = 'samyama_auth';

async function token(password) {
  const bytes = new TextEncoder().encode(`samyama|${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function form({ error, locked } = {}) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Teachers' supplement · Embodied Philosophy</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#20302A;color:#FAF5EB;font-family:Inter,Arial,sans-serif}
.box{width:100%;max-width:380px;display:flex;flex-direction:column;gap:16px}h1{margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:34px;line-height:1.1}
p{margin:0;font-size:15px;line-height:1.5;color:#EADDC6}.e{color:#F0B8A4}input{min-height:48px;padding:0 14px;font:inherit;font-size:16px;border:1px solid #31453C;border-radius:2px;background:#FAF5EB;color:#1E1A14}
button{min-height:48px;border:0;border-radius:2px;background:#A5432A;color:#FAF5EB;font:inherit;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer}button:hover{background:#83341F}</style></head>
<body><form class="box" method="post" action="/samyama"><h1>Saṃyama in the Yoga Sūtra</h1>
<p>${locked ? 'This page is not open yet. Please try again soon.' : 'Teachers’ supplement for Meditation Resolution 2027. Please enter the password to continue.'}</p>
${error ? '<p class="e">That password didn’t match. Please try again.</p>' : ''}
${locked ? '' : '<input type="password" name="password" placeholder="Password" autocomplete="current-password" autofocus required><button type="submit">Open</button>'}
</form></body></html>`;
  return new NextResponse(html, {
    status: locked ? 503 : error ? 401 : 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

export async function proxy(request) {
  const secret = process.env.SAMYAMA_PASSWORD;
  if (!secret) return form({ locked: true });
  const want = await token(secret);
  const { pathname } = request.nextUrl;

  if (request.method === 'POST' && (pathname === '/samyama' || pathname === '/samyama/')) {
    const data = await request.formData().catch(() => null);
    const given = String(data?.get('password') ?? '');
    if (!same(await token(given), want)) return form({ error: true });
    const res = NextResponse.redirect(new URL('/samyama', request.url), 303);
    res.cookies.set(COOKIE, want, { httpOnly: true, secure: true, sameSite: 'lax', path: '/samyama', maxAge: 60 * 60 * 24 * 30 });
    return res;
  }

  const have = request.cookies.get(COOKIE)?.value || '';
  if (same(have, want)) {
    const res = NextResponse.next();
    res.headers.set('x-robots-tag', 'noindex');
    res.headers.set('cache-control', 'private, no-store');
    return res;
  }
  // Locked out: the page itself shows the form; assets and the PDF just say no.
  if (pathname === '/samyama' || pathname === '/samyama/' || pathname === '/samyama/index.html') return form();
  return new NextResponse('Password needed', { status: 401, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}

export const config = { matcher: ['/samyama', '/samyama/:path*'] };
