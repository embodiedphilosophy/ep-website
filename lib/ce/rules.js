// Continuing-education (Yoga Alliance CE) rules. Pure functions only: no network, no database.
// Used by the Circle webhook, the member tracker (public/circle/ce.js), certificates and the ops ledger.
import crypto from 'crypto';

// ---- Settings (change here) ----
export const PACE_SHARE = 0.4;          // finished in less than 40% of the pathway's runtime → held for a staff look
export const CYCLE_HOURS = 30;          // Yoga Alliance: 30 CE hours…
export const CYCLE_YEARS = 3;           // …every three years
export const SAMPLE_PATHWAY = /meditation for real life/i; // regular Wisdom School can track this one; the certificate needs Plus
export const CE_PAGE = 'https://ss.embodiedphilosophy.com/c/ce-credits'; // the tracker page in Circle
export const SITE = 'https://www.embodiedphilosophy.com';

export const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// Site Pathways rows (lib/content.js getPathways) → CE pathways. Columns used: title, ce_hours, ya_category,
// courses (modules), and the optional CE columns ce_slug, circle_space_id, circle_url, lessons, runtime_minutes.
export function cePathways(rows) {
  return (rows || []).filter(r => Number(r.ce_hours) > 0).map(r => ({
    slug: String(r.ce_slug || '').trim() || slugify(r.title),
    title: r.title,
    hours: Number(r.ce_hours),
    category: r.ya_category || '',
    modules: r.courseList || String(r.courses || '').split(/;|\n/).map(c => c.trim()).filter(Boolean),
    spaceIds: String(r.circle_space_id || '').split(/[,\s]+/).filter(Boolean),
    lessons: Number(r.lessons) || 0,
    runtimeMinutes: Number(r.runtime_minutes) || 0,
    url: String(r.circle_url || '').trim(),
    sample: SAMPLE_PATHWAY.test(r.title || ''),
  }));
}

export const pathwayForSpace = (pathways, spaceId) => spaceId ? pathways.find(p => p.spaceIds.includes(String(spaceId))) || null : null;

// Who can get certificates: Wisdom School Plus (and anyone above it who has the Plus tag). tier: lib/member/tier.js
export const canCertify = tier => !!(tier && tier.wisdomPlus);
// Who can see the tracker at all: Plus, or regular Wisdom School (for the sample pathway)
export const canTrack = tier => !!(tier && (tier.wisdomPlus || tier.wisdom));

// ---- Pace check ----
// firstAt: first lesson we heard about; doneAt: course completed. Returns 'pass' | 'held' | 'unknown'.
export function paceCheck(firstAt, doneAt, runtimeMinutes, share = PACE_SHARE) {
  if (!firstAt || !doneAt || !runtimeMinutes) return 'unknown';
  const mins = (new Date(doneAt) - new Date(firstAt)) / 60000;
  return mins < runtimeMinutes * share ? 'held' : 'pass';
}

// ---- Certificate ids and links ----
export const certId = (year, seq) => `EP-CE-${year}-${String(seq).padStart(4, '0')}`;
export const CERT_ID = /^EP-CE-\d{4}-\d{4,}$/;

const secret = () => {
  const s = process.env.MEMBER_SECRET || process.env.OPS_SECRET;
  if (!s) throw new Error('MEMBER_SECRET is not set');
  return s;
};
// A short key that makes the PDF link unguessable (the verify page itself is public)
export const certKey = id => crypto.createHmac('sha256', secret()).update(`ce-cert:${id}`).digest('base64url').slice(0, 20);
export function goodKey(id, k) {
  const want = certKey(id);
  return typeof k === 'string' && k.length === want.length && crypto.timingSafeEqual(Buffer.from(k), Buffer.from(want));
}
export const pdfUrl = (id, base = SITE) => `${base}/api/ce/certificate/${id}?k=${certKey(id)}`;
export const verifyUrl = (id, base = SITE) => `${base}/ce/verify/${id}`;

export const longDate = iso => new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' });

// ---- Renewal cycle ----
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function cycleWindow(renewal, today) {
  // The current cycle ends on the member's renewal date (or, if not set, today) and starts three years earlier
  const end = DAY.test(String(renewal || '')) ? renewal : today;
  const d = new Date(end + 'T00:00:00Z'); d.setUTCFullYear(d.getUTCFullYear() - CYCLE_YEARS);
  return { start: d.toISOString().slice(0, 10), end, set: DAY.test(String(renewal || '')) };
}

