import { NextResponse } from 'next/server';
import { loadIssues, markIssue, weekEvents, buildIssue, nextSunday, addDays } from '@/lib/scaffolding';
import { createDraft, updateDraft, getBroadcast, isEditableDraft, draftUrl } from '@/lib/kit';
import { loadTeam } from '@/lib/calendar';
import { todayET } from '@/lib/events';
import { sendEmail, layout, button, esc } from '@/lib/ops/email';

// The Weekly Scaffolding draft (vercel.json cron, Thursdays). Builds a Kit DRAFT for the coming Sunday
// from the "Weekly Scaffolding" tab + that week's Master Schedule events, then emails the directors.
// It never schedules or sends: the send button in Kit stays with a person.
//
// Re-running for the same Sunday overwrites that draft (if it is still an unsent draft), so make text
// changes in the sheet, then rebuild. Edits made inside Kit are lost on a rebuild.
//
// Modes (all need ?key=CRON_SECRET or the cron's Authorization header):
//   (none)                 the cron: the coming Sunday
//   &date=YYYY-MM-DD       a specific Sunday (rebuilds its draft)
//   &preview=1             SENDS NOTHING, CREATES NOTHING: returns the email as a web page
//   &dry=1                 JSON of what would happen (events found, blanks to fill); nothing created
//
// Vercel: KIT_API_KEY, CALENDAR_SHEET_ID (+ Google service account), RESEND_API_KEY,
// optional SCAFFOLDING_TEMPLATE_ID (default 5578308 "Text only"), SCAFFOLDING_SEGMENT_ID or SCAFFOLDING_TAG_ID
// (default: all subscribers, same as the master draft).
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function audience() {
  const seg = Number(process.env.SCAFFOLDING_SEGMENT_ID || 0), tag = Number(process.env.SCAFFOLDING_TAG_ID || 0);
  if (seg) return [{ all: [{ type: 'segment', ids: [seg] }] }];
  if (tag) return [{ all: [{ type: 'tag', ids: [tag] }] }];
  return [{ all: [{ type: 'all_subscribers' }] }];
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers.get('authorization') !== `Bearer ${secret}` && url.searchParams.get('key') !== secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const asked = url.searchParams.get('date');
  const sendDate = asked || nextSunday(addDays(todayET(), 1));
  const preview = url.searchParams.get('preview'), dry = url.searchParams.get('dry');

  const issues = await loadIssues();
  const issue = issues.find(i => i.send_date === sendDate);
  if (!issue) return NextResponse.json({ error: `No row for ${sendDate} on the Weekly Scaffolding tab. Add one (Send Date = the Sunday).` }, { status: 404 });
  if (/^skip$/i.test(issue.status)) return NextResponse.json({ skipped: `${sendDate} is marked Skip` });
  if (/^sent$/i.test(issue.status)) return NextResponse.json({ skipped: `${sendDate} is marked Sent` });

  const events = await weekEvents(sendDate);
  const built = buildIssue(issue, events);

  if (preview) {
    // Liquid isn't run here: both versions of each button show, with the tag rule printed between them.
    const shown = built.content.replace(/\{%\s*if ([^%]+)%\}/g, '<p style="font:11px Arial;color:#888;margin:6px 0">[if $1]</p>')
      .replace(/\{%\s*else\s*%\}/g, '<p style="font:11px Arial;color:#888;margin:6px 0">[else]</p>').replace(/\{%\s*endif\s*%\}/g, '');
    return new NextResponse(`<!doctype html><meta charset="utf-8"><title>${esc(built.subject)}</title><body style="margin:0;background:#eee"><div style="max-width:600px;margin:20px auto;background:#FAF7EA">${shown}</div></body>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const summary = { send_date: sendDate, status: issue.status, subject: built.subject, events: events.map(e => `${e.date} ${e.track} ${e.title}${e.newsletter === 'enrolled_only' ? ' (enrolled only)' : ''}`), blanks: built.gaps };
  if (dry) return NextResponse.json({ mode: 'dry run: nothing created', ...summary });

  const fields = {
    subject: built.subject, preview_text: built.preview_text, content: built.content,
    description: `Weekly Scaffolding ${sendDate} (built from EP-Programming-Calendar)`,
    email_template_id: Number(process.env.SCAFFOLDING_TEMPLATE_ID || 5578308),
    subscriber_filter: audience(),
  };

  // Update this week's draft if we already made one and it hasn't gone out; otherwise create
  const existingId = (String(issue.kit_draft || '').match(/campaigns\/(\d+)/) || [])[1];
  let broadcast, action = 'created';
  if (existingId) {
    const current = await getBroadcast(existingId).catch(() => null);
    if (current && !isEditableDraft(current)) {
      await markIssue(issue._row, { status: 'Sent', draftUrl: draftUrl(existingId), builtAt: issue.built_at });
      return NextResponse.json({ skipped: 'That issue is already scheduled or sent in Kit; nothing changed.', draft: draftUrl(existingId) });
    }
    if (current) { broadcast = await updateDraft(existingId, fields); action = 'updated'; }
  }
  if (!broadcast) broadcast = await createDraft(fields);

  const link = draftUrl(broadcast.id);
  const builtAt = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  await markIssue(issue._row, { status: built.gaps.length ? '' : 'In Kit', draftUrl: link, builtAt });

  // Tell the directors (Team tab, Type = director)
  const notified = [];
  try {
    const team = await loadTeam({ fresh: true });
    const base = process.env.OPS_URL || url.origin;
    const html = layout(`Weekly Scaffolding for ${sendDate} is in Kit`, `
      <p>The draft is ready to review in Kit. Nothing has been scheduled.</p>
      ${built.gaps.length ? `<p><b>Still blank on the sheet:</b> ${built.gaps.map(esc).join(', ')}. Fill them in, then rebuild.</p>` : ''}
      <p><b>Events this week:</b></p><ul>${summary.events.map(e => `<li>${esc(e)}</li>`).join('') || '<li>None</li>'}</ul>
      ${button(link, 'Open the draft in Kit')}
      <p style="font-size:13px;color:#777">Changed the sheet? <a href="${esc(`${base}/api/scaffolding?key=${secret}&date=${sendDate}`)}">Rebuild this draft</a> (this replaces edits made inside Kit). <a href="${esc(`${base}/api/scaffolding?key=${secret}&date=${sendDate}&preview=1`)}">Preview</a>.</p>`);
    for (const d of team.filter(t => t.director && t.email)) {
      await sendEmail({ to: d.email, subject: `${built.gaps.length ? 'Needs content: ' : ''}Weekly Scaffolding draft for ${sendDate}`, html });
      notified.push(d.email);
    }
  } catch (e) { console.error('Scaffolding notice failed', e.message); }

  return NextResponse.json({ action, draft: link, notified, ...summary });
}
