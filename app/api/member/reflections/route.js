import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { reflectionsAvailable, listReflections, getReflection, createDraft, saveDraft, startRevision, shareVersion, discardDraft, deleteReflection, addComment, setAddressed, finalVersion, postedState, markPosted, markUnposted } from '@/lib/mentee/reflectionstore';
import { postContent, monthOf, STEPS } from '@/lib/mentee/reflections';
import { createPost, deletePost, headlessConfigured } from '@/lib/school/circle';
import { hubSettings } from '@/lib/school/hubconfig';
import { readTab, TABS } from '@/lib/mentee/content';
import { booksFrom } from '@/lib/mentee/books';
import { cleanToday } from '@/lib/member/practice';
import config from '@/data/mentee.json';

export const dynamic = 'force-dynamic';

// The mentee Reflections page (public/circle/sahrdaya.js on /c/reflections). GET ?today=&month=&id= → { list, detail?, meta }.
// POST { action, … } with action: save (create or update the draft), revise, share, discard, delete, comment, address, post, takedown, read.
// Reflections are the cohort's: only Sahṛdaya Upāya mentees and Circle admins (Jacob) get in (menteeFromBearer).
// Where final reflections are posted: the Reflections space of Sādhana School (Kula Commentary). data/school-hub.json settings, else data/mentee.json
const reflectionsSpace = () => hubSettings().reflections_space_id || config.reflections_space_id || null;
const last = new Map(); // email + action → time of that write, so a double click cannot post twice (Share's save → share chain still goes through)
const KNOWN = /^(Write|Keep|Choose|Press|Only|Couldn|This |Share |Unknown|That )|find that/;

async function meta(today) {
  const month = monthOf(today);
  let topic = '';
  try { topic = booksFrom(await readTab(TABS.books), today).current?.theme || ''; } catch { /* the page works without a topic */ }
  return { month, topic, steps: STEPS, canPost: headlessConfigured() && !!reflectionsSpace(), season: config.season };
}

export async function GET(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!reflectionsAvailable()) return reply(req, { error: 'The reflections aren’t connected yet.' }, 503);
  const q = new URL(req.url).searchParams, today = cleanToday(q.get('today'));
  const who = { email: me.email, name: me.firstName };
  try {
    const [list, m] = await Promise.all([listReflections(who, {}), meta(today)]);
    return reply(req, { list, meta: m, detail: q.get('id') ? await getReflection(who, q.get('id')) : null });
  } catch (e) { return fail(req, e, 'load'); }
}

export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!reflectionsAvailable()) return reply(req, { error: 'The reflections aren’t connected yet.' }, 503);
  const b = await req.json().catch(() => ({})), today = cleanToday(b.today), who = { email: me.email, name: me.firstName, admin: me.admin };
  const writes = b.action !== 'read';
  const lastKey = `${me.email}:${b.action}`;
  if (writes && Date.now() - (last.get(lastKey) || 0) < 1500) return reply(req, { error: 'One moment, then try again.' }, 429);
  if (writes) last.set(lastKey, Date.now());
  try {
    let id = b.id ? String(b.id) : '';
    switch (b.action) {
      case 'save': {
        const m = await meta(today);
        if (id) await saveDraft(who, id, b); else id = await createDraft(who, b, { season: config.season, month: monthOf(today), topic: m.topic });
        break;
      }
      case 'revise': await startRevision(who, id); break;
      case 'share': await shareVersion(who, id); break;
      case 'discard': await discardDraft(who, id); id = ''; break;
      case 'delete': { // a shared or posted reflection, by its author or a Circle admin: its Sādhana School post comes down first
        const st = await postedState(who, id);
        if (!st.author && !me.admin) throw new Error('Only the author can do that');
        if (st.postId) await deletePost(me.email, st.postId);
        await deleteReflection(who, id); id = '';
        break;
      }
      case 'comment': await addComment(who, id, b); break;
      case 'address': await setAddressed(who, id, b.comments, Number(b.n)); break;
      case 'read': break;
      case 'post': {
        const st = await postedState(who, id);
        if (!st.author) throw new Error('Only the author can do that');
        if (!st.postId) { // pressing it twice never makes two posts
          const space = reflectionsSpace();
          if (!headlessConfigured() || !space) throw new Error('Posting to Sādhana School isn’t switched on yet');
          const { version } = await finalVersion(who, id), c = postContent(version.title, version.body);
          const r = await createPost(me.email, space, { title: c.title, body: c.body });
          const postId = r?.id ?? r?.post?.id;
          if (postId == null) throw new Error('Couldn’t post to Sādhana School just now. Your reflection is safe: try again.');
          await markPosted(id, { postId, url: r.url || r.public_url || r.post?.url || '' });
        }
        break;
      }
      case 'takedown': {
        const st = await postedState(who, id);
        if (!st.author) throw new Error('Only the author can do that');
        if (st.postId) { await deletePost(me.email, st.postId); await markUnposted(who, id); }
        break;
      }
      default: return reply(req, { error: 'Unknown action' }, 400);
    }
    const [list, m] = await Promise.all([listReflections(who, {}), meta(today)]);
    return reply(req, { ok: true, id, list, meta: m, detail: id ? await getReflection(who, id) : null });
  } catch (e) { return fail(req, e, b.action); }
}

function fail(req, e, what) {
  const known = KNOWN.test(e.message);
  if (!known) console.error('reflections', what, e.message);
  return reply(req, { error: known ? e.message : what === 'post' || what === 'takedown' || what === 'delete' ? 'Couldn’t reach Sādhana School just now. Your reflection is safe: try again.' : 'We couldn’t do that just now. Please try again.' }, known ? 400 : 502);
}
export const OPTIONS = preflight;
