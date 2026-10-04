import PageHero from '@/components/PageHero';
export const metadata = { title: 'Teachers — Embodied Philosophy' };
// TODO: review bios and add photos (public/img/teachers/<slug>.jpg)
const TEACHERS = [
  { name: 'Jacob Kyle', role: 'Founding Director', bio: 'Doctoral candidate at the University of Oxford researching Utpaladeva and Abhinavagupta. Teaches Sādhana School and the philosophy of recognition, rasa, and Tantric meditation, in the lineage of Paul Muller-Ortega.' },
  { name: 'Nataraj Chaitanya', role: 'Faculty, Wisdom School & Sādhana School', bio: 'Has led retreats, kīrtans and teacher trainings for more than twenty years. A formal initiate and custodian of the meditation tradition of Bhagavan Nityananda of Ganeshpuri; based in Melbourne.' },
  { name: 'Tova Olsson', role: 'Guest teacher', bio: 'Scholar-practitioner and co-teacher of Song of the Goddess, our Navarātri immersion in the Devī Gītā.' },
  { name: 'Mary Reilly Nichols', role: 'Guest teacher', bio: 'Yoga teacher and contemplative guide with decades of experience in the Bhagavad Gītā, Tantra and cross-traditional mysticism.' },
  { name: 'Athena Potari', role: 'Wisdom School faculty', bio: 'Philosopher and teacher of the Hellenic wisdom traditions, leading a Wisdom School learning pathway on Greek esoteric thought.' },
];
export default function Teachers() {
  return (
    <>
      <PageHero eyebrow="Faculty" title="Scholars who practice. Practitioners who study." img="lady-hair" ground="vermilion" ring="#F2E9D8"
        lede="Our teachers bring together rigorous scholarship and long personal practice, so the ideas arrive with both precision and depth." />
      <section className="sec"><div className="wrap">
        <div className="teacher-grid">
          {TEACHERS.map(t => (
            <article className="teacher" key={t.name}>
              <div className="mono-avatar" aria-hidden="true">{(([f, ...r]) => f[0] + (r.length ? r[r.length - 1][0] : ''))(t.name.split(' '))}</div>
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
