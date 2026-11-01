// Server side of a reflection's thread: check the post really is one of this season's reflections, read its comments as the member and shape them.
import { memberSpaceIds, spacePosts, postComments } from './circle';
import { normPost } from './tabs';
import { findSeason, isWired } from './config';
import { menteePostIds } from './menteeposts';
import { commentLines, threadOf, countComments, authorOf } from './reflections';

// → { season, post } or { error, status }
export async function reflectionFor(email, programme, slug, postId) {
  const season = findSeason(programme, slug);
  if (!season || !isWired(season) || season.topic_ids?.reflections == null) return { error: 'This season is not open for reflections yet.', status: 400 };
  if (!(await memberSpaceIds(email)).has(String(season.hub_space_id))) return { error: 'You do not have access to this season.', status: 403 };
  const posts = (await spacePosts(email, season.hub_space_id)).map(normPost);
  const post = posts.find(p => p.id === String(postId) && p.topics.includes(String(season.topic_ids.reflections)));
  if (!post) return { error: 'We could not find that reflection.', status: 404 };
  return { season, post };
}

export async function threadFor(email, post) {
  const [comments, mentee] = await Promise.all([postComments(email, post.id), menteePostIds()]);
  const isMentee = mentee.has(String(post.id));
  const threads = threadOf(commentLines(comments), { postAuthorId: authorOf(post.raw || {}).id, mentee: isMentee });
  return { threads, count: countComments(threads) };
}
