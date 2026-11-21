import PageHero from '@/components/PageHero';
import { getSite } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: 'Meditation Resolution 2027: Saṃyama — Pay What You Can — Embodied Philosophy',
  description: 'Begin 2027 in practice. Five days, January 1–5, with the three inner limbs of yoga: dhāraṇā, dhyāna and samādhi, which Patañjali calls saṃyama. Guided meditation and teaching from Embodied Philosophy faculty. Pay what you can, including nothing.',
};

// Session time: leave empty until it's confirmed, and the page says the times come with the confirmation email.
const TIME = '';

const DAYS = [
  ['1', 'Fri Jan 1', 'Dhāraṇā', 'Binding attention to a place',
    'deśabandhaś cittasya dhāraṇā', 'Yoga Sūtra 3.1',
    'Patañjali’s definition is spatial: dhāraṇā is “binding the mind to a place.” The commentary attributed to Vyāsa names the places: the navel, the lotus of the heart, the light in the head, the tip of the nose, the tip of the tongue, or an outer object. We choose one, and practise the simplest act in meditation, which is coming back.'],
  ['2', 'Sat Jan 2', 'Dhyāna', 'The unbroken stream',
    'tatra pratyayaikatānatā dhyānam', 'Yoga Sūtra 3.2',
    'When the returning stops being effort, dhāraṇā becomes dhyāna: “a single, continuous extension of awareness there.” The commentary describes it as a stream of like moments of awareness that no other kind of thought breaks into.'],
  ['3', 'Sun Jan 3', 'Samādhi', 'Only the object shines',
    'tad evārthamātranirbhāsaṃ svarūpaśūnyam iva samādhiḥ', 'Yoga Sūtra 3.3',
    'Samādhi is “that same meditation, when only the object shines forth, as if empty of its own form.” The meditator’s sense of doing the meditation drops away. We look at what this “as if” (iva) is doing, and why the tradition is careful never to say the self simply vanishes.'],
  ['4', 'Mon Jan 4', 'Saṃyama', 'The three held as one',
    'trayam ekatra saṃyamaḥ · tajjayāt prajñālokaḥ', 'Yoga Sūtra 3.4–5',
    '“The three on a single object is saṃyama,” literally a “holding together.” Mastering it, Patañjali says, brings the light of insight (prajñāloka). We practise the three as one movement, and ask what that light is meant to reveal.'],
  ['5', 'Tue Jan 5', 'Recognition', 'The supreme meditation',
    'yogena yogo jñātavyaḥ', 'Yoga Bhāṣya on 3.6',
    'In Kashmir, Kṣemarāja read the Netra Tantra’s “supreme meditation” (paradhyāna) as a rewriting of every limb: dhāraṇā becomes holding to the supreme Self, and samādhi becomes recognizing what was always already there. We close with a dhāraṇā from the Vijñāna Bhairava, and with the commentary’s advice for the year ahead: “yoga is known through yoga.”'],
];

const SUTRAS = [
  ['3.1', 'deśabandhaś cittasya dhāraṇā', 'Dhāraṇā is binding the mind to a place.'],
  ['3.2', 'tatra pratyayaikatānatā dhyānam', 'Dhyāna is the unbroken extension of awareness there.'],
  ['3.3', 'tad evārthamātranirbhāsaṃ svarūpaśūnyam iva samādhiḥ', 'Samādhi is that same meditation, when only the object shines forth, as if empty of its own form.'],
  ['3.4', 'trayam ekatra saṃyamaḥ', 'The three on a single object is saṃyama.'],
  ['3.5', 'tajjayāt prajñālokaḥ', 'From mastering it comes the light of insight.'],
  ['3.6', 'tasya bhūmiṣu viniyogaḥ', 'It is applied in stages.'],
];

