import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { openSubmissions, returnSubmission, menteeAvailable } from '@/lib/mentee/store';
import { formationAvailable, pendingEntries, resolveEntry } from '@/lib/member/formation';
import { fileLink } from '@/lib/mentee/filelink';

export const dynamic = 'force-dynamic';

// Mentor view (Circle admins only): hand-ins waiting for Jacob and hours waiting to be confirmed.
//   GET                                   → { handins, hours }
//   POST { action: 'return', id, note }    → mark a hand-in returned, with an optional note the mentee sees
//   POST { action: 'confirm'|'decline', id } → confirm (counts toward the 100 hours) or remove a pending hours entry
const methods = 'GET, POST, OPTIONS';
const fail = (h, msg, status) => NextResponse.json({ error: msg }, { status, headers: h });

async function snapshot() {
  const [handins, hours] = await Promise.all([menteeAvailable() ? openSubmissions() : [], formationAvailable() ? pendingEntries() : []]);
  return { handins: handins.map(x => ({ ...x, fileLink: x.hasFile ? fileLink(x.id) : '' })), hours };
}

export async function GET(req) {
  const h = cors(req, methods), s = sessionFrom(req);
  if (!s) return fail(h, 'Please sign in again', 401);
  if (!s.admin) return fail(h, 'Only mentors can see hand-ins', 403);
  try { return NextResponse.json(await snapshot(), { headers: h }); } catch (e) { console.error('submissions GET', e.message); return fail(h, 'Couldn’t load hand-ins just now', 502); }
}

export async function POST(req) {
  const h = cors(req, methods), s = sessionFrom(req);
  if (!s) return fail(h, 'Please sign in again', 401);
  if (!s.admin) return fail(h, 'Only mentors can do this', 403);
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === 'return') await returnSubmission(b.id, b.note);
    else if (b.action === 'confirm' || b.action === 'decline') await resolveEntry(b.id, b.action === 'confirm');
    else return fail(h, 'Unknown action', 400);
    return NextResponse.json(await snapshot(), { headers: h });
  } catch (e) { console.error('submissions POST', e.message); return fail(h, 'Couldn’t save that just now', 502); }
}
export async function OPTIONS(req) { return new NextResponse(null, { status: 204, headers: cors(req, methods) }); }
