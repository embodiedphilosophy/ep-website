// What the landing-page feed (/api/landing-pages) and the sitemap say about this page.
// checkoutKey: the Site Links & Prices row that overrides `checkout` (sheet key: beneath_the_pose_checkout).
// The price shown comes from the sheet key beneath_the_pose_price, falling back to `price` below.
// Dates are New York days.
const lp = {
  title: 'Beneath the Pose: An Open Session',
  teacher: 'Jacob Kyle',
  startsAt: '2026-11-14',
  endsAt: '2026-11-14',
  checkoutKey: 'beneathThePoseCheckout',
  checkout: 'https://ss.embodiedphilosophy.com/checkout/beneath-the-pose', // Circle paywall ($79); the sheet key beneath_the_pose_checkout overrides it
  price: '$79',
};
export default lp;
