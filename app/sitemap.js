const BASE = 'https://www.embodiedphilosophy.com';
export default function sitemap() {
  const pages = ['', '/wisdom-school', '/sadhana-school', '/events', '/living-room-lectures', '/meditation-pass', '/podcast', '/about', '/teachers', '/contribute', '/contact'];
  return pages.map(p => ({
    url: BASE + p,
    lastModified: new Date(),
    changeFrequency: ['', '/events', '/podcast'].includes(p) ? 'daily' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));
}
