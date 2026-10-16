// The "This week" page drawn into Circle (public/circle/this-week.js) signs in the same way as the Schedule page:
// Circle's identity token → /api/member/session → a bearer session. Only mentees (and Circle admins) get through.
import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '../member/session';

const METHODS = 'GET, POST, OPTIONS';
export const preflight = req => new NextResponse(null, { status: 204, headers: cors(req, METHODS) });
export const reply = (req, body, status = 200) => NextResponse.json(body, { status, headers: cors(req, METHODS) });

// → { me } or { res } (a ready-made error response)
export function menteeFromBearer(req) {
  const s = sessionFrom(req);
  if (!s) return { res: reply(req, { error: 'Please sign in again', code: 'signin' }, 401) };
  if (!s.admin && s.tier !== 'mentee') return { res: reply(req, { error: 'This page is for Sahṛdaya Upāya mentees.', code: 'tier' }, 403) };
  return { me: { uid: s.uid, email: s.email, firstName: s.firstName || '', admin: !!s.admin } };
}
