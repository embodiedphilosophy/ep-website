// What the landing-page feed (/api/landing-pages) and the sitemap say about this page.
// checkoutKey: the Site Links & Prices row that overrides `checkout`. Dates are New York days.
const lp = {
  title: 'Christian Mysticism with Mary Reilly Nichols & Floss Harry',
  teacher: 'Mary Reilly Nichols, Floss Harry',
  startsAt: '2026-11-12',
  endsAt: '2026-12-10',
  checkoutKey: 'christianMysticismCheckout',
  // Placeholder until the checkout exists: add a christianMysticismCheckout row to Site Links & Prices.
  checkout: 'https://embodied-philosophy-2.kit.com/products/christian-mysticism',
  // Payment plan ($47 down + 3 weekly $27): placeholder until it exists; add a christianMysticismPlanCheckout row.
  planCheckoutKey: 'christianMysticismPlanCheckout',
  planCheckout: 'https://embodied-philosophy-2.kit.com/products/christian-mysticism-payment-plan',
};
export default lp;
