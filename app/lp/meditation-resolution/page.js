import { getSite, photoKey } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: 'Meditation Resolution 2027: A New Year Symposium — Pay What You Can — Embodied Philosophy',
  description: 'Begin 2027 in practice. Five days, January 1–5: five guided meditations on dhāraṇā, dhyāna and samādhi, and five lectures on the world’s traditions of meditation. Pay what you can, including nothing.',
};

// Session times: leave empty until they're confirmed, and the page says the times come with the confirmation email.
const TIME = '';

// [n, date, limb, meditation title, sūtra, reference, meditation, lecture tradition, lecture title, lecture]
const DAYS = [
  ['1', 'Fri Jan 1', 'Dhāraṇā', 'Binding attention to a place',
    'deśabandhaś cittasya dhāraṇā', 'Yoga Sūtra 3.1',
    'Patañjali’s definition is spatial: dhāraṇā is “binding the mind to a place.” The commentary names the places: the navel, the lotus of the heart, the light in the head, the tip of the nose, or an outer object. We choose one, and practise the simplest act in meditation, which is coming back.',
    'Classical Yoga', 'Patañjali’s map of the mind',
    'What the Yoga Sūtra means by the mind (citta) and its fluctuations, why it puts the three inner limbs last of eight, and what it thinks meditation is for.'],
  ['2', 'Sat Jan 2', 'Dhyāna', 'The unbroken stream',
    'tatra pratyayaikatānatā dhyānam', 'Yoga Sūtra 3.2',
    'When returning stops being effort, dhāraṇā becomes dhyāna: “a single, continuous extension of awareness there.” The commentary describes a stream of like moments of awareness that no other kind of thought breaks into.',
    'Buddhist traditions', 'Calm and insight',
    'Śamatha and vipaśyanā, and the four jhānas (jhāna is the Pali form of dhyāna). How Buddhist meditation shares Patañjali’s vocabulary, and where it disagrees about what meditation reveals.'],
  ['3', 'Sun Jan 3', 'Samādhi', 'Only the object shines',
    'tad evārthamātranirbhāsaṃ svarūpaśūnyam iva samādhiḥ', 'Yoga Sūtra 3.3',
    'Samādhi is “that same meditation, when only the object shines forth, as if empty of its own form.” The sense of doing the meditation drops away. We look at what the “as if” (iva) is doing, and why the tradition never says the self simply vanishes.',
    'Christian contemplation', 'Prayer without images',
    'From the Desert Fathers to The Cloud of Unknowing: contemplative prayer as a letting go of thoughts and images, read alongside samādhi “as if empty of its own form.”'],
  ['4', 'Mon Jan 4', 'Saṃyama', 'The three held as one',
    'trayam ekatra saṃyamaḥ · tajjayāt prajñālokaḥ', 'Yoga Sūtra 3.4–5',
    '“The three on a single object is saṃyama,” literally a “holding together.” Mastering it, Patañjali says, brings the light of insight (prajñāloka). We practise the three as one movement.',
    'Meditation and the modern mind', 'Attention, then and now',
    'What today’s research on attention and mind-wandering can and can’t tell us about saṃyama. An opening to Wisdom School’s 2027 theme, The Attention Project.'],
  ['5', 'Tue Jan 5', 'Recognition', 'The supreme meditation',
    'yogena yogo jñātavyaḥ', 'Yoga Bhāṣya on 3.6',
    'We close with a dhāraṇā from the Vijñāna Bhairava, practised as recognition rather than effort, and with the commentary’s advice for the year ahead: “yoga is known through yoga.”',
    'Kashmir Śaivism', 'Meditation as recognition',
    'How Abhinavagupta and Kṣemarāja reread the limbs of yoga, and why the Pratyabhijñā tradition treats the goal of meditation as something recognized, not produced.'],
];

