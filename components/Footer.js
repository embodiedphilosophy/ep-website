import { getSite } from '@/lib/content';
export default async function Footer() {
  const site = await getSite();
  const s = site.links.social;
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <img className="wordmark" src="/brand/ep-wordmark-white.png" alt="Embodied Philosophy" width="163" height="40" />
            <p className="mini">An online school for yoga philosophy, meditation, and contemplative study, for thinking practitioners.</p>
          </div>
          <div className="fcol"><h4>Study</h4>
            <a href="/sadhana-school">Sādhana School</a><a href="/wisdom-school">Wisdom School</a><a href="/meditation-pass">Meditation Pass</a><a href={site.links.wisdomCatalog}>Course Catalog</a><a href="#">Certificate Programs</a></div>
          <div className="fcol"><h4>Explore</h4>
            <a href="/events">Upcoming Events</a><a href="/living-room-lectures">Living Room Lectures</a><a href="/podcast">Chitheads Podcast</a><a href={site.links.tarkaSubstack}>Tarka Journal</a><a href="/#join">The Living Room Letter</a></div>
          <div className="fcol"><h4>About</h4>
            <a href="/about">Our Story</a><a href="/teachers">Teachers</a><a href="/contribute">Contribute</a><a href="/contact">Contact</a></div>
        </div>
        <p className="credits">Images: 19th-century Kalighat paintings. Cleveland Museum of Art (CC0); Wellcome Collection and Bodleian Library (CC BY 4.0); Bodleian Library, British Library, LACMA, Victoria and Albert Museum (public domain); Wikimedia Commons contributors (CC BY-SA).</p>
        <div className="foot-bottom">
          <div>© {new Date().getFullYear()} Embodied Philosophy. All rights reserved.</div>
          <div className="socials"><a href={s.instagram}>Instagram</a><a href={s.youtube}>YouTube</a><a href={s.facebook}>Facebook</a><a href={s.spotify}>Spotify</a></div>
          <div><a href={site.links.privacy}>Privacy</a> · <a href={site.links.terms}>Terms</a></div>
        </div>
      </div>
    </footer>
  );
}
