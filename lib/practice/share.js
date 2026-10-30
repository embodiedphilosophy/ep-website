// Share one saved diary entry to SS Reflections, once. Used by "Save & post" and by "Post to SS Reflections" on an older entry.
// Always answers { entry, shared, error? } so the page can say what happened; a failure leaves the entry private.
import * as store from './store';
import { postingLive, postToReflections } from './post';

export async function shareEntry(s, season, entry) {
  if (entry.posted) return { entry, shared: true };                       // already shared: same post, no second one
  if (!postingLive()) return { entry, shared: false, error: 'Sharing to SS Reflections isn’t switched on yet. Your entry is saved privately.' };
  const claimed = await store.claimForPost(s.uid, entry.id);
  if (!claimed) return { entry: (await store.getEntry(s.uid, entry.id)) || entry, shared: true }; // someone (a double tap) got there first
  try {
    const p = await postToReflections({ email: s.email, season, entry: claimed });
    return { entry: await store.finishPost(s.uid, entry.id, p.id, p.url), shared: true };
  } catch (e) {
    console.error('practice post', e.message);
    await store.releasePost(s.uid, entry.id).catch(() => {});
    return { entry, shared: false, error: 'Couldn’t post — try again. Your entry is saved privately.' };
  }
}
