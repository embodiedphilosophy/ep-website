import { NextResponse } from 'next/server';
import { TAG, circleMap, circleGroupsFor } from '@/lib/membership';
import { subscriberTagIds, findSubscriber } from '@/lib/kit';
import { ensureMember, grantGroup, revokeGroup, circleConfigured, groupIndex, norm } from '@/lib/circle';
import { authorized, clean } from '@/lib/membersync';

// Kit → Circle. One Kit webhook (events subscriber.tag_added + subscriber.tag_removed) calls:
//   https://<site>/api/members/kit?key=MEMBERS_WEBHOOK_SECRET
// Tags not mapped in lib/membership.js circleMap() (other than the Hold tag) are ignored.
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

// One change: a tag added to / removed from one subscriber
async function handle({ sub, tag, action }) {
  const email = clean(sub.email_address);
  if (!email || !tag) return { error: 'need subscriber email and tag' };
  if (!sub.id) sub = (await findSubscriber(email)) || sub;
  const tags = await subscriberTagIds(sub.id);
  const held = tags.includes(TAG.hold);
  const name = sub.first_name || '';
  const done = { email, tag, action, granted: [], revoked: [] };

  if (tag === TAG.hold) {
    if (action !== 'remove') return { skipped: 'hold added: nothing to do', email };
    const groups = circleGroupsFor(tags);
    if (!groups.length) return { skipped: 'released, but no tags that open Circle', email };
    done.member = (await ensureMember(email, name, { skipInvite: false })).created ? 'invited' : 'existing';
    for (const g of groups) { await grantGroup(g, email); done.granted.push(g); }
  } else if (!circleMap()[String(tag)]) {
    return { skipped: 'tag opens no Circle group', email, tag };
  } else if (action === 'add') {
    if (held) return { skipped: 'on hold: Circle waits until the Hold tag is removed', email };
    done.member = (await ensureMember(email, name, { skipInvite: false })).created ? 'invited' : 'existing';
    for (const g of circleMap()[String(tag)]) { await grantGroup(g, email); done.granted.push(g); }
  } else {
    const still = new Set(circleGroupsFor(tags.filter(t => t !== tag)));
    for (const g of circleMap()[String(tag)].filter(g => !still.has(g))) { await revokeGroup(g, email); done.revoked.push(g); }
  }
  console.log('Circle sync', JSON.stringify(done));
  return done;
}

// Accepts Kit's current webhooks (envelope { delivery_id, events: [{ type: 'subscriber.tag_added' |
// 'subscriber.tag_removed', data: { subscriber, tag } }] }) and the older one-tag style (?tag=&action=, body { subscriber }).
export async function POST(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!circleConfigured()) return NextResponse.json({ skipped: 'CIRCLE_API_TOKEN not set' });
  const url = new URL(req.url);
  const b = await req.json().catch(() => ({}));

  let changes;
  if (Array.isArray(b.events)) {
    changes = b.events.map(ev => {
      const type = String(ev.type || b.type || '');
      const d = ev.data || ev;
      const action = /tag_removed$/.test(type) ? 'remove' : /tag_added$/.test(type) ? 'add' : null;
      return { sub: d.subscriber || {}, tag: Number(d.tag?.id || d.tag_id || 0), action };
    }).filter(c => c.action);
  } else {
    changes = [{ sub: b.subscriber || {}, tag: Number(url.searchParams.get('tag') || b.tag?.id || 0), action: url.searchParams.get('action') === 'remove' ? 'remove' : 'add' }];
  }

  const results = [];
  let failed = 0;
  for (const c of changes) {
    try { results.push(await handle(c)); }
    catch (e) { failed++; console.error('Circle sync failed', c.sub?.email_address, c.tag, e.message); results.push({ error: e.message, email: c.sub?.email_address, tag: c.tag }); }
  }
  // 500 makes Kit retry the delivery if anything failed (adding/removing again is harmless)
  return NextResponse.json({ delivery: b.delivery_id || null, processed: results.length, results }, { status: failed ? 500 : 200 });
}
