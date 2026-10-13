'use client';
import { useState } from 'react';

// Sticky panel on a course page. Every button opens the offering's Circle paywall (checkout_url).
// Pay-what-you-can: pick an amount first, then continue to checkout with the amount attached.
export default function BuyPanel({ price, note, checkout, pwyc, amounts, cta }) {
  const [amt, setAmt] = useState(null);
  const href = !checkout ? '' : pwyc && amt ? `${checkout}${checkout.includes('?') ? '&' : '?'}amount=${amt}` : checkout;
  return (
    <aside className="cl-buy">
      {price && <div className="cl-price">{price}</div>}
      {note && <p className="cl-buy-note">{note}</p>}
      {pwyc && amounts.length > 0 && (
        <fieldset className="cl-amts"><legend>Choose an amount</legend>
          <div className="cl-chips">
            {amounts.map(a => <button key={a} type="button" aria-pressed={amt === a} className={`cl-chip${amt === a ? ' on' : ''}`} onClick={() => setAmt(amt === a ? null : a)}>${a}</button>)}
          </div>
        </fieldset>
      )}
      {href
        ? <a className="btn btn-primary cl-cta" href={href}>{pwyc ? (amt ? `Continue with $${amt}` : 'Continue to checkout') : cta} →</a>
        : <p className="cl-buy-note">Enrolment isn’t open yet. Check back soon.</p>}
    </aside>
  );
}
