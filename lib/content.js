import { site as defaults } from './site';
import { readTab, published } from './sheet';
import teachersFallback from '@/data/teachers.json';
import testimonialsFallback from '@/data/testimonials.json';

// Sheet key → where it lands in the site config
const MAP = {
  wisdom_join: ['links', 'wisdomJoin'], wisdom_price: ['prices', 'wisdomYear'],
  meditation_monthly: ['links', 'meditationMonthly'], dropin_meditation: ['links', 'dropinMeditation'], meditation_yearly: ['links', 'meditationYearly'],
  sadhana_year: ['links', 'sadhanaYear'], sadhana_year_price: ['prices', 'sadhanaYear'],
  sadhana_semester: ['links', 'sadhanaSemester'], sadhana_semester_price: ['prices', 'sadhanaSemesterFrom'],
  sign_in: ['links', 'signIn'],
  dropin_price: ['prices', 'dropin'], meditation_monthly_price: ['prices', 'meditationMonthly'], meditation_yearly_price: ['prices', 'meditationYearly'],
  wisdom_monthly: ['links', 'wisdomMonthly'], wisdom_monthly_price: ['prices', 'wisdomMonthly'], catalog: ['links', 'wisdomCatalog'], quiz: ['links', 'quiz'],
  tarka: ['links', 'tarkaSubstack'], sadhana_theme: [null, 'sadhanaTheme'],
};

// The site config (links, prices, stats, theme), with any values from the sheet taking priority
export async function getSite() {
  const site = { ...defaults, links: { ...defaults.links }, prices: { ...defaults.prices } };
  const [links, stats] = await Promise.all([readTab('links'), readTab('stats')]);
  for (const row of links || []) {
    const target = MAP[row.key]; if (!target || !row.value) continue;
    const [group, key] = target;
    if (group) site[group][key] = row.value; else site[key] = row.value;
    if (row.key === 'tarka') site.links.tarkaPrint = row.value;
  }
  const s = (stats || []).filter(r => r.number && r.label)
    .sort((a, b) => Number(a.order || 99) - Number(b.order || 99))
    .map(r => ({ n: r.number, l: r.label }));
  if (s.length) site.stats = s;
  return site;
}

export async function getTeachers() {
  const rows = (await readTab('teachers')) || teachersFallback;
  return rows.filter(r => r.name && published(r)).sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
}

export async function getTestimonials(program = 'home') {
  const rows = (await readTab('testimonials')) || testimonialsFallback;
  return rows.filter(r => r.quote && published(r) && [program, 'all', ''].includes(String(r.program || '').toLowerCase()));
}
