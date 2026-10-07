import { findSubscriber, upsertSubscriber, addTag, removeTag } from '@/lib/kit';
import { TAG, goLive } from '@/lib/membership';
import { loadTeam } from '@/lib/calendar';
import { sendEmail, layout, esc } from '@/lib/ops/email';

export const clean = e => String(e || '').trim().toLowerCase();

// Shared check for the member webhooks: ?key=MEMBERS_WEBHOOK_SECRET
// (Uscreen and SamCart don't sign their webhooks, so the secret lives in the URL we give them.)
export function authorized(req) {
  const secret = process.env.MEMBERS_WEBHOOK_SECRET;
  return !!secret && new URL(req.url).searchParams.get('key') === secret;
}

// Add and remove Kit tags for one person. New subscribers are created (with the Hold tag until go-live).
export async function applyTags({ email, name, add = [], remove = [], source }) {
  email = clean(email);
  if (!email) throw new Error('no email');
  const result = { email, source, added: [], removed: [], created: false };
  let sub = await findSubscriber(email);

  if (add.length) {
    if (!sub) {
      sub = await upsertSubscriber(email, String(name || '').trim().split(/\s+/)[0] || undefined);
      result.created = true;
      // Hold first, so the Circle webhook already sees it when the member tags land
      if (!goLive()) { await addTag(TAG.hold, email); result.added.push(TAG.hold); }
    }
    for (const id of add) { await addTag(id, email); result.added.push(id); }
  }
  if (remove.length && sub) {
    for (const id of remove) {
      await removeTag(id, sub.id).catch(e => { if (!/404/.test(e.message)) throw e; });
      result.removed.push(id);
    }
  }
  console.log('Member sync', JSON.stringify(result));
  return result;
}

// Email the directors (Team tab, Type = director). Never throws.
export async function tellDirectors(subject, lines) {
  try {
    const team = await loadTeam({ fresh: true });
    const html = layout(subject, `<ul>${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`);
    for (const d of team.filter(t => t.director && t.email)) await sendEmail({ to: d.email, subject, html });
  } catch (e) { console.error('Director notice failed', e.message); }
}
