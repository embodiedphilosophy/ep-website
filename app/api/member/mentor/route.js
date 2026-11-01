import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { cleanToday } from '@/lib/member/practice';
import { loadMentor } from '@/lib/mentee/mentorload';
import { ackReflection } from '@/lib/mentee/mentorstore';

export const dynamic = 'force-dynamic';

// Jacob's view of the Sahṛdaya Upāya page (Circle admins only): the review queue, pair health and "worth a word".
//   GET ?today=YYYY-MM-DD                     → { queue, counts, tiles, words, rotation, nudges }
//   POST { action: 'replied', id }             → mark a shared reflection as replied to (it leaves the queue)
// Confirming, returning and declining hours and hand-ins go through /api/member/submissions.
const methods = 'GET, POST, OPTIONS';
const fail = (h, msg, status) => NextResponse.json({ error: msg }, { status, headers: h });

export async function GET(req) {
  const h = cors(req, methods), s = sessionFrom(req);
  if (!s) return fail(h, 'Please sign in again', 401);
  if (!s.admin) return fail(h, 'Only mentors can see this', 403);
  try { return NextResponse.json(await loadMentor({ today: cleanToday(new URL(req.url).searchParams.get('today')) }), { headers: h }); }
  catch (e) { console.error('mentor GET', e.message); return fail(h, 'Couldn’t load the review queue just now', 502); }
}

export async function POST(req) {
  const h = cors(req, methods), s = sessionFrom(req);
  if (!s) return fail(h, 'Please sign in again', 401);
  if (!s.admin) return fail(h, 'Only mentors can do this', 403);
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action !== 'replied') return fail(h, 'Unknown action', 400);
    await ackReflection(b.id);
    return NextResponse.json(await loadMentor({ today: cleanToday(b.today) }), { headers: h });
  } catch (e) { console.error('mentor POST', e.message); return fail(h, 'Couldn’t save that just now', 502); }
}
export async function OPTIONS(req) { return new NextResponse(null, { status: 204, headers: cors(req, methods) }); }
