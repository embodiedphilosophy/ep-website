import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { eligible, podsFor, MAX, MINUTES } from '@/lib/pods/practicum';
import { practicumAvailable, listPods, createPod, join, leave, cancelPod, setLinks, autoRoom } from '@/lib/pods/practicum';
import { meetConfigured } from '@/lib/meet';

export const dynamic = 'force-dynamic';

// Practicum pods for Sahṛdaya Upāya mentees (and Circle admins), drawn on the mentee page by public/circle/sahrdaya.js. Anyone can organise one, no approval.
//   GET                                            → { pods, max, minutes }
//   POST { action: 'create', topic, description, startsAt, minutes, roomUrl }  | { action: 'join' | 'leave' | 'cancel', id } | { action: 'links', id, roomUrl, chatUrl }
const methods = 'GET, POST, OPTIONS';
const fail = (h, msg, status) => NextResponse.json({ error: msg }, { status, headers: h });
const meOf = s => ({ uid: s.uid, email: s.email, name: s.firstName || String(s.email || '').split('@')[0] });
async function payload(me, h, extra = {}) {
  const { pods, membersBy } = await listPods();
  return NextResponse.json({ pods: podsFor(pods, membersBy, me), max: MAX, minutes: MINUTES, autoRooms: meetConfigured(), ...extra }, { headers: h });
}
function gate(req) {
  const h = cors(req, methods), s = sessionFrom(req);
  if (!s?.uid) return { res: fail(h, 'Please sign in again', 401) };
  if (!eligible(s.tier, !!s.admin)) return { res: fail(h, 'Practicum pods are for Sahṛdaya Upāya mentees.', 403) };
  if (!practicumAvailable()) return { res: fail(h, 'Practicum pods aren’t connected yet.', 503) };
  return { h, me: meOf(s) };
}

export async function GET(req) {
  const { res, h, me } = gate(req); if (res) return res;
  try { return await payload(me, h); } catch (e) { console.error('practicum GET', e.message); return fail(h, 'Couldn’t load the practicum pods just now', 502); }
}
export async function POST(req) {
  const { res, h, me } = gate(req); if (res) return res;
  const b = await req.json().catch(() => ({}));
  try {
    let extra = {};
    if (b.action === 'create') extra = { created: await createPod(me, b) };
    else if (b.action === 'join') await join(me, b.id);
    else if (b.action === 'leave') await leave(me, b.id);
    else if (b.action === 'cancel') await cancelPod(me, b.id);
    else if (b.action === 'links') await setLinks(me, b.id, b);
    else if (b.action === 'autoroom') await autoRoom(me, b.id);
    else return fail(h, 'Unknown action', 400);
    return await payload(me, h, extra);
  } catch (e) {
    const known = /^(Give your|Choose|You can organise|You are|This pod|Only the organiser|As the organiser|A full link|That pod|We couldn’t make)/.test(e.message);
    if (!known) console.error('practicum POST', b.action, e.message);
    return fail(h, known ? e.message : 'We couldn’t save that just now. Please try again.', known ? 400 : 502);
  }
}
export async function OPTIONS(req) { return new NextResponse(null, { status: 204, headers: cors(req, methods) }); }
