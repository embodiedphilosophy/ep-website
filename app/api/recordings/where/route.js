import { NextResponse } from 'next/server';
import { loadAndPlan } from '@/lib/recordings';

// Where a finished Zoom recording belongs. Called by the Make scenarios "EP Zoom recording → trim + trailer" (to skip
// recordings that aren't a calendar session) and "EP trimmed recording → Vimeo → Circle" (to know where to post it).
// READ-ONLY: it reads the calendar sheet, Zoom and Circle and answers with a plan; Make does every write.
//
//   GET /api/recordings/where?key=RECORDINGS_KEY&meeting_id=82204960965&start=2026-10-21T13:00:00Z&topic=...
//
// Answer: { matched, programme, title, vimeo_name, actions: [ {type:'post'|'lesson'|'event', ...} ], notes }
// or { matched:false, reason }. Routing rules are in lib/recordings.js:
//   Meditation Mondays  → a lesson in that month's section of the Meditation Pass course + link on the session page
//   Sādhana School      → a post in the season's hub (Recordings topic; season picked by date) + link on the session page
//   Sahṛdaya Upāya      → a post in Mentorship Circle + link on the session page
//   Wisdom School       → a lesson in that month's section of the year course (Book club / Workshops by title) + session page
//   anything else       → link on its Circle session page
// Vercel: RECORDINGS_KEY (any long random string, the same one Make sends), plus the existing CALENDAR_SHEET_ID,
// CIRCLE_API_TOKEN, Zoom credentials and MEDITATION_MONDAYS_MEETING_ID.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req) {
  const url = new URL(req.url);
  const key = process.env.RECORDINGS_KEY || process.env.CRON_SECRET;
  if (!key || url.searchParams.get('key') !== key) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const meetingId = url.searchParams.get('meeting_id') || '';
  const start = url.searchParams.get('start') || '';
  if (!meetingId || !Date.parse(start)) return NextResponse.json({ error: 'meeting_id and start (ISO time) are needed' }, { status: 400 });
  try {
    return NextResponse.json(await loadAndPlan({ meetingId, topic: url.searchParams.get('topic') || '', start }));
  } catch (e) {
    console.error('recordings/where', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
