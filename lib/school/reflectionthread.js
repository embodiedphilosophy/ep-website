// Server side of the Reflections space (Kula Commentary): check a post is one the member may see, read its comments as the member and shape them.
import { memberSpaceIds, spacePosts, postComments } from './circle';
import { normPost } from './tabs';
import { hubItems, hubSettings, hubSeasons } from './hubconfig';
import { planOf, resolveItems } from './hub';
import { reflectionsFrom } from './season';
import { menteePostIds } from './menteeposts';
import { peopleIds } from './people';
import { commentLines, threadOf, countComments } from './reflections';

// The member's view of the Reflections space → { post, from } or { error, status }. A student of one season sees only the posts from the day
// their season began (nothing from before they registered); the full year sees everything.
export async function reflectionFor(email, postId) {
  const space = hubSettings().reflections_space_id;
  if (!space) return { error: 'Reflections are not open yet.', status: 400 };
  const member = await memberSpaceIds(email);
  if (!member.has(String(space))) return { error: 'You do not have access to the reflections.', status: 403 };
  const resolved = resolveItems(hubItems(), hubSeasons()), from = reflectionsFrom(resolved, member, planOf(resolved, member));
  const post = (await spacePosts(email, space)).map(normPost).find(p => p.id === String(postId) && (!from || String(p.at || '').slice(0, 10) >= from));
  return post ? { post, space } : { error: 'We could not find that reflection.', status: 404 };
}

export async function threadFor(email, post) {
  const [comments, ids] = await Promise.all([postComments(email, post.id), peopleIds()]);
  const threads = threadOf(commentLines(comments), { ids });
  return { threads, count: countComments(threads) };
}
