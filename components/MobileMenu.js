'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

// Phone/tablet menu: the main links are hidden in the header below 900px, so this button opens them.
export default function MobileMenu({ signIn, signInWisdom, signInSadhana }) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(72);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (open) setTop(document.querySelector('header.nav')?.getBoundingClientRect().bottom || 72);
    document.body.style.overflow = open ? 'hidden' : '';
    const esc = e => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [open]);
  const links = [
    ['/wisdom-school', 'Wisdom School'], ['/sadhana-school', 'Sādhana School'], ['/meditation-pass', 'Meditation Pass'],
    ['/living-room-lectures', 'Living Room Lectures'], ['/events', 'Events'], ['/podcast', 'Listen'],
    ['/#tarka', 'Tarka'], ['/about', 'About'], ['/teachers', 'Teachers'], ['/contact', 'Contact'],
  ];
  return (
    <>
      <button type="button" className="menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(o => !o)}>
        <span /><span /><span />
      </button>
      {open && createPortal(
        <div className="mobile-menu" id="mobile-menu" role="dialog" aria-label="Menu" style={{ top }}>
          <nav aria-label="Mobile">
            {links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
          </nav>
          <div className="mobile-menu-foot">
            <a className="btn btn-primary" href="/#join" onClick={() => setOpen(false)}>Join Free</a>
            <p className="mobile-signin-label">Sign in</p>
            <div className="mobile-signin-row">
              <a className="btn btn-ghost" href={signInWisdom || signIn}>Wisdom School</a>
              <a className="btn btn-ghost" href={signInSadhana || signIn}>Sādhana School</a>
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}
