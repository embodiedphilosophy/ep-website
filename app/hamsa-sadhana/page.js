import PageHero from '@/components/PageHero';
import { getSite } from '@/lib/content';

export const revalidate = 300;
export const metadata = {
  title: '21-Day Haṃsa Sādhana — Pay What You Can — Embodied Philosophy',
  description: 'Twenty-one days with the Haṃsa mantra, the breath that breathes you. Half study, half meditation, about an hour a day, on demand. Pay what you can.',
};

const MOVEMENTS = [
  ['I', 'The Breath Within the Breath', 'Days 1–7',
    'We learn to listen to the mantra rather than perform it: the two non-separate “sides” of the breath, the pulse of the life-force in all beings, the still point between the rise and fall of the breath, and the infinite sky of the Heart.',
    ['Now, Haṃsa', 'The Mantra That Recites Itself', 'Ha & Sa: The Linguistic Symbolism', 'The Breath in All Beings', 'The Still Point In-Between', 'The Heart', 'The Unstruck Sound']],
  ['II', 'The One Who Is Two', 'Days 8–14',
    'Haṃsa is a marriage of opposites. We meet Ardhanārīśvara, Śiva and Śakti in their non-dual, non-binary expression, and the sun and moon in the body. To encounter Haṃsa is to become a sahṛdaya, the “one with heart” who has learned to savor the nectarean delight of our very own life.',
    ['Ardhanārīśvara: The One Who Is Two', 'The Altar of the Heart', 'Sun & Moon, Prāṇa & Apāna', 'The Symbolism of the Half-Moon', 'Knots of the Heart', 'Rasa: Tasting the Real', 'Sahṛdaya: The Connoisseur of Reality']],
  ['III', 'Beyond Time', 'Days 15–21',
    'The breath is the body’s oldest clock, 21,600 moments a day counted through the inhale and exhale. The clock ticks, but its source is beyond it, expressed in the suspension between inhale and exhale. This relationship between the breath’s immanence and its transcendent source is the dialectic of Tantrik liberation.',
    ['The Breath as Time', 'Encountering Death', 'Letting Go & Receiving', 'The Breath as Guru', '“I Am the Supreme Haṃsa”', 'Jīvanmukti: Liberation in This Lifetime', 'The Swan Song of Kālī']],
];

const RHYTHM = [
  ['0–5′', 'Arrive', 'Settling the body and the altar of our attention, and a look at where we’ve been and where we’re heading.'],
  ['5–30′', 'Reflection & teaching', 'A brief teaching on the day’s theme: a verse from a Sanskrit text, an image or iconographic symbol, or a modern perspective on the breath.'],
  ['30–50′', 'Practice', 'Twenty minutes of guided meditation with the Haṃsa mantra: listening, savoring, resting in the breath.'],
  ['50–60′', 'Questions & closing', 'Questions from the group, and a closing intention to carry the practice into the day.'],
];

const TIERS = [
  ['Benefactor', '$297+', 'Covers your place and sponsors a scholarship for someone who needs it.'],
  ['Sustainer', '$149', 'Supports the teachings and keeps the container open to all.'],
  ['Community', '$79', 'A meaningful offering that honors the exchange.', true],
  ['Accessible', 'Any', 'Pay what you can, from $1. Your presence and participation is the offering.'],
];

const FAQ = [
  ['Do I need experience with meditation or Sanskrit?', 'None at all. Haṃsa is a natural practice: it works with the breath you are already breathing. Newcomers and seasoned practitioners will each find a depth that suits them, and every Sanskrit term is translated and explained.'],
  ['How does the on-demand format work?', 'You receive all twenty-one sessions, each about an hour, recorded live with a group of practitioners. Watch one a day for twenty-one days. The practice is cumulative, so regularity helps, but go at whatever pace your life allows.'],
  ['How does “pay what you can” work?', 'Choose the amount that fits your situation. The tiers are a guide: larger offerings quietly fund scholarships for those who need them, and no one is turned away for lack of funds. Everyone receives the same program.'],
  ['What will I need?', 'A quiet place to sit for an hour, and an intention to practice for twenty-one days. Early on we guide you in setting up a simple altar and practice space; this is entirely optional. Nothing but your breath and your attention is required.'],
  ['What is the connection to Sādhana School?', 'Haṃsa is the seed of Sahṛdaya Meditation and a doorway into the embodied linguistic mysticism of non-dual Tantra, the heart of Sādhana School. These twenty-one days lay that foundation and can help you decide whether Sādhana School is for you. They are also complete in themselves; there is no requirement to continue.'],
];

