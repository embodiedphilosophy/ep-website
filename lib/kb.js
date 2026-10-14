// Help Centre answers, read from the "EP Support KB" Google Sheet (Entries tab) through the
// sheet's Apps Script web app — the same source Ether (ep-support-agent) answers from.
// Only rows with Public = Yes and a Status in KB_STATUSES (default "Live") are shown.
// Private columns (Ether notes, handoff rules, owners) never leave the server.
// Vercel: KB_URL, KB_TOKEN, optional KB_STATUSES.

const TOPICS = [
  { name: 'Your Course Dashboard', blurb: 'Signing in, finding your courses, what you can see' },
  { name: 'Live sessions & replays', blurb: 'Joining live, time zones, recordings' },
  { name: 'Memberships & pricing', blurb: 'Wisdom School, Plus, Meditation Pass, Sādhana School' },
  { name: 'Billing, refunds & cancelling', blurb: 'Refunds, cancelling, failed payments' },
  { name: 'The legacy platform', blurb: 'Courses bought before October 2026' },
  { name: 'Certificates & CE hours', blurb: 'Yoga Alliance credits and certificates' },
  { name: 'Email, account & privacy', blurb: 'Newsletters, notifications, your data' },
  { name: 'Books & journal orders', blurb: 'EP Press books and Tarka Journal' },
];

// Answers are written in Ether's voice ("ask me"); on the page they point to Ether instead.
function forPage(text) {
  return String(text || '')
    .replace(/\bthen ask me here\b/g, 'then ask Ether, our chat assistant')
    .replace(/\b([Aa])sk me\b/g, '$1sk Ether')
    .replace(/\bTell me\b/g, 'Tell Ether')
    .replace(/\bSend me\b/g, 'Send Ether');
}

export async function getHelpTopics() {
  const url = process.env.KB_URL;
  if (!url) return [];
  const statuses = (process.env.KB_STATUSES || 'Live').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  try {
    const res = await fetch(`${url}?token=${encodeURIComponent(process.env.KB_TOKEN || '')}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`KB ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.entries)) throw new Error('KB bad response');
    const rows = data.entries.filter(e => e.id && String(e.public).toLowerCase() === 'yes' && statuses.includes(String(e.status).toLowerCase()));
    return TOPICS
      .map(t => ({
        ...t,
        entries: rows.filter(e => e.topic === t.name).map(e => ({ id: e.id, q: e.question, a: forPage(e.answer) })),
      }))
      .filter(t => t.entries.length);
  } catch (e) {
    console.error('help centre: KB fetch failed', e.message);
    return [];
  }
}
