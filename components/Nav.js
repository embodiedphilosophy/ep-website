import { getSite } from '@/lib/content';
import MobileMenu from './MobileMenu';
import SignInMenu from './SignInMenu';
export default async function Nav() {
  const site = await getSite();
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="brand" href="/" aria-label="Embodied Philosophy home">
          <img className="wordmark" src="/brand/ep-wordmark-black.png" alt="Embodied Philosophy" width="147" height="36" />
        </a>
        <nav className="links" aria-label="Main">
          <a href="/wisdom-school">Wisdom School</a>
          <a href="/sadhana-school">Sādhana School</a>
          <a href="/events">Events</a>
          <a href="/podcast">Listen</a>
          <a href="/#tarka">Tarka</a>
          <a href="/about">About</a>
        </nav>
        <div className="nav-cta">
          <SignInMenu wisdom={site.links.signInWisdom} sadhana={site.links.signInSadhana} />
          <a className="btn btn-primary" href="https://go.embodiedphilosophy.com/">Join Free</a>
          <MobileMenu signIn={site.links.signIn} signInWisdom={site.links.signInWisdom} signInSadhana={site.links.signInSadhana} />
        </div>
      </div>
    </header>
  );
}
