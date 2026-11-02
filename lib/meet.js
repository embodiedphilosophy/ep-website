// Google Meet links for study and practicum pods: each new pod gets its own reusable Meet room, so its leader never has to make one.
// Rooms belong to MEET_HOST_EMAIL (a Workspace user, e.g. team@embodiedphilosophy.com) and are OPEN: anyone with the link joins
// straight in, any day, with no host needed. Setup (docs/study-pods.md): enable the Google Meet REST API for the service account's project,
// and in Google Admin give the service account domain-wide delegation for the scope below. Off until MEET_HOST_EMAIL is set.
import { googleConfigured, delegatedToken } from './google';

const SCOPE = 'https://www.googleapis.com/auth/meetings.space.created';
export const meetConfigured = () => googleConfigured() && /@/.test(process.env.MEET_HOST_EMAIL || '');

export async function createMeetLink() {
  const t = await delegatedToken(SCOPE, process.env.MEET_HOST_EMAIL.trim());
  const res = await fetch(`${process.env.MEET_API_BASE || 'https://meet.googleapis.com'}/v2/spaces`, {
    method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: { accessType: 'OPEN', entryPointAccess: 'ALL' } }),
  });
  if (!res.ok) throw new Error(`Google Meet ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  if (!/^https:\/\/\S+$/.test(j.meetingUri || '')) throw new Error('Google Meet sent back no link');
  return j.meetingUri;
}

// Best effort: '' when Meet is off or the call fails, so making a pod never fails because of it (the leader can still paste a link)
export async function autoMeetLink() {
  if (!meetConfigured()) return '';
  try { return await createMeetLink(); } catch (e) { console.error('Meet link', e.message); return ''; }
}
