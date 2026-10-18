import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { freeToday } from '@/lib/member/today';

// The free layer of Today, the same for every signed-in member and for the practice app: practice summary, the
// teaching of the week and the day's question, sacred days ahead, and (when five or more people sat today) how many.
// GET ?today=YYYY-MM-DD. Needs the session from /api/member/session. The pañcāṅga (moon, tithi and the five limbs)
// depends on where the viewer is: the app asks /api/panchanga?lat=&lon=&tz= for it.
export async function GET(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  const q = new URL(req.url).searchParams;
  const data = await freeToday({ uid: s.uid, today: q.get('today') });
  return NextResponse.json({ ...data, firstName: s.firstName || '' }, { headers: h });
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
