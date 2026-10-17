import { sessionFrom, cors } from '@/lib/member/session';
import { NextResponse } from 'next/server';
import { cleanToday } from '@/lib/member/practice';
import { addLine, recentLines, menteeAvailable } from '@/lib/mentee/store';

export const dynamic = 'force-dynamic';

// The Inner Travelogue, free for every member (Today). The same private journal mentees already keep on "This week"
// (table mentee_travelogue), so there is one Travelogue, not two. Only ever returned to the person who wrote it.
const METHODS = 'GET, POST, OPTIONS';
const reply = (req, body, status = 200) => NextResponse.json(body, { status, headers: cors(req, METHODS) });

export async function GET(req) {
  const s = sessionFrom(req);
  if (!s) return reply(req, { error: 'Please sign in again' }, 401);
  if (!menteeAvailable()) return reply(req, { error: 'The Travelogue isn’t connected yet.' }, 503);
  return reply(req, { travelogue: await recentLines(s.uid) });
}

// { text, today } → adds one private line and returns the member's latest lines
export async function POST(req) {
  const s = sessionFrom(req);
  if (!s) return reply(req, { error: 'Please sign in again' }, 401);
  if (!menteeAvailable()) return reply(req, { error: 'The Travelogue isn’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  try {
    await addLine(s.uid, cleanToday(b.today), b.text);
    return reply(req, { travelogue: await recentLines(s.uid) });
  } catch (e) {
    const known = /^(Write a line|Keep it|Unknown date)/.test(e.message);
    if (!known) console.error('travelogue', e.message);
    return reply(req, { error: known ? e.message : 'We couldn’t save that just now. Please try again.' }, known ? 400 : 502);
  }
}

export const OPTIONS = req => new NextResponse(null, { status: 204, headers: cors(req, METHODS) });
