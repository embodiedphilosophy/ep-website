import { NextResponse } from 'next/server';
import { currentMember, sameOrigin } from '@/lib/school/session';
import { memberSpaceIds, createPost } from '@/lib/school/circle';
import { hubSettings } from '@/lib/school/hubconfig';
import { reflectionFor, threadFor } from '@/lib/school/reflectionthread';

// A reflection posted from the Reflections tab: a post in the Reflections space (Kula Commentary), shared by all of Sādhana School.
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'Please sign in again from Circle.' }, { status: 401 });
  const { title, body } = await req.json().catch(() => ({}));
  const space = hubSettings().reflections_space_id, text = String(body || '').trim();
  if (!space) return NextResponse.json({ error: 'Reflections are not open yet.' }, { status: 400 });
  if (!text || text.length > 10000) return NextResponse.json({ error: 'Write something before you post.' }, { status: 400 });
  try {
    if (!(await memberSpaceIds(me.email)).has(String(space))) return NextResponse.json({ error: 'You do not have access to the reflections.' }, { status: 403 });
    await createPost(me.email, space, { title: String(title || '').trim().slice(0, 120) || 'Reflection', body: text });
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.status === 429 ? 'Circle is busy. Try again in a minute.' : 'We could not post your reflection. Please try again.' }, { status: 502 }); }
}

// The replies under one reflection: GET ?post=
export async function GET(req) {
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'Please sign in again from Circle.' }, { status: 401 });
  try {
    const r = await reflectionFor(me.email, new URL(req.url).searchParams.get('post'));
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json(await threadFor(me.email, r.post));
  } catch (e) { return NextResponse.json({ error: e.status === 429 ? 'Circle is busy. Try again in a minute.' : 'We could not load the replies. Please try again.' }, { status: 502 }); }
}