export default async function HamsaSadhana() {
  const site = await getSite();
  const checkout = site.links.hamsaCheckout || 'https://embodied-philosophy-2.kit.com/products/hamsa-sadhana';
  return (
    <>
      <PageHero eyebrow="On demand · Pay what you can" title="21-Day Haṃsa Sādhana" img="yogi-shiva" ground="navy" ring="#EBA329"
        lede="Twenty-one days with the Haṃsa mantra, the breath that breathes you. Half study, half meditation practice: about an hour a day with the most intimate mantra of all.">
        <p className="upnext" style={{ marginTop: 18 }}><b>21 sessions · about 60 minutes each · start any time</b></p>
        <div className="btns" style={{ marginTop: 22 }}>
          <a className="btn btn-primary" href={checkout}>Begin the sādhana — pay what you can</a>
          <a className="btn btn-ghost" href="#journey">See the 21 days</a>
        </div>
      </PageHero>

      <section className="sec"><div className="wrap hs-intro">
        <div className="hs-stat"><div className="n">21,600</div><div className="l">The mantra you’re already reciting</div></div>
        <div className="prose">
          <p>Every inhalation makes a sound, every exhalation another. Repeated as a mantra, this is <i>Haṃsa</i>, often translated as “I am That.” Haṃsa is the <i>ajapa</i> mantra, the mantra that is “unrecited” even as it recites itself some 21,600 times a day.</p>
          <p>It is not a mantra in the everyday sense of the word. It is the sound of your individual life-wave, a mantra we all share, and so an immediate invitation to understand what connects all of us. And yet it so often goes unheard, taken for granted as a banal fact of biology. For twenty-one days, we tune in and listen to the wisdom it whispers within.</p>
          <p className="hs-ask">You have already repeated it some twenty-one thousand times today. But did you hear it?</p>
        </div>
      </div></section>

      <section className="sec path"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The invitation</span><h2>A single mantra, explored through knowledge and practice</h2>
          <p>Where Sādhana School’s seasons span eight weeks, this sādhana focuses on two simple syllables. But as with a sūtra, in these syllables is compressed the wisdom of the entire Tantrik teaching of liberation.</p></div>
        <div className="path-grid">
          <div className="tier"><h3>21 days</h3><p>Twenty-one consecutive sessions. The study and practice are cumulative, so a daily rhythm is encouraged.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--ochre)' }}><h3>About an hour a day</h3><p>Short reflections drawn from Sanskrit texts, including the <i>Haṃsasāra</i> and the <i>Svacchanda Tantra</i>, then twenty minutes of Haṃsa meditation.</p></div>
          <div className="tier" style={{ borderTopColor: 'var(--pine)' }}><h3>Study of the Self</h3><p>Teaching, practice, then questions: a rhythm that reflects the yogic practice of <i>svādhyāya</i>, “study of the Self.”</p></div>
        </div>
      </div></section>

      <section className="sec"><div className="wrap prose hs-swan">
        <span className="eyebrow">Why the swan</span>
        <h2>The breath that breathes you</h2>
        <p>In the Tantrik tradition, <i>haṃsa</i> is often translated as “goose” or “swan.” It is the consciousness that lives in and as the breath in every body. This consciousness, “the Supreme Self of all, abides even amidst motion; within and without, he vibrates through all embodied beings” (<i>Haṃsasāra</i> 9).</p>
        <p>The Tantrik commentator and philosopher Kṣemarāja, commenting on the <i>Svacchanda Tantra</i>, glosses the mantra as <i>hāna-samādāna-dharmā</i>: its nature is “abandoning and taking in.” The exhalation releases outward and lets go; the inhalation invites inward and receives. He also calls it the “unstruck resonance” (<i>anāhata-dhvani</i>), because it repeats its vibration without anyone uttering it. It is therefore the esoteric source of all mantra and the ground of sound.</p>
        <blockquote className="hs-verse"><span className="skt">śāstraṃ śabdātmakaṃ sarvaṃ śabdo haṃsaḥ prakīrtitaḥ</span>“All scripture is made of sound; sound is said to be Haṃsa.” <cite>Svacchanda Tantra 4.340</cite></blockquote>
        <p>To sit with the breath in this way is to recognize an esoteric truth that has been with us all along:</p>
        <blockquote className="hs-verse"><span className="skt">aham eva paro haṃsaḥ śivaḥ paramakāraṇam</span>“I am none other than the supreme Haṃsa: Śiva, the primal cause.” <cite>Svacchanda Tantra 4.399</cite></blockquote>
      </div></section>

      <section className="sec path" id="journey"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The journey</span><h2>Twenty-one days with the source of mantra</h2>
          <p>Three movements: from a simple encounter with the wisdom of the breath, into symbolism and iconography, and on to the esoteric teachings on the breath as time itself.</p></div>
        <div className="hs-moves">
          {MOVEMENTS.map(([n, t, d, desc, days]) => (
            <article key={n} className="hs-move">
              <div className="hs-num">{n}</div>
              <div className="hs-days">{d}</div>
              <h3>{t}</h3>
              <p>{desc}</p>
              <ol>{days.map(x => <li key={x}>{x}</li>)}</ol>
            </article>
          ))}
        </div>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">The rhythm</span><h2>Each session</h2></div>
        <div className="hs-rhythm">
          {RHYTHM.map(([t, h, p]) => <div key={h} className="hs-step"><div className="t">{t}</div><h3>{h}</h3><p>{p}</p></div>)}
        </div>
      </div></section>

      <section className="sec path"><div className="wrap hs-two">
        <div className="prose">
          <span className="eyebrow">Who is the Haṃsa deity?</span>
          <h2>Ardhanārīśvara: Śiva and Śakti as one</h2>
          <p>The “Lord who is half woman” is the organizing image of this practice. The Haṃsa mantra transcends opposites by revealing both to be expressions of non-duality.</p>
          <ul className="plain">
            <li><b>Ha</b>: Śiva, sun, prāṇa-śakti, the inhalation.</li>
            <li><b>Sa</b>: Śakti, moon, apāna-śakti, the exhalation.</li>
            <li>Both sides of the breath meet in the <i>suṣumṇā-nāḍī</i>, the central channel of auspicious non-duality.</li>
          </ul>
          <p>You’ll be invited, if you wish, to set up an altar and a dedicated practice space. This isn’t religious observance but a recognition that how we arrange our space directs our attention: symbols and faces help train awareness to see the sacred in what we take to be mundane.</p>
        </div>
        <div className="prose">
          <span className="eyebrow">The method</span>
          <h2>Sahṛdaya Meditation</h2>
          <p>In Indian aesthetics, <i>rasa</i> is “taste” or “flavor”: the distinctive aesthetic emotion a work of art awakens. Everyday emotions differ from emotions as they are relished or savored, and for Abhinavagupta what grounds that relishing is the Self itself, whose very nature is to relish. To learn to savor art and the beauty of experience is to become a <i>sahṛdaya</i>, “one with heart.”</p>
          <p>Before the heart savors a chant, a play or a symphony, it has already been savoring the one thing it can never be without: the breath. This is the root of Sahṛdaya Meditation, a method that begins with Haṃsa and ripens into chanting and mantra. These twenty-one days are the stage on which that practice learns to play.</p>
        </div>
      </div></section>

      <section className="sec"><div className="wrap hs-two">
        <div className="prose">
          <span className="eyebrow">Who it’s for</span>
          <h2>All levels are welcome</h2>
          <p>For anyone who wants to ground their meditation practice, beginners and long-time practitioners alike. If you’re ready for deeper study, it’s a gentle on-ramp to <a href="/sadhana-school">Sādhana School</a>, Embodied Philosophy’s flagship program. If you’re simply looking to re-ground your practice or learn something new, you’ll find much to relish in twenty-one days. There are no prerequisites.</p>
        </div>
        <div className="prose">
          <span className="eyebrow">Your guide</span>
          <h2>Jacob Kyle</h2>
          <p>Meditation teacher, writer, philosophy educator, publisher, and Founding Director of Embodied Philosophy. His work turns on the conviction that the modern divorce between scholarship and spirituality has impoverished both, and that healing this rift is among the more urgent tasks of our time.</p>
          <p>Jacob is a doctoral student at the University of Oxford, researching Pratyabhijñā philosophy with Diwakar Acharya and Monima Chadha. He holds an MPhil in Classical Indian Religions from Oxford, an MA in Philosophy from the New School for Social Research, and an MSc in Political Theory from the London School of Economics, and is a devoted practitioner of the Śaiva-Śākta darśana.</p>
        </div>
      </div></section>

      <section className="sec path" id="join"><div className="wrap">
        <div className="sec-head center"><span className="eyebrow">Pay what you can</span><h2>Choose the offering that fits your life</h2>
          <p>This many hours of study and practice would usually be priced at $297. We offer it by donation so that everyone who wants to can take part. If you’re in a more fluid financial position, you can help subsidize those who aren’t. No one is turned away for lack of funds.</p></div>
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
          <a className="btn btn-primary" href={checkout}>Begin the sādhana — choose your amount</a>
          <p>You’ll enter your amount at checkout. Every offering receives the full program.</p>
        </div>
      </div></section>

      <section className="sec"><div className="wrap prose">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>

      <section className="sec path"><div className="wrap hs-close">
        <p className="skt">haṃsa-sāraṃ paraṃ brahma paraṃ vyoma paraḥ śivaḥ</p>
        <h2>Study, practice, and relish.</h2>
        <p>Twenty-one days. One mantra. Relish the breath within the breath.</p>
        <a className="btn btn-primary" href={checkout}>Begin the sādhana</a>
      </div></section>
    </>
  );
}
