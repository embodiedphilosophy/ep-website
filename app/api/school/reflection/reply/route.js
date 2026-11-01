import { NextResponse } from 'next/server';
import { currentMember, sameOrigin } from '@/lib/school/session';
import { createComment, postComments } from '@/lib/school/circle';
import { reflectionFor, threadFor } from '@/lib/school/reflectionthread';

// A reply to a reflection (or to one of its comments), written to Circle as the signed-in member: { programme, season, post, parent?, text }.
// Returns the refreshed replies. Like the cohort chat send, the first real reply after a deploy is the test of Circle's request shape.
const last = new Map(); // email → time of the last reply, so a double click or a loop cannot flood a thread
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'Please sign in again from Circle.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const text = String(b.text ?? '').replace(/\r/g, '').trim();
  if (!text) return NextResponse.json({ error: 'Write your reply first.' }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: 'Keep the reply under 4,000 characters.' }, { status: 400 });
  if (Date.now() - (last.get(me.email) || 0) < 3000) return NextResponse.json({ error: 'One moment, then try again.' }, { status: 429 });
  try {
    const r = await reflectionFor(me.email, b.programme, b.season, b.post);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
    const parent = b.parent ? String(b.parent) : '';
    if (parent && !(await postComments(me.email, r.post.id)).some(c => String(c.id) === parent)) return NextResponse.json({ error: 'That comment is no longer there.' }, { status: 404 });
    last.set(me.email, Date.now());
    await createComment(me.email, r.post.id, { text, parentId: parent || null });
    return NextResponse.json(await threadFor(me.email, r.post));
  } catch (e) {
    console.error('reflection reply', e.message);
    return NextResponse.json({ error: e.status === 429 ? 'Circle is busy. Try again in a minute.' : 'We could not post your reply. Please try again.' }, { status: 502 });
  }
}
