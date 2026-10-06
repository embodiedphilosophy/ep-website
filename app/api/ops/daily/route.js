import { NextResponse } from 'next/server';
import { loadTeam } from '@/lib/calendar';
import { writeRange } from '@/lib/google';
import { syncToMotion, names, addDays, eventIdFromTag } from '@/lib/ops/tasks';
import { listTasks } from '@/lib/ops/motion';
import { sendEmail, layout, button, esc } from '@/lib/ops/email';
import { findTagged, getMeeting } from '@/lib/zoom';
import { todayET, reminderRows, zoomLinkOf, emailsOf, hostEmailsOf } from '@/lib/events';
import { meetingKey, zoomMode } from '@/lib/zoomplan';
import { longDate } from '@/lib/dates';

// Daily (vercel.json cron): welcome new teachers, fill Motion from the calendar, send teaching reminders.
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

export async function GET(req) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers.get('authorization') !== `Bearer ${secret}` && url.searchParams.get('key') !== secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const base = process.env.OPS_URL || url.origin;
  const out = { welcomed: [], motion: null, reminders: [], errors: [] };
  const only = url.searchParams.get('only');

  try { out.motion = await syncToMotion(); } catch (e) { out.errors.push('Motion: ' + e.message); }
  if (only === 'sync') return NextResponse.json(out);

  // Same events the website and Zoom sync use (EP Site Events, or the Master Schedule when events_source = calendar)
  const [cal, team] = await Promise.all([reminderRows(), loadTeam({ fresh: true })]);
  const today = todayET();
  const byName = Object.fromEntries(team.map(t => [t.name, t]));
  const byEmail = Object.fromEntries(team.filter(t => t.email).map(t => [t.email.trim(), t]));
  const seriesLinks = {};
  for (const ev of cal) if (ev.series && zoomLinkOf(ev) && !seriesLinks[ev.series]) seriesLinks[ev.series] = zoomLinkOf(ev);

  // 1) Onboarding: teachers named on an upcoming event who haven't been welcomed yet
  for (const t of team.filter(t => t.email && !t.welcomed_on && t.type.toLowerCase() === 'teacher')) {
    const teaching = cal.filter(ev => !ev._generated && ev.date >= today && names(ev.teachers).includes(t.name));
    if (!teaching.length) continue;
    try {
      const list = teaching.slice(0, 5).map(ev => `<li>${esc(ev.title)}: ${longDate(ev.date)}${ev.time ? ', ' + esc(ev.time) : ''}</li>`).join('');
      await sendEmail({ to: t.email, subject: 'Welcome to the Embodied Philosophy teaching team',
        html: layout(`Welcome, ${t.name.split(' ')[0]}`, `<p>We’re so glad you’re teaching with us. You’re on the calendar for:</p><ul>${list}</ul>
          <p>Your team dashboard lists everything we’ll need from you (bio, descriptions, materials) and when. You’ll also get reminders with the Zoom link a week before, the day before, and the morning of each teaching.</p>
          ${button(`${base}/ops/login`, 'Open your dashboard')}<p>Sign in with this email address (${esc(t.email)}).</p>`) });
      await writeRange(process.env.CALENDAR_SHEET_ID, `'Team'!F${t._row}`, [[today]]);
      out.welcomed.push(t.name);
    } catch (e) { out.errors.push(`Welcome ${t.name}: ${e.message}`); }
  }

  // 2) Reminders a week before, the day before, and the day of (every day of a multi-day course).
  // Recipients are ONLY the people responsible for that session: addresses in the session's
  // teacher_host_emails, the course's course_host_emails (Recurring tab), and Team members named in
  // the session's Teachers / Course Host. Each address gets one email per session.
  let tasks = [];
  try { tasks = await listTasks({ fresh: true }); } catch {}
  const whenFor = ev => {
    const end = ev.end_date && ev.end_date > ev.date ? ev.end_date : ev.date;
    if (ev.date === addDays(today, 7)) return 'in one week';
    if (ev.date === addDays(today, 1)) return 'tomorrow';
    if (today >= ev.date && today <= end) return 'today';
    return '';
  };
  for (const ev of cal) {
    const when = whenFor(ev);
    if (!when) continue;
    const hosts = names(ev.course_host);
    const people = new Map(); // email → { name, role }
    // A weekly session generated from a Recurring rule has no named teachers of its own
    for (const n of [...(ev._generated ? [] : names(ev.teachers)), ...hosts]) {
      const p = byName[n];
      if (p?.email) people.set(p.email.trim(), { name: p.name, role: hosts.includes(n) ? 'hosting' : 'teaching' });
    }
    for (const email of hostEmailsOf(ev)) {
      if (!people.has(email)) people.set(email, { name: byEmail[email]?.name || '', role: 'hosting' });
    }
    for (const email of emailsOf(ev)) {
      if (!people.has(email)) {
        const p = byEmail[email];
        people.set(email, { name: p?.name || '', role: p && hosts.includes(p.name) ? 'hosting' : 'teaching' });
      }
    }
    if (!people.size) continue;
    const link = await joinUrl(ev, seriesLinks);
    for (const [email, p] of people) {
      const open = p.name ? tasks.filter(t => !t.completed && eventIdFromTag(t.description) === ev.id && t.labels.includes(p.name)) : [];
      const todo = open.length ? `<p><b>Still to send:</b></p><ul>${open.map(t => `<li>${esc(t.name.split(' — ')[0])} (due ${longDate(t.due)})</li>`).join('')}</ul>` : '';
      const hi = p.name ? `Hi ${esc(p.name.split(' ')[0])}` : 'Hello';
      try {
        await sendEmail({ to: email, subject: `Reminder: you’re ${p.role} ${ev.title} ${when}`,
          html: layout(`${ev.title}: ${when}`, `<p>${hi}, a reminder that you’re ${p.role} <b>${esc(ev.title)}</b> ${when === 'today' ? 'today' : 'on <b>' + longDate(ev.date) + '</b>'}${ev.time ? ' at <b>' + esc(ev.time) + '</b>' : ''}.</p>
            ${link ? `<p><b>Zoom:</b> <a href="${esc(link)}">${esc(link)}</a></p>` : '<p>The Zoom link will follow from the team.</p>'}
            ${todo}${p.name ? button(`${base}/ops`, 'Open your dashboard') : ''}`) });
        out.reminders.push(`${email}: ${ev.title} (${when}${link ? '' : ', no Zoom link'})`);
      } catch (e) { out.errors.push(`Reminder ${email}: ${e.message}`); }
    }
  }
  return NextResponse.json(out);
}
