'use client';
import { useEffect } from 'react';
import { cookies } from './cyber-2026';

// The members' email link carries ?access=members (and ?member=ws for Wisdom School members). The server has already
// used it for this view; here we remember it for 7 days and tidy the address bar. This only decides what is shown.
export default function AccessCookie() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const set = (name, value) => { document.cookie = `${name}=${value}; max-age=${cookies.days * 86400}; path=/; SameSite=Lax`; };
      let changed = false;
      if (url.searchParams.get('access') === 'members') { set(cookies.access, 'members'); url.searchParams.delete('access'); changed = true; }
      if (url.searchParams.get('member') === 'ws') { set(cookies.member, 'ws'); url.searchParams.delete('member'); changed = true; }
      if (changed) window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch {}
  }, []);
  return null;
}
