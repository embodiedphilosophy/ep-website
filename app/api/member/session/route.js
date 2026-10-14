import { NextResponse } from 'next/server';
import { verifyCircleToken } from '@/lib/member/identity';
import { signSession, cors } from '@/lib/member/session';
import { tierFor } from '@/lib/member/tier';
import { memberOffer } from '@/lib/member/pricing';
import { nyToday, CREDIT_OFFERS } from '@/lib/member/credits';

// Circle custom code → here with window.circleUser.identityToken. We verify it with Circle's public key,
// look up the member's tier from their Kit tags, and hand back a 12-hour session for /api/member/*, plus any
// upgrade or seasonal-credit offer for their Today strip (lib/member/pricing.js).
// Admins can preview an offer: { preview: { tier, seasons, credit, day } }.
export async function POST(req) {
  const h = cors(req);
  try {
    const { identityToken, preview } = await req.json().catch(() => ({}));
    const who = await verifyCircleToken(identityToken);
    const tier = await tierFor(who.email);
    const session = signSession({ uid: who.uid, email: who.email, tier: tier.tier, admin: !!who.isAdmin });
    let offer = memberOffer(tier, nyToday());
    if (preview && who.isAdmin) {
      const o = CREDIT_OFFERS[0];
      const credits = Number(preview.credit) > 0 ? { [o.key]: { name: o.name, amount: Number(preview.credit), until: o.until } } : {};
      offer = memberOffer({ tier: preview.tier || 'none', seasons: [].concat(preview.seasons || []), credits }, /^\d{4}-\d\d-\d\d$/.test(preview.day || '') ? preview.day : nyToday());
    }
    return NextResponse.json({ session, firstName: who.firstName, tier, offer, admin: !!who.isAdmin }, { headers: h });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Sign-in failed' }, { status: 401, headers: h });
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
