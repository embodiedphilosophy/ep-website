'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Header "Study" — gathers EP's programs under one menu so the main nav stays uncluttered.
export const STUDY_LINKS = [
  ['/sadhana-school', 'Sādhana School', 'A year of guided study and daily practice'],
  ['/wisdom-school', 'Wisdom School', 'Weekly meditation, monthly lectures & learning pathways'],
  ['/meditation-pass', 'Meditation Pass', 'A live guided meditation every Monday'],
  ['/courses', 'Course Library', 'Every course, pathway and season in one place'],
];

export default function StudyMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimer = useRef(null);
  const pathname = usePathname();
  const active = STUDY_LINKS.some(([href]) => pathname === href || pathname?.startsWith(href + '/'));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const enter = () => { clearTimeout(closeTimer.current); setOpen(true); };
  const leave = () => { closeTimer.current = setTimeout(() => setOpen(false), 150); };

  return (
    <div className="study-menu" ref={ref} onMouseEnter={enter} onMouseLeave={leave}>
      <button type="button" className={`study-btn${active ? ' is-active' : ''}`} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Study <span className="signin-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="study-pop" role="menu">
          {STUDY_LINKS.map(([href, label, note]) => (
            <a key={href} role="menuitem" href={href} aria-current={pathname === href ? 'page' : undefined}>
              <strong>{label}</strong>
              <span>{note}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
