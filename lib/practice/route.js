// Shared by the /api/practice/* routes: the session, the member's own "today", and the SS-only gate. The member id is
// always the one inside the signed session, never anything the browser sends.
import { NextResponse } from 'next/server';
import { sessionFrom, readSession, cors } from '../member/session';
import { startSession } from '../member/signin';
import { cleanToday } from '../member/practice';
import { accessFor } from './season';
import { diaryAvailable } from './store';
import { TIERS } from '../member/tier';

export const METHODS = 'GET, POST, PUT, OPTIONS';
export const reply = (req, body, status = 200) => NextResponse.json(body, { status, headers: cors(req, METHODS) });
export const options = req => new NextResponse(null, { status: 204, headers: cors(req, METHODS) });

// → { s, access, today } or a Response to return. needSS: refuse anyone not in Sādhana School (403).
export async function gate(req, { needSS = true, today: rawToday } = {}) {
  let s = sessionFrom(req);
  if (!s) {
    const tok = req.headers.get('x-circle-identity');
    if (tok) { try { s = readSession((await startSession({ identityToken: tok })).session); } catch (e) { return reply(req, { error: e.message || 'Sign-in failed' }, 401); } }
  }
  if (!s) return reply(req, { error: 'Please sign in again' }, 401);
  const q = new URL(req.url).searchParams;
  const today = cleanToday(rawToday ?? q.get('today'));
  const as = q.get('as');
  const access = await accessFor(s, today, s.admin && TIERS.includes(as) ? as : '');
  if (needSS) {
    if (!diaryAvailable()) return reply(req, { error: 'The diary isn’t connected yet' }, 503);
    if (!access.isSS) return reply(req, { error: 'The diary and readings are part of Sādhana School' }, 403);
  }
  return { s, access, today };
}
export const isResponse = x => x instanceof Response;
