// Search engines may index the live site only; Vercel preview addresses stay hidden.
export default function robots() {
  const live = process.env.VERCEL_ENV === 'production';
  return live
    ? { rules: { userAgent: '*', allow: '/', disallow: ['/ops', '/api'] }, sitemap: 'https://www.embodiedphilosophy.com/sitemap.xml' }
    : { rules: { userAgent: '*', disallow: '/' } };
}
