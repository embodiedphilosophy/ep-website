// Circle sign-in → our own member session. Shared by /api/member/session and by /api/member/today (which can sign the
// student in itself, so the Today page needs one round trip, not two).
import { verifyCircleToken } from './identity';
import { signSession } from './session';
import { tierFor } from './tier';
import { memberOffer } from './pricing';
import { nyToday, CREDIT_OFFERS } from './credits';

// Verifies Circle's identity token, looks the member's tier up from their Kit tags and issues a 12-hour session, plus any
// upgrade or seasonal-credit offer. Admins can preview an offer: preview = { tier, seasons, credit, day }. Throws a plain message on failure.
export async function startSession({ identityToken, preview } = {}) {
  const who = await verifyCircleToken(identityToken);
  const tier = await tierFor(who.email);
  const session = signSession({ uid: who.uid, email: who.email, tier: tier.tier, admin: !!who.isAdmin, firstName: String(who.firstName || '').slice(0, 60) });
  let offer = memberOffer(tier, nyToday());
  if (preview && who.isAdmin) {
    const o = CREDIT_OFFERS[0];
    const credits = Number(preview.credit) > 0 ? { [o.key]: { name: o.name, amount: Number(preview.credit), until: o.until } } : {};
    offer = memberOffer({ tier: preview.tier || 'none', seasons: [].concat(preview.seasons || []), credits }, /^\d{4}-\d\d-\d\d$/.test(preview.day || '') ? preview.day : nyToday());
  }
  return { session, firstName: who.firstName, tier, offer, admin: !!who.isAdmin };
}
