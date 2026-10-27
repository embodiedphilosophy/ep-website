import { NextResponse } from 'next/server';
import { todayET, reminderRows } from '@/lib/events';
import { parseTime, zonedToUtc } from '@/lib/member/schedule';
import { joinUrlFor, seriesLinksOf, upcomingMeetings } from '@/lib/ops/joinurl';
import config from '@/data/meditation-pass.json';

// The Meditation Mondays "we begin in one hour" email (vercel.json cron, Mondays 12:00 UTC = 7 or 8am ET).
// Each Monday it finds that day's Meditation Monday in the calendar sheet and SCHEDULES a Kit broadcast for one
// hour before it starts (send_at, so daylight saving is handled), to Meditation Pass + Wisdom School + Plus members.
// No session that day (holiday, cancelled row) → nothing is sent. Runs at most once per Monday: the broadcast
// description carries [MM-REMINDER YYYY-MM-DD], and an existing one is never duplicated.
//
// By hand (all need ?key=CRON_SECRET or the cron's Authorization header):
//   &date=YYYY-MM-DD   a specific Monday instead of today (ET)
//   &preview=1         SENDS NOTHING, CREATES NOTHING: the email as a web page
//   &dry=1             JSON of what would happen; nothing created
//
// Vercel: KIT_API_KEY (already set). Optional: MM_REMINDER_TAG_IDS (comma list; default the three member tags),
// MM_REMINDER_TEMPLATE_ID (default 5578308 "Text only"), MM_REMINDER_OFF=1 to pause it.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Member: Meditation Pass, Member: Wisdom School, Member: Wisdom School Plus
const TAGS = () => String(process.env.MM_REMINDER_TAG_IDS || '24287364,24287365,24372169').split(',').map(Number).filter(Boolean);
const KIT = 'https://api.kit.com/v4';

