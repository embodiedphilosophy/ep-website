'use client';
// Fire a Meta Pixel event if the pixel is loaded (it only loads with consent). Safe to call anywhere.
export function track(event, params = {}) {
  try { if (typeof window !== 'undefined' && window.fbq) window.fbq('track', event, params); } catch {}
}
