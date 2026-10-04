'use client';
import KitForm from './KitForm';
import { track } from '@/lib/track';

// Free event sign-up: adds the person to Kit, and (if the event has a Zoom meeting) registers them
// so Zoom emails their personal link.
export default function EventSignup({ formId, eventId, button = 'Sign up for Free', success }) {
  const register = email => {
    track('CompleteRegistration', { content_name: eventId || 'living-room-lectures' });
    if (!eventId) return;
    fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: eventId, email }) })
      .catch(() => {});
  };
  return <KitForm formId={formId} onSuccess={register} button={button} success={success} />;
}
