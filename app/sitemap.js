import { publishedCourseSlugs } from '@/lib/coursepages';
import landingPages from '@/lib/lp/pages';
const BASE = 'https://www.embodiedphilosophy.com';
export const revalidate = 3600;
export default async function sitemap() {
  const pages = ['', '/wisdom-school', '/sadhana-school', '/events', '/living-room-lectures', '/meditation-pass', '/continuing-education', '/podcast', '/about', '/teachers', '/contribute', '/contact'];
  const courses = (await publishedCourseSlugs().catch(() => [])).map(s => `/courses/${s}`);
  // Every landing page under /lp/ (the same list as /api/landing-pages)
  const lps = landingPages.map(p => `/lp/${p.slug}`);
  return [...pages, ...lps, ...courses].map(p => ({
    url: BASE + p,
    lastModified: new Date(),
    changeFrequency: ['', '/events', '/podcast'].includes(p) ? 'daily' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));
}
