/** @type {import('next').NextConfig} */
const nextConfig = {
  // Old WordPress URLs get mapped here during the migration (step 6).
  async redirects() {
    return [];
  },
};
export default nextConfig;
