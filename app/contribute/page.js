import PageHero from '@/components/PageHero';
export const metadata = { title: 'Contribute — Embodied Philosophy' };
export default function Contribute() {
  return (
    <>
      <PageHero eyebrow="Contribute" title="Help keep this teaching open." img="lady-pitcher" ground="navy"
        lede="Many of our programs are free or pay what you can. Contributions from our community keep them that way, and fund scholarships, translations and Tarka." />
      <section className="sec"><div className="wrap prose">
        <h2>Where your support goes</h2>
        <ul className="plain">
          <li><b>Open programs.</b> Free Living Room Lectures and pay-what-you-can immersions like our Navarātri and summer sādhanas.</li>
          <li><b>Access.</b> Sliding-scale places and BIPOC rates across our schools.</li>
          <li><b>Translation and publishing.</b> New translations of primary texts, and Tarka, our journal.</li>
        </ul>
        <h2>Ways to give</h2>
        <p>Make a one-time or monthly contribution, or pay a little more when you join a pay-what-you-can program. For larger gifts or partnerships, write to us at <a href="mailto:hello@embodiedphilosophy.com">hello@embodiedphilosophy.com</a>.</p>
        <p><a className="btn btn-primary" href="#">Make a contribution</a></p>
      </div></section>
    </>
  );
}
