'use client';
import { track } from '@vercel/analytics';
import { withUtm } from '@/lib/utm';
import { campaign } from './cyber-2026';

export const isUrl = v => /^https?:\/\//.test(String(v || ''));

// Outbound checkout links carry the visitor's UTMs and utm_campaign=cyber-2026 (when none is set), so Cyber sales
// stay apart from the pay-what-you-can ad campaigns. Links that aren't set yet render as a disabled button.
export function decorate(href) {
  try {
    const url = new URL(withUtm(href), window.location.href);
    if (!url.searchParams.has('utm_campaign')) url.searchParams.set('utm_campaign', campaign.utmCampaign);
    return url.toString();
  } catch { return href; }
}

export default function CtaLink({ href, className = 'cm-btn', children, tier, item, state, soon = 'Opening soon', ...rest }) {
  if (!href || (!isUrl(href) && !/^[/#]/.test(href))) {
    return <span className={`${className} is-off`} aria-disabled="true" role="link" {...rest}>{soon}</span>;
  }
  const external = isUrl(href);
  return (
    <a
      href={href}
      className={className}
      onClick={e => {
        let utm = '';
        try { utm = JSON.parse(sessionStorage.getItem('ep-utm') || '{}').utm_source || ''; } catch {}
        try { track('cyber_cta_click', { tier: tier || '', item: item || '', state: state || '', utm_source: utm }); } catch {}
        if (external) e.currentTarget.href = decorate(href);
      }}
      {...rest}
    >{children}</a>
  );
}
