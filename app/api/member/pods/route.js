import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { podsFor, podsEnabled, eligible, MIN, MAX } from '@/lib/pods/logic';
import { podsAvailable, leaderOf, listPods } from '@/lib/pods/store';

export const dynamic = 'force-dynamic';

// The Study pods card on the Sahṛdaya Upāya page and Circle Today (drawn by public/circle/sahrdaya.js and today.js): the open pods, your own pods
// with their chat and live room, and whether you can lead one. Read only: joining and starting a pod happen on the Study pods tab (`url`).
// GET → { on, pods: [...], leader, min, max, url }   Not eligible, or pods off: 403 / 404 (the card simply does not show).
const methods = 'GET, OPTIONS';
const TAB = 'https://ss.embodiedphilosophy.com/c/sadhana-school?tab=pods';

export async function GET(req) {
  const h = cors(req, methods), s = sessionFrom(req);
  if (!s?.uid) return NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: h });
  if (!podsEnabled()) return NextResponse.json({ on: false }, { status: 404, headers: h });
  if (!eligible(s.tier, !!s.admin)) return NextResponse.json({ error: 'Study pods are for Sādhana School students.' }, { status: 403, headers: h });
  if (!podsAvailable()) return NextResponse.json({ on: false }, { status: 503, headers: h });
  try {
    const me = { uid: s.uid, email: s.email, name: s.firstName || '', admin: !!s.admin };
    const [{ pods, membersBy }, l] = await Promise.all([listPods(), leaderOf(me.uid)]);
    const list = podsFor(pods, membersBy, me).sort((a, b) => Number(b.mine) - Number(a.mine) || a.needs - b.needs)
      .map(p => ({ id: p.id, topic: p.topic, leader: p.leader, schedule: p.schedule, count: p.count, needs: p.needs, spots: p.spots, started: p.started, mine: p.mine, isLeader: p.isLeader, canJoin: p.canJoin, chatUrl: p.chatUrl, roomUrl: p.roomUrl, chatPending: p.chatPending }));
    return NextResponse.json({ on: true, pods: list.slice(0, 6), total: list.length, leader: l?.status || '', min: MIN, max: MAX, url: TAB }, { headers: h });
  } catch (e) { console.error('member pods', e.message); return NextResponse.json({ error: 'Couldn’t load the pods just now' }, { status: 502, headers: h }); }
}
export async function OPTIONS(req) { return new NextResponse(null, { status: 204, headers: cors(req, methods) }); }
