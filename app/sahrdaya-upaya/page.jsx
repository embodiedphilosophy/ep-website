import './sahrdaya-upaya.css';

export const metadata = {
  title: 'Sahṛdaya Upāya | Embodied Philosophy',
  description:
    'A 100-hour apprenticeship in Sahṛdaya Meditation and Subtle Liberation-Based Teaching, held alongside the Sādhana School 2026–27 year.',
};

// TODO: replace href="#" on the "Enroll for the year" button with the Circle checkout link.

export default function SahrdayaUpayaPage() {
  return (
    <div className="su-page">
      {/* HERO */}
      <section className="hero page-hero">
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow">Sādhana School · Teacher Formation · 2026–27</span>
            <h1>Sahṛdaya <em>Upāya</em></h1>
            <p className="sub">A 100-hour apprenticeship in Sahṛdaya Meditation and Subtle Liberation-Based Teaching, held alongside the Sādhana School year. For teachers, facilitators, therapists and scholar-practitioners who want to teach from the ground of their own practice.</p>
            <p className="upnext"><b>Applications close:</b> Fri, Oct 16 · <b>The year begins:</b> Wed, Oct 21</p>
            <div className="btns">
              <a className="btn btn-primary" href="#enroll">Enroll in Sādhana School to apply</a>
              <a className="btn btn-ghost" href="#immersions">See the eight immersions</a>
            </div>
          </div>
          <div className="hero-aside">
            <div className="collage grain-vermilion hero-collage">
              <img className="cut" src="/kalighat/woman-music.webp" alt="Kalighat painting of a woman playing a stringed instrument" />
            </div>
          </div>
        </div>
      </section>

      {/* FACT STRIP (new) */}
      <section className="su-facts" aria-label="Program at a glance">
        <div className="wrap">
          <div className="su-fact"><div className="n">200</div><div className="l">hours in all: 100 in Sādhana School, 100 in the apprenticeship</div></div>
          <div className="su-fact"><div className="n">8</div><div className="l">weekend immersions, November to May</div></div>
          <div className="su-fact"><div className="n">9</div><div className="l">monthly one-on-one mentorship sessions with Jacob</div></div>
          <div className="su-fact"><div className="n">1</div><div className="l">certificate in SLBT and Sahṛdaya Meditation</div></div>
        </div>
      </section>

      {/* PREMISE */}
      <section className="sec">
        <div className="wrap feature">
          <div className="art collage grain-slate">
            <img className="cut" src="/kalighat/mirror.webp" alt="Kalighat painting of a woman holding a mirror" />
          </div>
          <div>
            <span className="eyebrow">Subtle Liberation-Based Teaching</span>
            <h2>Nothing is acquired. Consciousness is already full.</h2>
            <p className="theme">A theory of education drawn from the Non-Dual Śākta-Śaiva tradition</p>
            <div className="prose" style={{ marginTop: '22px' }}>
              <p>In a yoga marketplace saturated with fitness, SLBT starts from a different premise. A teaching is liberatory when it removes what obscures the knowledge that was always there, not when it installs new information.</p>
              <p>SLBT is both a theory of education and the pedagogical model behind Sādhana School. It treats our inherited model of education as one object of study among several, and it trains teachers to transmit from experiential knowledge earned through sustained sādhana, rather than to perform scripts or repeat doctrine.</p>
            </div>
          </div>
        </div>
      </section>

      {/* THREE LIMBS OF KRIYĀ-YOGA */}
      <section className="sec path">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">The pedagogy</span>
            <h2>Rigorous, relational, revelatory</h2>
            <p>The training is rooted in the liberative aims of kriyā-yoga. Each of its three limbs shapes how an apprentice studies, practices and teaches.</p>
          </div>
          <div className="path-grid">
            <div className="tier">
              <span className="step">Tapas</span>
              <h3>Deep practice</h3>
              <p className="su-skt">the heat of daily sādhana</p>
              <p style={{ marginTop: '12px' }}>A personal Sahṛdaya practice every day, sustained across the year. The pedagogy can&apos;t be transmitted by anyone who isn&apos;t practicing.</p>
            </div>
            <div className="tier">
              <span className="step">Svādhyāya</span>
              <h3>Textual study</h3>
              <p className="su-skt">reading the sources closely</p>
              <p style={{ marginTop: '12px' }}>Root texts of the Pratyabhijñā and Śākta traditions, read alongside historical scholarship and articulated in group sessions.</p>
            </div>
            <div className="tier">
              <span className="step">Īśvara-praṇidhāna</span>
              <h3>Inquiry into reality</h3>
              <p className="su-skt">turning toward what is</p>
              <p style={{ marginTop: '12px' }}>Philosophical reflection on what teaching is for, who is teaching, and what a student is being formed into.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY NOW */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Why now</span>
            <h2>Yoga teaching has outgrown the model it inherited</h2>
          </div>
          <div className="prose">
            <p>The drop-in class as the basic unit. The 60-minute fitness session as the product. The student as a customer whose commitment is entirely optional. That model offers real stress relief, but it asks nothing of us with regard to yoga&apos;s deeper framework, and what asks nothing of us cannot change us.</p>
            <p>Meanwhile, the origin myths that carried yoga through the 2000s have expired. Many teachers who took the new historical scholarship seriously have quietly lost confidence in what they are teaching.</p>
          </div>
          <div className="su-three">
            <div><b>Some will stick to the script.</b><span>Same class, same cues, less conviction.</span></div>
            <div><b>Some will leave the profession.</b><span>The ground gave way and nothing replaced it.</span></div>
            <div className="group3"><b>Others will refine, integrate and expand.</b><span>Sahṛdaya Upāya is for this third group.</span></div>
          </div>
        </div>
      </section>

      {/* STATEMENT */}
      <section className="sec su-statement">
        <div className="wrap">
          <span className="eyebrow light">The premise of the program</span>
          <blockquote>If the crisis of education comes from focusing on <em>information</em> rather than being <em>in-formation</em>, any serious response has to begin with how a student is actually formed.</blockquote>
        </div>
      </section>

      {/* HOW A WEEKEND WORKS (new layout) */}
      <section className="sec path">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">How each immersion works</span>
            <h2>One weekend a month, in two halves</h2>
            <p>Each immersion opens with a workshop for every Sādhana School student. Apprentices stay for a second session where the teaching is practiced and rehearsed.</p>
          </div>
          <div className="su-weekend">
            <article className="su-day">
              <div className="when"><span className="day">Saturday · 10am ET</span><span className="hrs">2.5<small>hours</small></span></div>
              <h3>The Open Session</h3>
              <p>A complete, standalone workshop on one pedagogical theme. You don&apos;t need to teach, or intend to, for it to change how you practice.</p>
              <div className="who">Open to all year-long Sādhana School students</div>
            </article>
            <article className="su-day mentee">
              <div className="when"><span className="day">Sunday · 10am ET</span><span className="hrs">2<small>hours</small></span></div>
              <h3 style={{ color: 'var(--ivory)' }}>The Practicum</h3>
              <p>Saturday&apos;s teachings become exercises. You rehearse, embody and translate concepts into teaching skill, with supervision and feedback from Jacob and the cohort.</p>
              <div className="who" style={{ color: 'var(--ochre)' }}>Sahṛdaya Upāya apprentices only</div>
            </article>
          </div>
        </div>
      </section>

      {/* EIGHT IMMERSIONS */}
      <section className="sec" id="immersions">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">The curriculum</span>
            <h2>The eight immersions</h2>
            <p>Each weekend takes one theme from the craft of teaching in a living tradition, and trains one of the competencies SLBT asks of a teacher.</p>
          </div>
          <div className="su-terms"><span><b>Fall</b> Nov–Dec</span><span><b>Winter</b> Feb–Mar</span><span><b>Spring</b> Apr–May</span></div>
          <div className="su-imm">
            <div className="evt"><div className="date-chip"><div className="m">Nov</div><div className="d">14–15</div></div><div><div className="ttl">Beneath the Pose</div><div className="host">Guiding movement practitioners into the subtle</div><div className="meta"><span className="pill focus">Subtle attunement &amp; energetic literacy</span></div></div><div className="num">i</div></div>
            <div className="evt"><div className="date-chip"><div className="m">Dec</div><div className="d">5–6</div></div><div><div className="ttl">Tasting the Real</div><div className="host">Rasa theory as a contemplative method</div><div className="meta"><span className="pill focus">Philosophical grounding &amp; transmission</span></div></div><div className="num">ii</div></div>
            <div className="evt"><div className="date-chip"><div className="m">Feb</div><div className="d">6–7</div></div><div><div className="ttl">Two Tongues</div><div className="host">Teaching the subtle in secular rooms</div><div className="meta"><span className="pill focus">Ethical speech &amp; cultural responsibility</span></div></div><div className="num">iii</div></div>
            <div className="evt"><div className="date-chip"><div className="m">Feb</div><div className="d">20–21</div></div><div><div className="ttl">Shadow Speech</div><div className="host">The ethics and philosophy of ferocity, discomfort and discernment</div><div className="meta"><span className="pill focus">Relational pedagogy &amp; language ethics</span></div></div><div className="num">iv</div></div>
            <div className="evt"><div className="date-chip"><div className="m">Mar</div><div className="d">13–14</div></div><div><div className="ttl">Dying Before Death</div><div className="host">Embracing dissolution on the path of sādhana</div><div className="meta"><span className="pill focus">Embodied observation &amp; holding intensity</span></div></div><div className="num">v</div></div>
            <div className="evt"><div className="date-chip"><div className="m">Apr</div><div className="d">10–11</div></div><div><div className="ttl">Grace &amp; Initiation</div><div className="host">Śaktipāta, dīkṣā and the timing of transmission</div><div className="meta"><span className="pill focus">Thresholds, rituals &amp; curriculum design</span></div></div><div className="num">vi</div></div>
            <div className="evt"><div className="date-chip"><div className="m">May</div><div className="d">8–9</div></div><div><div className="ttl">Cult or Community?</div><div className="host">Authority, consent and dependency in spiritual groups</div><div className="meta"><span className="pill focus">Institutional structures, consent &amp; community dynamics</span></div></div><div className="num">vii</div></div>
            <div className="evt"><div className="date-chip"><div className="m">May</div><div className="d">29–30</div></div><div><div className="ttl">The Spectre of Authenticity</div><div className="host">On inheriting a tradition you were not born into</div><div className="meta"><span className="pill focus">Lineage-informed creativity &amp; teaching integrity</span></div></div><div className="num">viii</div></div>
          </div>
        </div>
      </section>

      {/* WHAT YOU RECEIVE */}
      <section className="sec path">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Benefits of the mentorship</span>
            <h2>What apprentices receive</h2>
          </div>
          <div className="path-grid su-four" id="benefits">
            <div className="tier"><span className="step">Weekend immersions</span><h3>Eight practicums</h3><p>A supervised cohort practicum after every Open Session, across the year.</p></div>
            <div className="tier"><span className="step">One-on-one</span><h3>Mentorship</h3><p>Monthly 45-minute check-ins with Jacob for mentorship and articulation support, over nine months.</p></div>
            <div className="tier"><span className="step">On completion</span><h3>Certificate</h3><p>A 100-hour certificate in SLBT and Sahṛdaya Meditation.</p></div>
            <div className="tier"><span className="step">Resources</span><h3>75% off</h3><p>Any Tarka Journal issue, translation or printed teaching resource from Embodied Philosophy Press.</p></div>
          </div>
        </div>
      </section>

      {/* COMMITMENTS */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">A year of formation</span>
            <h2>What the year asks of you</h2>
            <p>To complete the program, apprentices carry these six commitments across the year.</p>
          </div>
          <div className="su-commit">
            <div><span className="k">Every day</span><h3>Daily practice</h3><p>A personal Sahṛdaya sādhana, sustained across the year.</p></div>
            <div><span className="k">Ongoing</span><h3>Study</h3><p>Assigned readings, integrated and articulated in group sessions.</p></div>
            <div><span className="k">Monthly</span><h3>Reflection</h3><p>A written post on what is ripening in your practice and your teaching.</p></div>
            <div><span className="k">Between immersions</span><h3>Peer practicum</h3><p>Partnered and small-group languaging practice.</p></div>
            <div><span className="k">Summer 2027</span><h3>Retreat practicum</h3><p>Teach workshops at the Sādhana School summer retreat, in person or online.</p></div>
            <div><span className="k">Spring 2027</span><h3>Final project</h3><p>A 60-minute teaching, delivered live and recorded, plus a reflective essay on lineage, positionality and your application of SLBT.</p></div>
          </div>
        </div>
      </section>

      {/* WEEKLY RHYTHM (new) */}
      <section className="sec path">
        <div className="wrap su-rhythm">
          <div>
            <span className="eyebrow">Time commitment</span>
            <h2 style={{ fontSize: '44px', marginTop: '14px' }}>About 2–3 hours a week, on top of Sādhana School</h2>
            <div className="prose" style={{ marginTop: '18px' }}>
              <p>Immersion weekends carry the most. Between them, the time goes to peer practice, study, your monthly reflection and your one-on-one with Jacob. Expect more in the spring, as you prepare your final teaching project.</p>
            </div>
          </div>
          <div className="su-bars" aria-label="Typical hours in a month">
            <div className="su-legend"><span><i style={{ background: 'var(--pine)' }}></i>Sādhana School</span><span><i style={{ background: 'var(--terra)' }}></i>Sahṛdaya Upāya</span></div>
            <div className="su-bar ss"><div className="row"><b>Weekly live session (Wednesdays, 9am ET)</b><span>2.5 h / week</span></div><div className="track"><div className="fill" style={{ width: '100%' }}></div></div></div>
            <div className="su-bar ss"><div className="row"><b>Daily Sahṛdaya practice, two sits</b><span>20–40 min / day</span></div><div className="track"><div className="fill" style={{ width: '93%' }}></div></div></div>
            <div className="su-bar"><div className="row"><b>Open Session + Practicum</b><span>4.5 h / month</span></div><div className="track"><div className="fill" style={{ width: '45%' }}></div></div></div>
            <div className="su-bar"><div className="row"><b>Peer practice, study, reflection</b><span>≈ 4–6 h / month</span></div><div className="track"><div className="fill" style={{ width: '50%' }}></div></div></div>
            <div className="su-bar"><div className="row"><b>One-on-one with Jacob</b><span>45 min / month</span></div><div className="track"><div className="fill" style={{ width: '8%' }}></div></div></div>
          </div>
        </div>
      </section>

      {/* TEACHER */}
      <section className="sec">
        <div className="wrap su-founder">
          <div className="portrait"><img src="https://nustrh8agxtgmkrb.public.blob.vercel-storage.com/teachers/jacob-kyle.jpg" alt="Jacob Kyle" /></div>
          <div>
            <span className="eyebrow">Teacher &amp; mentor</span>
            <h2>Jacob Kyle</h2>
            <div className="role">Founding Director, Embodied Philosophy</div>
            <div className="prose" style={{ marginTop: '18px' }}>
              <p>Jacob is a meditation teacher, writer, philosophy educator and publisher. His work turns on the conviction that the modern divorce between scholarship and spirituality has impoverished both, and that healing the rift is among the more urgent tasks of our time.</p>
              <p>He is a doctoral student at the University of Oxford, researching Pratyabhijñā philosophy with Diwakar Acharya and Monima Chadha, and a devoted practitioner of the Śaiva-Śākta darśana.</p>
            </div>
            <div className="su-creds"><span>DPhil candidate, Oxford</span><span>MPhil, Classical Indian Religions, Oxford</span><span>MA, Philosophy, The New School</span><span>MSc, Political Theory, LSE</span></div>
          </div>
        </div>
      </section>

      {/* FOUNDATION: SĀDHANA SCHOOL */}
      <section className="sec path">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">The foundation</span>
            <h2>Every apprentice is a Sādhana School student first</h2>
            <p>The Sādhana School process of study and practice is foundational to the mentorship. The year&apos;s arc is the ground the apprenticeship stands on.</p>
          </div>
          <div className="season-grid">
            <div className="season-card"><div className="season-when">Fall 2026</div><h3>The Heart of Recognition</h3><p>Kṣemarāja&apos;s Pratyabhijñāhṛdaya. Wed, Oct 21 – Wed, Dec 9.</p></div>
            <div className="season-card"><div className="season-when">Winter 2027</div><h3>Poetry as Philosophy</h3><p>Utpaladeva&apos;s Śivastotrāvalī, the &quot;Garland of Hymns.&quot;</p></div>
            <div className="season-card"><div className="season-when">Spring 2027</div><h3>The Many Faces of Kālī</h3><p>The fierce wisdom teachings on the Goddess Kālī.</p></div>
            <div className="season-card"><div className="season-when">Summer 2027</div><h3>Being With the Heart</h3><p>The Sahṛdaya Summer Immersion. Sat, Jul 10 – Fri, Jul 16.</p></div>
          </div>
          <ul className="su-includes">
            <li>Three 8-week sādhanas of live weekly sessions, with recordings</li>
            <li>A 7-day summer immersion, online or in person</li>
            <li>Saturday Open Sessions at every weekend immersion</li>
            <li>The Sādhaka&apos;s Sourcebook, Inner Travelogue and Practice Portfolio</li>
            <li>A community of over 100 committed practitioners</li>
            <li>100 hours of study, with no Sanskrit required</li>
          </ul>
        </div>
      </section>

      {/* WHAT IS SAHṚDAYA MEDITATION */}
      <section className="sec su-statement">
        <div className="wrap">
          <span className="eyebrow light">What is Sahṛdaya Meditation?</span>
          <blockquote>The discipline of meeting the good, the bad and the ugly with a heart awake to the wonder in everything: to <em>recognize</em>, to <em>relish</em>, and to <em>remember</em>.</blockquote>
          <p style={{ maxWidth: '640px', margin: '26px auto 0', color: 'rgba(250,245,235,.75)', fontSize: '16.5px' }}>Where most meditation asks you to muscle down the mind, Sahṛdaya Meditation includes the mind&apos;s activity rather than transcending it. Its ground is mantra, beginning with haṃsa, the breath-mantra performed some 21,600 times a day. Sahṛdaya names the practice. SLBT names the context in which it is taught.</p>
        </div>
      </section>

      {/* HOW ENROLLMENT WORKS */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">How enrollment works</span>
            <h2>By application, in four steps</h2>
          </div>
          <div className="su-steps">
            <div className="su-step"><div className="n">1</div><h3>Enroll in Sādhana School</h3><p>Join the full 2026–27 year. Apprentices must be year-long students.</p></div>
            <div className="su-step"><div className="n">2</div><h3>Get your application link</h3><p>We email it to you as soon as you enroll.</p></div>
            <div className="su-step"><div className="n">3</div><h3>Apply</h3><p>Tell us about your teaching, training, coaching or facilitation experience.</p><span className="date">Due Fri, Oct 16</span></div>
            <div className="su-step"><div className="n">4</div><h3>Hear back from us</h3><p>If accepted, the apprenticeship begins with the school year. If not, continue in Sādhana School or take a full refund within 30 days.</p></div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="sec path">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow">Sādhana School is entering its third year</span>
            <h2>From past and current students</h2>
          </div>
          <div className="quotes">
            <div className="q"><div className="mark">“</div><p>What I feel now is an immense joy, a sense of wonder, that I can be a part of this awesome sādhana group from my home in a small African country called Malawi.</p><div className="who">Katherine</div><div className="role">Sādhana School student</div></div>
            <div className="q"><div className="mark">“</div><p>You have created an incredible space, filled with so much authenticity. I loved the mixture between the intense practices and the rich theoretical knowledge.</p><div className="who">Jonah</div><div className="role">Sādhana School student</div></div>
            <div className="q"><div className="mark">“</div><p>Your deep knowledge, dedication and commitment to the path is what is needed for such precious information.</p><div className="who">Serena</div><div className="role">Sādhana School student</div></div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="sec" id="enroll">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow">Tuition</span>
            <h2>Sādhana School, plus the apprenticeship</h2>
            <p>You pay for Sādhana School now. Sahṛdaya Upāya tuition is charged only if you&apos;re accepted.</p>
          </div>
          <div className="su-plans">
            <article className="plan featured">
              <span className="badge-top">Step one</span>
              <h3>Sādhana School, full year</h3>
              <div className="amt">$1,797<small>2026–27</small></div>
              <ul className="feat">
                <li><span>✓</span>Fall, Winter and Spring sādhanas, live with recordings</li>
                <li><span>✓</span>Summer immersion: Being With the Heart</li>
                <li><span>✓</span>Saturday Open Sessions at all eight immersions</li>
                <li><span>✓</span>100 hours of study</li>
                <li><span>✓</span>Your Sahṛdaya Upāya application link</li>
              </ul>
              <a className="btn btn-primary" href="#" data-todo="Circle checkout: SS full year">Enroll for the year</a>
            </article>
            <article className="plan">
              <span className="badge-top" style={{ background: 'var(--terra)' }}>By application</span>
              <h3>Sahṛdaya Upāya</h3>
              <div className="amt">$1,300<small>if accepted</small></div>
              <ul className="feat">
                <li><span>✓</span>Eight Sunday Practicums</li>
                <li><span>✓</span>Nine monthly one-on-ones with Jacob</li>
                <li><span>✓</span>Private Mentorship space and events</li>
                <li><span>✓</span>100-hour certificate on completion</li>
              </ul>
              <p className="note">Pay-over-time options available at checkout.</p>
            </article>
          </div>
          <div className="su-guarantee">
            <b>30-day guarantee</b>
            <p>If Sādhana School isn&apos;t right for you, refund requests made within 30 days of purchase are fully honored, issued within 5 business days. Write to hello@embodiedphilosophy.com.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec path">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow">Questions</span>
            <h2>Before you apply</h2>
          </div>
          <div className="faq">
            <details open><summary>Do I need to be enrolled in Sādhana School?</summary><div className="ans">Yes. The Sādhana School process of study and practice is foundational to the apprenticeship, so every apprentice enrolls in the full 2026–27 year.</div></details>
            <details><summary>Do I need teaching experience?</summary><div className="ans">In most cases. We look for past experience in teaching, training, coaching or facilitation, though some applicants are accepted on the strength of their interest and background. Without it, you&apos;re very welcome in Sādhana School, including the Open Session half of every immersion.</div></details>
            <details><summary>What does Sahṛdaya Upāya cost?</summary><div className="ans">$1,300, charged in addition to Sādhana School tuition and only if you&apos;re accepted. Pay-over-time options are available at checkout.</div></details>
            <details><summary>What if I&apos;m not accepted?</summary><div className="ans">You owe nothing more. Continue as a Sādhana School student, or receive a full refund within your first 30 days.</div></details>
            <details><summary>Is it online?</summary><div className="ans">Yes. The program runs October 2026 to July 2027 online. The retreat practicum can be completed in person or in the online facilitated version.</div></details>
            <details><summary>How much time does it take each week?</summary><div className="ans">On average, about 2–3 hours a week on top of Sādhana School. Immersion weekends carry the most, with a 2.5-hour Open Session and a 2-hour Practicum. Alongside this you keep your Sādhana School commitments: the weekly 150-minute live session during each 8-week term, and a daily Sahṛdaya practice of 20–40 minutes split between two sits.</div></details>
            <details><summary>Do I need to know Sanskrit?</summary><div className="ans">No.</div></details>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="sec su-close">
        <div className="wrap">
          <span className="eyebrow">Applications close Friday, October 16</span>
          <h2>Teach from the ground of your <em>own practice</em></h2>
          <p>Enroll in Sādhana School for the year, and we&apos;ll send your Sahṛdaya Upāya application the same day.</p>
          <div className="btns">
            <a className="btn btn-primary" href="#enroll">Enroll &amp; apply</a>
            <a className="btn btn-ghost" href="/sadhana-school">Explore Sādhana School</a>
          </div>
        </div>
      </section>
    </div>
  );
}
