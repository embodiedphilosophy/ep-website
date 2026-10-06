'use client';
import { useState } from 'react';
import { track } from '@/lib/track';

// Posts directly to a Kit form. Without a form ID (local preview) it just shows the success state.
export default function KitForm({ formId, onSuccess, button, buttonClass = 'btn btn-primary', success = 'Check your inbox to confirm.', hintClass = 'form-ok' }) {
  const [state, setState] = useState('idle');
  async function onSubmit(e) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email_address');
    setState('sending');
    if (!formId) { setState('ok'); track('Lead', { content_name: 'signup' }); onSuccess?.(email); return; }
    try {
      const id = String(formId).trim();
      const res = await fetch(`https://app.kit.com/forms/${id}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({ email_address: email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status === 'failed') { setState('error'); return; }
      track('Lead', { content_name: id });
      onSuccess?.(email);
      // Kit asks visitors in GDPR regions (UK/EU) to give consent on its own page before the
      // subscription is created. Without this step those signups are silently dropped.
      if (data.consent?.enabled && data.consent?.url) {
        const w = window.open(data.consent.url, '_blank');
        if (!w) { window.location.href = data.consent.url; return; }
        setState('consent'); return;
      }
      setState('ok');
    } catch { setState('error'); }
  }
  if (state === 'ok') return <p className={hintClass} role="status">{success}</p>;
  if (state === 'consent') return <p className={hintClass} role="status">One more step: confirm your subscription in the tab that just opened.</p>;
  return (
    <form onSubmit={onSubmit}>
      <input type="email" name="email_address" required placeholder="Your email address" aria-label="Email address" />
      <button className={buttonClass} type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : button}</button>
      {state === 'error' && <p className={hintClass} role="alert">That didn’t go through. Check the address and try again.</p>}
    </form>
  );
}
