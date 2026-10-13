import { getSite } from '@/lib/content';

export const revalidate = 300;
export const metadata = {
  title: 'Navarātri & the Devī Gītā: A Fall Sādhana — Pay What You Can — Embodied Philosophy',
  description: 'Ten live sessions, one chapter of the Devī Gītā each night of Navarātri, October 11–20, 2026, with Jacob Kyle and Tova Olsson. Study, recitation and mantra meditation. Pay what you can.',
  openGraph: { images: ['https://cdn.lugc.link/91338456-b648-4744-9510-67bf2e454fdb/-/preview/1200x1200/-/format/png/'] },
};

// Art and teacher photos are served from the Navarātri enroll page's image CDN for now.
// To move them onto ep-media (Vercel Blob), replace these three URLs.
const IMG = {
  durga: 'https://cdn.lugc.link/91338456-b648-4744-9510-67bf2e454fdb/-/preview/1000x1000/-/format/auto/',
  jacob: 'https://cdn.lugc.link/cd2aae5b-8c39-45af-85b0-74d4950498da/-/crop/479x479/0,35/-/preview/320x320/-/format/auto/',
  tova: 'https://cdn.lugc.link/a04c6dbe-e38a-4a2b-8e45-d528f131bdae/-/preview/320x320/-/format/auto/',
};

// Page styles (build on the shared hs-* course-page styles in globals.css).
const CSS = `
.nv-note{font-size:14.5px;color:var(--ink-soft);margin-top:-14px}
.nv-collage .cut{height:auto;width:96%;max-width:96%;bottom:4%}
.nv-days{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:20px}
.nv-day{display:grid;grid-template-columns:118px 1fr;gap:20px;background:var(--ivory);border:1px solid var(--line);padding:24px 24px 22px;min-width:0}
.nv-day:first-child,.nv-day:last-child{border-top:3px solid var(--terra)}
.nv-when{display:flex;flex-direction:column;gap:4px;min-width:0}
.nv-n{font-family:var(--font-serif),serif;font-size:46px;line-height:1;color:var(--terra)}
.nv-date{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink-soft)}
.nv-fest{font-family:var(--font-serif),serif;font-style:italic;font-size:17px;color:var(--ochre);line-height:1.2}
.nv-body{min-width:0}
.nv-body h3{font-size:24px;line-height:1.15}
.nv-body p{font-size:15px;color:var(--ink-soft);margin-top:8px}
.nv-lead{display:inline-block;margin-top:10px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--terra)}
.nv-outcomes{display:grid;grid-template-columns:repeat(3,1fr);gap:28px 24px}
.nv-teacher{display:flex;flex-direction:column;gap:18px;min-width:0}
.nv-teacher img{width:132px;height:132px;object-fit:cover;border-radius:50%;border:3px solid var(--ivory);box-shadow:0 0 0 1px var(--line)}
.nv-teacher h3{font-size:30px}
.nv-role{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink-soft);margin-top:2px}
@media(max-width:980px){.nv-days{grid-template-columns:1fr}.nv-outcomes{grid-template-columns:1fr 1fr}}
@media(max-width:720px){.nv-outcomes{grid-template-columns:1fr}.nv-day{grid-template-columns:1fr;gap:12px}.nv-when{flex-direction:row;align-items:baseline;flex-wrap:wrap;gap:4px 12px}.nv-n{font-size:36px}}
`;

const RING = 'M21 4.5C31 4 37 12 35.5 21.5C34 31 26 36.5 17.5 35.5C8.5 34.5 3.5 26.5 5 17.5C6 11.5 10.5 6.5 16.5 5';

