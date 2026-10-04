'use client';
import { useState } from 'react';

// Posts directly to a Kit form. Without a form ID (local preview) it just shows the success state.
export default function KitForm({ formId, button, buttonClass = 'btn btn-primary', success = 'Check your inbox to confirm.', hintClass = 'form-ok' }) {
  const [state, setState] = useState('idle');
  async function onSubmit(e) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email_address');
    setState('sending');
    if (!formId) { setState('ok'); return; }
    try {
      const res = await fetch(`https://app.kit.com/forms/${formId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({ email_address: email }),
      });
      setState(res.ok ? 'ok' : 'error');
    } catch { setState('error'); }
  }
  if (state === 'ok') return <p className={hintClass} role="status">{success}</p>;
  return (
    <form onSubmit={onSubmit}>
      <input type="email" name="email_address" required placeholder="Your email address" aria-label="Email address" />
      <button className={buttonClass} type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : button}</button>
      {state === 'error' && <p className={hintClass} role="alert">That didn’t go through. Check the address and try again.</p>}
    </form>
  );
}
