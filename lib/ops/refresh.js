import { revalidatePath, revalidateTag } from 'next/cache';
import { SHEET_TAG } from '../google';

// After the dashboard writes to the sheet: expire every cached sheet read (pages, the events feed, the
// dashboard) and every cached page, so the site shows the change on the next request instead of within 5 minutes.
export function refreshSite() {
  revalidateTag(SHEET_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
}
