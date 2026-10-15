/** @type {import('next').NextConfig} */

// When the old WordPress site is moved to its own subdomain (e.g. https://archive.embodiedphilosophy.com),
// set ARCHIVE_ORIGIN in Vercel. Any old URL the new site doesn't have (articles, author pages, etc.)
// is then served from the archive automatically, so no old link breaks.
const ARCHIVE = process.env.ARCHIVE_ORIGIN;

// The team dashboard and teacher onboarding now live in their own project (ep-ops). Once OPS_ORIGIN is set
// (https://ops.embodiedphilosophy.com), old /ops and /teach links, including sign-in links already in
// people's inboxes, forward there.
const OPS = process.env.OPS_ORIGIN?.replace(/\/$/, '');

const nextConfig = {
  // The certificate PDF reads its fonts from disk (lib/ce/pdf.js)
  outputFileTracingIncludes: { '/api/ce/certificate/[id]': ['./lib/ce/fonts/**'] },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        // Kalighat cutouts live in public/ (copied from the Practice Report app).
        { source: '/kalighat/:file', destination: '/:file' },
      ],
      fallback: ARCHIVE ? [{ source: '/:path*', destination: `${ARCHIVE}/:path*` }] : [],
    };
  },
  async redirects() {
    const r = (source, destination) => ({ source, destination, permanent: true });
    const ops = OPS ? ['/ops', '/ops/:path*', '/teach', '/teach/:path*', '/api/ops/verify']
      .map(p => ({ source: p, destination: `${OPS}${p}`, permanent: false })) : [];
    return [
      ...ops,
      // Podcast
      r('/chitheads', '/podcast'),
      r('/chitheads/:path*', '/podcast'),
      r('/type/audio', '/podcast'),
      r('/type/audio/:path*', '/podcast'),
      // Old podcast episode posts end in the episode number, e.g. /what-karma-actually-means-with-philip-goldberg-184/
      r('/:slug([a-z0-9%-]+-\\d{1,3})', '/podcast'),
      // Landing pages moved under /lp/
      r('/hamsa-sadhana', '/lp/hamsa-sadhana'),
      r('/tibetan-book-of-the-dead', '/lp/tibetan-book-of-the-dead'),
      r('/navaratri', '/lp/navaratri'),
      // Programs
      r('/wisdom-school-courses', '/wisdom-school'),
      r('/wisdom-school-courses/:path*', '/wisdom-school'),
      r('/certificate-programs', '/wisdom-school'),
      r('/certificate-programs/:path*', '/wisdom-school'),
      // Tarka issues now live on tarkajournal.com
      r('/journals', 'https://www.tarkajournal.com'),
      r('/journals/:path*', 'https://www.tarkajournal.com'),
      // Get involved
      r('/submissions', '/contribute'),
      r('/submissions/:path*', '/contribute'),
    ];
  },
};
export default nextConfig;
