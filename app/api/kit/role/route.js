import { NextResponse } from 'next/server';
import { kitConfigured, ensureTag, getSubscriberById, addTagById } from '@/lib/kit';
import { roleTagName, validSid } from '@/lib/kittags/roles';

// POST { sid, role } from components/RoleTag.js when a reader lands from an "I teach / I practise" email link.
// Adds only the matching Role tag, only to a subscriber that exists in Kit. Never removes anything.
export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const tag = roleTagName(body.role);
  if (!tag || !validSid(body.sid)) return NextResponse.json({ ok: false }, { status: 400 });
  if (!kitConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    const sub = await getSubscriberById(body.sid);
    if (!sub) return NextResponse.json({ ok: false }, { status: 404 });
    await addTagById(await ensureTag(tag), sub.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('kit role tag failed', e.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
