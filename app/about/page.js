import PageHero from '@/components/PageHero';
import KitForm from '@/components/KitForm';
export const metadata = { title: 'About — Embodied Philosophy' };
export default function About() {
  return (
    <>
      <PageHero eyebrow="Our story" title="Philosophy you can practice." img="mirror" ground="black"
        lede="Embodied Philosophy is an online school for yoga philosophy, meditation, and the world’s contemplative traditions, for people who want to think carefully and practice deeply." />
      <section className="sec"><div className="wrap prose">
        <h2>Why we exist</h2>
        <p>Since 2015, Embodied Philosophy has offered courses, lectures, a journal and a podcast for practitioners who find most spiritual education either too shallow or too academic. We take the wisdom traditions seriously as living philosophy: texts to be read closely, practices to be done daily, and questions that change how a life is lived.</p>
        <p>Our home tradition is the non-dual Śaiva-Śākta Tantra of Kashmir, especially the philosophy of recognition (Pratyabhijñā) and the aesthetic theory of rasa. Around it we teach widely, from the Yoga Sūtras and Buddhist thought to the Hellenic and mystical traditions of the West.</p>
        <h2>How we teach</h2>
        <p>Every program pairs study with practice. Lectures give the ideas their context and precision; guided meditation, mantra and reflection make them something you live. We teach in community, live and online, with recordings for every session.</p>
        <ul className="plain">
          <li><b>Living Room Lectures</b>: free monthly talks open to everyone.</li>
          <li><b>Wisdom School</b>: a membership with weekly meditation, monthly lectures, and and, with Wisdom School Plus, a library of learning pathways and certificate programs.</li>
          <li><b>Sādhana School</b>: our flagship year of guided study and daily practice.</li>
          <li><b>Tarka</b>: our journal of yoga philosophy and contemplative studies.</li>
          <li><b>Chitheads</b>: long-form conversations with teachers and scholars.</li>
        </ul>
        <h2>Our founder</h2>
        <p><b>Jacob Kyle</b> founded Embodied Philosophy in 2015. He is a doctoral candidate at the University of Oxford, where he researches the Pratyabhijñā philosophers Utpaladeva and Abhinavagupta, and holds degrees from Oxford, the New School for Social Research, and the London School of Economics. He has studied and practiced in the lineage of Paul Muller-Ortega since 2015.</p>
        <p><a className="btn btn-ghost" href="/teachers">Meet our teachers</a></p>
      </div></section>
      <section className="sec" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="letter">
          <div><span className="eyebrow light">Every Sunday · Free</span><h2>The Weekly Scaffolding</h2>
            <p>A weekly wisdom studies e-zine with teachings, simple practices, bite-sized translations of Sanskrit texts, and what’s coming up at Embodied Philosophy.</p></div>
          <div><KitForm formId={process.env.NEXT_PUBLIC_KIT_FORM_LETTER} button="Subscribe" buttonClass="btn btn-light" hintClass="hint" success="You’re in. Check your inbox to confirm." /></div>
        </div>
      </div></section>
    </>
  );
}
