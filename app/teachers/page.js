import PageHero from '@/components/PageHero';
import { getTeachers } from '@/lib/content';
export const revalidate = 300;
export const metadata = { title: 'Teachers — Embodied Philosophy' };
export default async function Teachers() {
  const TEACHERS = await getTeachers();
  return (
    <>
      <PageHero eyebrow="Faculty" title="Scholars who practice. Practitioners who study." img="lady-hair" ground="vermilion" ring="#F2E9D8"
        lede="Our teachers bring together rigorous scholarship and long personal practice, so the ideas arrive with both precision and depth." />
      <section className="sec"><div className="wrap">
        <div className="teacher-grid">
          {TEACHERS.map(t => (
            <article className="teacher" key={t.name}>
              {t.photo_url ? <img className="teacher-photo" src={t.photo_url} alt={t.name} width="64" height="64" /> : <div className="mono-avatar" aria-hidden="true">{(([f, ...r]) => f[0] + (r.length ? r[r.length - 1][0] : ''))(t.name.split(' '))}</div>}
              <h3>{t.name}</h3>
              <div className="role">{t.role}</div>
              <p>{t.bio}</p>
            </article>
          ))}
        </div>
      </div></section>
    </>
  );
}
