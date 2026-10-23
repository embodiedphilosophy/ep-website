import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { verifyCircleToken } from '@/lib/member/identity';
import { currentMember } from '@/lib/school/session';
import { loadMeditationHub } from '@/lib/hub/meditation-load';

export const dynamic = 'force-dynamic';

// Everything the Meditation Pass hub (/school/meditation-pass) and the Meditation Pass card on Today need, in one call:
//   { plan: 'pass' | 'dropin' | 'none', next, latestReplay, nextFour[4], upcoming[], sections[], streams[5], ... }
// The member is whoever signed in: the Bearer session Today uses, Circle's identity token (X-Circle-Identity), or the hub's own
// cookie. Reads Circle as that member and nothing else; sends nothing and changes nothing. Admins can preview a plan with ?as=pass|dropin|none.
export async function GET(req) {
  const h = cors(req);
  let who = null;
  try {
    const s = sessionFrom(req);
    if (s) who = { email: s.email, admin: !!s.admin, uid: s.uid };
    else if (req.headers.get('x-circle-identity')) { const w = await verifyCircleToken(req.headers.get('x-circle-identity')); who = { email: w.email, admin: w.isAdmin, uid: w.uid }; }
    else who = await currentMember();
  } catch (e) { return NextResponse.json({ error: e.message || 'Please sign in again' }, { status: 401, headers: h }); }
  if (!who) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  try {
    const data = await loadMeditationHub({ email: who.email, admin: who.admin, uid: who.uid || '', as: new URL(req.url).searchParams.get('as') || '' });
    return NextResponse.json(data, { headers: h });
  } catch (e) {
    console.error('Meditation hub failed', e.message);
    return NextResponse.json({ error: e.status === 503 ? 'The hub is being set up' : e.status === 429 ? 'Circle is busy. Please try again in a minute.' : 'We could not load the hub just now' }, { status: e.status === 503 || e.status === 429 ? e.status : 502, headers: h });
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
