import CatalogBrowser from '@/components/CatalogBrowser';
import { getCatalog, ACCESS, PROGRAMMES, KINDS, FORMATS, DEPTHS, TOPICS, unlockLine } from '@/lib/catalog';

// Expires with the rest of the sheet reads, and on demand through POST /api/revalidate-courses.
export const revalidate = 300;
export const metadata = {
  title: 'Course Library — Embodied Philosophy',
  description: 'Every live practice, course, learning pathway and season at Embodied Philosophy, in one place.',
};

export default async function CoursesPage() {
  const items = (await getCatalog().catch(() => [])).map(o => ({ ...o, unlockLine: unlockLine(o) }));
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  return <CatalogBrowser items={items} today={today} meta={{ access: ACCESS, programmes: PROGRAMMES, kinds: KINDS, formats: FORMATS, depths: DEPTHS, topics: TOPICS }} />;
}
