import fs from 'fs';
import path from 'path';
import { readRange, googleConfigured, toObjects } from './google';
import { parseCSV } from './sheet';

// The Course Library catalog. ep-ops writes the "catalog" tab of the EP Website sheet; this site only reads it.
// Columns are matched by header name; extra columns are ignored. A missing or empty tab gives an empty library.
// Env: CATALOG_SHEET_ID (defaults to the EP Website sheet; read with the site's Google service account) or
// CATALOG_CSV_URL (the tab published as CSV). In development, an empty result falls back to data/catalog-seed.csv;
// production never shows placeholder data (unless CATALOG_USE_SEED=1).
export const CATALOG_SHEET_ID = '1Ss58wGNPM6mW-ZyB9nMFak-Df4ZEqX-mQxsx2lieYSw';
export const CATALOG_TAB = 'catalog';

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

const list = s => String(s || '').split(/\n|;|\|/).map(x => x.trim()).filter(Boolean);
const json = s => { try { const v = JSON.parse(s); return Array.isArray(v) ? v : null; } catch { return null; } };
const isoDay = s => (/^\d{4}-\d{2}-\d{2}/.test(String(s || '').trim()) ? String(s).trim().slice(0, 10) : '');
const pick = (v, allowed) => allowed.find(a => a.toLowerCase() === String(v || '').trim().toLowerCase()) || '';

async function readRows() {
  let rows = [];
  const id = process.env.CATALOG_SHEET_ID || CATALOG_SHEET_ID;
  const url = process.env.CATALOG_CSV_URL;
  if (googleConfigured()) {
    // Reads only this one tab (never lists the sheet's tabs). A tab that doesn't exist yet answers 400: not an error.
    try { rows = toObjects(await readRange(id, `'${CATALOG_TAB}'!A1:AZ1000`)); }
    catch (e) { if (!/: 400/.test(e.message)) console.error('Catalog tab read failed', e.message); }
  } else if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: 300, tags: ['sheet'] } });
      const text = res.ok ? await res.text() : '';
      if (!text.trimStart().startsWith('<')) rows = parseCSV(text);
    } catch (e) { console.error('Catalog CSV read failed', e.message); }
  }
  if (!rows.length && (process.env.NODE_ENV !== 'production' || process.env.CATALOG_USE_SEED === '1')) {
    try { rows = parseCSV(fs.readFileSync(path.join(process.cwd(), 'data', 'catalog-seed.csv'), 'utf8')); } catch { /* no seed */ }
  }
  return rows;
}

// One sheet row → the shape the pages use. Returns null for a row that must not show.
export function toOffering(r) {
  const id = String(r.offering_id || '').trim().toLowerCase();
  if (!id || String(r.status || '').trim().toLowerCase() !== 'published' || !r.title) return null;
  if (!ACCESS[r.access]) return null;
  const included = list(r.included);
  if (!included.length) return null; // never show an offering (or a price) without a "what's included" list
  // teachers: a JSON array of {name, role, bio, photo} (older form: "Name | headshot_url; Name")
  const teachers = (json(r.teachers) || String(r.teachers || '').split(/\n|;/).map(t => { const [name, photo] = t.split('|').map(x => x.trim()); return { name, photo }; }))
    .map(t => ({ name: String(t.name || '').trim(), role: t.role || '', bio: t.bio || '', photo: t.photo || '' })).filter(t => t.name);
  // sessions: a JSON array of {date, title, time} (older form: one "date or length | title" per line)
  const sessions = (json(r.sessions) || String(r.sessions || '').split('\n').map(x => x.trim()).filter(Boolean).map(l => {
    const [a, ...b] = l.split('|').map(x => x.trim());
    return b.length ? { date: a, title: b.join(' | ') } : { title: a };
  })).map(x => ({ title: String(x.title || '').trim(), when: [x.date, x.time].filter(Boolean).join(' · ') })).filter(x => x.title);
  const ce = parseFloat(r.ce_hours);
  const next = isoDay(r.next_date) || isoDay(r.next_session);
  return {
    id, title: r.title, promise: r.promise || '', cover: r.cover_url || '',
    priceLabel: r.price_label || '', checkout: /^https?:\/\//.test(r.checkout_url || '') ? r.checkout_url : '',
    circleStatus: r.circle_status || '', access: r.access, requires: r.requires || '', unlockNote: r.unlock_note || '',
    programme: PROGRAMMES[r.programme] ? r.programme : 'on_demand', label: r.card_label || '',
    kind: pick(r.kind, KINDS), format: pick(r.format, FORMATS), depth: pick(r.depth, DEPTHS),
    topics: list(r.topics).map(t => pick(t, TOPICS)).filter(Boolean),
    teachers, length: r.length || '', next, whenLabel: r.when_label || (r.next_session && !isoDay(r.next_session) ? r.next_session : ''), liveLabel: r.live_label || (pick(r.format, FORMATS) === 'Live' ? (/weekly/i.test(r.length || '') ? 'Live weekly' : 'Live') : ''), order: parseFloat(r.sort_order) || 999,
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
