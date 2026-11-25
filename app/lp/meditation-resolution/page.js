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

function Bindu({ className = '' }) {
  return (
    <div className={`mr-bindu ${className}`} aria-hidden="true">
      <span className="r r3" /><span className="r r2" /><span className="r r1" /><span className="dot" />
    </div>
  );
}

export default async function MeditationResolution() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return (
    <div className="mr">
      <style>{CSS}</style>

      <section className="mr-hero">
        <Bindu className="mr-hero-bindu" />
        <div className="wrap mr-hero-in">
          <p className="mr-kicker">January 1–5, 2027 · Pay what you can</p>
          <h1>Meditation<br />Resolution</h1>
          <p className="mr-sub">A New Year Symposium</p>
          <p className="mr-lede">Five guided meditations on the three inner limbs of yoga, <i>dhāraṇā</i>, <i>dhyāna</i> and <i>samādhi</i>. Five lectures on how the world’s traditions have practised them. One point to return to, all year.</p>
          <ul className="mr-facts">
            <li><b>5</b> meditations</li><li><b>5</b> lectures</li><li><b>Live</b> on Zoom, with replays</li>
          </ul>
          <div className="mr-btns">
            <a className="mr-btn" href={checkout}>Save your place</a>
            <a className="mr-btn mr-btn-line" href="#days">See the five days</a>
          </div>
        </div>
      </section>

      <section className="mr-red"><div className="wrap mr-red-in">
        <p className="mr-big">The mind wanders.<br /><em>Wandering, and returning, is the practice.</em></p>
        <div className="mr-red-text">
          <p>Each January, Embodied Philosophy opens the year with Meditation Resolution. We’ve sat with the five elements, the five kleśas and the five kośas. This year we go to the heart of meditation itself.</p>
          <p>Most resolutions fail for the same reason most meditation sessions feel like failures: attention drifts. The yoga tradition doesn’t treat that as a problem to fix before practice begins. The third chapter of the <i>Yoga Sūtra</i> describes where the returning leads, and the symposium asks how other traditions have mapped the same road.</p>
        </div>
      </div></section>

      <section className="mr-dark" id="days"><div className="wrap">
        <p className="mr-eyebrow">The five days</p>
        <h2 className="mr-h2">A meditation and a lecture,<br />every day</h2>
        <ol className="mr-days">
          {DAYS.map(([n, date, limb, mt, skt, ref, md, trad, lt, ld]) => (
            <li key={n} className="mr-day">
              <div className="mr-day-n"><span>{n}</span><b>{date}</b><i>{limb}</i></div>
              <div className="mr-day-col">
                <p className="mr-tag">Meditation</p>
                <h3>{mt}</h3>
                <p className="mr-skt">{skt} <span>{ref}</span></p>
                <p>{md}</p>
              </div>
              <div className="mr-day-col mr-lec">
                <p className="mr-tag">Lecture · {trad}</p>
                <h3>{lt}</h3>
                <p>{ld}</p>
              </div>
            </li>
          ))}
        </ol>
      </div></section>

      <section className="mr-black" id="teachers"><div className="wrap">
        <p className="mr-eyebrow">Your teachers</p>
        <h2 className="mr-h2">Five teachers, five traditions</h2>
        <p className="mr-teach-lede">The symposium is led by Embodied Philosophy faculty, each bringing a lineage and a way of sitting. More teachers may be announced.</p>
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

      <section className="mr-dark"><div className="wrap mr-rings-in">
        <svg className="mr-rings" viewBox="0 0 400 400" aria-hidden="true">
          <circle cx="200" cy="200" r="190" /><circle cx="200" cy="200" r="130" /><circle cx="200" cy="200" r="70" />
          <circle className="core" cx="200" cy="200" r="12" />
          <text x="200" y="38">dhāraṇā</text><text x="200" y="98">dhyāna</text><text x="200" y="158">samādhi</text>
        </svg>
        <div>
          <p className="mr-eyebrow">Three words for one movement</p>
          <h2 className="mr-h2">Concentration deepens into meditation. Meditation deepens into absorption.</h2>
          <p><i>Dhāraṇā</i> comes from <i>√dhṛ</i>, to hold. <i>Dhyāna</i> from <i>√dhyai</i>, to contemplate. <i>Samādhi</i> is a “placing together,” and <i>saṃyama</i> a “holding together.” Patañjali calls these three the <i>inner</i> limbs, then says that even they are outer compared with seedless (<i>nirbīja</i>) samādhi (<i>Yoga Sūtra</i> 3.8). The practice keeps opening inward.</p>
          <p>In Kashmir, Kṣemarāja rewrote each limb as a mode of recognition: samādhi is not something you build but something you recognize. <a href="https://read.tarkajournal.com/p/patanjalis-eight-limbs-are-only-one">Read more in Tarka →</a></p>
        </div>
      </div></section>

      <section className="mr-black"><div className="wrap">
        <p className="mr-eyebrow">The source</p>
        <h2 className="mr-h2">Six sūtras that hold the whole practice</h2>
        <ol className="mr-sutras">
          {SUTRAS.map(([n, skt, en]) => (
            <li key={n}><span>YS {n}</span><p className="mr-skt">{skt}</p><p>{en}</p></li>
          ))}
        </ol>
        <p className="mr-fine">Translations by Embodied Philosophy.</p>
        <blockquote className="mr-quote">“Yoga is known through yoga. Yoga arises from yoga. Whoever is attentive in yoga delights in yoga for a long time.”<cite>Yoga Bhāṣya on Yoga Sūtra 3.6</cite></blockquote>
      </div></section>

      <section className="mr-red" id="join"><div className="wrap">
        <p className="mr-eyebrow mr-on-red">Pay what you can</p>
        <h2 className="mr-h2">No one is kept out by price.</h2>
        <p className="mr-red-lede">A set price keeps out exactly the people a new-year practice is for. So we ask everyone to give what’s true for them, and trust that it balances out. Every teacher who leads a session is paid for their time.</p>
        <div className="mr-tiers">
          {TIERS.map(([name, amt, desc, suggested]) => (
            <article key={name} className={`mr-tier${suggested ? ' on' : ''}`}>
              {suggested && <span className="mr-badge">Suggested</span>}
              <h3>{name}</h3><div className="amt">{amt}</div><p>{desc}</p>
            </article>
          ))}
        </div>
        <div className="mr-center">
          <a className="mr-btn mr-btn-ivory" href={checkout}>Save your place — choose your amount</a>
          <p>Choose your amount when you register. Everyone receives all ten sessions.</p>
        </div>
      </div></section>

      <section className="mr-dark"><div className="wrap">
        <p className="mr-eyebrow">After the five days</p>
        <h2 className="mr-h2">Keep the resolution</h2>
        <div className="mr-next">
          {NEXT.map(([h, p, href]) => (
            <a key={h} href={href} className="mr-next-card"><h3>{h}</h3><p>{p}</p><span>Learn more →</span></a>
          ))}
        </div>
      </div></section>

      <section className="mr-black"><div className="wrap mr-faq">
        <h2 className="mr-h2">Questions</h2>
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>

      <section className="mr-close">
        <Bindu className="mr-close-bindu" />
        <div className="wrap">
          <p className="mr-skt">trayam ekatra saṃyamaḥ</p>
          <h2>Three limbs. One point.<br />A whole year.</h2>
          <a className="mr-btn" href={checkout}>Save your place</a>
        </div>
      </section>
    </div>
  );
}

