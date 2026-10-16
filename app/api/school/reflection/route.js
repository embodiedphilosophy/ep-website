import { NextResponse } from 'next/server';
import { currentMember, sameOrigin } from '@/lib/school/session';
import { memberSpaceIds, createPost } from '@/lib/school/circle';
import { findSeason, isWired } from '@/lib/school/config';

// A reflection posted from the Reflections tab: a post in the season's post space with the Reflections topic.
export async function POST(req) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const me = await currentMember();
  if (!me) return NextResponse.json({ error: 'Please sign in again from Circle.' }, { status: 401 });
  const { programme, season: slug, title, body } = await req.json().catch(() => ({}));
  const season = findSeason(programme, slug);
  const text = String(body || '').trim();
  if (!season || !isWired(season) || season.topic_ids?.reflections == null) return NextResponse.json({ error: 'This season is not open for reflections yet.' }, { status: 400 });
  if (!text || text.length > 10000) return NextResponse.json({ error: 'Write something before you post.' }, { status: 400 });
  try {
    if (!(await memberSpaceIds(me.email)).has(String(season.hub_space_id))) return NextResponse.json({ error: 'You do not have access to this season.' }, { status: 403 });
    await createPost(me.email, season.hub_space_id, { title: String(title || '').trim().slice(0, 120) || 'Reflection', body: text, topicId: season.topic_ids.reflections });
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.status === 429 ? 'Circle is busy. Try again in a minute.' : 'We could not post your reflection. Please try again.' }, { status: 502 }); }
}
