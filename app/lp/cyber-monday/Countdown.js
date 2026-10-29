'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Days · hours · minutes, no seconds. The first paint uses the server's number; then it ticks every 30s.
// At zero it refreshes the page so the server picks the next state.
const pad = n => String(n).padStart(2, '0');
function split(ms) {
  const mins = Math.floor(Math.max(0, ms) / 60000);
  return { d: Math.floor(mins / 1440), h: Math.floor((mins % 1440) / 60), m: mins % 60 };
}

export default function Countdown({ target, initialMs, variant = 'compact', label }) {
  const router = useRouter();
  const [ms, setMs] = useState(initialMs);
  useEffect(() => {
    const end = Date.parse(target);
    const tick = () => {
      const left = end - Date.now();
      setMs(left);
      if (left <= 0) router.refresh();
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [target, router]);
  const { d, h, m } = split(ms);
  if (variant === 'compact') {
    return <span className="cm-count-compact" aria-live="off" aria-label={label}>{d}d · {h}h · {m}m</span>;
  }
  return (
    <div className="cm-count-large" aria-live="off" role="timer" aria-label={label}>
      {[[pad(d), 'Days'], [pad(h), 'Hours'], [pad(m), 'Min']].map(([v, l]) => (
        <div key={l}><b>{v}</b><span>{l}</span></div>
      ))}
    </div>
  );
}
