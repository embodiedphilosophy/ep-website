// What the landing-page feed (/api/landing-pages) and the sitemap say about this page.
// checkoutKey: the Site Links & Prices row that overrides `checkout`. Dates are New York days.
const lp = {
  title: 'Christian Mysticism with Mary Reilly Nichols & Floss Harry',
  teacher: 'Mary Reilly Nichols, Floss Harry',
  startsAt: '2026-11-12',
  endsAt: '2026-12-10',
  checkoutKey: 'christianMysticismCheckout',
  // Circle paywall "Christian Mysticism with Mary Reilly Nichols & Floss Harry" (grants the course space). price_id picks the option.
  checkout: 'https://ss.embodiedphilosophy.com/checkout/christian-mysticism?price_id=390326', // $127 one-time
  planCheckoutKey: 'christianMysticismPlanCheckout',
  planCheckout: 'https://ss.embodiedphilosophy.com/checkout/christian-mysticism?price_id=390325', // $47 + 3 weekly $27
};
export default lp;