const RHYTHM = [
  ['Arrive', 'A few minutes to settle, set the day’s intention, and name the place where attention will rest.'],
  ['Teaching', 'A short teaching on the day’s sūtra or verse: what the Sanskrit says, and what it asks of a practitioner.'],
  ['Practice', 'Guided meditation on the day’s limb. Most of each session is practice.'],
  ['Carry it', 'One small daily practice to take with you, so the resolution outlasts the week.'],
];

const TIERS = [
  ['Scholarship seat', '$108', 'Covers your place and helps fund a scholarship seat in Sādhana School.'],
  ['Sharing', '$54', 'Covers your place and helps cover someone else’s.'],
  ['Your place', '$27', 'Covers your own place and pays the teachers for their time.', true],
  ['Whatever you can', 'Any', 'Including nothing. If you can’t give this year, please come anyway.'],
];

const NEXT = [
  ['Meditation Pass', 'Meditation Mondays, live every week with Embodied Philosophy faculty, plus the replays.', '/meditation-pass', 'About the Meditation Pass'],
  ['Wisdom School', '2027 is The Attention Project: a year of study on attention, the faculty this week trains, plus Meditation Mondays.', '/wisdom-school', 'About Wisdom School'],
  ['Sādhana School', 'For those ready to go deeper: the Winter term, The Many Faces of Kālī, begins on January 27.', '/sadhana-school', 'About Sādhana School'],
];

const FAQ = [
  ['Do I need experience with meditation?', 'None. Each day is guided from the beginning, and the three limbs build on one another, so a newcomer can start on day one. Long-time practitioners will find the texts and the practice reward a deeper look. Every Sanskrit term is translated and explained.'],
  ['What if I can’t make it live?', 'Every session is recorded, and the replays stay in your dashboard, so you can practise on your own schedule or catch up on a day you missed.'],
  ['When are the sessions?', TIME
    ? `Daily from Friday, January 1 to Tuesday, January 5, 2027, at ${TIME}, live on Zoom.`
    : 'Daily from Friday, January 1 to Tuesday, January 5, 2027, live on Zoom. The times, and how to join, come in your confirmation email.'],
  ['How does “pay what you can” work?', 'You choose your amount when you register, and it can be nothing. The suggestions are a guide: $27 covers your own place, and anything above that helps someone else take part. Everyone receives the same five days.'],
  ['Why saṃyama?', 'A new year’s resolution is a kind of dhāraṇā: you choose one place and keep returning to it. Patañjali’s three inner limbs are the classical map of what happens when that returning deepens. They also lead straight into The Attention Project, Wisdom School’s theme for 2027.'],
  ['What if it isn’t right for me?', 'If you gave a contribution and want it back, write to hello@embodiedphilosophy.com within 30 days and we’ll refund it within 5 business days.'],
];

