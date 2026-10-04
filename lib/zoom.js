// Zoom Server-to-Server OAuth. Set in Vercel: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
let cached = { token: null, exp: 0 };

async function token() {
  if (cached.token && Date.now() < cached.exp) return cached.token;
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) throw new Error('Zoom credentials are not set');
  const res = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64') },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Zoom auth failed: ${res.status} ${await res.text()}`);
  const j = await res.json();
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return cached.token;
}

async function zoom(path, init = {}) {
  const res = await fetch(`https://api.zoom.us/v2${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Zoom ${path} failed: ${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

// The next session of a recurring meeting that hasn't ended yet
export async function nextOccurrence(meetingId) {
  const m = await zoom(`/meetings/${meetingId}`);
  const now = Date.now();
  const occ = (m.occurrences || []).filter(o => o.status !== 'deleted')
    .find(o => new Date(o.start_time).getTime() + (o.duration || m.duration || 60) * 60000 > now);
  return occ ? { id: occ.occurrence_id, start: occ.start_time, topic: m.topic } : null;
}

// Register someone. With occurrenceId: that one session only. Without: every session.
export async function addRegistrant(meetingId, { email, first_name, last_name }, occurrenceId) {
  const qs = occurrenceId ? `?occurrence_ids=${occurrenceId}` : '';
  return zoom(`/meetings/${meetingId}/registrants${qs}`, {
    method: 'POST',
    body: JSON.stringify({ email, first_name: first_name || 'Friend', last_name: last_name || '' }),
  });
}
