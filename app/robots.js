// Search engines may index the live site only; Vercel preview addresses stay hidden.
export default function robots() {
  const live = process.env.VERCEL_ENV === 'production';
  return live
    ? { rules: { userAgent: '*', allow: '/' }, sitemap: 'https://www.embodiedphilosophy.com/sitemap.xml' }
    : { rules: { userAgent: '*', disallow: '/' } };
}
