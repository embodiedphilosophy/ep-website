import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { memberToday } from '@/lib/member/today';
import { TIERS } from '@/lib/member/tier';

export const dynamic = 'force-dynamic';

// Everything on the Circle Today page (public/circle/today.js): the free layer (also at /api/practice/today) plus the
// member's enrolment cards, locked programmes and coming-up list. GET ?today=YYYY-MM-DD&tz=…[&lat=&lon=]
// Admins can preview a membership with &as=<tier>.
export async function GET(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  const q = new URL(req.url).searchParams;
  const as = q.get('as');
  const tier = s.admin && TIERS.includes(as) ? as : s.tier;
  const data = await memberToday({ uid: s.uid, email: s.email, tier, today: q.get('today'), tz: q.get('tz'), lat: q.get('lat'), lon: q.get('lon') });
  return NextResponse.json({ ...data, firstName: s.firstName || '' }, { headers: h });
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
