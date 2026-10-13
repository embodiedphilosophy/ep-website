import './tibetan-book.css';
import { getSite } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: 'The Tibetan Book of the Dead with Andrew Holecek — Pay What You Can — Embodied Philosophy',
  description: 'A four-module on-demand course with Andrew Holecek on the Tibetan Book of the Dead: the bardos, the stages of dissolution, dream yoga, and how to help others as they die. Pay what you can.',
  openGraph: {
    title: 'The Tibetan Book of the Dead with Andrew Holecek',
    description: 'Four modules on the most famous guide to dying ever written, and what it teaches about living. Pay what you can.',
    images: ['/img/tbotd/citipati-sq.webp'],
  },
};

const OUTCOMES = [
  ['Meet death without dread', 'Work directly with the fear of dying through teaching and guided meditation, rather than avoiding it.'],
  ['Learn the map', 'The three death bardos and the stages of dissolution: a “GPS” for a journey that otherwise feels bewildering.'],
  ['Practice now', 'Dream yoga and lucid dreaming as a nightly rehearsal, and the small bardos of everyday life as daily practice.'],
  ['Be present for others', 'How to accompany friends, family and patients as they die, with steadiness and care.'],
];

const MODULES = [
  ['1', 'Origins & Hidden History',
    'Who wrote the Book, who discovered it, and for whom was it composed? The central narratives that hold it together, the best translations and what is lost in them, and the “death principle” at its heart. Why meditation is “death in slow motion” that lets you die before you die.'],
  ['2', 'The Stages of Dissolution',
    'The three death bardos, beginning with the painful bardo of dying. The five stages of outer dissolution and three of inner dissolution, the subtle anatomy of death, and how this map can help you, and those you love, when the time comes.'],
  ['3', 'Emptiness & Luminosity',
    'The luminous bardo of dharmatā, where the nature of mind is revealed without the buffer of the body. Why its light frightens us, the role of projection, and who the peaceful and wrathful deities really are.'],
  ['4', 'Graceful Entry',
    'The karmic bardo of becoming, where most of the 49 days are spent. Karma and habit, how dream yoga prepares us for “the dream at the end of time,” and how this bardo plays out in the end of a job, a relationship, or anything that ends.'],
];

const INCLUDES = [
  '4 pre-recorded lectures with Andrew Holecek',
  '2 guided meditations',
  'About 10 hours of video',
  'Course readings (PDF)',
  'Bonus: Tibetan Book of the Dead: Decoding an Ancient Masterwork (2-hour workshop)',
  'Bonus: The Neuroecopsychology of the Subtle Body',
  'Bonus: Reason, Intuition & the Science of Buddhism, with Thupten Jinpa',
  'Lifetime access, at your own pace',
];

const TIERS = [
  ['Supporter', '$147', 'Covers your place and helps fund a scholarship for someone who needs it.'],
  ['Community', '$79', 'A meaningful offering that honors the exchange and keeps these teachings open.', true],
  ['Accessible', 'Any', 'Pay what you can, from $1. Your participation is the offering.'],
];

const FAQ = [
  ['Do I need a background in Buddhism?', 'No. Andrew teaches the text from the ground up and translates its vocabulary into contemporary terms. Longtime practitioners will find plenty of depth; newcomers will not be left behind.'],
  ['How does the on-demand format work?', 'You get immediate access to all four modules, the meditations, readings and bonuses. Watch at your own pace; there are no live sessions to attend and access does not expire.'],
  ['How does “pay what you can” work?', 'Choose the amount that fits your situation at checkout. The tiers are a guide: larger offerings help fund scholarships, and no one is turned away for lack of funds. Everyone receives the same course.'],
  ['Is this course only about death?', 'The Book was written as a guide for dying, but it is equally a guide for living. Its teachings apply to anything that ends: a relationship, a job, a stage of life, even each night’s sleep.'],
  ['Can I use this in my work as a chaplain, hospice worker or caregiver?', 'Yes. Module 2 in particular gives a detailed account of the dying process, and the course includes practical guidance on being present with others as they die.'],
  ['What happens after I register?', 'You’ll receive an email right away with your access details. If anything goes wrong, reply to that email and our team will help.'],
];

