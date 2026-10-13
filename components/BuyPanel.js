'use client';
import { useState } from 'react';

// Sticky panel on an offering page. Every button opens the offering's Circle paywall (checkout_url).
// Pay what you can: choose an amount (or "Other", where the buyer types it at checkout), then continue.
export default function BuyPanel({ eyebrow, heading, note, checkout, pwyc, amounts, cta, signIn }) {
  const [pick, setPick] = useState(1);
  const opts = pwyc ? [...amounts.map(a => ({ label: `$${a}`, amount: a })), { label: 'Other', amount: null }] : [];
  const chosen = opts[Math.min(pick, opts.length - 1)];
  const href = !checkout ? '' : chosen?.amount ? `${checkout}${checkout.includes('?') ? '&' : '?'}amount=${chosen.amount}` : checkout;
  return (
    <div className="cl-buy">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="cl-h2">{heading}</h2>
      {pwyc && (
        <fieldset className="cl-amts" aria-label="Contribution amount" style={{ gridTemplateColumns: `repeat(${opts.length},minmax(0,1fr))` }}>
          {opts.map((o, i) => <button key={o.label} type="button" aria-pressed={i === pick} className={`cl-amt${i === pick ? ' on' : ''}`} onClick={() => setPick(i)}>{o.label}</button>)}
        </fieldset>
      )}
      {note && <p className="cl-small">{note}</p>}
      {href
        ? <a className="cl-btn cl-cta" href={href}>{cta} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
        : <p className="cl-small">Enrolment isn’t open yet. Check back soon.</p>}
      <div className="cl-small cl-secure"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5A5346" strokeWidth="2.2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>Secure checkout on Circle · instant access</div>
      <div className="cl-signin">Already enrolled? <a href={signIn}>Sign in to watch</a></div>
    </div>
  );
}
