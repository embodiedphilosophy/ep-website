import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { coursesAvailable, myCourses } from '@/lib/member/courses';

export const dynamic = 'force-dynamic';
const methods = 'GET, OPTIONS';

// "Your courses" on Circle's Today page (public/circle/today.js): the course spaces this member has been given in Circle,
// newest first. GET → { courses: [{ id, title, url, image, group }], total }. Read only.
export async function GET(req) {
  const h = cors(req, methods), s = sessionFrom(req);
  if (!s?.email) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  if (!coursesAvailable()) return NextResponse.json({ courses: [], total: 0 }, { status: 503, headers: h });
  try {
    const list = await myCourses(s.email);
    return NextResponse.json({ courses: list, total: list.length }, { headers: h });
  } catch (e) { console.error('member courses', e.message); return NextResponse.json({ error: 'Couldn’t load your courses just now' }, { status: 502, headers: h }); }
}
export async function OPTIONS(req) { return new NextResponse(null, { status: 204, headers: cors(req, methods) }); }