export default async function TibetanBook() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return (
    <>
      <section className="hero page-hero tb-hero">
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow">On demand · Pay what you can</span>
            <h1>The Tibetan Book of the Dead</h1>
            <p className="sub">A four-module course with Andrew Holecek on the most famous guide to dying ever written, and what it can teach us about how to live.</p>
            <p className="upnext" style={{ marginTop: 18 }}><b>4 modules · 2 meditations · 3 bonus talks · start any time</b></p>
            <div className="btns" style={{ marginTop: 22 }}>
              <a className="btn btn-primary" href={checkout}>Enroll — pay what you can</a>
              <a className="btn btn-ghost" href="#modules">See the four modules</a>
            </div>
          </div>
          <div className="hero-aside">
            <div className="tb-frame">
              <img src="/img/tbotd/citipati-sq.webp" alt="The Citipati, two dancing skeletons, framed by flames in a Tibetan painting" />
            </div>
          </div>
        </div>
      </section>

      <section className="sec"><div className="wrap hs-intro">
        <div className="hs-stat"><div className="n">49</div><div className="l">Days between death and rebirth</div></div>
        <div className="prose">
          <p>The <i>Bardo Thödol</i>, “liberation through hearing in the intermediate state,” is read aloud to the dying and the dead in Tibet. In the West it became known as <i>The Tibetan Book of the Dead</i>, and it has been a companion to seekers, psychologists and caregivers for a century.</p>
          <p>It is, at heart, a meditation manual. It describes the <i>bardos</i>, the “intervals” that await us at the end of life, and it shows how practice now prepares us for them. Bardos are everywhere: every ending is a small death, and every small death is a chance to rehearse.</p>
          <p className="hs-ask">Death is something you can practice now. Its other name is letting go.</p>
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">What you’ll learn</span><h2>A book of the dead that is really a book of life</h2>
          <p>Andrew “translates” this ancient masterpiece into contemporary terms, without flattening it, and shows its immediate application in modern life.</p></div>
        <div className="tb-outcomes">
          {OUTCOMES.map(([h, p]) => <div key={h} className="tier"><h3>{h}</h3><p>{p}</p></div>)}
        </div>
      </div></section>

      <section className="sec" id="modules"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The course</span><h2>Four modules, three bardos</h2>
          <p>The course follows the journey through the Book itself: from its history, through the bardo of dying and the luminous bardo of reality, to the bardo of becoming.</p></div>
        <div className="tb-modules">
          {MODULES.map(([n, t, d]) => (
            <article key={n} className="hs-move">
              <div className="hs-num">{n}</div>
              <div className="hs-days">Module {n}</div>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </div></section>

      <section className="tb-band" aria-hidden="true"><img src="/img/tbotd/wrathful-wide.webp" alt="" /></section>

      <section className="sec"><div className="wrap hs-two">
        <div className="prose">
          <span className="eyebrow">Your teacher</span>
          <h2>Andrew Holecek</h2>
          <p>Andrew Holecek completed the traditional three-year Buddhist meditation retreat and teaches internationally on meditation, dream yoga and the art of dying. He is the author of <i>Preparing to Die</i>, <i>Dream Yoga: Illuminating Your Life Through Lucid Dreaming and the Tibetan Yogas of Sleep</i>, <i>The Power and the Pain</i> and <i>Meditation in the iGeneration</i>.</p>
          <p>A member of the American Academy of Sleep Medicine, his work has appeared in <i>Lion’s Roar</i>, <i>Tricycle</i>, <i>Parabola</i> and <i>Buddhadharma</i>. He holds degrees in classical music and biology and a doctorate in dental surgery: a scholar-practitioner in every sense.</p>
        </div>
        <div className="prose">
          <span className="eyebrow">What’s included</span>
          <h2>Everything, at any offering</h2>
          <ul className="tb-list">{INCLUDES.map(x => <li key={x}>{x}</li>)}</ul>
        </div>
      </div></section>

      <section className="sec path" id="join"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Pay what you can</span><h2>Choose the offering that fits your life</h2>
          <p>A course of this depth would usually be priced at $147. We offer it by donation so that anyone who wants to study these teachings can. If you’re in a more fluid financial position, you help subsidize those who aren’t. No one is turned away for lack of funds.</p></div>
        <div className="hs-tiers tb-tiers">
          {TIERS.map(([name, amt, desc, suggested]) => (
            <article key={name} className={`plan${suggested ? ' featured' : ''}`}>
              {suggested && <span className="badge-top">Suggested</span>}
              <h3>{name}</h3>
              <div className="amt">{amt}</div>
              <p className="plan-sub">{desc}</p>
            </article>
          ))}
        </div>
        <div className="hs-cta">
          <a className="btn btn-primary" href={checkout}>Enroll — choose your amount</a>
          <p>You’ll enter your amount at checkout. Every offering receives the full course and all three bonuses.</p>
        </div>
      </div></section>

      <section className="sec"><div className="wrap prose">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>

      <section className="sec path"><div className="wrap hs-close">
        <p className="skt">Die before you die.</p>
        <h2>Study the art of dying, and live more fully.</h2>
        <p>Four modules. Three bardos. One lifetime to practice.</p>
        <a className="btn btn-primary" href={checkout}>Enroll — pay what you can</a>
        <p className="tb-more">Want to keep going? <a href="/wisdom-school">Wisdom School Plus</a> opens our learning pathways and certificate programs, including Buddhist Psychology.</p>
      </div></section>
    </>
  );
}