const DAYS = [
  ['1', 'Sun Oct 11', 'Ghaṭasthāpana', 'Opening the Song', 'Jacob & Tova',
    'Opening mantras. Jacob on the gītā as a genre; Tova on the story of Śiva and Satī that the text alludes to.'],
  ['2', 'Mon Oct 12', '', 'Ch. 1: The Appearance of the Great Goddess', 'Tova',
    'She appears as unbearable light, then as four-armed Bhuvaneśvarī. Two kinds of seeking in one assembly: the gods want their heavens back, Himālaya wants to know what she is.'],
  ['3', 'Tue Oct 13', '', 'Ch. 2: The Supreme Cause of Creation', 'Jacob',
    'Two models of creation held side by side: Sāṃkhyan unfolding and Advaitin reflection. Māyā as the power she wields and, in some sense, is.'],
  ['4', 'Wed Oct 14', '', 'Ch. 3: The Cosmic Body (the Virāj)', 'Tova',
    '“I am the sun and the stars.” Her self-predications give way to the devouring, fire-spewing form before which the gods faint.'],
  ['5', 'Thu Oct 15', 'Lalitā Pañcamī', 'Ch. 4: The Yoga of Knowledge', 'Jacob',
    'Hearing, reflecting, meditating. Tat tvam asi in her voice, and her own dissolution meditation on the syllable Hrīṃ.'],
  ['6', 'Fri Oct 16', '', 'Ch. 5: The Eight-Limbed & Serpentine Yoga', 'Tova',
    'The subtle body, the cakras, the ascent, and the descent that matters just as much, in which the body is remade as divine.'],
  ['7', 'Sat Oct 17', '', 'Ch. 6: Knowledge of Brahman', 'Jacob',
    'The archer’s bow, the light beyond all lights, and why the teacher outranks the parent.'],
  ['8', 'Sun Oct 18', 'Durgāṣṭamī', 'Ch. 7: The Yoga of Devotion', 'Tova',
    'Four grades of bhakti, and the paradox at the summit: utter detachment alongside tears, faltering voice, and dancing without shame.'],
  ['9', 'Mon Oct 19', 'Mahānavamī', 'Ch. 8–9: Her Abodes & the Forms of Worship', 'Jacob',
    'Sthānas, not tīrthas: her seats are dwellings in this world, each one a place where her body fell. Then the typology of pūjā, and worship turning inward.'],
  ['10', 'Tue Oct 20', 'Vijayadaśamī', 'Ch. 10: Tāntric Worship & the Disappearance', 'Tova & Jacob',
    'The throne installed in your own body, its legs the corpses of the gods. She is welcomed, served, and released, led home to the heart, and gone. Closing recitation and visarjana.'],
];

const OUTCOMES = [
  ['Understand the Devī Gītā as a whole', 'Its narrative frame, its ten-chapter architecture, and its place among the gītā literature of South Asia.'],
  ['Practice with Hrīṃ, the Hṛllekhā', 'The Goddess’s own seed-syllable, encountered as sonic essence, meditative object, and ritual thread running through every day of the cycle.'],
  ['Encounter the Goddess’s many forms', 'From the benevolent, four-armed Bhuvaneśvarī to the world-devouring Virāj, and sit with the question of how they all express the same divine absolute.'],
  ['Learn her yogas', 'The yoga of knowledge, the eight-limbed and serpentine disciplines, and the paths of devotion, as she herself teaches them.'],
  ['Understand Śākta cosmotheism', 'How “the Goddess is the world” differs from both illusionism and pantheism, and what that difference asks of a practitioner.'],
  ['Install the practice in the body', 'A Tantric mode of practice through mantra meditation, always returning to an experiential sense of Devī flowering from the lotus of your heart.'],
];

const TIERS = [
  ['Benefactor', '$297+', 'Covers your place and sponsors a scholarship for someone who needs it.'],
  ['Sustainer', '$149', 'Supports the teachings and keeps the container open to all.'],
  ['Community', '$79', 'A meaningful offering that honors the exchange.', true],
  ['Accessible', 'Any', 'Pay what you can, from $1. Your presence and participation is the offering.'],
];

const FAQ = [
  ['Do I need to know Sanskrit or have read the Devī Gītā?', 'Not at all. Every Sanskrit term is translated and explained, and we read the text together one chapter at a time. Newcomers and long-time students of the Goddess traditions will each find a depth that suits them.'],
  ['What if I can’t make it live?', 'Every session is recorded and available within 24 hours, so you can follow along at your own pace. Joining after the festival has begun? You can catch up on the recordings and join the rest live.'],
  ['When are the sessions?', 'Daily from Sunday, October 11 to Tuesday, October 20, 2026, at 9am ET, live on Zoom. Each session runs about 60 minutes.'],
  ['How does “pay what you can” work?', 'Choose the amount that fits your situation. The tiers are a guide: larger offerings quietly fund scholarships for those who need them, and no one is turned away for lack of funds. Everyone receives the same program.'],
  ['What if it isn’t right for me?', 'Refund requests made within 30 days of purchase are fully honored. Write to hello@embodiedphilosophy.com and we’ll issue your refund within 5 business days.'],
];

