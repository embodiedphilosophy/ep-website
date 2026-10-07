import { NextResponse } from 'next/server';
import { TAG, circleMap, circleGroupsFor } from '@/lib/membership';
import { subscriberTagIds, findSubscriber } from '@/lib/kit';
import { ensureMember, grantGroup, revokeGroup, circleConfigured, groupIndex, norm } from '@/lib/circle';
import { authorized, clean } from '@/lib/membersync';

// Kit → Circle. Kit webhooks (one per tag and direction) call:
//   https://<site>/api/members/kit?key=MEMBERS_WEBHOOK_SECRET&tag=<tag id>&action=add|remove
// for every tag in lib/membership.js circleMap(), plus the Hold tag with action=remove.
//
//  - member tag added   → put them in that tag's Circle group(s), unless they have the Hold tag
//  - member tag removed → take them out of any group no other tag of theirs still opens
//  - Hold tag removed   → (release) add them to Circle with an invitation and open every group their tags allow
// People with the Hold tag are never added to Circle, so Circle sends them nothing.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET ?key=…  checks the setup: lists Circle groups and whether each mapped name exists
export async function GET(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!circleConfigured()) return NextResponse.json({ error: 'CIRCLE_API_TOKEN not set' });
  const idx = await groupIndex();
  const map = circleMap();
  const check = Object.fromEntries(Object.entries(map).map(([t, gs]) => [t, gs.map(g => `${g}: ${idx[norm(g)] ? idx[norm(g)].kind + ' ' + idx[norm(g)].id : 'NOT FOUND'}`)]));
  return NextResponse.json({ mapping: check, circle_groups: Object.values(idx).map(g => `${g.kind}: ${g.name} (${g.id})`) });
}

export async function POST(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!circleConfigured()) return NextResponse.json({ skipped: 'CIRCLE_API_TOKEN not set' });
  const url = new URL(req.url);
  const b = await req.json().catch(() => ({}));
  const tag = Number(url.searchParams.get('tag') || b.tag?.id || 0);
  const action = url.searchParams.get('action') === 'remove' ? 'remove' : 'add';
  let sub = b.subscriber || {};
  const email = clean(sub.email_address);
  if (!email || !tag) return NextResponse.json({ error: 'need subscriber email and tag' }, { status: 400 });
  if (!sub.id) sub = (await findSubscriber(email)) || sub;

  try {
    const tags = await subscriberTagIds(sub.id);
    const held = tags.includes(TAG.hold);
    const name = sub.first_name || '';
    const done = { email, tag, action, granted: [], revoked: [] };

    if (tag === TAG.hold) {
      if (action !== 'remove') return NextResponse.json({ skipped: 'hold added: nothing to do' });
      const groups = circleGroupsFor(tags);
      if (!groups.length) return NextResponse.json({ skipped: 'released, but no tags that open Circle' });
      done.member = (await ensureMember(email, name, { skipInvite: false })).created ? 'invited' : 'existing';
      for (const g of groups) { await grantGroup(g, email); done.granted.push(g); }
    } else if (action === 'add') {
      if (held) return NextResponse.json({ skipped: 'on hold: Circle waits until the Hold tag is removed' });
      const groups = circleMap()[String(tag)] || [];
      if (!groups.length) return NextResponse.json({ skipped: 'tag opens no Circle group' });
      done.member = (await ensureMember(email, name, { skipInvite: false })).created ? 'invited' : 'existing';
      for (const g of groups) { await grantGroup(g, email); done.granted.push(g); }
    } else {
      const still = new Set(circleGroupsFor(tags.filter(t => t !== tag)));
      for (const g of (circleMap()[String(tag)] || []).filter(g => !still.has(g))) { await revokeGroup(g, email); done.revoked.push(g); }
    }
    console.log('Circle sync', JSON.stringify(done));
    return NextResponse.json(done);
  } catch (e) {
    console.error('Circle sync failed', email, e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
