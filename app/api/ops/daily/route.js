import { NextResponse } from 'next/server';
import { loadCalendar, loadTeam } from '@/lib/calendar';
import { writeRange } from '@/lib/google';
import { syncToMotion, names, addDays, eventIdFromTag } from '@/lib/ops/tasks';
import { listTasks } from '@/lib/ops/motion';
import { sendEmail, layout, button, esc } from '@/lib/ops/email';
import { findTagged, getMeeting } from '@/lib/zoom';
import { todayET } from '@/lib/events';
import { longDate } from '@/lib/dates';

// Daily (vercel.json cron): welcome new teachers, fill Motion from the calendar, send teaching reminders.
// Run by hand: /api/ops/daily?key=CRON_SECRET  (add &only=sync to just fill Motion)
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function joinUrl(ev) {
  try {
    if (ev.series === 'meditation-mondays' && process.env.MEDITATION_MONDAYS_MEETING_ID) return (await getMeeting(process.env.MEDITATION_MONDAYS_MEETING_ID)).join_url;
    const m = await findTagged(ev.id);
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

  const [cal, team] = await Promise.all([loadCalendar({ fresh: true }), loadTeam({ fresh: true })]);
  const today = todayET();
  const byName = Object.fromEntries(team.map(t => [t.name, t]));

  // 1) Onboarding: teachers named on an upcoming event who haven't been welcomed yet
  for (const t of team.filter(t => t.email && !t.welcomed_on && t.type.toLowerCase() === 'teacher')) {
    const teaching = cal.filter(ev => ev.date >= today && names(ev.teachers).includes(t.name));
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

  // 2) Reminders a week before, the day before, and the day of
  let tasks = [];
  try { tasks = await listTasks({ fresh: true }); } catch {}
  const when = { [addDays(today, 7)]: 'in one week', [addDays(today, 1)]: 'tomorrow', [today]: 'today' };
  for (const ev of cal.filter(ev => when[ev.date])) {
    const people = [...new Set([...names(ev.teachers), ...names(ev.course_host)])].map(n => byName[n]).filter(p => p?.email);
    if (!people.length) continue;
    const link = await joinUrl(ev);
    for (const p of people) {
      const role = names(ev.course_host).includes(p.name) ? 'hosting' : 'teaching';
      const open = tasks.filter(t => !t.completed && eventIdFromTag(t.description) === ev.id && t.labels.includes(p.name));
      const todo = open.length ? `<p><b>Still to send:</b></p><ul>${open.map(t => `<li>${esc(t.name.split(' — ')[0])} (due ${longDate(t.due)})</li>`).join('')}</ul>` : '';
      try {
        await sendEmail({ to: p.email, subject: `Reminder: you’re ${role} ${ev.title} ${when[ev.date]}`,
          html: layout(`${ev.title}: ${when[ev.date]}`, `<p>Hi ${esc(p.name.split(' ')[0])}, a reminder that you’re ${role} <b>${esc(ev.title)}</b> on <b>${longDate(ev.date)}${ev.time ? ', ' + esc(ev.time) : ''}</b>.</p>
            ${link ? `<p><b>Zoom:</b> <a href="${esc(link)}">${esc(link)}</a></p>` : '<p>The Zoom link will follow from the team.</p>'}
            ${todo}${button(`${base}/ops`, 'Open your dashboard')}`) });
        out.reminders.push(`${p.name}: ${ev.title} (${when[ev.date]})`);
      } catch (e) { out.errors.push(`Reminder ${p.name}: ${e.message}`); }
    }
  }
  return NextResponse.json(out);
}