// The symposium faculty. Photos come from the Teachers tab (site.photos); a teacher without one shows initials.
const TEACHERS = [
  ['Nataraj Chaitanya', 'Faculty, Wisdom School & Sādhana School',
    'Has led retreats, kīrtans and teacher trainings for more than twenty years. A formal initiate and custodian of the meditation tradition of Bhagavan Nityananda of Ganeshpuri; based in Melbourne.'],
  ['Tova Olsson', 'Founder, Saraswati Studies',
    'Scholar of religion, author and yoga teacher with over twenty years in education. Author of Yoga and Tantra: History, Philosophy and Mythology, and co-teacher of our Navarātri immersion in the Devī Gītā.'],
  ['Floss Harry', 'Faculty, Meditation Mondays',
    'Yoga teacher and embodied philosophy facilitator (MPhil, Cambridge) who approaches philosophy as lived practice, drawing on the wisdom traditions of East and West. Leads the Somatic stream of Meditation Mondays.'],
  ['Oneika Mays', 'Faculty, Meditation Mondays',
    'Leads the Metta stream of Meditation Mondays: loving-kindness practice that widens care from yourself outward, one breath at a time.'],
  ['Dr. Abha Rajbhandari', 'Faculty, Meditation Mondays',
    'Leads the Neuroscience & Yoga stream of Meditation Mondays, teaching what attention, breath and stillness do in the nervous system, and how to use them.'],
];
// Photos already on ep-media, used if the Teachers tab has none.
const PHOTOS = { 'floss harry': 'https://nustrh8agxtgmkrb.public.blob.vercel-storage.com/teachers/floss-harry.jpg' };
const initials = n => n.replace(/^Dr\.?\s+/, '').split(/\s+/).map(w => w[0]).slice(0, 2).join('');

const SUTRAS = [
  ['3.1', 'deśabandhaś cittasya dhāraṇā', 'Dhāraṇā is binding the mind to a place.'],
  ['3.2', 'tatra pratyayaikatānatā dhyānam', 'Dhyāna is the unbroken extension of awareness there.'],
  ['3.3', 'tad evārthamātranirbhāsaṃ svarūpaśūnyam iva samādhiḥ', 'Samādhi is that same meditation, when only the object shines forth, as if empty of its own form.'],
  ['3.4', 'trayam ekatra saṃyamaḥ', 'The three on a single object is saṃyama.'],
  ['3.5', 'tajjayāt prajñālokaḥ', 'From mastering it comes the light of insight.'],
  ['3.6', 'tasya bhūmiṣu viniyogaḥ', 'It is applied in stages.'],
];

const TIERS = [
  ['Scholarship seat', '$108', 'Covers your place and helps fund a scholarship seat in Sādhana School.'],
  ['Sharing', '$54', 'Covers your place and helps cover someone else’s.'],
  ['Your place', '$27', 'Covers your own place and pays the teachers for their time.', true],
  ['Whatever you can', 'Any', 'Including nothing. If you can’t give this year, please come anyway.'],
];

const NEXT = [
  ['Meditation Pass', 'Meditation Mondays, live every week with Embodied Philosophy faculty, plus the replays.', '/meditation-pass'],
  ['Wisdom School', '2027 is The Attention Project: a year of study on the faculty this week trains, plus Meditation Mondays.', '/wisdom-school'],
  ['Sādhana School', 'For those ready to go deeper. The Winter term, The Many Faces of Kālī, begins January 27.', '/sadhana-school'],
];

const FAQ = [
  ['Do I need experience with meditation?', 'None. The meditations are guided from the beginning and build on one another, and every Sanskrit term in the lectures is translated and explained. Long-time practitioners will find plenty to go deeper with.'],
  ['Do I have to come to both sessions each day?', 'No. Come to whichever you can. Many people sit the meditation live and watch the lecture later. Every session is recorded, and the replays stay in your dashboard.'],
  ['When are the sessions?', TIME
    ? `Daily from Friday, January 1 to Tuesday, January 5, 2027, ${TIME}, live on Zoom.`
    : 'Daily from Friday, January 1 to Tuesday, January 5, 2027, live on Zoom. The times, and how to join, come in your confirmation email.'],
  ['How does “pay what you can” work?', 'You choose your amount when you register, and it can be nothing. The suggestions are a guide: $27 covers your own place, and anything above that helps someone else take part. Everyone receives all ten sessions.'],
  ['Why a symposium?', 'The Greek symposion meant “drinking together.” Ours is a gathering to sit and think together: a practice each morning of the new year, and a conversation across the traditions that have mapped the same inner territory.'],
  ['What if it isn’t right for me?', 'If you gave a contribution and want it back, write to hello@embodiedphilosophy.com within 30 days and we’ll refund it within 5 business days.'],
];

