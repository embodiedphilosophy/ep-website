'use client';
import { useEffect, useRef, useState } from 'react';

// Header "Sign in" — EP's schools live on different platforms, so this opens a
// small menu that sends students to the right sign-in page.
export default function SignInMenu({ wisdom, sadhana }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); window.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="signin-menu" ref={ref}>
      <button type="button" className="signin" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Sign in <span className="signin-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="signin-pop" role="menu">
          <p className="signin-pop-head">Sign in to</p>
          <a role="menuitem" href={wisdom}>
            <strong>Wisdom School</strong>
            <span>Pathways, lectures &amp; Meditation Mondays</span>
          </a>
          <a role="menuitem" href={sadhana}>
            <strong>Sādhana School</strong>
            <span>Your cohort, live sessions &amp; recordings</span>
          </a>
        </div>
      )}
    </div>
  );
}
