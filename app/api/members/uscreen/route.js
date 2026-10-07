import { NextResponse } from 'next/server';
import { uscreenTags } from '@/lib/membership';
import { applyTags, authorized, tellDirectors } from '@/lib/membersync';

// Uscreen → Kit member tags. Uscreen > Settings > Webhooks, one webhook per event, all pointing at
//   https://<site>/api/members/uscreen?key=MEMBERS_WEBHOOK_SECRET
// Events: Subscription Assigned (adds tags), Ownership Lifecycle Changed (removes tags when access ends),
// Access Canceled (a cancellation request: access continues to the end date, so tags stay; directors are told).
// Plan → tag rules live in lib/membership.js (uscreenTags).
export const dynamic = 'force-dynamic';

const ENDED = /expired|ended|inactive|revoked|terminated|churned|finished/i;

export async function POST(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const event = String(b.event || '').toLowerCase();
  console.log('Uscreen webhook', event, JSON.stringify(b).slice(0, 800));

  try {
    if (event === 'subscription_assigned') {
      const tags = uscreenTags(b.subscription_title);
      if (!tags.length) return NextResponse.json({ skipped: `no tags for plan "${b.subscription_title}"` });
      return NextResponse.json(await applyTags({ email: b.user_email, name: b.user_name, add: tags, source: `uscreen: ${b.subscription_title}` }));
    }

    if (event === 'ownership_lifecycle_changed') {
      const tags = uscreenTags(b.offer_title);
      if (ENDED.test(String(b.to || '')) && tags.length) {
        const r = await applyTags({ email: b.email, remove: tags, source: `uscreen ended (${b.from} → ${b.to}): ${b.offer_title}` });
        await tellDirectors(`Uscreen access ended: ${b.email}`, [`${b.name || ''} <${b.email}>`, `Plan: ${b.offer_title}`, `${b.from} → ${b.to} (${b.reason || 'no reason given'})`, 'Their member tags were removed in Kit; Circle access follows.']);
        return NextResponse.json(r);
      }
      // Other transitions (e.g. trial → active) are logged only; assignment already added the tags
      return NextResponse.json({ logged: `${b.from} → ${b.to}` });
    }

    if (event === 'subscription_canceled') {
      await tellDirectors(`Uscreen cancellation: ${b.email}`, [`${b.name || ''} <${b.email}>`, `Plan: ${b.offer_title}`, `Access ends: ${b.access_ends_at || 'unknown'}`, 'Tags stay until access actually ends.']);
      return NextResponse.json({ noted: 'cancellation request; tags kept until access ends' });
    }

    return NextResponse.json({ ignored: event || 'no event' });
  } catch (e) {
    console.error('Uscreen sync failed', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 }); // 500 so Uscreen retries
  }
}
