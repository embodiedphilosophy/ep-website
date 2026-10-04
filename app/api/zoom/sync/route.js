import { NextResponse } from 'next/server';
import { eventRows, recurringRules, todayET } from '@/lib/events';
import { listUpcoming, findTagged, createMeeting, updateMeeting, tagFor } from '@/lib/zoom';
import { to24h, TZ, WEEKDAY_NUM } from '@/lib/when';

// Creates or updates a Zoom meeting for every sheet row with zoom = TRUE.
// Runs daily via Vercel Cron (vercel.json), or open /api/zoom/sync?key=CRON_SECRET to run it now.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const yes = v => String(v || '').trim().toUpperCase() === 'TRUE';
const settings = { approval_type: 0, registrants_confirmation_email: true, registrants_email_notification: true, waiting_room: false, join_before_host: false, auto_recording: 'cloud' };

export async function GET(req) {
  const url = new URL(req.url);
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || (auth !== `Bearer ${secret}` && url.searchParams.get('key') !== secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const report = [];
  try {
    const upcoming = await listUpcoming();
    const today = todayET();

    // One-off events (Living Room Lectures, lectures, workshops, orientations…)
    for (const e of (await eventRows()).filter(e => yes(e.zoom) && (e.end_date || e.date) >= today)) {
      const start_time = `${e.date}T${to24h(e.time)}`;
      const duration = Number(e.duration_minutes) || 90;
      const body = { topic: e.title, type: 2, start_time, timezone: TZ, duration, agenda: `${e.title}\n${tagFor(e.id)}`, settings };
      const found = await findTagged(e.id, upcoming);
      if (!found) { const m = await createMeeting(body); report.push({ id: e.id, action: 'created', meeting: m.id }); }
      else {
        // Zoom reports start_time in UTC; compare in Eastern time
        const et = found.start_time ? new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(found.start_time)).replace(' ', 'T') : '';
        const changed = found.topic !== e.title || found.duration !== duration || et !== start_time.slice(0, 16);
        if (changed) { await updateMeeting(found.id, body); report.push({ id: e.id, action: 'updated', meeting: found.id }); }
        else report.push({ id: e.id, action: 'ok', meeting: found.id });
      }
    }

    // Weekly series (Sādhana School semesters, lecture series…) → one recurring meeting
    for (const r of (await recurringRules()).filter(r => yes(r.zoom))) {
      const key = r.series || r.title;
      const day = WEEKDAY_NUM[String(r.weekday || '').trim().toLowerCase()];
      if (!day || !r.start_date) { report.push({ id: key, action: 'skipped', reason: 'needs weekday and start_date' }); continue; }
      const end = r.end_date || new Date(new Date(r.start_date).getTime() + 12 * 7 * 86400000).toISOString().slice(0, 10);
      const body = {
        topic: r.title, type: 8, start_time: `${r.start_date}T${to24h(r.time)}`, timezone: TZ,
        duration: Number(r.duration_minutes) || 90, agenda: `${r.title}\n${tagFor(key)}`,
        recurrence: { type: 2, repeat_interval: 1, weekly_days: String(day), end_date_time: `${end}T23:59:00Z` },
        settings: { ...settings, registration_type: String(r.zoom_registration).toLowerCase() === 'each' ? 2 : 1 },
      };
      const found = await findTagged(key, upcoming);
      if (!found) { const m = await createMeeting(body); report.push({ id: key, action: 'created series', meeting: m.id }); }
      else report.push({ id: key, action: 'ok', meeting: found.id });
    }
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error('Zoom sync failed', err.message);
    return NextResponse.json({ ok: false, error: err.message, report }, { status: 500 });
  }
}
