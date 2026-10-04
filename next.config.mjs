/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kalighat cutouts are served from the Practice Report app so both sites share one image set.
  async rewrites() {
    return [{ source: '/kalighat/:file', destination: 'https://report.embodiedphilosophy.com/img/:file' }];
  },
  // Old WordPress URLs get mapped here during the migration (step 6).
  async redirects() {
    return [];
  },
};
export default nextConfig;
