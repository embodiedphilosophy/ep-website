// Sharing a diary entry to SS Reflections: a copy goes into the season's hub space under the "reflections" topic, as the
// member (Circle Headless Member API: lib/school/circle.js createPost). The diary keeps the original. Off until
// PRACTICE_POST=live is set in Vercel, like CIRCLE_EVENT_SYNC, so nothing reaches Circle by accident.
import { createPost, headlessConfigured } from '../school/circle';

export const postingLive = () => process.env.PRACTICE_POST === 'live' && headlessConfigured();

// "Thu 29 Oct — Dear Lord, today…" (80 characters at most)
export function postTitle(body, dateIso) {
  const d = new Date(dateIso || Date.now());
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(/,/g, '');
  const words = String(body).replace(/\s+/g, ' ').trim();
  const head = `${day} — `;
  const room = 80 - head.length;
  return head + (words.length > room ? words.slice(0, room - 1).replace(/\s+\S*$/, '') + '…' : words);
}

// → { id, url } or throws
export async function postToReflections({ email, season, entry }) {
  const space = season?.hub_space_id, topic = season?.topic_ids?.reflections;
  if (!space || topic == null) throw Object.assign(new Error('This season’s Reflections space isn’t set up yet'), { status: 503 });
  const body = entry.prompt ? `${entry.prompt}\n\n${entry.body}` : entry.body;
  const r = await createPost(email, space, { title: postTitle(entry.body, entry.at), body, topicId: topic });
  const post = r?.post || r || {};
  return { id: post.id ?? post.slug ?? '', url: post.url || (post.slug ? `https://ss.embodiedphilosophy.com/c/${season.circle_slug}/${post.slug}` : '') };
}