export default async function Navaratri() {
  const site = await getSite();
  const checkout = site.links.navaratriCheckout || 'https://embodiedphil.samcart.com/products/navaratri-2026';
  return (
    <>
      <style>{CSS}</style>
      <section className="hero page-hero">
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow">A Fall Sādhana · Pay what you can</span>
            <h1>Navarātri &amp; the Devī Gītā</h1>
            <p className="sub">Ten nights with the “Song of the Goddess.” Study Śākta Tantrik teachings on cosmology, yoga and devotion, and join a daily practice of recitation, visualization and journaling anchored in mantra meditation.</p>
            <p className="upnext" style={{ marginTop: 18 }}><b>10 live sessions · October 11–20, 2026 · 9am ET</b></p>
            <p className="nv-note">Live on Zoom with Jacob Kyle and Tova Olsson. Recordings within 24 hours.</p>
            <div className="btns" style={{ marginTop: 22 }}>
              <a className="btn btn-primary" href={checkout}>Reserve your place — pay what you can</a>
              <a className="btn btn-ghost" href="#curriculum">See the ten days</a>
            </div>
          </div>
          <div className="hero-aside">
            <div className="collage grain-vermilion hero-collage nv-collage">
              <svg className="ring ring-tr" viewBox="0 0 40 40" aria-hidden="true">
                <path d={RING} fill="none" stroke="#EBA329" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <img className="cut" src={IMG.durga} alt="The Goddess Durgā riding a tiger, holding weapons in her many arms" />
            </div>
          </div>
        </div>
      </section>

      <section className="sec"><div className="wrap hs-intro">
        <div className="hs-stat"><div className="n">507</div><div className="l">Verses in her song</div></div>
        <div className="prose">
          <p>Most yoga practitioners and students of South Asian philosophy know the <i>Bhagavad Gītā</i>, the “Song of the Lord.” Fewer know the <i>Devī Gītā</i>, the “Song of the Goddess.”</p>
          <p>Yet it may be the more relevant text for many of us, especially devotees of the Goddess and those drawn to a non-dual Tantrik worldview. Some Śāktas even regard it as the supreme scripture, one that both complements and completes all others.</p>
          <p className="hs-ask">Join us this Navarātri, and immerse yourself in the wisdom of the Goddess.</p>
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">A Fall Sādhana</span><h2>We take the text at the pace of the festival</h2>
          <p>One chapter each night. Our sādhana opens on Ghaṭasthāpana, the morning the Kalaśa is established and the Goddess is invoked into the vessel, and closes on Vijayadaśamī, the day of visarjana.</p></div>
        <div className="path-grid">
          <div className="tier"><h3>10 live sessions</h3><p>Daily, October 11–20, at 9am ET on Zoom. About 60 minutes each, recorded for anyone who can’t attend live.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--ochre)' }}><h3>One chapter a night</h3><p>The ten chapters of the <i>Devī Gītā</i>, read in step with the ten days of the festival, from her appearance to her disappearance.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--pine)' }}><h3>Study &amp; practice</h3><p>Teaching alongside a daily process of recitation, visualization and journaling, anchored in mantra meditation on Hrīṃ.</p></div>
        </div>
      </div></section>

      <section className="sec"><div className="wrap prose hs-swan">
        <span className="eyebrow">The text</span>
        <h2>A Goddess who is subservient to none</h2>
        <p>Written around the thirteenth century, seemingly modelled on the <i>Bhagavad Gītā</i>, and drawing on several philosophical systems (<i>darśana</i>), the <i>Devī Gītā</i> sings the praise of a Goddess who is subservient to none.</p>
        <p>Like the <i>Bhagavad Gītā</i>, it is part of a much longer work, though it often circulates on its own. Its 507 verses form the last ten chapters of the seventh book of the <i>Devī-Bhāgavata Purāṇa</i>, one of the most important Purāṇic texts of the Śāktas.</p>
        <p>The text opens in the traditional setting of the conflict between gods and demons. The Goddess appears to console the gods, defeated by the demon Tāraka, and to restore them to their celestial realms. Yet the battle itself, unlike in earlier Śākta texts such as the <i>Devī Māhātmya</i>, is given very little room. Its real focus is devotional, philosophical and spiritual counsel, apart from any cosmic or social crisis.</p>
        <blockquote className="hs-verse">Just as Kṛṣṇa offers Arjuna his wisdom more than his strength in battle, so too the Goddess offers her wisdom teachings to her devotee, the Mountain King Himālaya.</blockquote>
        <p>Chapter 10 ends with the Devī dismissed from the external image, led back into the lotus of the heart, and then vanishing from sight: the same gesture the whole subcontinent performs as the images go to the water. We read her disappearance on the day she disappears.</p>
      </div></section>

      <section className="sec path" id="curriculum"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The ten-day curriculum</span><h2>Ten nights with the Song of the Goddess</h2>
          <p>Jacob and Tova alternate leading each night, and open and close the cycle together.</p></div>
        <ol className="nv-days">
          {DAYS.map(([n, date, festival, title, lead, desc]) => (
            <li key={n} className="nv-day">
              <div className="nv-when">
                <span className="nv-n">{n}</span>
                <span className="nv-date">{date}</span>
                {festival && <span className="nv-fest">{festival}</span>}
              </div>
              <div className="nv-body">
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="nv-lead">With {lead}</span>
              </div>
            </li>
          ))}
        </ol>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">What you’ll take away</span><h2>By the end of this Navarātri sādhana</h2></div>
        <div className="nv-outcomes">
          {OUTCOMES.map(([h, p]) => <div key={h} className="hs-step"><h3>{h}</h3><p>{p}</p></div>)}
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Your teachers</span><h2>Two scholar-practitioners of the Goddess traditions</h2></div>
        <div className="hs-two">
          <div className="nv-teacher">
            <img src={IMG.jacob} alt="Jacob Kyle" />
            <div className="prose">
              <h3>Jacob Kyle</h3>
              <p className="nv-role">Founding Director, Embodied Philosophy</p>
              <p>Meditation teacher, writer, philosophy educator, and Founding Director of Embodied Philosophy. His guiding mission is to re-imagine the modern role of the yoga teacher in alignment with the teachings, texts and traditions of yoga’s profound history.</p>
              <p>Jacob is a doctoral student at the University of Oxford, researching Pratyabhijñā philosophy with Diwakar Acharya and Monima Chadha. He holds an MPhil in Classical Indian Religions from Oxford, an MA in Philosophy from the New School for Social Research, and an MSc in Political Theory from the London School of Economics, and is a devoted practitioner of the Śaiva-Śākta darśana.</p>
            </div>
          </div>
          <div className="nv-teacher">
            <img src={IMG.tova} alt="Tova Olsson" />
            <div className="prose">
              <h3>Tova Olsson</h3>
              <p className="nv-role">Founder, Saraswati Studies</p>
              <p>A scholar of religion, author and yoga teacher with over twenty years of experience in education, loved for her deep knowledge, her gift for making esoteric ideas accessible, her immersive storytelling, and her heart-led teaching.</p>
              <p>Tova holds an MA in Religious Studies and is completing a PhD on the construction of gender in contemporary tantra in Europe. She is the author of <i>Yoga and Tantra: History, Philosophy and Mythology</i> (Motilal Banarsidass), runs the online school Saraswati Studies, and teaches on several international yoga teacher trainings.</p>
            </div>
          </div>
        </div>
      </div></section>

      <section className="sec" id="join"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Pay what you can</span><h2>Choose the offering that fits your life</h2>
          <p>This many hours of study and practice would usually be priced at $197. We offer it by donation so that everyone who wants to can take part. If you’re in a more fluid financial position, you can help subsidize those who aren’t. No one is turned away for lack of funds.</p></div>
        <div className="hs-tiers">
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
          <a className="btn btn-primary" href={checkout}>Reserve your place — choose your amount</a>
          <p>You’ll enter your amount at checkout. Every offering receives the full program.</p>
          <p>Refund requests within 30 days are fully honored.</p>
        </div>
      </div></section>

      <section className="sec path"><div className="wrap prose">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>

      <section className="sec"><div className="wrap hs-close">
        <p className="skt">oṃ hrīṃ</p>
        <h2>Ten nights with the Goddess.</h2>
        <p>Deepen your connection to the Devī and invite her wisdom into your daily life.</p>
        <a className="btn btn-primary" href={checkout}>Reserve your place</a>
      </div></section>
    </>
  );
}
