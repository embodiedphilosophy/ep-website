import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { loadLibrary } from '@/lib/library/load';
import { starsAvailable, starsOf } from '@/lib/library/store';

export const dynamic = 'force-dynamic';
const H = req => cors(req, 'GET, OPTIONS');

// The Library for the signed-in member: only what their membership opens, plus their own stars.
export async function GET(req) {
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again', code: 'signin' }, { status: 401, headers: H(req) });
  const stars = starsAvailable() ? await starsOf(s.uid).catch(e => { console.error('library stars', e.message); return new Set(); }) : new Set();
  return NextResponse.json(await loadLibrary(s, stars), { headers: H(req) });
}
export const OPTIONS = req => new NextResponse(null, { status: 204, headers: H(req) });
