'use client';
import { useEffect, useRef, useState } from 'react';
import KitForm from './KitForm';

// Vimeo replay with a free preview. After `previewMinutes`, the video pauses and asks for an email.
// Once someone signs up, every replay on this device is unlocked.
const KEY = 'ep-lrl-unlocked';
let apiPromise;
const loadVimeo = () => apiPromise ||= new Promise(res => {
  if (window.Vimeo) return res(window.Vimeo);
  const s = document.createElement('script');
  s.src = 'https://player.vimeo.com/api/player.js';
  s.onload = () => res(window.Vimeo);
  document.head.appendChild(s);
});

export default function ReplayPlayer({ videoId, title, previewMinutes = 15, formId }) {
  const frame = useRef(null);
  const player = useRef(null);
  const [unlocked, setUnlocked] = useState(false);
  const [gated, setGated] = useState(false);
  const limit = previewMinutes * 60;
  const [id, hash] = String(videoId).split('/');
  const src = `https://player.vimeo.com/video/${id}?${hash ? `h=${hash}&` : ''}dnt=1&title=0&byline=0&portrait=0`;

  useEffect(() => {
    try { setUnlocked(localStorage.getItem(KEY) === '1'); } catch {}
  }, []);

  useEffect(() => {
    let p;
    loadVimeo().then(Vimeo => {
      if (!frame.current) return;
      p = player.current = new Vimeo.Player(frame.current);
      const check = ({ seconds }) => {
        let open = false;
        try { open = localStorage.getItem(KEY) === '1'; } catch {}
        if (!open && seconds >= limit) {
          p.pause(); p.setCurrentTime(limit - 1).catch(() => {});
          setGated(true);
        }
      };
      p.on('timeupdate', check);
      p.on('seeked', check);
    });
    return () => { p?.off('timeupdate'); p?.off('seeked'); };
  }, [limit]);

  const unlock = () => {
    try { localStorage.setItem(KEY, '1'); } catch {}
    setUnlocked(true);
    setTimeout(() => { setGated(false); player.current?.play().catch(() => {}); }, 1200);
  };

  return (
    <div className="replay">
      <div className="replay-frame">
        <iframe ref={frame} src={src} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        {gated && !unlocked && (
          <div className="gate" role="dialog" aria-label="Keep watching">
            <div className="gate-card">
              <h3>Keep watching the full lecture</h3>
              <p>Enter your email to unlock this replay and every Living Room Lecture. We’ll also send you the link so you can come back anytime.</p>
              <KitForm formId={formId} onSuccess={unlock} button="Watch the full replay" success="Unlocked. Enjoy the lecture." />
            </div>
          </div>
        )}
      </div>
      {!unlocked && <p className="replay-note">Free preview: the first {previewMinutes} minutes.</p>}
    </div>
  );
}
