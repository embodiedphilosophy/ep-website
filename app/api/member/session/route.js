import { NextResponse } from 'next/server';
import { cors } from '@/lib/member/session';
import { startSession } from '@/lib/member/signin';

// Circle custom code → here with window.circleUser.identityToken. We verify it with Circle's public key,
// look up the member's tier from their Kit tags, and hand back a 12-hour session for /api/member/*, plus any
// upgrade or seasonal-credit offer for their Today page (lib/member/pricing.js). (The Today page now signs in through
// /api/member/today in one step; this stays for admin previews and the other Circle pages.)
// Admins can preview an offer: { preview: { tier, seasons, credit, day } }.
export async function POST(req) {
  const h = cors(req);
  try {
    const { identityToken, preview } = await req.json().catch(() => ({}));
    return NextResponse.json(await startSession({ identityToken, preview }), { headers: h });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Sign-in failed' }, { status: 401, headers: h });
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