// Campaign art (MR27 collage series), one tile per day: [image, ground colour, text is dark?]
const ART = n => `/mr27/collage-${n}.webp`;
const DAY_ART = [
  ['02', '#E790BB', true],   // the eye on the target: dhāraṇā
  ['04', '#93BADB', true],   // moon over the waves: dhyāna
  ['05', '#16151B', false],  // the figure dissolving into gold: samādhi
  ['07', '#78B5B0', true],   // three circles held as one: saṃyama
  ['03', '#EFB399', true],   // the wheel between two hands: recognition
];

function Rings() {
  return (
    <svg className="mr-target" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="56" /><circle cx="60" cy="60" r="40" /><circle cx="60" cy="60" r="24" />
      <circle className="dot" cx="60" cy="60" r="9" />
    </svg>
  );
}

export default async function MeditationResolution() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return (
    <div className="mr">
      <style>{CSS}</style>

      <section className="mr-sec mr-indigo mr-hero"><div className="wrap mr-split">
        <div>
          <span className="mr-label">Pay what you can</span>
          <h1>Meditation Resolution 2027</h1>
          <p className="mr-sub">A New Year Symposium on Saṃyama</p>
          <p className="mr-lede">Five guided meditations on the three inner limbs of yoga, <i>dhāraṇā</i>, <i>dhyāna</i> and <i>samādhi</i>. Five lectures on how the world’s traditions have practised them. One point to return to, all year.</p>
          <ul className="mr-facts"><li>January 1–5, 2027</li><li>5 meditations · 5 lectures</li><li>Live on Zoom, with replays</li></ul>
          <div className="mr-btns">
            <a className="mr-btn mr-btn-gold" href={checkout}>Save your place</a>
            <a className="mr-btn mr-btn-line" href="#days">See the five days</a>
          </div>
        </div>
        <img className="mr-art mr-hero-art" src={ART('01')} alt="A gold-leaf meditator with a bindu at the crown, inside concentric rings" />
      </div></section>

      <section className="mr-sec mr-orange"><div className="wrap mr-split mr-split-rev">
        <img className="mr-art" src={ART('06')} alt="A collage of a seated yogi inside an arch, with a gold triangle at the heart" />
        <div>
          <h2 className="mr-big">Begin the new year with attention.</h2>
          <p>Each January, Embodied Philosophy opens the year with Meditation Resolution. We’ve sat with the five elements, the five kleśas and the five kośas. This year we go to the heart of meditation itself.</p>
          <p>Most resolutions fail for the same reason most meditation sessions feel like failures: the mind wanders. The yoga tradition doesn’t treat that as a problem to fix before practice begins. Wandering, and returning, <i>is</i> the practice. The third chapter of the <i>Yoga Sūtra</i> describes where the returning leads, and the symposium asks how other traditions have mapped the same road.</p>
        </div>
      </div></section>

      <section className="mr-sec mr-cream" id="days"><div className="wrap">
        <span className="mr-label mr-label-ink">The five days</span>
        <h2 className="mr-h2">A meditation and a lecture, every day.</h2>
        <ol className="mr-days">
          {DAYS.map(([n, date, limb, mt, skt, ref, md, trad, lt, ld], i) => {
            const [img, ground, dark] = DAY_ART[i];
            return (
              <li key={n} className={`mr-day${dark ? '' : ' mr-day-light'}`} style={{ background: ground }}>
                <div className="mr-day-art"><img src={ART(img)} alt="" /><span className="mr-day-n">{n}</span></div>
                <div className="mr-day-body">
                  <p className="mr-day-when">{date} · <i>{limb}</i></p>
                  <div className="mr-day-cols">
                    <div>
                      <p className="mr-tag">Meditation</p>
                      <h3>{mt}</h3>
                      <p className="mr-skt">{skt} <span>{ref}</span></p>
                      <p>{md}</p>
                    </div>
                    <div>
                      <p className="mr-tag">Lecture · {trad}</p>
                      <h3>{lt}</h3>
                      <p>{ld}</p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div></section>

      <section className="mr-sec mr-paper"><div className="wrap mr-split mr-split-rev">
        <figure className="mr-limbs">
          <img className="mr-art" src={ART('09')} alt="Three collage panels: a target on pink, a seated sage on blue, and gold leaf" />
          <figcaption><span><b>Dhāraṇā</b>concentration</span><span><b>Dhyāna</b>meditation</span><span><b>Samādhi</b>absorption</span></figcaption>
        </figure>
        <div>
          <h2 className="mr-big mr-ink">Three limbs. One practice.</h2>
          <p><i>Dhāraṇā</i> comes from <i>√dhṛ</i>, to hold. <i>Dhyāna</i> from <i>√dhyai</i>, to contemplate. <i>Samādhi</i> is a “placing together,” and <i>saṃyama</i> a “holding together.” Concentration that deepens becomes meditation; meditation that deepens becomes absorption.</p>
          <p>Patañjali calls these the <i>inner</i> limbs, then says that even they are outer compared with seedless (<i>nirbīja</i>) samādhi (<i>Yoga Sūtra</i> 3.8). In Kashmir, Kṣemarāja rewrote each limb as a mode of recognition: samādhi is not something you build but something you recognize. <a href="https://read.tarkajournal.com/p/patanjalis-eight-limbs-are-only-one">Read more in Tarka →</a></p>
        </div>
      </div></section>

      <section className="mr-sec mr-plum" id="teachers"><div className="wrap">
        <div className="mr-head-art">
          <div>
            <span className="mr-label">Your teachers</span>
            <h2 className="mr-h2">Five teachers, five traditions.</h2>
            <p className="mr-intro">The symposium is led by Embodied Philosophy faculty, each bringing a lineage and a way of sitting. More teachers may be announced.</p>
          </div>
          <img className="mr-art mr-corner" src={ART('10')} alt="" />
        </div>
        <div className="mr-teachers">
          {TEACHERS.map(([name, role, bio]) => {
            const photo = site.photos?.[photoKey(name)] || PHOTOS[photoKey(name)];
            return (
              <article key={name} className="mr-teacher">
                {photo ? <img src={photo} alt={name} /> : <span className="mr-initials" aria-hidden="true">{initials(name)}</span>}
                <h3>{name}</h3>
                <p className="mr-role">{role}</p>
                <p>{bio}</p>
              </article>
            );
          })}
        </div>
      </div></section>

      <section className="mr-sec mr-cream"><div className="wrap mr-sutra-wrap">
        <div>
          <span className="mr-label mr-label-ink">The source</span>
          <h2 className="mr-h2">Six sūtras that hold the whole practice.</h2>
          <ol className="mr-sutras">
            {SUTRAS.map(([n, skt, en]) => (
              <li key={n}><span>YS {n}</span><p className="mr-skt">{skt}</p><p>{en}</p></li>
            ))}
          </ol>
          <p className="mr-fine">Translations by Embodied Philosophy.</p>
        </div>
        <img className="mr-art mr-tree" src={ART('08')} alt="A collage of a tree of the subtle body rooted in two hands" />
      </div></section>

      <section className="mr-sec mr-indigo mr-quote-sec"><div className="wrap">
        <Rings />
        <blockquote className="mr-quote">Yoga is known through yoga. Yoga arises from yoga. Whoever is attentive in yoga delights in yoga for a long time.<cite>Yoga Bhāṣya on Yoga Sūtra 3.6</cite></blockquote>
      </div></section>

      <section className="mr-sec mr-pink" id="join"><div className="wrap">
        <span className="mr-label mr-label-ink">Pay what you can</span>
        <h2 className="mr-h2">No one is kept out by price.</h2>
        <p className="mr-intro">A set price keeps out exactly the people a new-year practice is for. So we ask everyone to give what’s true for them, and trust that it balances out. Every teacher who leads a session is paid for their time.</p>
        <div className="mr-tiers">
          {TIERS.map(([name, amt, desc, suggested]) => (
            <article key={name} className={`mr-tier${suggested ? ' on' : ''}`}>
              {suggested && <span className="mr-label mr-badge">Suggested</span>}
              <h3>{name}</h3><div className="amt">{amt}</div><p>{desc}</p>
            </article>
          ))}
        </div>
        <div className="mr-center">
          <a className="mr-btn mr-btn-indigo" href={checkout}>Save your place — choose your amount</a>
          <p>Choose your amount when you register. Everyone receives all ten sessions.</p>
        </div>
      </div></section>

      <section className="mr-sec mr-blue"><div className="wrap">
        <span className="mr-label mr-label-ink">After the five days</span>
        <h2 className="mr-h2">Keep the resolution.</h2>
        <div className="mr-next">
          {NEXT.map(([h, p, href]) => (
            <a key={h} href={href} className="mr-next-card"><h3>{h}</h3><p>{p}</p><span>Learn more →</span></a>
          ))}
        </div>
      </div></section>

      <section className="mr-sec mr-paper"><div className="wrap mr-faq">
        <h2 className="mr-h2">Questions</h2>
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>

      <section className="mr-sec mr-black mr-close"><div className="wrap">
        <Rings />
        <p className="mr-skt">trayam ekatra saṃyamaḥ</p>
        <h2>Three limbs. One point. A whole year.</h2>
        <a className="mr-btn mr-btn-gold" href={checkout}>Save your place</a>
      </div></section>
    </div>
  );
}

// Palette sampled from the MR27 campaign images.
const CSS = `
.mr{--indigo:#2A234F;--pink:#E790BB;--peach:#EFB399;--sky:#93BADB;--black:#16151B;--orange:#E8603A;--teal:#78B5B0;--cream:#F2ECE0;--paper:#F8F5EE;--plum:#582550;--gold:#D9A93A;--ivory:#FBF8F1;--ink:var(--indigo);color:var(--ink);background:var(--paper)}
.mr p{line-height:1.6}
.mr i{font-style:italic}
.mr a{color:inherit}
.mr-sec{padding:104px 0}
.mr-indigo{background:var(--indigo);color:var(--ivory)}.mr-orange{background:var(--orange);color:var(--ivory)}
.mr-cream{background:var(--cream)}.mr-paper{background:var(--paper)}.mr-plum{background:var(--plum);color:var(--ivory)}
.mr-pink{background:var(--pink)}.mr-blue{background:var(--sky)}.mr-black{background:var(--black);color:var(--ivory)}

/* type: italic serif display, small sans labels */
.mr h1,.mr-h2,.mr-big,.mr h3,.mr-sub,.mr-quote,.mr-close h2{font-family:var(--font-serif),serif;font-style:italic;font-weight:500;letter-spacing:-.3px}
.mr h1{font-size:clamp(54px,7.4vw,104px);line-height:.95;margin:22px 0 0;color:var(--ivory)}
.mr-sub{font-size:clamp(22px,2.4vw,30px);color:var(--gold);margin:16px 0 0}
.mr-h2{font-size:clamp(36px,4.4vw,58px);line-height:1.02;margin:14px 0 26px;color:inherit}
.mr .mr-big{font-size:clamp(38px,4.6vw,62px);line-height:1.02;margin:0 0 26px;color:inherit}
.mr-ink{color:var(--indigo)}
.mr-label{display:inline-block;background:var(--gold);color:var(--black);font-family:var(--font-sans),sans-serif;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;padding:6px 10px}
.mr-label-ink{background:var(--indigo);color:var(--ivory)}
.mr-intro{max-width:640px;font-size:17.5px;margin:-6px 0 40px;opacity:.9}
.mr-lede{max-width:540px;font-size:18.5px;color:rgba(251,248,241,.85);margin:26px 0 0}
.mr-facts{list-style:none;padding:0;margin:24px 0 0;display:flex;flex-wrap:wrap;gap:8px}
.mr-facts li{border:1px solid rgba(251,248,241,.35);font-size:13px;padding:7px 12px;color:rgba(251,248,241,.9)}

/* collage pieces: white torn-paper edge, soft shadow */
.mr-art{display:block;width:100%;height:auto}
.mr-split{display:grid;grid-template-columns:1.05fr .95fr;gap:72px;align-items:center}
.mr-split-rev{grid-template-columns:.9fr 1.1fr}
.mr-orange p,.mr-paper .mr-split p{font-size:17.5px;margin:0 0 16px}
.mr-orange p{color:rgba(251,248,241,.95)}
.mr-paper .mr-split a{text-decoration:underline;text-underline-offset:3px}

/* buttons */
.mr-btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.mr-btn{display:inline-block;padding:16px 28px;font-weight:700;font-size:15px;text-decoration:none;border:1.5px solid transparent;transition:transform .2s,filter .2s}
.mr-btn:hover{transform:translateY(-2px);filter:brightness(1.06)}
.mr-btn-gold{background:var(--gold);color:var(--black)!important}
.mr-btn-line{border-color:rgba(251,248,241,.6);color:var(--ivory)!important}
.mr-btn-indigo{background:var(--indigo);color:var(--ivory)!important}

/* days: one coloured panel per day, with its collage */
.mr-days{list-style:none;padding:0;margin:0;display:grid;gap:22px}
.mr-day{display:grid;grid-template-columns:300px 1fr;color:var(--indigo);box-shadow:0 1px 0 rgba(0,0,0,.04)}
.mr-day-light{color:var(--ivory)}
.mr-day-art{position:relative}
.mr-day-art img{display:block;width:100%;height:100%;object-fit:cover}
.mr-day-n{position:absolute;left:18px;bottom:6px;font-family:var(--font-serif),serif;font-style:italic;font-size:88px;line-height:1;color:var(--ivory);text-shadow:0 2px 14px rgba(0,0,0,.25)}
.mr-day-body{padding:34px 38px}
.mr-day-when{font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin:0 0 14px}
.mr-day-when i{font-family:var(--font-serif),serif;font-size:20px;letter-spacing:0;text-transform:none;font-weight:500}
.mr-day-cols{display:grid;grid-template-columns:1fr 1fr;gap:34px}
.mr-day-cols>div+div{border-left:1px solid currentColor;padding-left:34px;border-color:rgba(42,35,79,.25)}
.mr-day-light .mr-day-cols>div+div{border-color:rgba(251,248,241,.25)}
.mr-tag{font-size:10.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;opacity:.75}
.mr-day h3{font-size:28px;line-height:1.08;margin:0 0 8px}
.mr-day-cols p:last-child{font-size:15px;margin:0;opacity:.88}
.mr-skt{font-family:var(--font-serif),serif;font-style:italic;font-size:18px;line-height:1.35!important;margin:0 0 10px}
.mr-skt span{font-family:var(--font-sans),sans-serif;font-style:normal;font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;opacity:.65;margin-left:4px}
.mr-day-light .mr-skt{color:var(--gold)}

/* three limbs */
.mr-limbs{margin:0}
.mr-limbs figcaption{display:grid;grid-template-columns:repeat(3,1fr);margin-top:-6px;padding:0 6%;text-align:left}
.mr-limbs figcaption span{font-size:12px;color:#6D6488}
.mr-limbs figcaption b{display:block;font-family:var(--font-serif),serif;font-size:20px;font-weight:600;color:var(--indigo)}

/* teachers */
.mr-head-art{display:grid;grid-template-columns:1fr 260px;gap:40px;align-items:center}
.mr-corner{width:260px;margin-top:-40px}
.mr-teachers{display:grid;grid-template-columns:repeat(5,1fr);gap:28px;margin-top:10px}
.mr-teacher img,.mr-initials{display:flex;align-items:center;justify-content:center;width:128px;height:128px;border-radius:50%;object-fit:cover;border:5px solid var(--ivory);box-shadow:0 6px 18px rgba(0,0,0,.28)}
.mr-initials{background:radial-gradient(circle at 35% 30%,#F0C766,var(--gold) 55%,#B9862A);font-family:var(--font-serif),serif;font-style:italic;font-size:44px;color:var(--plum)}
.mr-teacher h3{font-size:26px;line-height:1.1;margin:22px 0 6px;color:var(--ivory)}
.mr .mr-role{font-size:10.5px;letter-spacing:1.8px;text-transform:uppercase;font-weight:700;color:var(--gold);margin:0 0 10px;line-height:1.5}
.mr-teacher p:last-child{font-size:14.5px;color:rgba(251,248,241,.8);margin:0}

/* sūtras */
.mr-sutra-wrap{display:grid;grid-template-columns:1fr 330px;gap:56px;align-items:start}
.mr-tree{position:sticky;top:110px}
.mr-sutras{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mr-sutras li{background:var(--ivory);padding:22px 22px 20px;box-shadow:0 1px 0 rgba(42,35,79,.08)}
.mr-sutras span{font-size:10.5px;letter-spacing:2px;font-weight:700;color:var(--orange)}
.mr-sutras .mr-skt{font-size:20px;margin:8px 0 6px;color:var(--plum)}
.mr-sutras p:last-child{font-size:15px;margin:0;color:#4B4469}
.mr-fine{font-size:13px;color:#6D6488;margin:14px 0 0}

/* quote */
.mr-quote-sec{text-align:center;padding:96px 0}
.mr-target{width:110px;height:110px;margin:0 auto 26px;display:block}
.mr-target circle{fill:none;stroke:rgba(251,248,241,.55);stroke-width:1}
.mr-target circle.dot{fill:var(--gold);stroke:var(--ivory);stroke-width:3}
.mr-quote{max-width:820px;margin:0 auto;font-size:clamp(26px,3.2vw,40px);line-height:1.18;color:var(--ivory)}
.mr-quote cite{display:block;margin-top:18px;font-family:var(--font-sans),sans-serif;font-style:normal;font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:var(--gold)}

/* pay what you can */
.mr-tiers{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.mr-tier{position:relative;background:var(--ivory);padding:30px 24px 26px}
.mr-tier h3{font-size:25px;margin:0;line-height:1.1}
.mr-tier .amt{font-family:var(--font-serif),serif;font-size:56px;font-weight:600;line-height:1;margin:14px 0 12px;color:var(--plum)}
.mr-tier p{font-size:15px;margin:0;color:#4B4469}
.mr-tier.on{background:var(--indigo);color:var(--ivory)}
.mr-tier.on .amt{color:var(--gold)}.mr-tier.on p{color:rgba(251,248,241,.85)}
.mr-badge{position:absolute;top:-12px;left:22px}
.mr-center{text-align:center;margin-top:42px}
.mr-center p{font-size:14px;margin:14px 0 0}

/* next */
.mr-next{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.mr-next-card{display:block;background:var(--ivory);padding:32px 28px;text-decoration:none;transition:transform .2s}
.mr-next-card:hover{transform:translateY(-3px)}
.mr-next-card h3{font-size:30px;margin:0 0 10px}
.mr-next-card p{font-size:15px;color:#4B4469;margin:0 0 16px}
.mr-next-card span{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:var(--orange)}

/* faq */
.mr-faq{max-width:820px}
.mr-faq details{border-bottom:1px solid rgba(42,35,79,.18);padding:20px 0}
.mr-faq summary{font-size:19px;font-weight:600;cursor:pointer}
.mr-faq details p{margin:12px 0 0;font-size:16px;color:#4B4469}

/* close */
.mr-close{text-align:center;padding:130px 0}
.mr-close .mr-skt{color:var(--gold);font-size:22px}
.mr-close h2{font-size:clamp(40px,5.6vw,76px);line-height:1;margin:8px 0 38px;color:var(--ivory)}
.mr-close .mr-target circle.dot{fill:var(--orange)}

@media(max-width:980px){
  .mr-split,.mr-split-rev,.mr-sutra-wrap{grid-template-columns:1fr;gap:44px}
  .mr-hero-art{max-width:460px}
  .mr-tree{position:static;max-width:320px}
  .mr-day{grid-template-columns:220px 1fr}
  .mr-day-cols{grid-template-columns:1fr;gap:22px}.mr-day-cols>div+div{border-left:0;padding-left:0;border-top:1px solid;padding-top:22px}
  .mr-teachers{grid-template-columns:repeat(3,1fr)}.mr-tiers{grid-template-columns:1fr 1fr}.mr-next{grid-template-columns:1fr}
  .mr-head-art{grid-template-columns:1fr 180px}.mr-corner{width:180px}
}
@media(max-width:720px){
  .mr-sec{padding:72px 0}
  .mr-day{grid-template-columns:1fr}.mr-day-art{height:260px}.mr-day-body{padding:26px 22px}
  .mr-head-art{grid-template-columns:1fr}.mr-corner{display:none}
  .mr-teachers{grid-template-columns:1fr 1fr;gap:32px 18px}.mr-teacher img,.mr-initials{width:100px;height:100px}
  .mr-sutras,.mr-tiers{grid-template-columns:1fr}
  .mr-btn{width:100%;text-align:center}
}
`;
