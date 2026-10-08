import { emailsOf } from '../events';
import { zoomMode, MANUAL_SERIES } from '../zoomplan';
import { whereOf } from './eventfields';

// Event readiness checks (Ops Dashboard v2 spec, "Event readiness"), read straight from the calendar sheet:
// nobody keeps a separate checklist. Each check applies to some tracks, has a due date, and says which field
// in the event drawer fixes it. Kit tag, promo emails, social posts and the Circle space need outside
// systems and come with the external signals step.
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const names = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
const filled = v => String(v ?? '').trim() !== '';
const key = n => String(n || '').toLowerCase().replace(/^dr\.?\s+/, '').replace(/[^a-z]+/g, ' ').trim();
const lower = s => String(s || '').trim().toLowerCase();

// "Promo Starts" can be a date or a raw sheet serial number (46271)
export function promoStart(v) {
  const s = String(v || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{5}$/.test(s)) return addDays('1899-12-30', Number(s));
  return '';
}

const PUBLIC = ev => /public/i.test(ev.audience || '') && ev.track !== 'LAUNCH';
const PAID = ev => /paid|donation|pay what|\$|retreat|rate/i.test(`${ev.access} ${ev.price}`) && !/^free/i.test(String(ev.price || ''));

// ctx: { profileOf(name) → Teachers-tab row, siteTeacher(name) → Site Teachers row, pageOf(ev) → Course Pages row,
//        offsets: { TRACK: { title: -21, replay: 1 } } from Task Templates, seriesLinks: { series: link } }
export function checksFor(ev, ctx) {
  const T = ev.track, out = [];
  const add = (key, label, ready, due, field, detail = '') => out.push({ key, label, ready: !!ready, due, field, detail });
  const promo = promoStart(ev.promo_starts);
  const off = ctx.offsets[T] || {};
  if (T === 'LAUNCH') return out;
  const teachers = names(ev.teachers);

  add('teacher', 'Teacher assigned', teachers.length && emailsOf(ev).length, addDays(ev.date, -21), 'Teachers & Hosts',
    !teachers.length ? 'No teacher named' : !emailsOf(ev).length ? 'No reminder email' : '');
  if (['WSML', 'LRL', 'WSQ', 'SSWW', 'EVENT'].includes(T)) {
    const page = ctx.pageOf(ev), sent = page && ['submitted', 'published'].includes(lower(page.status));
    add('title', 'Title and description', (filled(ev.public_title) && filled(ev.summary)) || sent, addDays(ev.date, off.title ?? -21), 'Summary',
      !filled(ev.public_title) ? 'No public title' : !filled(ev.summary) ? 'No summary' : '');
  }
  if (T !== 'MM' && teachers.length) {
    const missing = teachers.filter(n => { const p = ctx.profileOf(n), s = ctx.siteTeacher(n); return !((p && filled(p.bio) && filled(p.photo_url)) || (s && filled(s.bio))); });
    add('bio', 'Bio and headshot', !missing.length, addDays(ev.date, -28), null, missing.join(', '));
  }
  if (T === 'EVENT' && teachers.length === 1) {
    const page = ctx.pageOf(ev);
    add('blurbs', 'Promo blurbs', page && ['promo_1', 'promo_2', 'promo_3'].every(k => filled(page[k])), addDays(ev.date, -42), null, 'From the teacher’s onboarding');
  }
  if (PUBLIC(ev)) add('web', 'On the website', ev.website, promo || addDays(ev.date, -21), 'Website');
  if (PUBLIC(ev) && PAID(ev)) add('registration', 'Registration open', filled(ev.registration_url), promo || addDays(ev.date, -21), 'Registration URL');
  const where = whereOf(ev.zoom, T);
  // A pasted Zoom link always wins; otherwise Circle needs its event, Zoom needs a link or an automatic meeting
  const linked = filled(ev.zoom_link) || (where === 'circle' ? filled(ev.circle_event)
    : (ev.series && ctx.seriesLinks[ev.series]) || ['one-off', 'series'].includes(zoomMode(ev.zoom)) || MANUAL_SERIES.has(ev.series));
  add('link', 'Session link', linked, addDays(ev.date, -7), 'Zoom Type', where === 'circle' && !linked ? 'Circle event not created yet' : !linked ? 'No Zoom link' : '');
  if (['SS', 'EVENT'].includes(T)) add('host', 'Course host', filled(ev.course_host), addDays(ev.date, -7), 'Course Host');
  if (off.replay != null) add('replay', 'Replay on Vimeo', filled(ev.video_id), addDays(ev.end_date || ev.date, off.replay), 'Vimeo Video ID');
  return out;
}

// red: a check past due, or the event under 7 days away with one still missing; amber: one due within 7 days;
// green: everything due so far is in; grey: nothing due yet
export function checkStatus(ev, checks, today) {
  const soon = addDays(today, 7), missing = checks.filter(c => !c.ready);
  if (missing.some(c => c.due < today) || (ev.date >= today && ev.date < soon && missing.some(c => c.due <= ev.date))) return 'red';
  if (missing.some(c => c.due <= soon)) return 'amber';
  return checks.some(c => c.due <= soon) ? 'green' : 'grey';
}

// Everything checksFor needs, loaded once
export async function checkContext(cal) {
  const { loadTemplates, PROFILES_TAB } = await import('../calendar');
  const { readRange, toObjects } = await import('../google');
  const { loadPages, offeringKey } = await import('../teach');
  const { getAllTeachers } = await import('../content');
  const { seriesLinksOf } = await import('./joinurl');
  const { ruleOf } = await import('./autocomplete');
  const [tpls, pages, profiles, site] = await Promise.all([
    loadTemplates().catch(() => []), loadPages({ fresh: false }).catch(() => []),
    readRange(process.env.CALENDAR_SHEET_ID, `'${PROFILES_TAB}'!A1:Z2000`).then(toObjects).catch(() => []),
    getAllTeachers().catch(() => []),
  ]);
  const offsets = {};
  for (const t of tpls) {
    const r = ruleOf(t), tr = String(t.track).toUpperCase(), o = Number(t.offset_days) || 0;
    if (r === 'title') (offsets[tr] ||= {}).title = Math.min(offsets[tr]?.title ?? 0, o);
    if (r === 'video_id') (offsets[tr] ||= {}).replay = o;
  }
  const prof = Object.fromEntries(profiles.filter(p => p.name).map(p => [key(p.name), p]));
  const sit = Object.fromEntries(site.filter(p => p.name).map(p => [key(p.name), p]));
  const pg = Object.fromEntries(pages.map(p => [p.offering, p]));
  return { offsets, seriesLinks: seriesLinksOf(cal), profileOf: n => prof[key(n)], siteTeacher: n => sit[key(n)], pageOf: ev => pg[offeringKey(ev)] };
}
