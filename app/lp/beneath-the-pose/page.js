import PageHero from '@/components/PageHero';
import { getSite } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: 'Beneath the Pose: Guiding Movement Practitioners into the Subtle — Embodied Philosophy',
  description: 'A live 2.5-hour Open Session with Jacob Kyle, Saturday November 14, 10am ET. How to lead āsana- and fitness-trained practitioners from gross sensation into breath, prāṇa and subtle perception, without bypassing where they are.',
};

// Teacher photo lives in the ep-media Blob store.
const JACOB = 'https://nustrh8agxtgmkrb.public.blob.vercel-storage.com/teachers/jacob-kyle.jpg';

const CSS = `
.bp-note{font-size:14.5px;color:var(--ink-soft);margin-top:-14px}
.bp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px 24px}
.bp-src{display:block;margin-top:8px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--terra)}
.bp-about{align-items:start}
.bp-about .eyebrow{display:block;margin-bottom:12px}
.bp-about h3{font-size:34px;line-height:1.1;margin:0}
.bp-teacher-head{display:flex;align-items:center;gap:28px;margin-bottom:26px}
.bp-teacher-head img{flex:none;width:200px;height:200px;object-fit:cover;object-position:50% 30%;border-radius:50%;border:4px solid var(--ivory);box-shadow:0 0 0 1px var(--line)}
.bp-about .bp-role{font-size:12.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--terra);margin:10px 0 0}
.bp-formation{background:var(--ivory);border:1px solid var(--line);border-top:3px solid var(--terra);padding:34px 34px 20px}
.bp-formation h3{font-size:30px;margin-bottom:16px}
@media(max-width:720px){.bp-teacher-head{flex-direction:column;align-items:flex-start;gap:20px}.bp-teacher-head img{width:168px;height:168px}.bp-about h3{font-size:30px}.bp-formation{padding:26px 22px 12px}}
.bp-ticket{max-width:440px;margin:0 auto}
.bp-ticket ul{margin:6px 0 0;padding-left:18px;font-size:15px;color:var(--ink-soft)}
.bp-ticket li{margin:4px 0}
@media(max-width:980px){.bp-grid{grid-template-columns:1fr 1fr}}
@media(max-width:720px){.bp-grid{grid-template-columns:1fr}}
`;

const FOR = [
  ['Yoga & movement teachers', 'You teach strong, intelligent physical classes, and you sense there is a further threshold your students never quite cross.', 'var(--terra)'],
  ['Practitioners', 'Your own practice has lived mostly in the muscles and joints, and you want to know what the tradition meant by what lies beneath.', 'var(--ochre)'],
  ['Somatic guides & facilitators', 'Therapists, coaches and bodyworkers who want a grounded, non-mystified language for subtle experience.', 'var(--pine)'],
];

const EXPLORE = [
  ['The threshold', 'Where attention shifts from body-as-object to breath-as-felt, what keeps that door closed in a typical class, and the words that invite someone across.', 'The heart of the session'],
  ['Posture as relaxed effort', 'Sthira-sukham āsanam. Posture is perfected by relaxing effort and merging with the boundless. What does that ask of us as teachers of the physical practice?', 'Yoga Sūtra 2.46–2.49'],
  ['The pose was never the destination', 'In the haṭha texts, āsana brings steadiness, health and lightness as a preparation, and breath work follows. A modern class often stops where the tradition begins.', 'Haṭhapradīpikā 1–2'],
  ['The turning points of the breath', 'The opening breath practices of the Vijñāna Bhairava, which rest attention at the turn of the inhale and exhale and in the space between them.', 'Vijñāna Bhairava Tantra 24–27'],
  ['A map into subtle attention', 'Kṣemarāja’s means for the “expansion of the centre”: dissolving thought-constructs, contracting and expanding śakti, and attending to where the breath begins and ends.', 'Pratyabhijñāhṛdaya'],
  ['A bridge vocabulary', 'What the science of interoception, the felt sense of the body from inside, can and can’t say, for students who trust research language more than “energy” talk.', 'Farb et al., 2015'],
];

const FAQ = [
  ['Do I need to be a teacher?', 'No. The Open Session is a complete, standalone workshop. You don’t need to teach, or intend to, for it to change how you practice.'],
  ['Do I need to know Sanskrit or have read the texts?', 'No. Every Sanskrit term is translated and explained, and Jacob brings the passages we need into the room.'],
  ['When is it, and how long?', 'Saturday, November 14, 2026, 10:00am–12:30pm ET (3:00–5:30pm in the UK), live on Zoom. You’ll receive the link by email after you register.'],
  ['What if I can’t make it live?', 'Register anyway: the recording is sent to everyone who signs up.'],
  ['I’m already in Sādhana School. Do I need to buy this?', 'No. Open Sessions are included for year-long Sādhana School students. Join from your Today page in Circle as usual.'],
  ['What if it isn’t right for me?', 'Write to hello@embodiedphilosophy.com within 30 days and we’ll refund you in full.'],
];