const CSS = `
.mr{--night:#0E0B09;--night2:#17120E;--saffron:#EBA329;--verm:#C2401F;--ivory:#FAF5EB;color:var(--ivory);background:var(--night)}
.mr a{color:inherit}
.mr i,.mr em{font-style:italic}
.mr-eyebrow{font-size:12px;letter-spacing:4px;text-transform:uppercase;color:var(--saffron);font-weight:600;margin:0 0 18px}
.mr-h2{font-family:var(--font-serif),serif;font-weight:600;font-size:clamp(34px,4.6vw,60px);line-height:1.02;letter-spacing:-.5px;margin:0 0 28px;color:var(--ivory)}
.mr p{line-height:1.6}
.mr .mr-big,.mr .mr-quote{line-height:1.08}.mr .mr-skt{line-height:1.35}

/* hero */
.mr-hero{position:relative;overflow:hidden;padding:120px 0 130px;background:radial-gradient(ellipse at 78% 45%,#3A1A0E 0%,var(--night) 58%)}
.mr-hero-in{position:relative;z-index:2}
.mr-kicker{font-size:13px;letter-spacing:4px;text-transform:uppercase;color:var(--saffron);font-weight:600;margin:0 0 26px}
.mr-hero h1{font-family:var(--font-serif),serif;font-weight:600;font-size:clamp(64px,11vw,156px);line-height:.86;letter-spacing:-2px;margin:0;color:var(--ivory)}
.mr-sub{font-family:var(--font-serif),serif;font-style:italic;font-size:clamp(26px,3.4vw,44px);color:var(--saffron);margin:18px 0 0}
.mr-lede{max-width:560px;font-size:19px;color:rgba(250,245,235,.82);margin:30px 0 0}
.mr-facts{list-style:none;display:flex;flex-wrap:wrap;gap:10px 28px;padding:0;margin:28px 0 0;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:rgba(250,245,235,.7)}
.mr-facts b{color:var(--ivory);font-size:16px}
.mr-btns{display:flex;flex-wrap:wrap;gap:14px;margin-top:38px}
.mr-btn{display:inline-block;padding:17px 30px;background:var(--saffron);color:var(--night)!important;font-weight:700;font-size:15px;letter-spacing:.3px;text-decoration:none;border:1.5px solid var(--saffron);transition:transform .2s,background .2s}
.mr-btn:hover{transform:translateY(-2px);background:#F7BA4A}
.mr-btn-line{background:transparent;color:var(--ivory)!important;border-color:rgba(250,245,235,.5)}
.mr-btn-line:hover{background:rgba(250,245,235,.08)}
.mr-btn-ivory{background:var(--ivory);border-color:var(--ivory);color:var(--verm)!important}
.mr-btn-ivory:hover{background:#fff}

/* bindu */
.mr-bindu{position:absolute;pointer-events:none}
.mr-bindu .dot{position:absolute;inset:0;margin:auto;width:22%;height:22%;border-radius:50%;background:radial-gradient(circle,#FFE6A8 0%,var(--saffron) 35%,var(--verm) 70%,transparent 72%);box-shadow:0 0 80px 30px rgba(235,163,41,.35),0 0 200px 80px rgba(194,64,31,.25);animation:mrBreath 7s ease-in-out infinite}
.mr-bindu .r{position:absolute;inset:0;margin:auto;border-radius:50%;border:1px solid rgba(235,163,41,.28)}
.mr-bindu .r1{width:44%;height:44%}.mr-bindu .r2{width:70%;height:70%;border-color:rgba(235,163,41,.18)}.mr-bindu .r3{width:100%;height:100%;border-color:rgba(235,163,41,.1)}
.mr-hero-bindu{width:min(780px,90vw);height:min(780px,90vw);right:-140px;top:50%;transform:translateY(-50%)}
@keyframes mrBreath{0%,100%{transform:scale(1);opacity:.92}50%{transform:scale(1.12);opacity:1}}
@media (prefers-reduced-motion:reduce){.mr-bindu .dot{animation:none}}

/* bands */
.mr-red{background:var(--verm);padding:110px 0;color:var(--ivory)}
.mr-red-in{display:grid;grid-template-columns:1.15fr 1fr;gap:64px;align-items:center}
.mr-big{font-family:var(--font-serif),serif;font-size:clamp(38px,5vw,68px);line-height:1.02;font-weight:600;margin:0}
.mr-big em{color:#FFE2B0}
.mr-red-text p{font-size:17px;margin:0 0 16px;color:rgba(250,245,235,.92)}
.mr-on-red{color:#FFE2B0}
.mr-red-lede{max-width:680px;font-size:18px;color:rgba(250,245,235,.9);margin:0 0 44px}
.mr-dark{background:var(--night2);padding:110px 0}
.mr-black{background:var(--night);padding:110px 0}

/* days */
.mr-days{list-style:none;padding:0;margin:20px 0 0;border-top:1px solid rgba(235,163,41,.25)}
.mr-day{display:grid;grid-template-columns:170px 1fr 1fr;gap:44px;padding:44px 0;border-bottom:1px solid rgba(235,163,41,.25)}
.mr-day-n span{display:block;font-family:var(--font-serif),serif;font-size:96px;line-height:.8;color:var(--saffron)}
.mr-day-n b{display:block;margin-top:14px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(250,245,235,.6)}
.mr-day-n i{display:block;margin-top:6px;font-family:var(--font-serif),serif;font-size:22px;color:var(--ivory)}
.mr-tag{font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:700;color:var(--saffron);margin:0 0 10px}
.mr-lec .mr-tag{color:#F07A55}
.mr-day h3{font-family:var(--font-serif),serif;font-size:30px;line-height:1.08;font-weight:600;margin:0 0 10px;color:var(--ivory)}
.mr-day-col>p:last-child{font-size:15.5px;color:rgba(250,245,235,.72);margin:0}
.mr-lec{border-left:1px solid rgba(250,245,235,.12);padding-left:44px}
.mr-skt{font-family:var(--font-serif),serif;font-style:italic;font-size:19px;color:var(--saffron);margin:0 0 12px;line-height:1.35}
.mr-skt span{font-family:var(--font-sans),sans-serif;font-style:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(250,245,235,.45);margin-left:6px}

/* rings */
.mr-rings-in{display:grid;grid-template-columns:420px 1fr;gap:72px;align-items:center}
.mr-rings{width:100%;max-width:420px}
.mr-rings circle{fill:none;stroke:rgba(235,163,41,.45);stroke-width:1}
.mr-rings circle.core{fill:var(--saffron);stroke:none;filter:drop-shadow(0 0 14px rgba(235,163,41,.8))}
.mr-rings text{fill:rgba(250,245,235,.75);font-family:var(--font-serif),serif;font-style:italic;font-size:17px;text-anchor:middle}
.mr-rings-in p:not(.mr-eyebrow){font-size:17px;color:rgba(250,245,235,.8);margin:0 0 14px}
.mr-rings-in a{color:var(--saffron);text-decoration:underline;text-underline-offset:3px}

/* teachers */
.mr-teach-lede{max-width:640px;font-size:17px;color:rgba(250,245,235,.75);margin:-8px 0 44px}
.mr-teachers{display:grid;grid-template-columns:repeat(5,1fr);gap:28px}
.mr-teacher{min-width:0}
.mr-teacher img,.mr-initials{display:flex;align-items:center;justify-content:center;width:132px;height:132px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px var(--night),0 0 0 3.5px var(--saffron),0 0 40px rgba(235,163,41,.25)}
.mr-initials{background:radial-gradient(circle at 35% 30%,#3A1A0E,var(--night2));font-family:var(--font-serif),serif;font-size:42px;color:var(--saffron)}
.mr-teacher h3{font-family:var(--font-serif),serif;font-size:26px;font-weight:600;line-height:1.1;margin:24px 0 6px;color:var(--ivory)}
.mr .mr-role{font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#F07A55;margin:0 0 12px;line-height:1.5}
.mr-teacher p:last-child{font-size:14.5px;color:rgba(250,245,235,.72);margin:0}

/* sūtras */
.mr-sutras{list-style:none;padding:0;margin:10px 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(235,163,41,.22);border:1px solid rgba(235,163,41,.22)}
.mr-sutras li{background:var(--night);padding:30px 28px}
.mr-sutras span{font-size:11px;letter-spacing:3px;font-weight:700;color:#F07A55}
.mr-sutras .mr-skt{font-size:22px;margin:12px 0 10px}
.mr-sutras p:last-child{font-size:15px;color:rgba(250,245,235,.75);margin:0}
.mr-fine{font-size:13px;color:rgba(250,245,235,.45);margin:16px 0 0}
.mr-quote{margin:70px auto 0;max-width:820px;text-align:center;font-family:var(--font-serif),serif;font-style:italic;font-size:clamp(26px,3.2vw,40px);line-height:1.2;color:var(--ivory)}
.mr-quote cite{display:block;margin-top:18px;font-family:var(--font-sans),sans-serif;font-style:normal;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--saffron)}

/* tiers */
.mr-tiers{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.mr-tier{position:relative;border:1.5px solid rgba(250,245,235,.55);padding:30px 26px}
.mr-tier h3{font-family:var(--font-serif),serif;font-size:26px;font-weight:600;margin:0;line-height:1.1}
.mr-tier .amt{font-family:var(--font-serif),serif;font-size:58px;font-weight:600;line-height:1;margin:16px 0 14px}
.mr-tier p{font-size:15px;margin:0;color:rgba(250,245,235,.88)}
.mr-tier.on{background:var(--ivory);color:var(--night);border-color:var(--ivory)}
.mr-tier.on .amt{color:var(--verm)}.mr-tier.on p{color:#4A4036}
.mr-badge{position:absolute;top:-12px;left:24px;background:var(--night);color:var(--saffron);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;padding:5px 10px}
.mr-center{text-align:center;margin-top:44px}
.mr-center p{font-size:14px;color:rgba(250,245,235,.85);margin:14px 0 0}

/* next */
.mr-next{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.mr-next-card{display:block;padding:34px 30px;border:1px solid rgba(235,163,41,.3);text-decoration:none;transition:background .2s,border-color .2s}
.mr-next-card:hover{background:rgba(235,163,41,.07);border-color:var(--saffron)}
.mr-next-card h3{font-family:var(--font-serif),serif;font-size:30px;font-weight:600;margin:0 0 10px}
.mr-next-card p{font-size:15.5px;color:rgba(250,245,235,.72);margin:0 0 18px}
.mr-next-card span{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:var(--saffron)}

/* faq */
.mr-faq{max-width:820px}
.mr-faq details{border-bottom:1px solid rgba(235,163,41,.25);padding:20px 0}
.mr-faq summary{font-size:19px;font-weight:600;cursor:pointer;color:var(--ivory)}
.mr-faq details p{margin:12px 0 0;color:rgba(250,245,235,.78);font-size:16px}

/* close */
.mr-close{position:relative;overflow:hidden;background:var(--night);text-align:center;padding:170px 0}
.mr-close-bindu{width:620px;height:620px;left:50%;top:50%;transform:translate(-50%,-50%);opacity:.6}
.mr-close .wrap{position:relative;z-index:2}
.mr-close .mr-skt{font-size:24px}
.mr-close h2{font-family:var(--font-serif),serif;font-weight:600;font-size:clamp(40px,6vw,80px);line-height:1;margin:10px 0 40px;color:var(--ivory)}

@media(max-width:980px){
  .mr-red-in,.mr-rings-in{grid-template-columns:1fr;gap:40px}
  .mr-rings{max-width:300px;margin:0 auto}
  .mr-day{grid-template-columns:1fr 1fr;gap:28px}.mr-day-n{grid-column:1/-1;display:flex;align-items:baseline;gap:16px}
  .mr-day-n span{font-size:64px}.mr-day-n b,.mr-day-n i{margin:0}
  .mr-sutras,.mr-next{grid-template-columns:1fr 1fr}.mr-tiers{grid-template-columns:1fr 1fr}.mr-teachers{grid-template-columns:repeat(3,1fr)}
}
@media(max-width:720px){
  .mr-hero{padding:80px 0 90px}.mr-hero-bindu{right:-45vw;top:28%;opacity:.55}
  .mr-red,.mr-dark,.mr-black{padding:76px 0}
  .mr-day{grid-template-columns:1fr;padding:34px 0}.mr-lec{border-left:0;padding-left:0;border-top:1px solid rgba(250,245,235,.12);padding-top:24px}
  .mr-day-n{flex-wrap:wrap;gap:6px 14px}
  .mr-sutras,.mr-next,.mr-tiers{grid-template-columns:1fr}.mr-teachers{grid-template-columns:1fr 1fr;gap:34px 20px}.mr-teacher img,.mr-initials{width:104px;height:104px}
  .mr-btn{width:100%;text-align:center}
  .mr-close{padding:120px 0}.mr-close-bindu{width:420px;height:420px}
}
`;
