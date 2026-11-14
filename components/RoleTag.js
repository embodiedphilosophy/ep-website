'use client';
import { useEffect } from 'react';

// Site-wide: if someone arrives from an email link carrying ?role=teacher|practitioner and their Kit subscriber
// id (ck_subscriber_id, added by Kit, or sid), tag them once. Runs in the browser after a short pause, so link
// scanners that only fetch the page (and don't run scripts) aren't tagged.
export default function RoleTag() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const role = q.get('role');
    const sid = q.get('ck_subscriber_id') || q.get('sid');
    if (!role || !sid) return;
    const key = `ep-role-${sid}-${role}`;
    try { if (sessionStorage.getItem(key)) return; } catch {}
    const t = setTimeout(() => {
      fetch('/api/kit/role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid, role }), keepalive: true })
        .then(r => { if (r.ok) { try { sessionStorage.setItem(key, '1'); } catch {} } })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
