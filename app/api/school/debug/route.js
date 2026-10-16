import { NextResponse } from 'next/server';
import { currentMember } from '@/lib/school/session';
import { memberSpaceIds, eventList, spacePosts } from '@/lib/school/circle';
import { allSeasons } from '@/lib/school/config';

// Admins only: what Circle's headless API returns for this member, as counts and field names (no content).
export async function GET() {
  const me = await currentMember();
  if (!me?.admin) return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  const out = {};
  const keys = o => (o && typeof o === 'object' ? Object.keys(o).slice(0, 60) : typeof o);
  const attempt = async (name, fn) => { try { out[name] = await fn(); } catch (e) { out[name] = { error: e.message, status: e.status }; } };
  await attempt('spaces', async () => { const s = await memberSpaceIds(me.email); return { count: s.size, ids: [...s].slice(0, 80) }; });
  await attempt('events', async () => {
    const ev = await eventList(me.email);
    const bySpace = {}; for (const e of ev) { const k = String(e.space_id ?? e.space?.id ?? 'none'); bySpace[k] = (bySpace[k] || 0) + 1; }
    const inSpace = ev.filter(e => String(e.space_id ?? e.space?.id) === String(allSeasons()[0].event_space_id));
    const one = inSpace[0] || ev[0];
    // time-like and replay-like fields, shown as names and value types only
    const shape = o => Object.fromEntries(Object.entries(o || {}).filter(([k]) => /start|end|time|date|at$|replay|record|url|link|host|duration|rsvp|attend/i.test(k)).map(([k, v]) => [k, v && typeof v === 'object' ? keys(v) : typeof v === 'string' ? v.slice(0, 12) + '…' : v]));
    return { count: ev.length, bySpace, firstKeys: keys(one), shape: shape(one) };
  });
  for (const s of allSeasons()) {
    if (!s.hub_space_id) continue;
    await attempt(`posts:${s.slug}`, async () => { const p = await spacePosts(me.email, s.hub_space_id); return { count: p.length, firstKeys: keys(p[0]), topicsSample: p.slice(0, 3).map(x => x.topics ?? x.topic_ids ?? null) }; });
  }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
