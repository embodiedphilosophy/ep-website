import { NextResponse } from 'next/server';
import { loadTeam } from '@/lib/calendar';
import { syncToMotion, addDays, eventIdFromTag } from '@/lib/ops/tasks';
import { listTasks } from '@/lib/ops/motion';
import { sendEmail, layout, button, esc } from '@/lib/ops/email';
import { findTagged, getMeeting } from '@/lib/zoom';
import { todayET, reminderRows, zoomLinkOf, emailsOf } from '@/lib/events';
import { meetingKey, zoomMode } from '@/lib/zoomplan';
import { longDate } from '@/lib/dates';

// Daily (vercel.json cron): fill Motion from the calendar and send teaching reminders.
// The ONLY emails this sends are reminders to addresses in each session's Teacher/Host Emails column.
// Run by hand: /api/ops/daily?key=CRON_SECRET  (add &only=sync to just fill Motion)
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Zoom link, in order: this row's zoom_link; a zoom_link on any row of the same series;
// Meditation Mondays' hand-made meeting; the meeting the Zoom sync made (one-off or series).
async function joinUrl(ev, seriesLinks) {
  if (zoomLinkOf(ev)) return zoomLinkOf(ev);
  if (ev.series && seriesLinks[ev.series]) return seriesLinks[ev.series];
  try {
    if (ev.series === 'meditation-mondays' && process.env.MEDITATION_MONDAYS_MEETING_ID) return (await getMeeting(process.env.MEDITATION_MONDAYS_MEETING_ID)).join_url;
    const key = meetingKey(ev) || ev.series || '';
    if (!key) return '';
    const m = await findTagged(key);
    return m ? (m.join_url || (await getMeeting(m.id)).join_url) : '';
  } catch { return ''; }
}

// Who gets a session's reminders: ONLY the addresses typed in that row's Teacher/Host Emails column.
// Nothing else sends a reminder: not the Team tab, not names in Teachers, not other rows of the series.
// To cover every session of a course, put the teacher's email on each of that course's rows.
function recipientsFor(ev, byEmail) {
  const people = new Map();
  for (const email of emailsOf(ev)) people.set(email, { name: byEmail[email]?.name || '', role: 'teaching' });
  return people;
}

// Reminder due on `day`: a week before, the day before, and the day of (every day of a multi-day event)
function whenFor(ev, day) {
  const end = ev.end_date && ev.end_date > ev.date ? ev.end_date : ev.date;
  if (ev.date === addDays(day, 7)) return 'in one week';
  if (ev.date === addDays(day, 1)) return 'tomorrow';
  if (day >= ev.date && day <= end) return 'today';
  return '';
}

function reminderEmail({ ev, when, p, link, tasks, base }) {
  const open = p.name ? tasks.filter(t => !t.completed && eventIdFromTag(t.description) === ev.id && t.labels.includes(p.name)) : [];
  const todo = open.length ? `<p><b>Still to send:</b></p><ul>${open.map(t => `<li>${esc(t.name.split(' — ')[0])} (due ${longDate(t.due)})</li>`).join('')}</ul>` : '';
  const hi = p.name ? `Hi ${esc(p.name.split(' ')[0])}` : 'Hello';
  return {
    subject: `Reminder: you’re ${p.role} ${ev.title} ${when}`,
    html: layout(`${ev.title}: ${when}`, `<p>${hi}, a reminder that you’re ${p.role} <b>${esc(ev.title)}</b> ${when === 'today' ? 'today' : 'on <b>' + longDate(ev.date) + '</b>'}${ev.time ? ' at <b>' + esc(ev.time) + '</b>' : ''}.</p>
      ${link ? `<p><b>Zoom:</b> <a href="${esc(link)}">${esc(link)}</a></p>` : '<p>The Zoom link will follow from the team.</p>'}
      ${todo}${p.name ? button(`${base}/ops`, 'Open your dashboard') : ''}`),
  };
}

