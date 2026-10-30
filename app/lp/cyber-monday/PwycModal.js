'use client';
import { useEffect, useRef, useState } from 'react';
import CtaLink, { isUrl } from './CtaLink';
import { kitAmountParam } from './cyber-2026';

// "Pay what you can" button + the dialog that opens before checkout.
// Suggested amounts come from cyber-2026.js (pwyc). Until they are set, the dialog just says the amount is chosen at
// checkout. If Kit takes a pre-filled amount (kitAmountParam), the chosen amount is passed through.
export default function PwycModal({ course, pwyc, regular, state }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const dialog = useRef(null);
  const amounts = pwyc.suggested.every(n => n > 0) ? pwyc.suggested : null;
  const [pick, setPick] = useState(1);
  const [custom, setCustom] = useState('');
  const min = pwyc.minimum || 0;
  const customNum = parseFloat(custom);
  const customOk = custom === '' || (customNum > 0 && customNum >= min);
  const amount = custom !== '' ? (customOk ? customNum : null) : amounts ? amounts[pick] : null;

  function close() { setOpen(false); trigger.current?.focus(); }

  useEffect(() => {
    if (!open) return;
    const el = dialog.current;
    const focusables = () => [...el.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')].filter(n => !n.disabled);
    focusables()[0]?.focus();
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const [a, b] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, [open]);

  let href = course.checkout;
  if (isUrl(href) && kitAmountParam && amount) {
    const u = new URL(href); u.searchParams.set(kitAmountParam, String(amount)); href = u.toString();
  }
  const withAmount = kitAmountParam && amount;

  return (
    <>
      <button ref={trigger} type="button" className="cm-btn cm-btn-sm" onClick={() => setOpen(true)} aria-haspopup="dialog">Pay what you can</button>
      {open && (
        <div className="cm-scrim" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
          <div className="cm-modal" role="dialog" aria-modal="true" aria-labelledby={`pwyc-${course.id}`} ref={dialog}>
            <div className="cm-modal-head">
              {course.thumb ? <img src={course.thumb} alt="" width="112" height="72" /> : <div className="cm-modal-thumb" aria-hidden="true" />}
              <div><span className="cm-eyebrow">{course.topic}</span><h2 id={`pwyc-${course.id}`}>{course.title}</h2></div>
              <button type="button" className="cm-x" aria-label="Close" onClick={close}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="cm-modal-body">
              <div className="cm-row"><strong>{amounts ? 'Choose what you can give' : 'You choose the amount'}</strong><span>Regular <s>${regular}</s></span></div>
              {amounts ? (
                <>
                  <div className="cm-amounts">
                    {amounts.map((n, i) => (
                      <button key={i} type="button" aria-pressed={custom === '' && pick === i} onClick={() => { setPick(i); setCustom(''); }}>
                        ${n}<span>{pwyc.suggestedLabels[i]}</span>
                      </button>
                    ))}
                  </div>
                  <label className="cm-custom">Or enter your own amount{min ? ` (min $${min})` : ''}
                    <span><b>$</b><input type="text" inputMode="decimal" placeholder="0.00" value={custom} onChange={e => setCustom(e.target.value.replace(/[^0-9.]/g, ''))} aria-invalid={!customOk} /></span>
                    {!customOk && <em role="alert">{min ? `Please enter $${min} or more.` : 'Please enter an amount above zero.'}</em>}
                  </label>
                </>
              ) : (
                <p className="cm-note">At checkout you enter what is right for you. Same course, whatever you choose.</p>
              )}
              <CtaLink href={href} className="cm-btn" tier="open-library" item={course.id} state={state} soon="Checkout opening soon">
                Continue to checkout{withAmount ? ` · $${amount}` : ''}
              </CtaLink>
              <p className="cm-fine">Secure checkout · 30-day refund guarantee</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
