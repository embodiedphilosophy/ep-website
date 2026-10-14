import { NextResponse } from 'next/server';
import { verifyCircleToken } from '@/lib/member/identity';
import { signSession, cors } from '@/lib/member/session';
import { tierFor } from '@/lib/member/tier';

// Circle custom code → here with window.circleUser.identityToken. We verify it with Circle's public key,
// look up the member's tier from their Kit tags, and hand back a 12-hour session for /api/member/*.
export async function POST(req) {
  const h = cors(req);
  try {
    const { identityToken } = await req.json().catch(() => ({}));
    const who = await verifyCircleToken(identityToken);
    const tier = await tierFor(who.email);
    const session = signSession({ uid: who.uid, email: who.email, tier: tier.tier, admin: !!who.isAdmin });
    return NextResponse.json({ session, firstName: who.firstName, tier, admin: !!who.isAdmin }, { headers: h });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Sign-in failed' }, { status: 401, headers: h });
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
