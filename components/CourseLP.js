import './course-lp.css';

// One on-demand, pay-what-you-can course landing page (used by the folders in app/lp/).
// Each page passes a `c` object with its copy; sections without data are left out.
export const JACOB_PHOTO = 'https://cdn.lugc.link/cd2aae5b-8c39-45af-85b0-74d4950498da/-/crop/479x479/0,35/-/preview/320x320/-/format/auto/';
export const JACOB_BIO = [
  'Meditation teacher, writer, philosophy educator, and Founding Director of Embodied Philosophy. His guiding mission is to re-imagine the modern role of the yoga teacher in alignment with the teachings, texts and traditions of yoga’s profound history.',
  'Jacob is a doctoral candidate at the University of Oxford, researching Pratyabhijñā philosophy with Diwakar Acharya and Monima Chadha. He holds an MPhil in Classical Indian Religions from Oxford, an MA in Philosophy from the New School for Social Research, and an MSc in Political Theory from the London School of Economics. He received dīkṣā into a Tantric form of meditation in 2015, studies with Kashmir Śaivism scholar-practitioner Paul Muller-Ortega, and is a devoted practitioner of the Śaiva-Śākta darśana.',
];
export const JACOB = { name: 'Jacob Kyle', role: 'Founding Director, Embodied Philosophy', photo: JACOB_PHOTO, bio: JACOB_BIO };

const PWYC_FAQ = ['How does “pay what you can” work?', 'Choose the amount that fits your situation at checkout. The tiers are a guide: larger offerings help fund scholarships, and no one is turned away for lack of funds. Everyone receives the same course.'];
const AFTER_FAQ = ['What happens after I register?', 'You’ll receive an email right away with your access details. If anything goes wrong, reply to that email and our team will help.'];
const REFUND_FAQ = ['What if it isn’t right for me?', 'Refund requests made within 30 days of purchase are fully honored. Write to hello@embodiedphilosophy.com and we’ll issue your refund within 5 business days.'];

// Copy may use <i>…</i> and <b>…</b> for Sanskrit titles and emphasis; nothing else is treated as markup.
function rich(text) {
  return text.split(/(<i>.*?<\/i>|<b>.*?<\/b>)/g).map((part, i) => {
    const m = part.match(/^<(i|b)>(.*)<\/\1>$/);
    if (!m) return part;
    return m[1] === 'i' ? <i key={i}>{m[2]}</i> : <b key={i}>{m[2]}</b>;
  });
}

