import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { headlessConfigured, createPost, questionPosts } from '@/lib/school/circle';
import { questionsSpace } from '@/lib/mentee/load';

export const dynamic = 'force-dynamic';

// A mentee asks the group a question from the page: { text }. It becomes a post in the "Questions for the Group" space as that member
// (the question is the title); answers happen in Circle. Returns the latest questions.
const last = new Map();
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const space = headlessConfigured() ? await questionsSpace(me.email).catch(() => null) : null;
  if (!space) return reply(req, { error: 'Questions for the Group isn’t switched on yet.' }, 503);
  const b = await req.json().catch(() => ({}));
  const text = String(b.text ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return reply(req, { error: 'Write your question first.' }, 400);
  if (text.length > 240) return reply(req, { error: 'Keep the question under 240 characters.' }, 400);
  if (Date.now() - (last.get(me.uid) || 0) < 5000) return reply(req, { error: 'One moment, then try again.' }, 429);
  last.set(me.uid, Date.now());
  try {
    await createPost(me.email, space, { title: text, body: text });
    return reply(req, { questions: (await questionPosts(me.email, space)).slice(0, 2) });
  } catch (e) {
    console.error('this-week question', e.message);
    return reply(req, { error: 'We couldn’t post that just now. Please try again.' }, 502);
  }
}
export const OPTIONS = preflight;
