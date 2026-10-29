import './christian-mysticism.css';
import { getSite } from '@/lib/content';
import lp from './lp';
import Plans from './Plans';
// Public-domain art from Wikimedia Commons: Hildegard of Bingen, Scivias (the Choirs of Angels); Gustave Doré, Paradiso, Canto 31.
// To move them onto ep-media (Vercel Blob), replace these two URLs.
const choirs = { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/07angels-hildegard_von_bingen.jpg/960px-07angels-hildegard_von_bingen.jpg' };
const empyrean = { src: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Paradiso_Canto_31.jpg' };

export const revalidate = 300;
export const metadata = {
  title: 'Christian Mysticism with Mary Reilly Nichols & Floss Harry — Embodied Philosophy',
  description: 'A four-session live course on Christian mysticism with Mary Reilly Nichols and Floss Harry: knowing through participation, incarnation and the sacredness of matter, the way of unknowing, and the mysticism of the heart, in conversation with yoga and tantra. Thursdays, Nov 12 – Dec 10, 2026. $127.',
  openGraph: {
    title: 'Christian Mysticism with Mary Reilly Nichols & Floss Harry',
    description: 'Four live sessions on the contemplative heart of Christianity, in conversation with yoga and tantra. Thursdays from November 12. $127.',
    images: [choirs.src],
  },
};

const PRICE = '$127';
// Payment plan: a down payment today, then weekly payments (total shown on the card).
const PLAN = { down: '$47', weekly: '$27', count: 3 };
const PLAN_TOTAL = `$${Number(PLAN.down.slice(1)) + PLAN.count * Number(PLAN.weekly.slice(1))}`;

const OUTCOMES = [
  ['Know by participating', 'Meet the mystical tradition as a path of encounter and transformation, not a set of beliefs: the difference between knowing about God and knowing God.'],
  ['Recover the sacred body', 'Why “the Word became flesh” makes matter, the body and the cosmos sites of revelation, and why Christianity is far less body-denying than its reputation.'],
  ['Practice unknowing', 'Silence, contemplative prayer and the apophatic way, practiced together in each session, not only studied.'],
  ['Hear the resonance', 'Shakti and the Holy Spirit, the Blessed Mother and the Goddess, guru and Christ: the parallels with yoga and tantra, explored with care rather than collapsed.'],
];

const SESSIONS = [
  ['1', 'Thursday, November 12', 'What Is Christian Mysticism? Knowing Through Participation',
    'A map of the Christian mystical tradition, from its biblical foundations in Paul and the Gospel of John. Theosis, or deification; contemplation and prayer as ways of knowing; Jesus as exemplar and the Logos. Read through the lens of yoga and tantra: the siddha, the transmission of grace, and guru yoga.'],
  ['2', 'Thursday, November 19', 'Incarnation: Body, Matter & Cosmos',
    'Begin with the extraordinary Christian proposition, “the Word became flesh,” and ask what follows if the divine is encountered through matter rather than by escaping it. Creation as participation in God, sacrament and Eucharist, microcosm and macrocosm, with Irenaeus, Maximus the Confessor and Hildegard of Bingen. And the Blessed Mother as “Mother of the Word,” alongside Shakti and mātṛkā śakti in Kashmir Śaivism.'],
  ['3', 'Thursday, December 3', 'The Way of Unknowing: Silence, Contemplation & Apophaticism',
    'A tradition that speaks endlessly of a God its greatest teachers say cannot be spoken of. Cataphatic and apophatic theology, Pseudo-Dionysius, The Cloud of Unknowing and Meister Eckhart, hesychia and the Jesus Prayer. The Kingdom of Heaven within and Christ’s teaching on presence. With a guided period of contemplative silence.'],
  ['4', 'Thursday, December 10', 'The Heart: Desire, Love & Union',
    'Christian mysticism is extraordinarily affective. From the Song of Songs and Christ as Bridegroom to Bernard of Clairvaux, Hadewijch, Mechthild, Julian of Norwich, Teresa of Ávila, John of the Cross and Francis of Assisi. Mystical union, and the return: how love of God becomes love of the world.'],
];

const ARC = [
  ['Knowing', 'How can God be known?'],
  ['Being', 'What kind of reality lets the divine be met in bodies and matter?'],
  ['Practice', 'How do we cultivate the capacity to perceive it?'],
  ['Love', 'What draws us toward it, and what does the encounter do to us?'],
];

// Headshots from the ep-media Blob store (the same ones the Teachers page uses).
const MARY_PHOTO = 'https://nustrh8agxtgmkrb.public.blob.vercel-storage.com/teachers/mary-reilly-nichols.jpg';
const FLOSS_PHOTO = 'https://nustrh8agxtgmkrb.public.blob.vercel-storage.com/teachers/floss-harry.jpg';

const MARY = [
  'A yoga and meditation teacher for over 40 years, Mary offers yoga instruction emphasizing breath awareness, with insights from neuroscience and evolutionary biology as well as the philosophy of the Upaniṣads, Advaita Vedānta and the Tantric methods of Kashmir Śaivism.',
  'Director of the Nalanda Institute’s yoga teacher training program, she has taught at Tibet House in New York City and the New York Open Center, and has been a keynote speaker at symposia sponsored by the Wonderstruck Webcast and Harvard Divinity School. Mary holds a BA in anthropology from Harvard University and completed five years of residency in meditation ashrams in India and the US.',
];

const FLOSS = [
  'Floss Harry (MPhil, Cambridge) is a yoga teacher and embodied philosophy facilitator who approaches philosophy as lived practice and a way of life, drawing on the wisdom traditions of East and West.',
  'At Embodied Philosophy she teaches in Wisdom School, serves as Sādhana School’s Integration Facilitator, and is project manager of Tarka, EP’s journal of philosophy and contemplative practice.',
];

const INCLUDES = [
  '4 live sessions on Zoom, 2 hours each',
  'Guided contemplative practice in every session',
  'Recordings of every session, to watch at your own pace',
  'Live Q&A and discussion with Mary and Floss',
  'A course space on the EP platform for resources and recordings',
];

const FAQ = [
  ['Do I need to be Christian, or to know the tradition?', 'No. The course is open to anyone, of any background or none. We build the map from the ground up, and longtime students of Christianity will find plenty of depth.'],
  ['Is this a comparison of Christianity and yoga?', 'It is a course on Christian mysticism in its own right, taught by teachers steeped in yoga and tantra. We draw out real resonances between the traditions without pretending they are the same thing.'],
  ['When are the sessions?', 'Thursdays, November 12 and 19 and December 3 and 10, 2026, at 9am Eastern / 2pm UK, for two hours. There is no session on November 26 (Thanksgiving).'],
  ['What if I can’t attend live?', 'Every session is recorded and posted to the course space shortly after it ends, so you can follow along at your own pace.'],
  ['How does the payment plan work?', `You pay ${PLAN.down} when you enroll, then ${PLAN.count} weekly payments of ${PLAN.weekly}, taken automatically (${PLAN_TOTAL} in total). You get full access from the first payment.`],
  ['Is the course included in Wisdom School?', 'Yes. Wisdom School members get Christian Mysticism as part of their membership, monthly or annual. If you’re already a member, there’s nothing more to buy.'],
  ['What happens after I register?', 'You’ll receive an email right away with your access details and the link to join. If anything goes wrong, reply to that email and our team will help.'],
];

export default async function ChristianMysticism() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  const planCheckout = site.links[lp.planCheckoutKey] || lp.planCheckout;
  return (
    <>
      <section className="hero page-hero cm-hero">
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow">Live online · 4 Thursdays from November 12</span>
            <h1>Christian Mysticism</h1>
            <p className="sub">A four-session course with Mary Reilly Nichols and Floss Harry on the contemplative heart of Christianity, and its deep resonance with the philosophy and practice of yoga and tantra.</p>
            <p className="upnext" style={{ marginTop: 18 }}><b>4 live sessions · 2 hours each · recordings included · {PRICE} or {PLAN.down} down</b></p>
            <div className="btns" style={{ marginTop: 22 }}>
              <a className="btn btn-primary" href={checkout}>Enroll — {PRICE}</a>
              <a className="btn btn-ghost" href="#sessions">See the four sessions</a>
            </div>
          </div>
          <div className="hero-aside">
            <div className="cm-frame">
              <img src={choirs.src} alt="Concentric rings of angels around a point of light, from Hildegard of Bingen’s Scivias" />
            </div>
          </div>
        </div>
      </section>

      <section className="sec"><div className="wrap hs-intro">
        <div className="hs-stat"><div className="n">4</div><div className="l">Sessions: knowing, being, practice, love</div></div>
        <div className="prose">
          <p>For many students of yoga, Christianity is the tradition they grew up with, left behind, or never really met. Yet beneath its doctrines runs a contemplative river two thousand years long: the desert mothers and fathers, the apophatic theologians, the visionaries and the saints of the heart.</p>
          <p>Christian mysticism is concerned less with belief than with <i>encounter</i>: knowing God not as an object but by participation, by becoming like what one knows. Its methods and its summits share a striking kinship with the paths of yoga and tantra.</p>
          <blockquote className="cm-quote">“The eye with which I see God is the same eye with which God sees me.”<cite>Meister Eckhart</cite></blockquote>
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">What you’ll learn</span><h2>Christianity as a way of knowing</h2>
          <p>Rather than racing through two thousand years of history, we explore four big questions at the heart of the tradition, with time for contemplative practice in every session.</p></div>
        <div className="cm-outcomes">
          {OUTCOMES.map(([h, p]) => <div key={h} className="tier"><h3>{h}</h3><p>{p}</p></div>)}
        </div>
      </div></section>

      <section className="sec" id="sessions"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The course</span><h2>Four sessions, one ascent</h2>
          <p>Thursdays at 9am Eastern / 2pm UK, two hours each. Each session moves from teaching to discussion to contemplative practice.</p></div>
        <div className="cm-dates" style={{ marginBottom: 32 }}>
          {ARC.map(([t, q], i) => <div key={t} className="hs-step"><div className="t">{i + 1} · {t}</div><p>{q}</p></div>)}
        </div>
        <div className="cm-modules">
          {SESSIONS.map(([n, date, t, d]) => (
            <article key={n} className="hs-move">
              <div className="hs-num">{n}</div>
              <div className="hs-days">{date}</div>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </div></section>

      <section className="cm-band" aria-hidden="true"><img src={empyrean.src} alt="" /></section>
      <p className="cm-credit">Gustave Doré, The Empyrean (Paradiso, Canto 31). Above: Hildegard of Bingen, Scivias, the Choirs of Angels.</p>

      <section className="sec"><div className="wrap hs-two">
        <div className="prose">
          <span className="eyebrow">Your teachers</span>
          <div className="cm-teacher"><img src={MARY_PHOTO} alt="Mary Reilly Nichols" /><h2>Mary Reilly Nichols</h2></div>
          {MARY.map(p => <p key={p.slice(0, 20)}>{p}</p>)}
          <div className="cm-teacher" style={{ marginTop: 32 }}><img src={FLOSS_PHOTO} alt="Floss Harry" /><h2>Floss Harry</h2></div>
          {FLOSS.map(p => <p key={p.slice(0, 20)}>{p}</p>)}
        </div>
        <div className="prose">
          <span className="eyebrow">What’s included</span>
          <h2>Live, and yours to keep</h2>
          <ul className="cm-list">{INCLUDES.map(x => <li key={x}>{x}</li>)}</ul>
        </div>
      </div></section>

      <section className="sec path" id="join"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Enroll</span><h2>Join us from November 12</h2>
          <p>Pay in full, spread the cost across the weeks of the course, or join Wisdom School and get Christian Mysticism included.</p></div>
        <Plans
          full={{ price: PRICE, href: checkout }}
          plan={{ ...PLAN, total: PLAN_TOTAL, href: planCheckout }}
          wisdom={{ monthlyPrice: site.prices.wisdomMonthly, yearPrice: site.prices.wisdomYear, monthlyHref: site.links.wisdomMonthly || site.links.wisdomJoin, yearHref: site.links.wisdomJoin }}
        />
        <p className="cm-plan-note">All three include the four live sessions and every recording.</p>
      </div></section>

      <section className="sec"><div className="wrap prose">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>

      <section className="sec path"><div className="wrap hs-close">
        <p className="skt">The Word became flesh.</p>
        <h2>Meet the contemplative heart of Christianity.</h2>
        <p>Four Thursdays. Knowing, being, practice, love.</p>
        <a className="btn btn-primary" href={checkout}>Enroll — {PRICE}</a>
        <p className="cm-more">Want to keep going? <a href="/wisdom-school">Wisdom School</a> opens our full library of live courses and learning pathways.</p>
      </div></section>
    </>
  );
}
