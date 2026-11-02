// The Teacher Formation Manual, read live from Jake's Google Doc ("Sahṛdaya Upāya - Training Manual"), so editing the doc is editing the page.
// Read through the cache (5 minutes; a save in Ops, or "Publish the manual now" there, refreshes it at once). If the doc can't be read, or a
// part the page needs is missing after an edit, the last good version is kept (and data/sahrdaya-manual.json before the first read).
import { readDoc, googleConfigured } from '../google';
import { doc2manual, problemsWith } from './doc2manual';
import { setManual } from './manual';
import saved from '../../data/sahrdaya-manual.json';

export const MANUAL_DOC = '1u9O7F59dnj0I6mo0u0wIZ_SVjfbIMRZpcIsVzpnYuOw';
export const MANUAL_DOC_URL = `https://docs.google.com/document/d/${MANUAL_DOC}/edit`;
export const MANUAL_PDF_URL = `https://docs.google.com/document/d/${MANUAL_DOC}/export?format=pdf`;
let last = saved, note = '';

// → { manual, live, note } and makes it the one lib/school/manual.js and texts.js use for this render
export async function loadManual() {
  if (!googleConfigured()) { setManual(last); return { manual: last, live: false, note: 'not connected' }; }
  try {
    const { doc, modified } = await readDoc(MANUAL_DOC, { tags: ['sheet', 'manual'] });
    const m = doc2manual(doc, { source: `Google Doc ${MANUAL_DOC}`, updated: modified ? modified.slice(0, 10) : last.updated });
    const bad = problemsWith(m);
    if (bad.length) { note = `The Google Doc couldn’t be used (${bad.join(', ')}); showing the last good version.`; console.error('Manual:', note); }
    else { last = m; note = ''; }
  } catch (e) { note = 'The Google Doc couldn’t be read just now; showing the last good version.'; console.error('Manual read failed', e.message); }
  setManual(last);
  return { manual: last, live: !note, note };
}
