'use client';
import { useEffect, useState, useCallback } from 'react';

// A photo grid with a simple full-screen viewer (click a photo; arrow keys or swipe to move; Esc to close).
// photos: [{ src, alt, w?, h? }]. Renders nothing when the list is empty.
export default function RetreatGallery({ photos = [] }) {
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(d => setOpen(i => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, close, step]);

  if (!photos.length) return null;
  let touchX = null;

  return (
    <>
      <div className="retreat-grid">
        {photos.map((p, i) => (
          <button key={p.src} type="button" className={`retreat-tile${i === 0 ? ' wide' : ''}`} onClick={() => setOpen(i)} aria-label={`View photo: ${p.alt}`}>
            <img src={p.thumb || p.src} alt={p.alt} loading={i < 4 ? 'eager' : 'lazy'} width={p.w} height={p.h} />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="retreat-viewer" role="dialog" aria-modal="true" aria-label="Retreat photos" onClick={close}
          onTouchStart={e => { touchX = e.touches[0].clientX; }}
          onTouchEnd={e => { if (touchX === null) return; const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); touchX = null; }}>
          <figure onClick={e => e.stopPropagation()}>
            <img src={photos[open].src} alt={photos[open].alt} />
            <figcaption>{photos[open].alt}<span>{open + 1} / {photos.length}</span></figcaption>
          </figure>
          <button type="button" className="rv-btn rv-close" onClick={close} aria-label="Close">×</button>
          {photos.length > 1 && <>
            <button type="button" className="rv-btn rv-prev" onClick={e => { e.stopPropagation(); step(-1); }} aria-label="Previous photo">‹</button>
            <button type="button" className="rv-btn rv-next" onClick={e => { e.stopPropagation(); step(1); }} aria-label="Next photo">›</button>
          </>}
        </div>
      )}
    </>
  );
}