export default function CourseLP({ c, checkout }) {
  const tiers = c.tiers;
  const faq = [...(c.faq || []), PWYC_FAQ, AFTER_FAQ, REFUND_FAQ];
  return (
    <>
      <section className="hero page-hero cl-hero">
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow">{c.eyebrow || 'On demand · Pay what you can'}</span>
            <h1>{c.title}</h1>
            <p className="sub">{c.lede}</p>
            <p className="upnext" style={{ marginTop: 18 }}><b>{c.facts}</b></p>
            <div className="btns" style={{ marginTop: 22 }}>
              <a className="btn btn-primary" href={checkout}>Enroll — pay what you can</a>
              {c.modules && <a className="btn btn-ghost" href="#course">{c.modulesLink || 'See the course'}</a>}
            </div>
          </div>
          <div className="hero-aside">
            <div className={`cl-frame ${c.frame || ''}`}><img src={c.hero} alt={c.heroAlt} /></div>
          </div>
        </div>
      </section>

      <section className="sec"><div className="wrap hs-intro">
        <div className="hs-stat"><div className="n">{c.stat[0]}</div><div className="l">{c.stat[1]}</div></div>
        <div className="prose">
          {c.intro.map((p, i) => <p key={i}>{rich(p)}</p>)}
          {c.ask && <p className="hs-ask">{c.ask}</p>}
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">What you’ll learn</span><h2>{c.outcomesTitle}</h2>
          {c.outcomesLede && <p>{c.outcomesLede}</p>}</div>
        <div className="cl-outcomes">
          {c.outcomes.map(([h, p]) => <div key={h} className="tier"><h3>{h}</h3><p>{p}</p></div>)}
        </div>
      </div></section>

      {c.modules && (
        <section className="sec" id="course"><div className="wrap">
          <div className="sec-head"><span className="eyebrow">{c.modulesEyebrow || 'The course'}</span><h2>{c.modulesTitle}</h2>
            {c.modulesLede && <p>{c.modulesLede}</p>}</div>
          <div className="cl-modules">
            {c.modules.map(([label, t, d], i) => (
              <article key={t} className="hs-move">
                <div className="hs-num">{i + 1}</div>
                <div className="hs-days">{label}</div>
                <h3>{t}</h3>
                {d && <p>{d}</p>}
              </article>
            ))}
          </div>
        </div></section>
      )}

      {c.band && <section className="cl-band" aria-hidden="true"><img src={c.band} alt="" /></section>}

      {c.deep && (
        <section className={`sec${c.band ? '' : ' path'}`}><div className="wrap prose hs-swan">
          <span className="eyebrow">{c.deep.eyebrow}</span>
          <h2>{c.deep.title}</h2>
          {c.deep.body.map((p, i) => <p key={i}>{rich(p)}</p>)}
          {c.deep.verse && <blockquote className="hs-verse">{c.deep.verse}</blockquote>}
          {c.deep.art && <figure className="cl-art"><img src={c.deep.art[0]} alt={c.deep.art[1]} /><figcaption>{c.deep.art[1]}</figcaption></figure>}
        </div></section>
      )}

      {c.bonus && (
        <section className="sec path"><div className="wrap">
          <div className="sec-head"><span className="eyebrow">Included bonuses</span><h2>{c.bonusTitle}</h2></div>
          <div className="cl-bonus">
            {c.bonus.map(([t, by, d]) => <div key={t} className="tier"><h3>{t}</h3><p className="by">With {by}</p><p>{d}</p></div>)}
          </div>
        </div></section>
      )}

      <section className="sec"><div className="wrap hs-two">
        <div className="prose">
          <span className="eyebrow">{c.teachers.length > 1 ? 'Your teachers' : 'Your teacher'}</span>
          <div className="cl-teachers">
            {c.teachers.map(t => (
              <div key={t.name} className={`cl-teacher${t.photo ? '' : ' noimg'}`}>
                {t.photo && <img src={t.photo} alt={t.name} />}
                <div>
                  <h2 style={{ fontSize: 30 }}>{t.name}</h2>
                  {t.role && <p className="cl-role">{t.role}</p>}
                  {t.bio.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="prose">
          <span className="eyebrow">What’s included</span>
          <h2>Everything, at any offering</h2>
          <ul className="cl-list">{c.includes.map(x => <li key={x}>{x}</li>)}</ul>
        </div>
      </div></section>

      <section className="sec path" id="join"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Pay what you can</span><h2>Choose the offering that fits your life</h2>
          <p>A {c.kind || 'course'} like this would usually be priced at {c.value}. We offer it by donation so that anyone who wants to study these teachings can. If you’re in a more fluid financial position, you help subsidize those who aren’t. No one is turned away for lack of funds.</p></div>
        <div className="hs-tiers cl-tiers">
          {tiers.map(([name, amt, desc, suggested]) => (
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
          <p>You’ll enter your amount at checkout. Every offering receives the full {c.kind || 'course'}{c.bonus ? ' and all bonuses' : ''}.</p>
          <p>Refund requests within 30 days are fully honored.</p>
        </div>
      </div></section>

      <section className="sec"><div className="wrap prose">
        <h2>Questions</h2>
        {faq.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>

      <section className="sec path"><div className="wrap hs-close">
        {c.close[0] && <p className="skt">{c.close[0]}</p>}
        <h2>{c.close[1]}</h2>
        <p>{c.close[2]}</p>
        <a className="btn btn-primary" href={checkout}>Enroll — pay what you can</a>
        <p className="cl-more">Want to keep going? <a href="/wisdom-school">Wisdom School Plus</a> opens our full library of learning pathways and certificate programs.</p>
      </div></section>
    </>
  );
}

// Standard tiers: Supporter (2× suggested), Community (suggested), Accessible (from $1).
export function tiersFor(suggested, supporter) {
  return [
    ['Supporter', `$${supporter}`, 'Covers your place and helps fund a scholarship for someone who needs it.'],
    ['Community', `$${suggested}`, 'A meaningful offering that honors the exchange and keeps these teachings open.', true],
    ['Accessible', 'Any', 'Pay what you can, from $1. Your participation is the offering.'],
  ];
}

export const cdn = (id, size = 1000) => `https://cdn.lugc.link/${id}/-/preview/${size}x${size}/-/format/auto/`;