export default async function MeditationResolution() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return (
    <>
      <style>{CSS}</style>
      <PageHero eyebrow="Meditation Resolution 2027 · Pay what you can" title="Saṃyama: begin the year in practice" img="yogi-padmasana" ground="black" ring="#EBA329"
        lede="Five days with the three inner limbs of yoga: dhāraṇā, dhyāna and samādhi. Patañjali calls them, practised together, saṃyama, a “holding together.” We think it’s the best description of a resolution there is.">
        <p className="upnext" style={{ marginTop: 18 }}><b>5 days · January 1–5, 2027{TIME ? ` · ${TIME}` : ''}</b></p>
        <p className="mr-note">Live on Zoom, with replays. Pay what you can, including nothing.</p>
        <div className="btns" style={{ marginTop: 22 }}>
          <a className="btn btn-primary" href={checkout}>Save your place — pay what you can</a>
          <a className="btn btn-ghost" href="#days">See the five days</a>
        </div>
      </PageHero>

      <section className="sec"><div className="wrap hs-intro">
        <div className="hs-stat"><div className="n">3</div><div className="l">Limbs, held as one</div></div>
        <div className="prose">
          <p>Each January, Embodied Philosophy opens the year with Meditation Resolution. In past years we’ve sat with the five elements, the five kleśas and the five kośas. This year we go to the heart of the practice itself.</p>
          <p>Most resolutions fail for the same reason most meditation sessions feel like failures: the mind wanders. The yoga tradition doesn’t treat that as a problem to be solved before practice begins. Wandering, and returning, <i>is</i> the practice. The third chapter of the <i>Yoga Sūtra</i> describes where that returning leads.</p>
          <p className="hs-ask">Five days to learn it, and a practice to keep for the rest of the year.</p>
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The source</span><h2>Six sūtras that hold the whole practice</h2>
          <p>The opening of the <i>Yoga Sūtra</i>’s third chapter defines the three inner limbs (<i>antaraṅga</i>) in four lines, then says what they are for. We read one line a day.</p></div>
        <ol className="mr-sutras">
          {SUTRAS.map(([n, skt, en]) => (
            <li key={n}><span className="mr-ref">YS {n}</span><p className="mr-skt">{skt}</p><p className="mr-en">{en}</p></li>
          ))}
        </ol>
        <p className="mr-fine">Translations by Embodied Philosophy.</p>
      </div></section>

      <section className="sec" id="days"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The five days</span><h2>From one point to the light of insight</h2>
          <p>Three days, one for each limb. A fourth to hold them together. And a fifth in Kashmir, where the Tantric tradition read all of it as recognition.</p></div>
        <ol className="nv-days">
          {DAYS.map(([n, date, limb, title, skt, ref, desc]) => (
            <li key={n} className="nv-day">
              <div className="nv-when">
                <span className="nv-n">{n}</span>
                <span className="nv-date">{date}</span>
                <span className="nv-fest">{limb}</span>
              </div>
              <div className="nv-body">
                <h3>{title}</h3>
                <p className="mr-day-skt">{skt} <span>· {ref}</span></p>
                <p>{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div></section>

      <section className="sec path"><div className="wrap prose hs-swan">
        <span className="eyebrow">Why it matters</span>
        <h2>Three words for one movement</h2>
        <p>The words themselves are a teaching. <i>Dhāraṇā</i> comes from <i>√dhṛ</i>, to hold or bear. <i>Dhyāna</i> comes from <i>√dhyai</i>, to contemplate. <i>Samādhi</i> is a “placing together,” and <i>saṃyama</i> a “holding together.” Patañjali presents them as stages, but he also says they are one practice. Concentration that deepens becomes meditation; meditation that deepens becomes absorption.</p>
        <p>He calls these three the <i>inner</i> limbs, more intimate than posture or breath. Then he says something more surprising: compared with seedless (<i>nirbīja</i>) samādhi, even these are outer limbs (<i>Yoga Sūtra</i> 3.8). The practice keeps opening inward.</p>
        <blockquote className="hs-verse">Yoga is known through yoga. Yoga arises from yoga. Whoever is attentive in yoga delights in yoga for a long time.<span className="mr-cite">Yoga Bhāṣya on Yoga Sūtra 3.6</span></blockquote>
        <p>The Tantric traditions of Kashmir took these limbs and reread them. The <i>Vijñāna Bhairava</i> offers 112 dhāraṇās, among them the breath, a sound fading into silence, and the space between two thoughts. In his commentary on the <i>Netra Tantra</i>, Kṣemarāja rewrote each of the eight limbs as a mode of recognition (<i>pratyabhijñā</i>): samādhi is not something you build but something you recognize. On the last day we practise in that key. <a href="https://read.tarkajournal.com/p/patanjalis-eight-limbs-are-only-one">Read more in Tarka</a>.</p>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Each day</span><h2>Mostly practice, with a little teaching</h2></div>
        <div className="mr-rhythm">
          {RHYTHM.map(([h, p]) => <div key={h} className="hs-step"><h3>{h}</h3><p>{p}</p></div>)}
        </div>
      </div></section>

      <section className="sec path" id="join"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Pay what you can</span><h2>No one is kept out by price</h2>
          <p>A set price keeps out exactly the people a new-year practice is for. So we ask everyone to give what’s true for them, and we trust that it balances out. Every faculty member who leads a session is paid for their time.</p></div>
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
          <a className="btn btn-primary" href={checkout}>Save your place — choose your amount</a>
          <p>You’ll choose your amount when you register. Everyone receives the same five days.</p>
        </div>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">After the five days</span><h2>Keep the resolution</h2>
          <p>Meditation Resolution is complete in itself. If you want company for the rest of the year, here’s where it continues.</p></div>
        <div className="path-grid">
          {NEXT.map(([h, p, href, cta], i) => (
            <div key={h} className="tier" style={i ? { borderTopColor: i === 1 ? 'var(--ochre)' : 'var(--pine)' } : undefined}>
              <h3>{h}</h3><p>{p}</p><p><a href={href}>{cta} →</a></p>
            </div>
          ))}
        </div>
      </div></section>

      <section className="sec path"><div className="wrap prose">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>

      <section className="sec"><div className="wrap hs-close">
        <p className="skt">trayam ekatra saṃyamaḥ</p>
        <h2>Three limbs. One point. A whole year.</h2>
        <p>Begin 2027 in practice, with everyone sitting beside you.</p>
        <a className="btn btn-primary" href={checkout}>Save your place</a>
      </div></section>
    </>
  );
}

// Page styles (build on the shared hs-* course-page styles in globals.css; nv-days styles shared with Navarātri).
const CSS = `
.mr-note{font-size:14.5px;color:var(--ink-soft);margin-top:-14px}
.mr-sutras{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.mr-sutras li{background:var(--ivory);border:1px solid var(--line);padding:22px 22px 20px;min-width:0}
.mr-ref{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--terra)}
.mr-skt{font-family:var(--font-serif),serif;font-style:italic;font-size:19px;line-height:1.3;margin-top:8px}
.mr-en{font-size:15px;color:var(--ink-soft);margin-top:8px}
.mr-fine{font-size:13px;color:var(--ink-soft);margin-top:14px}
.mr-day-skt{font-family:var(--font-serif),serif;font-style:italic;color:var(--ochre)!important;font-size:16px!important}
.mr-day-skt span{font-family:inherit;font-style:normal;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--ink-soft)}
.mr-cite{display:block;margin-top:10px;font-size:12px;font-style:normal;letter-spacing:1.2px;text-transform:uppercase;color:var(--ink-soft)}
.mr-rhythm{display:grid;grid-template-columns:repeat(4,1fr);gap:28px 24px}
.nv-days{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:20px}
.nv-day{display:grid;grid-template-columns:118px 1fr;gap:20px;background:var(--ivory);border:1px solid var(--line);padding:24px 24px 22px;min-width:0}
.nv-day:last-child{grid-column:1/-1;border-top:3px solid var(--terra)}
.nv-when{display:flex;flex-direction:column;gap:4px;min-width:0}
.nv-n{font-family:var(--font-serif),serif;font-size:46px;line-height:1;color:var(--terra)}
.nv-date{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink-soft)}
.nv-fest{font-family:var(--font-serif),serif;font-style:italic;font-size:17px;color:var(--ochre);line-height:1.2}
.nv-body{min-width:0}
.nv-body h3{font-size:24px;line-height:1.15}
.nv-body p{font-size:15px;color:var(--ink-soft);margin-top:8px}
@media(max-width:980px){.nv-days,.mr-sutras{grid-template-columns:1fr}.mr-rhythm{grid-template-columns:1fr 1fr}}
@media(max-width:720px){.mr-rhythm{grid-template-columns:1fr}.nv-day{grid-template-columns:1fr;gap:12px}.nv-when{flex-direction:row;align-items:baseline;flex-wrap:wrap;gap:4px 12px}.nv-n{font-size:36px}}
`;