async function kit(path, { method = 'GET', body } = {}) {
  if (!process.env.KIT_API_KEY) throw new Error('KIT_API_KEY is not set');
  const res = await fetch(KIT + path, {
    method, cache: 'no-store',
    headers: { 'X-Kit-Api-Key': process.env.KIT_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Kit ${method} ${path} failed: ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

// Already made this Monday's? (looks at the most recent broadcasts only)
async function alreadyMade(marker) {
  const r = await kit('/broadcasts?per_page=50');
  return (r.broadcasts || []).find(b => String(b.description || '').includes(marker)) || null;
}

// ---------- the email (Kit's "Text only" template wraps this and adds the unsubscribe footer) ----------
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const C = { cream: '#FAF7EA', ink: '#1A1613', gold: '#9C7E1E', gold2: '#A2851F', goldLight: '#C4A74B', body: '#4C4636', muted: '#928A72', rule: '#DBCFAC', amber: '#ECA127' };
const block = (inner, bg = C.cream, pad = '28px 32px 24px 32px', extra = '') =>
  `<table class="ck-layout-block" width="100%" border="0" cellPadding="0" cellSpacing="0" bgcolor="${bg}" style="background-color:${bg};padding:${pad};margin:0px;${extra}"><tbody><tr><td width="100%" style="vertical-align:top">${inner}</td></tr></tbody></table>`;
const para = (t, extra = '') => `<p style="color:${C.body};font-family:Arial;font-size:15px;line-height:1.6;margin:0 0 12px 0;${extra}">${t}</p>`;
const btn = (href, label, bg, fg) => `<table width="100%"><tbody><tr><td align="left"><a class="email-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer" style="border:solid 1px ${bg};background-color:${bg};color:${fg};display:inline-block;text-decoration:none;padding:12px 20px;margin:6px 0 6px 0;font-size:14px;border-radius:4px;font-family:Arial;font-weight:700;letter-spacing:0.5px">${esc(label)}</a></td></tr></tbody></table>`;

function buildEmail({ timeText, teacher, topic, zoom, circle }) {
  const lead = [topic && `<em>${esc(topic)}</em>`, teacher && `with ${esc(teacher)}`].filter(Boolean).join(' ');
  const content = [
    block(`<p style="text-align:center;margin:4px 0"><a href="https://embodiedphilosophy.com" target="_blank"><img src="https://embed.filekitcdn.com/e/x8NRZ83fCR5nzjGX8kcfRN/sNy6tXg8PBU4u8j7rBoKXX" alt="Embodied Philosophy" width="190" style="width:190px;max-width:100%;height:auto"/></a></p>`, C.cream, '28px 24px 22px 24px', `border-bottom:solid 2px ${C.ink}`),
    block([
      `<h4 style="color:${C.gold};font-family:Arial;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0">Meditation Mondays · Live today</h4>`,
      `<h2 style="color:${C.gold2};font-family:Georgia;font-size:30px;font-weight:400;line-height:1.2;margin:0 0 14px 0">We begin in one hour.</h2>`,
      para('Dear {{ subscriber.first_name | default: "friend" }},'),
      para(`Today's Meditation Monday${lead ? `, ${lead},` : ''} starts at <strong>${esc(timeText)}</strong>. Find a quiet seat, settle in, and join a few minutes early so we can begin together.`),
      zoom ? btn(zoom, 'Join live on Zoom →', C.amber, C.ink) : '',
      btn(circle, zoom ? 'Open Meditation Mondays in Circle' : 'Join from Meditation Mondays in Circle →', zoom ? C.ink : C.amber, zoom ? '#FFFFFF' : C.ink),
      `<hr style="width:100%;height:1px;margin:10px 0;border:none;background-color:${C.rule}"/>`,
      para(`Can't make it live? The replay will be posted in ${`<a href="${esc(config.replays_url)}" target="_blank" style="color:${C.gold}">your Meditation Mondays replays</a>`} shortly after the session.`),
      para('See you shortly,'),
      `<h3 style="color:${C.ink};font-family:Georgia;font-size:19px;font-weight:700;line-height:1.3;margin:0">Jacob Kyle</h3>`,
      `<p style="color:${C.muted};font-family:Arial;font-size:12px;line-height:1.4;margin:0">Founding Director, Embodied Philosophy</p>`,
    ].join('')),
    block(`<p style="text-align:center;margin:0 0 6px 0"><img src="https://embed.filekitcdn.com/e/x8NRZ83fCR5nzjGX8kcfRN/2EUaDr5877kQGXdy9Lae7T" alt="EP" width="36" style="width:36px;height:auto"/></p><p style="color:${C.goldLight};font-family:Arial;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0;text-align:center">Embodied Philosophy</p><p style="color:#B1A982;font-family:Arial;font-size:12px;line-height:1.6;margin:8px 0;text-align:center">A school of interdisciplinary, contemplative education. <a href="https://embodiedphilosophy.com" target="_blank" style="color:${C.gold}">embodiedphilosophy.com</a></p>`, C.ink, '24px 24px 22px 24px'),
  ].join('');
  return {
    subject: 'Meditation Mondays begins in one hour',
    preview_text: `Live at ${timeText}${teacher ? ` with ${teacher}` : ''}. Here's your link to join.`,
    content,
  };
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers.get('authorization') !== `Bearer ${secret}` && url.searchParams.get('key') !== secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const mode = url.searchParams.get('preview') ? 'preview' : url.searchParams.get('dry') ? 'dry' : 'build';
  if (mode === 'build' && process.env.MM_REMINDER_OFF === '1') return NextResponse.json({ skipped: 'Paused (MM_REMINDER_OFF=1).' });

  const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') || '') ? url.searchParams.get('date') : todayET();
  try {
    const rows = await reminderRows();
    const ev = rows.find(e => String(e.series || '').toLowerCase() === 'meditation-mondays' && e.date === day && !/cancel/i.test(e.status || ''));
    if (!ev) return NextResponse.json({ skipped: `No Meditation Monday in the calendar on ${day}; nothing sent.` });

    const t = parseTime(ev.time) || { h: 12, m: 0, zone: 'America/New_York' };
    const start = zonedToUtc(day, t.h, t.m, t.zone);
    const sendAt = new Date(start.getTime() - 60 * 60000);
    const timeText = String(ev.time || '').trim() || '12pm ET';
    const zoom = await joinUrlFor(ev, seriesLinksOf(rows), await upcomingMeetings()).catch(() => '');
    const topic = /^meditation mondays?$/i.test(String(ev.public_title || ev.title || '').trim()) ? '' : String(ev.public_title || ev.title || '').trim();
    const email = buildEmail({ timeText, teacher: String(ev.teachers || ev.host || '').trim(), topic, zoom, circle: config.live_url });

    if (mode === 'preview') {
      return new NextResponse(`<!doctype html><meta charset="utf-8"><title>${esc(email.subject)}</title><body style="margin:0;background:#eee"><div style="max-width:600px;margin:20px auto">${email.content}</div></body>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    const marker = `[MM-REMINDER ${day}]`;
    const summary = { day, starts: start.toISOString(), send_at: sendAt.toISOString(), zoom: zoom ? 'found' : 'none (Circle button only)', tags: TAGS(), subject: email.subject };
    if (mode === 'dry') return NextResponse.json({ mode: 'dry run: nothing created', ...summary });

    if (sendAt.getTime() < Date.now() + 5 * 60000) return NextResponse.json({ skipped: 'Too late to send an hour ahead.', ...summary });
    const existing = await alreadyMade(marker);
    if (existing) return NextResponse.json({ skipped: 'Already scheduled for this Monday.', id: existing.id, ...summary });

    const r = await kit('/broadcasts', {
      method: 'POST',
      body: {
        ...email, public: false, send_at: sendAt.toISOString(),
        description: `${marker} Meditation Mondays 1-hour reminder · auto-scheduled · Meditation Pass + Wisdom School + Plus`,
        email_template_id: Number(process.env.MM_REMINDER_TEMPLATE_ID || 5578308),
        subscriber_filter: [{ any: [{ type: 'tag', ids: TAGS() }] }],
      },
    });
    return NextResponse.json({ scheduled: true, id: r.broadcast?.id, link: `https://app.kit.com/campaigns/${r.broadcast?.id}/draft`, ...summary });
  } catch (e) {
    console.error('meditation-reminder', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