// ---- The member's tracker ----
// pathways: cePathways(); lessons: { slug: { count, firstAt } }; done: { slug: at }; certs: rows from the store.
// Returns everything public/circle/ce.js draws.
export function summarise({ pathways, lessons = {}, done = {}, certs = [], renewal = null, today, tier }) {
  const eligible = canCertify(tier);
  const live = certs.filter(c => c.status !== 'revoked');
  const bySlug = Object.fromEntries(live.map(c => [c.pathway, c]));
  const rows = pathways.map(p => {
    const cert = bySlug[p.slug] || null;
    const l = lessons[p.slug] || { count: 0 };
    const finished = !!done[p.slug];
    let status = 'new';
    if (cert) status = cert.status === 'held' ? 'held' : 'certified';
    else if (finished) status = eligible ? 'reflect' : 'locked';
    else if (l.count > 0) status = 'progress';
    const total = p.lessons || 0;
    const count = finished && total ? total : Math.min(l.count, total || l.count);
    return {
      slug: p.slug, title: p.title, hours: p.hours, category: p.category, modules: p.modules, status,
      lessonsDone: count, lessonsTotal: total, percent: finished ? 100 : total ? Math.round((count / total) * 100) : 0,
      cert: cert ? { id: cert.id, status: cert.status, issuedAt: cert.issued_at || cert.issuedAt, name: cert.name } : null,
      sample: p.sample, url: p.url,
    };
  });
  const issued = live.filter(c => c.status === 'issued');
  const win = cycleWindow(renewal, today);
  const inCycle = issued.filter(c => { const d = String(c.issued_at || c.issuedAt || '').slice(0, 10); return d >= win.start && d <= win.end; });
  const cycleHours = round1(inCycle.reduce((a, c) => a + Number(c.hours || 0), 0));
  const byCategory = {};
  for (const c of issued) byCategory[c.category || 'Other'] = round1((byCategory[c.category || 'Other'] || 0) + Number(c.hours || 0));
  return {
    eligible, today, renewal: win.set ? renewal : null, cycle: { ...win, hours: cycleHours, need: CYCLE_HOURS, met: cycleHours >= CYCLE_HOURS },
    certifiedHours: round1(issued.reduce((a, c) => a + Number(c.hours || 0), 0)),
    availableHours: round1(pathways.reduce((a, p) => a + p.hours, 0)),
    byCategory, rows,
  };
}
const round1 = n => Math.round(n * 10) / 10;

// ---- Circle "Send to webhook" payloads ----
// Circle's workflow webhook body isn't documented in detail, so we look for the fields wherever they sit.
// The workflow URL can also say what happened: ?event=lesson or ?event=course.
function walk(o, fn, path = []) {
  if (!o || typeof o !== 'object' || path.length > 6) return;
  for (const [k, v] of Object.entries(o)) { fn(k, v, path); if (v && typeof v === 'object') walk(v, fn, [...path, k]); }
}
export function parseCircle(body, event = '') {
  let email = '', lessonId = '', spaceId = '', courseId = '', name = '', type = '';
  walk(body, (k, v, path) => {
    const parent = (path[path.length - 1] || '').toLowerCase();
    const key = k.toLowerCase();
    if (!email && /email/.test(key) && typeof v === 'string' && /@/.test(v) && !/admin|sender|from/.test(key)) email = v;
    if (!type && /^(type|event|event_type|trigger|name)$/.test(key) && typeof v === 'string' && /lesson|course|section/i.test(v) && !parent) type = v;
    if (!lessonId && (key === 'lesson_id' || key === 'course_lesson_id' || (key === 'id' && /lesson/.test(parent)))) lessonId = String(v ?? '');
    if (!spaceId && (key === 'space_id' || (key === 'id' && /space/.test(parent)))) spaceId = String(v ?? '');
    if (!courseId && (key === 'course_id' || (key === 'id' && parent === 'course'))) courseId = String(v ?? '');
    if (!name && key === 'name' && /member|user/.test(parent) && typeof v === 'string') name = v;
  });
  const hint = String(event || type || '').toLowerCase();
  const kind = /course/.test(hint) ? 'course' : /lesson/.test(hint) ? 'lesson' : lessonId ? 'lesson' : 'course';
  return { kind, email: email.trim().toLowerCase(), lessonId, spaceId: spaceId || courseId, name };
}

// ---- CSV for the Yoga Alliance records export ----
const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function certsCsv(certs) {
  const head = ['Certificate ID', 'Status', 'Issued', 'Name on certificate', 'Email', 'Yoga Alliance member ID', 'Pathway', 'CE hours', 'Category', 'Started', 'Lessons completed', 'Attested', 'Pace check', 'Reflection 1', 'Reflection 2', 'Notes'];
  const rows = certs.map(c => [c.id, c.status, c.issued_at, c.name, c.email, c.ya_id, c.title, c.hours, c.category, c.first_at, c.done_at, c.attested_at, c.pace, c.r1, c.r2, c.notes]);
  return [head, ...rows].map(r => r.map(csvCell).join(',')).join('\n') + '\n';
}
