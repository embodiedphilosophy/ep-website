'use client';
import { useEffect } from 'react';

// Reports one Lead to Meta when the visitor lands here from a Kit sign-up: the browser pixel and the
// server (Conversions API) get the same event_id, so Meta deduplicates them. Waits for the pixel, which
// Tracking.js loads only with consent where it's required; with no pixel, nothing is sent.
// A per-browser flag stops reloads or revisits from counting twice.
export default function LeadPing({ slug, contentName }) {
  useEffect(() => {
    const key = `ep-lead-${slug}`;
    try { if (localStorage.getItem(key)) return; } catch {}
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (!window.fbq) { if (tries > 40) clearInterval(timer); return; } // give up after ~20s (no consent / blocked)
      clearInterval(timer);
      const eventID = `lead-${slug}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      try { window.fbq('track', 'Lead', { content_name: contentName, content_category: 'lead_magnet' }, { eventID }); } catch {}
      const cookie = n => (document.cookie.match(new RegExp(`(?:^|; )${n}=([^;]*)`)) || [])[1];
      fetch('/api/meta/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ slug, event_id: eventID, fbp: cookie('_fbp'), fbc: cookie('_fbc'), url: window.location.href }),
      }).catch(() => {});
      try { localStorage.setItem(key, new Date().toISOString()); } catch {}
    }, 500);
    return () => clearInterval(timer);
  }, [slug, contentName]);
  return null;
}
