import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { freeToday } from '@/lib/member/today';

// The free layer of Today, the same for every signed-in member and for the practice app: practice summary, the
// teaching of the week and the day's question, the moon week and tithi, sacred days ahead, and (when five or
// more people sat today) how many. GET ?today=YYYY-MM-DD&tz=America/New_York[&lat=..&lon=..]. Needs the session
// from /api/member/session. lat/lon are optional, used for this answer only and never stored.
export async function GET(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  const q = new URL(req.url).searchParams;
  const data = await freeToday({ uid: s.uid, today: q.get('today'), tz: q.get('tz'), lat: q.get('lat'), lon: q.get('lon') });
  return NextResponse.json({ ...data, firstName: s.firstName || '' }, { headers: h });
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
