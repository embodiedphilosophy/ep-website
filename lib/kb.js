import { readRange } from './google';

// Help Centre answers, read from the "EP Support KB" Google Sheet (Entries tab) — the same
// source Ether (ep-support-agent) answers from. Only rows with Public = Yes are shown, and only
// the question and public answer are read: Ether's notes, handoff rules and owners never load here.

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

// Reads the Entries tab with the site's Google service account (the same one that reads
// EP-Programming-Calendar). KB_SHEET_ID can override the sheet.
async function readEntries() {
  const sheetId = process.env.KB_SHEET_ID || '1Fn884BCxEK-m_h7oeV3V1JmEfzaiUGahRWCPyEq-Upc';
  const rows = await readRange(sheetId, 'Entries!A1:O500');
  const [head = [], ...body] = rows;
  const col = name => head.indexOf(name);
  const pick = (r, name) => (col(name) >= 0 ? String(r[col(name)] || '').trim() : '');
  return body.map(r => ({
    id: pick(r, 'ID'), topic: pick(r, 'Topic'), question: pick(r, 'Question'),
    answer: pick(r, 'Public answer'), public: pick(r, 'Public'), status: pick(r, 'Status'),
  }));
}

export async function getHelpTopics() {
  // Until the team has reviewed the drafts, the Help Centre shows Live and Draft rows.
  // Set KB_STATUSES=Live in Vercel to show only approved answers.
  const statuses = (process.env.KB_STATUSES || 'Live,Draft').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  try {
    const entries = await readEntries();
    const rows = entries.filter(e => e.id && e.public.toLowerCase() === 'yes' && statuses.includes(e.status.toLowerCase()));
    return TOPICS
      .map(t => ({
        ...t,
        entries: rows.filter(e => e.topic === t.name).map(e => ({ id: e.id, q: e.question, a: forPage(e.answer) })),
      }))
      .filter(t => t.entries.length);
  } catch (e) {
    console.error('help centre: KB read failed', e.message);
    return [];
  }
}
