import { site } from '@/lib/site';
export default function Nav() {
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
          <a className="signin" href={site.links.signIn}>Sign in</a>
          <a className="btn btn-primary" href="/#join">Join Free</a>
        </div>
      </div>
    </header>
  );
}
