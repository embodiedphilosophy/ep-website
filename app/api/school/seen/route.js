import { NextResponse } from 'next/server';
import { currentMember, sameOrigin } from '@/lib/school/session';
import { markSeen } from '@/lib/school/seen';
import { knownSpaceIds } from '@/lib/school/hubconfig';

// The hub calls this when a member opens a space, so the "new" count for it starts again from now.
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'Please sign in again from Circle.' }, { status: 401 });
  const { spaceId } = await req.json().catch(() => ({}));
  if (!knownSpaceIds().has(String(spaceId))) return NextResponse.json({ error: 'Unknown space' }, { status: 400 });
  try { return NextResponse.json({ ok: await markSeen(me.email, spaceId) }); }
  catch { return NextResponse.json({ error: 'Not saved' }, { status: 502 }); }
}
