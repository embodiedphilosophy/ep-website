import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash, timingSafeEqual } from 'node:crypto';

// "Way of the Waves" retreat page, behind a password. A standalone page (no site nav or footer): the page itself lives in
// lib/retreats/way-of-the-waves.html and its pictures in public/retreats/way-of-the-waves/.
// GET shows the page if the visitor's cookie says they've entered the password, otherwise the password form.
// POST checks the password. Only a fingerprint (SHA-256) of the password is kept here, not the password itself.
// To change it, set RETREAT_PASSWORD_HASH in Vercel to the SHA-256 of the new password in capitals.
// This is a light gate for sharing with a group, not account security; the pictures are plain files and aren't covered.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL_PATH = '/retreats/way-of-the-waves';
const PASSWORD_HASH = process.env.RETREAT_PASSWORD_HASH || '2712dc12a3982fc6b90a89d7dbd47b6425487abc1d6c3603f91ad5755732683a';
const sha = s => createHash('sha256').update(s).digest('hex');
const TOKEN = sha(`wotw-access:${PASSWORD_HASH}`);
const COOKIE = 'wotw_access';
const HEADERS = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };

const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const hasAccess = req => {
  const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]+)`));
  return !!m && same(m[1], TOKEN);
};

const gate = error => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="robots" content="noindex, nofollow">
<title>Way of the Waves · Surf, Yoga &amp; Meditation Retreat · Costa Rica 2027</title>
<meta name="description" content="Seven nights of surf, yoga and meditation at a beachfront villa in Santa Teresa, Costa Rica. Hosted by Jacob Kyle and Patricia Pinto, March 11–18, 2027.">
<link rel="icon" href="/icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Embodied Philosophy">
<meta property="og:title" content="Way of the Waves · Surf, Yoga &amp; Meditation Retreat · Costa Rica 2027">
<meta property="og:description" content="Seven nights of surf, yoga and meditation at a beachfront villa in Santa Teresa, Costa Rica. Hosted by Jacob Kyle and Patricia Pinto, March 11–18, 2027.">
<meta property="og:url" content="https://www.embodiedphilosophy.com${URL_PATH}">
<meta property="og:image" content="https://www.embodiedphilosophy.com${URL_PATH}/images/casa-capitan-13.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&amp;family=Inter:wght@400;500;600&amp;family=Montserrat:wght@300&amp;display=swap">
<style>
:root{color-scheme:light only;--sand:#FBF7F0;--ink:#1D2A2B;--ink-soft:#4E5B5A;--terra:#A5432A;--terra-deep:#83341F;--line:#D9CFBE;--sun:#E3A94F}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;background:var(--sand);color:var(--ink);font:400 16px/1.65 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.top{display:flex;align-items:center;justify-content:center;gap:14px;padding:22px 20px;border-bottom:1px solid var(--line)}
.top img{height:30px;width:auto;display:block}
.top .x{font:500 1.2rem "Cormorant Garamond",Georgia,serif;color:var(--ink-soft)}
.lsy{display:inline-flex;align-items:center;gap:9px}
.lsy span{font:300 1.2rem/1 Montserrat,Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#070707;white-space:nowrap}
main{flex:1;display:flex;align-items:center;justify-content:center;padding:48px 20px}
.box{width:100%;max-width:440px;text-align:center}
.eyebrow{font:600 .75rem/1.2 Inter,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:var(--terra);margin:0}
h1{font:600 clamp(2.6rem,9vw,3.6rem)/1.08 "Cormorant Garamond",Georgia,serif;margin:16px 0 0;text-wrap:balance}
h1 em{font-style:italic;font-weight:500;color:var(--terra)}
p.lede{color:var(--ink-soft);margin:18px 0 0}
form{margin-top:28px;display:flex;flex-direction:column;gap:12px}
input{font:400 1rem Inter,sans-serif;min-height:48px;padding:12px 16px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);text-align:center;letter-spacing:.08em;width:100%}
input:focus-visible,button:focus-visible{outline:3px solid var(--sun);outline-offset:3px}
button{font:600 .95rem/1 Inter,sans-serif;min-height:48px;padding:15px 24px;border:0;border-radius:999px;background:var(--terra);color:#fff;cursor:pointer;transition:background .2s}
button:hover{background:var(--terra-deep)}
.err{color:var(--terra-deep);font-size:.92rem;margin:14px 0 0}
@media (max-width:440px){.top{gap:9px;padding:18px 14px}.top img{height:24px}.lsy span{font-size:.7rem;letter-spacing:.03em}.lsy{gap:6px}.top .x{display:none}}
</style>
</head>
<body>
<header class="top">
  <img src="/brand/ep-wordmark-black.png" alt="Embodied Philosophy">
  <span class="x" aria-hidden="true">×</span>
  <span class="lsy"><img src="${URL_PATH}/lsy-mark-dark.png" alt=""><span>Love Surf Yoga</span></span>
</header>
<main>
  <div class="box">
    <p class="eyebrow">Santa Teresa, Costa Rica · March 11–18, 2027</p>
    <h1>Way of the <em>Waves</em></h1>
    <p class="lede">Please enter the password to view the retreat page.</p>
    <form method="post" action="${URL_PATH}">
      <label class="sr" for="pw" style="position:absolute;left:-9999px">Password</label>
      <input id="pw" name="password" type="password" autocomplete="current-password" autocapitalize="off" autofocus required placeholder="Password">
      <button type="submit">View the retreat</button>
    </form>
    ${error ? '<p class="err" role="alert">That password isn\'t right. Please try again.</p>' : ''}
  </div>
</main>
</body>
</html>`;

export async function GET(req) {
  if (!hasAccess(req)) return new Response(gate(false), { status: 200, headers: HEADERS });
  const html = await readFile(path.join(process.cwd(), 'lib/retreats/way-of-the-waves.html'), 'utf8');
  return new Response(html, { headers: HEADERS });
}

export async function POST(req) {
  let given = '';
  try { given = String((await req.formData()).get('password') || ''); } catch { /* no form data */ }
  if (!same(sha(given.trim().toUpperCase()), PASSWORD_HASH)) return new Response(gate(true), { status: 401, headers: HEADERS });
  return new Response(null, {
    status: 303,
    headers: { Location: URL_PATH, 'Cache-Control': 'private, no-store', 'Set-Cookie': `${COOKIE}=${TOKEN}; Path=${URL_PATH}; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax` },
  });
}
