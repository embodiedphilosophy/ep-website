import PageHero from '@/components/PageHero';

export const metadata = { title: 'Page not found — Embodied Philosophy', robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <PageHero eyebrow="404" title="We couldn’t find that page." img="lady-kohl" ground="slate"
        lede="The page may have moved when we rebuilt the site. Try one of these, or write to us and we’ll point you in the right direction.">
        <p style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="/">Go to the homepage</a>
          <a className="btn btn-ghost" href="/wisdom-school">Wisdom School</a>
          <a className="btn btn-ghost" href="/sadhana-school">Sādhana School</a>
          <a className="btn btn-ghost" href="/podcast">Podcast</a>
          <a className="btn btn-ghost" href="/contact">Contact us</a>
        </p>
      </PageHero>
    </>
  );
}
