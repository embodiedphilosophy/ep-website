import { site } from '@/lib/site';
export default function Footer() {
  const s = site.links.social;
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="name">Embodied<span>·</span>Philosophy</div>
            <p className="mini">An online school for yoga philosophy, meditation, and contemplative study, for thinking practitioners.</p>
          </div>
          <div className="fcol"><h4>Study</h4>
            <a href="/#sadhana">Sādhana School</a><a href="/#wisdom">Wisdom School</a><a href={site.links.wisdomCatalog}>Course Catalog</a><a href="#">Certificate Programs</a></div>
          <div className="fcol"><h4>Explore</h4>
            <a href="/events">Upcoming Events</a><a href="/#chitheads">Chitheads Podcast</a><a href={site.links.tarkaSubstack}>Tarka Journal</a><a href="/#join">The Living Room Letter</a></div>
          <div className="fcol"><h4>About</h4>
            <a href="/#about">Our Story</a><a href="#">Teachers</a><a href="#">Contribute</a><a href="mailto:hello@embodiedphilosophy.com">Contact</a></div>
        </div>
        <div className="foot-bottom">
          <div>© {new Date().getFullYear()} Embodied Philosophy. All rights reserved.</div>
          <div className="socials"><a href={s.instagram}>Instagram</a><a href={s.youtube}>YouTube</a><a href={s.facebook}>Facebook</a><a href={s.spotify}>Spotify</a></div>
          <div>Privacy · Terms</div>
        </div>
      </div>
    </footer>
  );
}
