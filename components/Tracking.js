'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';

// Vercel Analytics: cookieless, always on.
// Meta Pixel: loads only after consent in the EU/EEA, UK and Switzerland; elsewhere it loads unless the visitor opts out.
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const KEY = 'ep-consent'; // 'granted' | 'denied'
const CONSENT_REGIONS = new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB CH'.split(' '));
const CHECKOUT = /embodiedphilosophy\.org\/offers|kit\.com\/products|enroll\.embodiedphilosophy\.com|school\.embodiedphilosophy\.com\/offers/;

function loadPixel() {
  if (!PIXEL || window.fbq) return;
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', PIXEL);
  window.fbq('track', 'PageView');
}

export default function Tracking() {
  const pathname = usePathname();
  const [banner, setBanner] = useState(false);
  const [ready, setReady] = useState(false);

  // Decide: stored choice → use it; otherwise ask only where consent is required
  useEffect(() => {
    if (!PIXEL) return;
    let choice = null;
    try { choice = localStorage.getItem(KEY); } catch {}
    if (choice === 'granted') { loadPixel(); setReady(true); return; }
    if (choice === 'denied') return;
    fetch('/api/geo').then(r => r.json()).then(({ country }) => {
      if (CONSENT_REGIONS.has(country)) setBanner(true);
      else { loadPixel(); setReady(true); }
    }).catch(() => setBanner(true));
  }, []);

  // PageView on client-side navigation (the first one is sent by loadPixel)
  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (first) { setFirst(false); return; }
    if (ready && window.fbq) window.fbq('track', 'PageView');
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clicks through to any checkout → InitiateCheckout
  useEffect(() => {
    const onClick = e => {
      const a = e.target.closest?.('a[href]');
      if (a && CHECKOUT.test(a.href) && window.fbq) window.fbq('track', 'InitiateCheckout', { content_name: (a.textContent || '').trim().slice(0, 80) });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Footer "Cookie preferences" link reopens the banner
  useEffect(() => {
    const open = () => setBanner(true);
    window.addEventListener('ep-cookie-prefs', open);
    return () => window.removeEventListener('ep-cookie-prefs', open);
  }, []);

  const choose = v => {
    try { localStorage.setItem(KEY, v); } catch {}
    setBanner(false);
    if (v === 'granted') { loadPixel(); setReady(true); }
    else if (window.fbq) window.location.reload(); // unload the pixel if it was running
  };

  return (
    <>
      <Analytics />
      {banner && PIXEL && (
        <div className="cookie" role="dialog" aria-label="Cookie preferences">
          <p>We use cookies to measure our advertising, so we can reach more people who’d enjoy these teachings. <a href="https://www.iubenda.com/privacy-policy/47854771/cookie-policy">Cookie policy</a></p>
          <div className="cookie-btns">
            <button type="button" className="btn btn-ghost" onClick={() => choose('denied')}>No thanks</button>
            <button type="button" className="btn btn-primary" onClick={() => choose('granted')}>Accept</button>
          </div>
        </div>
      )}
    </>
  );
}