export default async function BeneathThePose() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  const price = site.prices.beneathThePose || lp.price;
  const Cta = ({ children, className = 'btn btn-primary' }) => checkout
    ? <a className={className} href={checkout}>{children}</a>
    : <a className={className} href="mailto:hello@embodiedphilosophy.com?subject=Beneath%20the%20Pose">Registration opening soon: email us</a>;
  return (
    <>
      <style>{CSS}</style>
      <PageHero eyebrow="Open Session · Saturday, November 14" title="Beneath the Pose" img="yogi-padmasana" ground="vermilion" ring="#EBA329"
        lede="Guiding movement practitioners into the subtle. A live workshop on how to meet āsana- and fitness-trained students where they stand, and lead them from gross sensation into breath, prāṇa and subtle perception, without bypassing where they are.">
        <p className="upnext" style={{ marginTop: 18 }}><b>One live session · Sat Nov 14 · 10am–12:30pm ET</b></p>
        <p className="bp-note">Live on Zoom with Jacob Kyle. Recording sent to everyone who registers.</p>
        <div className="btns" style={{ marginTop: 22 }}>
          <Cta>Save your seat — {price}</Cta>
          <a className="btn btn-ghost" href="#explore">What we’ll explore</a>
        </div>
      </PageHero>

      <section className="sec"><div className="wrap hs-intro">
        <div className="hs-stat"><div className="n">2.47</div><div className="l">Posture is perfected by relaxing effort</div></div>
        <div className="prose">
          <p>Most yoga in the West is taught as a physical practice: alignment, strength, flexibility, a good sweat. That’s a real gift. But for the traditions that gave us āsana, the pose was never the destination. It was a way of becoming steady enough to turn toward the breath, and through the breath, toward something subtler.</p>
          <p>So how do you lead someone who trusts their hamstrings more than any talk of “energy” across that threshold? Not by asking them to believe something, and not by skipping over the body they actually live in, but by refining the attention they already have.</p>
          <p className="hs-ask">This Open Session is about that threshold, and how to teach it.</p>
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Who it’s for</span><h2>For anyone whose practice begins in the body</h2></div>
        <div className="path-grid">
          {FOR.map(([h, p, c]) => <div key={h} className="tier" style={{ borderTopColor: c }}><h3>{h}</h3><p>{p}</p></div>)}
        </div>
      </div></section>

      <section className="sec" id="explore"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">What we’ll explore</span><h2>From the pose, to the breath, to the subtle</h2>
          <p>Classical sources read alongside contemporary research, with guided practice and conversation throughout.</p></div>
        <div className="bp-grid">
          {EXPLORE.map(([h, p, src]) => <div key={h} className="hs-step"><h3>{h}</h3><p>{p}</p><span className="bp-src">{src}</span></div>)}
        </div>
      </div></section>

      <section className="sec path"><div className="wrap prose">
        <blockquote className="hs-verse"><span className="skt">madhyavikāsāc cidānandalābhaḥ</span>From the expansion of the centre comes the attainment of the bliss of consciousness.<cite>Kṣemarāja, Pratyabhijñāhṛdaya</cite></blockquote>
      </div></section>

      <section className="sec"><div className="wrap hs-two bp-about">
        <div className="prose">
          <div className="bp-teacher-head">
            <img src={JACOB} alt="Jacob Kyle" />
            <div>
              <span className="eyebrow">Your teacher</span>
              <h3>Jacob Kyle</h3>
              <p className="bp-role">Founding Director, Embodied Philosophy</p>
            </div>
          </div>
          <p>Meditation teacher, writer, philosophy educator and publisher. His work turns on the conviction that the modern divorce between scholarship and spirituality has impoverished both, and that healing it is among the more urgent tasks of our time.</p>
          <p>Jacob is a doctoral student at the University of Oxford, researching Pratyabhijñā philosophy with Diwakar Acharya and Monima Chadha. He holds an MPhil in Classical Indian Religions from Oxford, an MA in Philosophy from the New School for Social Research, and an MSc in Political Theory from the London School of Economics.</p>
        </div>
        <div className="prose bp-formation">
          <span className="eyebrow">Part of a year of formation</span>
          <h3>The first of eight Open Sessions</h3>
          <p>Beneath the Pose opens this year’s Sādhana School weekend immersions. Each one is a complete workshop on a single theme in teaching the subtle, from ethical speech in secular rooms to rasa theory as a contemplative method.</p>
          <p>Open Sessions are included for year-long <a href="/sadhana-school">Sādhana School</a> students. Teachers who want to go further can train in Subtle Liberation-Based Teaching through <a href="/sahrdaya-upaya">Sahṛdaya Upāya</a>, our 100-hour mentorship.</p>
        </div>
      </div></section>

      <section className="sec path" id="join"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Join us live</span><h2>Save your seat for Saturday</h2></div>
        <article className="plan featured bp-ticket">
          <span className="badge-top">Open Session</span>
          <h3>Beneath the Pose</h3>
          <div className="amt">{price}<span> one live session</span></div>
          <ul>
            <li>2.5 hours live with Jacob Kyle on Zoom</li>
            <li>Teaching, guided breath practice and Q&amp;A</li>
            <li>The full recording, posted on the session page in Circle</li>
            <li>The reading list from the Sādhana School workbook</li>
          </ul>
          <Cta>Save your seat</Cta>
        </article>
        <div className="hs-cta"><p>Saturday, November 14 · 10:00am–12:30pm ET · Refund requests within 30 days are fully honored.</p></div>
      </div></section>

      <section className="sec"><div className="wrap prose">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>

      <section className="sec path"><div className="wrap hs-close">
        <p className="skt">sthira-sukham āsanam</p>
        <h2>Beneath every pose, the breath. Beneath the breath, the subtle.</h2>
        <p>Spend a Saturday morning learning to lead there.</p>
        <Cta>Save your seat — {price}</Cta>
      </div></section>
    </>
  );
}
