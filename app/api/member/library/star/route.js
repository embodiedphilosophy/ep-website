import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { starsAvailable, setStar } from '@/lib/library/store';

export const dynamic = 'force-dynamic';
const H = req => cors(req, 'POST, OPTIONS');

// Star or unstar an item: { id, on }
export async function POST(req) {
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again', code: 'signin' }, { status: 401, headers: H(req) });
  if (!starsAvailable()) return NextResponse.json({ error: 'Stars aren’t connected yet.' }, { status: 503, headers: H(req) });
  const b = await req.json().catch(() => ({}));
  try { await setStar(s.uid, b.id, !!b.on); return NextResponse.json({ ok: true }, { headers: H(req) }); }
  catch (e) { return NextResponse.json({ error: /Unknown/.test(e.message) ? e.message : 'We couldn’t save that just now.' }, { status: /Unknown/.test(e.message) ? 400 : 502, headers: H(req) }); }
}
export const OPTIONS = req => new NextResponse(null, { status: 204, headers: H(req) });
