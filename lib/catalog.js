import fs from 'fs';
import path from 'path';
import { readRange, googleConfigured, toObjects } from './google';
import { parseCSV } from './sheet';

// The Course Library catalog. ep-ops writes the "Catalog" tab of the EP Website sheet; this site only reads it.
// Env: CATALOG_SHEET_ID (the sheet, read with the site's Google service account) or CATALOG_CSV_URL (the tab
// published to the web as CSV). With neither, development builds fall back to data/catalog-seed.csv;
// production shows an empty library rather than placeholder data.
export const CATALOG_TAB = 'Catalog';

export const ACCESS = {
  pwyc: { label: 'Pay what you can', short: 'PWYC' },
  meditation_pass: { label: 'Meditation Pass', short: 'Med Pass' },
  wisdom_school: { label: 'Wisdom School', short: 'Wisdom School' },
  ws_plus: { label: 'WS Plus', long: 'Wisdom School Plus', short: 'WS Plus' },
  sadhana_school: { label: 'Sādhana School', short: 'Sādhana School' },
};
export const PROGRAMMES = {
  meditation_mondays: { label: 'Meditation Mondays', color: '#B98A3E' },
  wisdom_school: { label: 'Wisdom School', color: '#A5432A' },
  learning_pathways: { label: 'Learning Pathways', color: '#83341F' },
  sadhana_school: { label: 'Sādhana School', color: '#20302A' },
  seasonal: { label: 'Seasonal Sādhanas', color: '#7D3F52' },
  on_demand: { label: 'On demand', color: '#5A5346' },
};
export const KINDS = ['Live practice', 'Course', 'Learning Pathway', 'Season', 'Immersion / retreat', 'Certificate'];
export const FORMATS = ['Live', 'On demand', 'In person'];
export const DEPTHS = ['Start here', 'Deepen', 'Formation'];
export const TOPICS = ['Non-Dual Śākta-Śaiva', 'Tantra', 'Yoga philosophy', 'Meditation', 'Mantra', 'Sanskrit'];

const list = s => String(s || '').split(/\n|;/).map(x => x.trim()).filter(Boolean);
const pick = (v, allowed) => allowed.find(a => a.toLowerCase() === String(v || '').trim().toLowerCase()) || '';

async function readRows() {
  const id = process.env.CATALOG_SHEET_ID;
  if (id && googleConfigured()) {
    try { return toObjects(await readRange(id, `'${CATALOG_TAB}'!A1:AZ1000`)); }
    catch (e) { console.error('Catalog tab read failed', e.message); return []; }
  }
  const url = process.env.CATALOG_CSV_URL;
  if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: 300, tags: ['sheet'] } });
      const text = res.ok ? await res.text() : '';
      return text.trimStart().startsWith('<') ? [] : parseCSV(text);
    } catch (e) { console.error('Catalog CSV read failed', e.message); return []; }
  }
  if (process.env.NODE_ENV !== 'production' || process.env.CATALOG_USE_SEED === '1') {
    try { return parseCSV(fs.readFileSync(path.join(process.cwd(), 'data', 'catalog-seed.csv'), 'utf8')); } catch { return []; }
  }
  return [];
}

// One sheet row → the shape the pages use. Returns null for a row that must not show.
export function toOffering(r) {
  const id = String(r.offering_id || '').trim().toLowerCase();
  if (!id || String(r.status || '').trim().toLowerCase() !== 'published' || !r.title) return null;
  if (!ACCESS[r.access]) return null;
  const included = list(r.included);
  if (!included.length) return null; // never show an offering (or a price) without a "what's included" list
  const teachers = list(r.teachers).map(t => { const [name, photo] = t.split('|').map(x => x.trim()); return { name, photo: photo || '' }; });
  // One session per line: "title" or "date or length | title" (e.g. "2026-10-19 | Opening" or "42:10 | The mind as mantra")
  const sessions = String(r.sessions || '').split('\n').map(x => x.trim()).filter(Boolean).map(l => {
    const [a, ...b] = l.split('|').map(x => x.trim());
    return b.length ? { when: a, title: b.join(' | ') } : { when: '', title: a };
  });
  const ce = parseFloat(r.ce_hours);
  const next = /^\d{4}-\d{2}-\d{2}$/.test(r.next_date || '') ? r.next_date : '';
  return {
    id, title: r.title, promise: r.promise || '', cover: r.cover_url || '',
    priceLabel: r.price_label || '', checkout: /^https?:\/\//.test(r.checkout_url || '') ? r.checkout_url : '',
    circleStatus: r.circle_status || '', access: r.access, requires: r.requires || '', unlockNote: r.unlock_note || '',
    programme: PROGRAMMES[r.programme] ? r.programme : 'on_demand', label: r.card_label || '',
    kind: pick(r.kind, KINDS), format: pick(r.format, FORMATS), depth: pick(r.depth, DEPTHS),
    topics: list(r.topics).map(t => pick(t, TOPICS)).filter(Boolean),
    teachers, length: r.length || '', next, whenLabel: r.when_label || '', liveLabel: r.live_label || '', order: parseFloat(r.sort_order) || 999,
    ceEligible: !!String(r.ce_hours || '').trim(), ce: ce > 0 ? ce : 0,
    description: r.description || '', included, sessions,
    amounts: list(r.pwyc_amounts).map(Number).filter(n => n > 0),
  };
}

export async function getCatalog() {
  const seen = new Set();
  return (await readRows()).map(toOffering).filter(o => o && !seen.has(o.id) && seen.add(o.id));
}
export async function getOffering(id) {
  return (await getCatalog()).find(o => o.id === String(id).toLowerCase()) || null;
}

// "Unlock with …" for a locked card
export const unlockLine = o => o.unlockNote || (o.access === 'pwyc' ? '' : `Unlock with ${ACCESS[o.access].long || ACCESS[o.access].label}`);
