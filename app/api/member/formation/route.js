import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { formationAvailable, formationFor, addEntry, removeEntry } from '@/lib/member/formation';

// Formation hours (the 100-hour record). Needs the session from /api/member/session.
//   GET                      → a mentee's own record (Circle admins can pass ?email= to see anyone's)
//   POST   { email, component, hours, day, note }  → (Circle admins) credit hours, returns that mentee's record
//   DELETE ?email=&id=       → (Circle admins) remove an entry
const fail = (h, msg, status) => NextResponse.json({ error: msg }, { status, headers: h });
const methods = 'GET, POST, DELETE, OPTIONS';

export async function GET(req) {
  const h = cors(req, methods);
  const s = sessionFrom(req);
  if (!s) return fail(h, 'Please sign in again', 401);
  if (!formationAvailable()) return fail(h, 'The formation record isn’t connected yet', 503);
  const asked = new URL(req.url).searchParams.get('email');
  if (asked && !s.admin) return fail(h, 'Only mentors can see another person’s record', 403);
  if (!s.admin && s.tier !== 'mentee') return fail(h, 'The formation record is part of Sahṛdaya Upāya', 403);
  const email = asked || s.email;
  if (!email) return fail(h, 'Please sign in again', 401);
  try {
    return NextResponse.json(await formationFor(email), { headers: h });
  } catch (e) {
    console.error('formation GET', e.message);
    return fail(h, 'Couldn’t load the formation record just now', 502);
  }
}

export async function POST(req) {
  const h = cors(req, methods);
  const s = sessionFrom(req);
  if (!s) return fail(h, 'Please sign in again', 401);
  if (!s.admin) return fail(h, 'Only mentors can credit hours', 403);
  if (!formationAvailable()) return fail(h, 'The formation record isn’t connected yet', 503);
  const b = await req.json().catch(() => ({}));
  try {
    return NextResponse.json(await addEntry(s.email, b), { headers: h });
  } catch (e) {
    const known = /Choose|Hours should/.test(e.message);
    if (!known) console.error('formation POST', e.message);
    return fail(h, known ? e.message : 'Couldn’t save that just now', known ? 400 : 502);
  }
}

export async function DELETE(req) {
  const h = cors(req, methods);
  const s = sessionFrom(req);
  if (!s) return fail(h, 'Please sign in again', 401);
  if (!s.admin) return fail(h, 'Only mentors can change the record', 403);
  if (!formationAvailable()) return fail(h, 'The formation record isn’t connected yet', 503);
  const q = new URL(req.url).searchParams;
  try {
    return NextResponse.json(await removeEntry(q.get('email'), q.get('id')), { headers: h });
  } catch (e) {
    return fail(h, 'Couldn’t remove that just now', 502);
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req, methods) });
}
