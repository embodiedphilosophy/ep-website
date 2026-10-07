// Campaign attribution: remembers where a visitor came from (UTM tags, Meta click,
// or referring site) so Kit signups and checkouts can be credited to a source.
// Session copy is always kept; a first-touch copy is kept across visits only after
// tracking consent (see Tracking.js → persistUtm).
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const SESSION = 'ep-utm';
const FIRST = 'ep-utm-first';

function read(store, key) {
  try { return JSON.parse(store.getItem(key) || 'null'); } catch { return null; }
}
function write(store, key, value) {
  try { store.setItem(key, JSON.stringify(value)); } catch {}
}

// Call once per page load.
export function captureUtm() {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams(window.location.search);
  const found = {};
  KEYS.forEach((k) => { const v = p.get(k); if (v) found[k] = v.slice(0, 120); });
  if (!found.utm_source && (p.get('fbclid') || p.get('ad_id'))) Object.assign(found, { utm_source: 'facebook', utm_medium: 'paid' });
  if (!found.utm_source && p.get('gclid')) Object.assign(found, { utm_source: 'google', utm_medium: 'paid' });
  if (!found.utm_source && document.referrer) {
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (host && !host.endsWith('embodiedphilosophy.com')) Object.assign(found, { utm_source: host, utm_medium: 'referral' });
    } catch {}
  }
  if (!found.utm_source) return;
  found.landing = window.location.pathname;
  found.at = new Date().toISOString().slice(0, 10);
  write(sessionStorage, SESSION, found);
}

// After consent: keep the very first source we ever saw for this browser.
export function persistUtm() {
  if (typeof window === 'undefined') return;
  const s = read(sessionStorage, SESSION);
  if (s && !read(localStorage, FIRST)) write(localStorage, FIRST, s);
}

export function getUtm() {
  if (typeof window === 'undefined') return {};
  return read(sessionStorage, SESSION) || read(localStorage, FIRST) || {};
}
export function getFirstTouch() {
  if (typeof window === 'undefined') return {};
  return read(localStorage, FIRST) || read(sessionStorage, SESSION) || {};
}

// Extra fields for a Kit form POST (custom fields must exist in Kit).
export function kitUtmFields() {
  const u = getUtm();
  const f = getFirstTouch();
  const out = {};
  KEYS.forEach((k) => { if (u[k]) out[`fields[${k}]`] = u[k]; });
  if (f.utm_source) out['fields[first_source]'] = [f.utm_source, f.utm_medium].filter(Boolean).join(' / ');
  if (f.utm_campaign) out['fields[first_campaign]'] = f.utm_campaign;
  return out;
}

// Adds the visitor's UTM tags to an outbound checkout link (keeps any tags already on it).
export function withUtm(href) {
  const u = getUtm();
  if (!u.utm_source) return href;
  try {
    const url = new URL(href, window.location.href);
    KEYS.forEach((k) => { if (u[k] && !url.searchParams.has(k)) url.searchParams.set(k, u[k]); });
    return url.toString();
  } catch { return href; }
}
