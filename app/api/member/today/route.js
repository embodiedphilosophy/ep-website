import { NextResponse } from 'next/server';
import { sessionFrom, readSession, cors } from '@/lib/member/session';
import { startSession } from '@/lib/member/signin';
import { memberToday } from '@/lib/member/today';
import { TIERS } from '@/lib/member/tier';

export const dynamic = 'force-dynamic';

// Everything on the Circle Today page (public/circle/today.js): the free layer (also at /api/practice/today) plus the
// member's enrolment cards, locked programmes and coming-up list. GET ?today=YYYY-MM-DD
// Signs in with the usual Bearer session, or, on a first visit, with Circle's identity token in X-Circle-Identity: the
// answer then carries a `signin` block (session, tier, offer) so the page needs one round trip, not two.
// Admins can preview a membership with &as=<tier>. The Server-Timing header says where the time went.
export async function GET(req) {
  const h = cors(req);
  const t0 = Date.now(), marks = [];
  const mark = name => marks.push(`${name};dur=${Date.now() - t0}`);
  let s = sessionFrom(req), signin = null;
  if (!s) {
    const tok = req.headers.get('x-circle-identity');
    if (tok) {
      try { signin = await startSession({ identityToken: tok }); s = readSession(signin.session); }
      catch (e) { return NextResponse.json({ error: e.message || 'Sign-in failed' }, { status: 401, headers: h }); }
      mark('signin');
    }
  }
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  const q = new URL(req.url).searchParams;
  const as = q.get('as');
  const tier = s.admin && TIERS.includes(as) ? as : s.tier;
  const data = await memberToday({ uid: s.uid, email: s.email, tier, today: q.get('today') });
  mark('today');
  return NextResponse.json({ ...data, firstName: s.firstName || '', ...(signin ? { signin } : {}) }, { headers: { ...h, 'Server-Timing': marks.join(', '), 'Access-Control-Expose-Headers': 'Server-Timing' } });
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
