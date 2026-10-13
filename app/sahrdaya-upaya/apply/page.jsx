import '../sahrdaya-upaya.css';
import ApplyForm from './ApplyForm';

export const metadata = {
  title: 'Apply · Sahṛdaya Upāya | Embodied Philosophy',
  description:
    'Apply for Sahṛdaya Upāya, the 100-hour teacher formation in Subtle Liberation-Based Teaching and Sahṛdaya Meditation.',
};

export default function ApplyPage() {
  return (
    <div className="su-page">
      <section className="hero page-hero su-apply-hero">
        <div className="wrap">
          <a className="su-back" href="/sahrdaya-upaya">← Sahṛdaya Upāya</a>
          <span className="eyebrow">Application · 2026–27</span>
          <h1>Apply for Sahṛdaya <em>Upāya</em></h1>
          <p className="sub">A 100-hour formation in Sahṛdaya Meditation and Subtle Liberation-Based Teaching (SLBT), for facilitators, yoga and meditation teachers, therapists and scholar-practitioners.</p>
          <p className="upnext"><b>Applications close:</b> Fri, Oct 16 · <b>About 20 minutes</b> · Cohort capped at twelve</p>
        </div>
      </section>

      <section className="sec su-apply-sec">
        <div className="wrap su-apply-grid">
          <aside className="su-apply-aside">
            <h2>What is SLBT?</h2>
            <p>SLBT trains existing and future teachers to be ambassadors of the subtle rather than the superficial: a rigorous, relational and revelatory pedagogy rooted in deep practice, textual study and philosophical integrity.</p>
            <p>Where Sahṛdaya Meditation names <em>what</em> is transmitted, SLBT names <em>how</em>.</p>
            <ol className="su-apply-steps">
              <li><b>Apply</b> with this form.</li>
              <li><b>Enroll</b> in Sādhana School and the apprenticeship together ($1,797 + $1,300).</li>
              <li><b>Hear back</b> from Jacob. If you&apos;re not accepted, you receive a full refund.</li>
            </ol>
          </aside>
          <ApplyForm />
        </div>
      </section>
    </div>
  );
}
