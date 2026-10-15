import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { tierFor } from '@/lib/member/tier';
import { canTrack } from '@/lib/ce/rules';
import { memberSummary, reflect, ceReady } from '@/lib/ce/service';
import { setRenewal } from '@/lib/ce/store';
import { cleanToday } from '@/lib/member/practice';

export const dynamic = 'force-dynamic';

// The member's CE tracker (public/circle/ce.js). Needs the session from /api/member/session.
// GET ?today=YYYY-MM-DD → summary. POST { action: 'reflect', slug, r1, r2, name, yaId, attest } → certificate
// POST { action: 'renewal', renewal: 'YYYY-MM-DD' | '' } → summary
export async function GET(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  if (!ceReady()) return NextResponse.json({ error: 'CE tracking isn’t connected yet' }, { status: 503, headers: h });
  const tier = await tierFor(s.email);
  if (!canTrack(tier) && !s.admin) return NextResponse.json({ error: 'CE hours come with Wisdom School Plus', upgrade: true }, { status: 403, headers: h });
  try {
    const today = cleanToday(new URL(req.url).searchParams.get('today'));
    return NextResponse.json(await memberSummary(s.email, s.admin && !canTrack(tier) ? { wisdomPlus: true } : tier, today), { headers: h });
  } catch (e) {
    console.error('CE summary failed', e.message);
    return NextResponse.json({ error: 'Couldn’t load your CE hours just now' }, { status: 502, headers: h });
  }
}

export async function POST(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  if (!ceReady()) return NextResponse.json({ error: 'CE tracking isn’t connected yet' }, { status: 503, headers: h });
  const b = await req.json().catch(() => ({}));
  const tier = await tierFor(s.email);
  try {
    if (b.action === 'renewal') {
      const r = String(b.renewal || '');
      if (r && !/^\d{4}-\d{2}-\d{2}$/.test(r)) return NextResponse.json({ error: 'Please pick a date' }, { status: 400, headers: h });
      await setRenewal(s.email, r || null);
      return NextResponse.json(await memberSummary(s.email, tier, cleanToday(b.today)), { headers: h });
    }
    if (b.action === 'reflect') {
      const cert = await reflect({ email: s.email, uid: s.uid, tier, slug: b.slug, r1: b.r1, r2: b.r2, name: b.name, yaId: b.yaId, attest: !!b.attest });
      const summary = await memberSummary(s.email, tier, cleanToday(b.today));
      return NextResponse.json({ cert: { id: cert.id, status: cert.status, emailed: cert.emailed }, summary }, { headers: h });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: h });
  } catch (e) {
    return NextResponse.json({ error: e.status ? e.message : 'Something went wrong. Please try again.' }, { status: e.status || 500, headers: h });
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
