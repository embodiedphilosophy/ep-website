/** @type {import('next').NextConfig} */

// When the old WordPress site is moved to its own subdomain (e.g. https://archive.embodiedphilosophy.com),
// set ARCHIVE_ORIGIN in Vercel. Any old URL the new site doesn't have (articles, author pages, etc.)
// is then served from the archive automatically, so no old link breaks.
const ARCHIVE = process.env.ARCHIVE_ORIGIN;

const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        // Kalighat cutouts are shared with the Practice Report app.
        { source: '/kalighat/:file', destination: 'https://report.embodiedphilosophy.com/img/:file' },
      ],
      fallback: ARCHIVE ? [{ source: '/:path*', destination: `${ARCHIVE}/:path*` }] : [],
    };
  },
  async redirects() {
    const r = (source, destination) => ({ source, destination, permanent: true });
    return [
      // Podcast
      r('/chitheads', '/podcast'),
      r('/chitheads/:path*', '/podcast'),
      r('/type/audio', '/podcast'),
      r('/type/audio/:path*', '/podcast'),
      // Old podcast episode posts end in the episode number, e.g. /what-karma-actually-means-with-philip-goldberg-184/
      r('/:slug([a-z0-9%-]+-\\d{1,3})', '/podcast'),
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