// Modes (all need ?key=CRON_SECRET):
//   (none)                       the real daily run: Motion sync and reminders (no other emails)
//   &only=sync                   just fill Motion
//   &preview=21                  SENDS NOTHING. Lists every reminder due in the next 21 days, who gets it, and its Zoom link
//   &test_to=EMAIL&event=ID      sends ONE reminder for that event to EMAIL only (subject starts [TEST]); nobody else
//                                is emailed, no Motion changes. EMAIL must be a director on the Team tab. Optional &when=today|tomorrow|in one week
export async function GET(req) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers.get('authorization') !== `Bearer ${secret}` && url.searchParams.get('key') !== secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const base = process.env.OPS_URL || url.origin;
  const only = url.searchParams.get('only');
  const preview = Number(url.searchParams.get('preview') || 0);
  const testTo = String(url.searchParams.get('test_to') || '').trim().toLowerCase();

  const load = async () => {
    const [cal, team] = await Promise.all([reminderRows(), loadTeam({ fresh: true })]);
    const byEmail = Object.fromEntries(team.filter(t => t.email).map(t => [t.email.trim(), t]));
    const seriesLinks = {};
    for (const ev of cal) if (ev.series && zoomLinkOf(ev) && !seriesLinks[ev.series]) seriesLinks[ev.series] = zoomLinkOf(ev);
    return { cal, team, byEmail, seriesLinks };
  };

  // ---- Preview: nothing is sent or changed ----
  if (preview) {
    const { cal, byEmail, seriesLinks } = await load();
    const today = todayET(); const days = [];
    for (let i = 0; i < Math.min(preview, 60); i++) {
      const day = addDays(today, i); const items = [];
      for (const ev of cal) {
        const when = whenFor(ev, day); if (!when) continue;
        const people = recipientsFor(ev, byEmail); if (!people.size) continue;
        items.push({ event: ev.title, event_id: ev.id, session_date: ev.date, when, to: [...people].map(([e, p]) => `${e} (${p.role})`), zoom_link: (await joinUrl(ev, seriesLinks)) || 'NONE: email will say the link will follow' });
      }
      if (items.length) days.push({ send_on: day, reminders: items });
    }
    return NextResponse.json({ mode: 'preview: nothing was sent', days });
  }

  // ---- Test: one reminder, to one address, nobody else ----
  if (testTo) {
    const { cal, team, byEmail, seriesLinks } = await load();
    if (!team.some(t => t.director && t.email.trim() === testTo)) return NextResponse.json({ error: 'test_to must be a director on the Team tab' }, { status: 403 });
    const ev = cal.find(e => e.id === url.searchParams.get('event'));
    if (!ev) return NextResponse.json({ error: 'event not found; use an event_id from the preview', ids: cal.filter(e => e.date >= todayET()).slice(0, 30).map(e => `${e.id}: ${e.title}`) }, { status: 404 });
    const when = url.searchParams.get('when') || 'tomorrow';
    const real = recipientsFor(ev, byEmail);
    const p = real.get(testTo) || { name: byEmail[testTo]?.name || '', role: 'teaching' };
    const link = await joinUrl(ev, seriesLinks);
    let tasks = []; try { tasks = await listTasks({ fresh: true }); } catch {}
    const msg = reminderEmail({ ev, when, p, link, tasks, base });
    await sendEmail({ to: testTo, subject: `[TEST] ${msg.subject}`, html: msg.html });
    return NextResponse.json({ mode: 'test: one email sent', sent_to: testTo, subject: `[TEST] ${msg.subject}`, zoom_link: link || 'NONE', real_recipients_for_this_event: [...real.keys()], note: 'Only the test address was emailed.' });
  }

  // ---- The real daily run ----
  const out = { motion: null, reminders: [], errors: [] };
  try { out.motion = await syncToMotion(); } catch (e) { out.errors.push('Motion: ' + e.message); }
  if (only === 'sync') return NextResponse.json(out);

  const { cal, byEmail, seriesLinks } = await load();
  const today = todayET();

  // 2) Reminders
  let tasks = [];
  try { tasks = await listTasks({ fresh: true }); } catch {}
  for (const ev of cal) {
    const when = whenFor(ev, today); if (!when) continue;
    const people = recipientsFor(ev, byEmail); if (!people.size) continue;
    const link = await joinUrl(ev, seriesLinks);
    for (const [email, p] of people) {
      try {
        const msg = reminderEmail({ ev, when, p, link, tasks, base });
        await sendEmail({ to: email, ...msg });
        out.reminders.push(`${email}: ${ev.title} (${when}${link ? '' : ', no Zoom link'})`);
      } catch (e) { out.errors.push(`Reminder ${email}: ${e.message}`); }
    }
  }
  return NextResponse.json(out);
}
