// Pure logic for the Wisdom School hub (/school/wisdom-school, and GET /api/hub/wisdom-school for Today). No network and no
// @-imports, so scripts/ops-test/wisdom-hub.mjs can run it directly. Circle decides who can open what; this turns what the
// member's own Circle reads returned (events, course sections, posts), their plan, the ws_pathways rows and their CE record
// into the one payload the page draws. Config and Circle ids: data/ws-hub.json. Notes: docs/wisdom-hub.md.
import { normEvent, normPost } from '../school/tabs.js';

export const TABS = [
  { key: 'month', label: 'This month' },
  { key: 'live', label: 'Live' },
  { key: 'year', label: 'The year' },
  { key: 'book', label: 'Book club' },
  { key: 'pathways', label: 'Pathways' },
  { key: 'library', label: 'Course Library' },
  { key: 'ce', label: 'Certificates & CE' },
];
export const tabKey = t => (TABS.some(x => x.key === t) ? t : 'month');
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const PLAN_LABEL = { ws: 'Wisdom School', plus: 'Wisdom School Plus', none: 'Preview' };
export const PLANS = ['ws', 'plus', 'none'];

const NEW_WINDOW_MS = 14 * 24 * 3600 * 1000; // a source the member has never opened from the hub: count the last two weeks
const LIVE_GRACE_MS = 30 * 60 * 1000; // a session counts as upcoming until 30 minutes past its end
const ms = iso => (iso ? new Date(iso).getTime() : NaN);
const first = (...v) => v.find(x => x !== undefined && x !== null && x !== '');
const num = n => { const x = Number(n); return Number.isFinite(x) ? x : 0; };
export const fmtHours = n => String(Math.round(num(n) * 10) / 10);

// ---- plan ----
// plus: the Wisdom School Plus tag. ws: the Wisdom School tag, or a Sādhana School year / mentorship (both include Wisdom School;
// lib/member/programmes.js OPEN). Everything else is a visitor.
export function planOf(tier) {
  if (!tier) return 'none';
  if (tier.wisdomPlus || tier.tier === 'wisdom_plus') return 'plus';
  if (tier.wisdom || ['wisdom', 'ss_year', 'mentee'].includes(tier.tier)) return 'ws';
  return 'none';
}
export const canOpen = (plan, need) => plan === 'plus' || (plan === 'ws' && need === 'ws');
const badgeFor = need => (need === 'plus' ? 'Plus' : 'Members');

// ---- Circle records ----
// Tiptap documents and HTML both turn up as a lesson's text depending on how it was written; flatten either to plain paragraphs
function docText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(docText).filter(Boolean).join('\n');
  if (node.type === 'text') return node.text || '';
  const inner = docText(node.content || node.body);
  return ['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type) ? `${inner}\n` : inner;
}
export function plainText(v) {
  const raw = typeof v === 'string' ? v : docText(v);
  return String(raw).replace(/<\/(p|div|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

export function normLesson(l) {
  const status = first(l.status, l.progress?.status, l.completion_status);
  return {
    id: String(l.id),
    name: first(l.name, l.title) || '',
    url: first(l.url, l.public_url) || '',
    done: status === 'complete' || status === 'completed' || l.completed === true,
    at: first(l.published_at, l.created_at, l.updated_at) || null,
    text: plainText(first(l.body_text, l.description, l.rich_text_body, l.tiptap_body, l.body, l.text) || ''),
  };
}
export function normSection(s) {
  return { id: String(s.id), name: first(s.name, s.title) || '', url: first(s.url) || '', lessons: (s.lessons || s.course_lessons || []).map(normLesson) };
}

// Circle's member API lists a course's lessons without their address, so the lecture button and the month squares had
// nothing to link to. A lesson's page is always <course space>/sections/<section id>/lessons/<lesson id>; fill it in.
export function fillLessonUrls(sections, base) {
  const b = String(base || '').replace(/\/$/, '');
  if (!b) return sections;
  return sections.map(s => ({ ...s, lessons: s.lessons.map(l => (l.url ? l : { ...l, url: `${b}/sections/${s.id}/lessons/${l.id}` })) }));
}

// "October · The Return with Wisdom" → "The Return with Wisdom". A name without " · " is the theme as it stands, minus a leading "October:".
export function themeOf(name, monthName) {
  const n = String(name || '').trim(), i = n.indexOf(' · ');
  if (i >= 0) return n.slice(i + 3).trim();
  return n.replace(new RegExp(`^${monthName}\\s*[:\\-–—]\\s*`, 'i'), '').trim();
}

// The question for practice is the first lesson's text: its first paragraph. Empty → null, and the page leaves the line out.
export function questionOf(text) {
  const p = String(text || '').split('\n').map(x => x.trim()).find(Boolean);
  if (!p) return null;
  return p.length > 320 ? `${p.slice(0, 317).trimEnd()}…` : p;
}

// 0 = the project's year has not started, 13 = it is over
export function currentMonth(today, year) {
  const y = Number(String(today).slice(0, 4)), m = Number(String(today).slice(5, 7));
  return y < year ? 0 : y > year ? 13 : m;
}

// ---- the twelve months ----
// themes: fallback theme per month (the Annual Themes sheet) for when Circle cannot be read, e.g. for a visitor
export function buildMonths({ sections = [], cfg, today, themes = [] }) {
  const byId = new Map(sections.map(s => [s.id, s]));
  const cur = currentMonth(today, cfg.settings.year);
  return cfg.circle.month_sections.map((sid, k) => {
    const i = k + 1, name = MONTHS[k], sec = byId.get(String(sid)), l0 = sec?.lessons[0] || null;
    return {
      index: i, name, sectionId: String(sid), theme: sec ? themeOf(sec.name, name) : themes[k] || '',
      state: i < cur ? 'past' : i === cur ? 'current' : 'future',
      lessonUrl: l0?.url || null, hasLesson: !!l0, question: l0 ? questionOf(l0.text) : null,
    };
  });
}

// ---- events ----
export function upcomingEvents(rawEvents, spaceIds, now) {
  const spaces = new Set(spaceIds.map(String));
  return rawEvents.map(normEvent).filter(e => spaces.has(e.spaceId) && e.start && (ms(e.end) || ms(e.start) + 2 * 3600 * 1000) + LIVE_GRACE_MS >= now)
    .sort((a, b) => ms(a.start) - ms(b.start));
}
const slimEvent = e => ({ id: e.id, startsAt: e.start, endsAt: e.end || null, title: e.title, teacher: e.teacher || '', url: e.pageUrl || e.url || '', spaceId: e.spaceId });

export function buildLive({ cfg, liveEvents, medEvents, open }) {
  return cfg.live.map(row => {
    const pool = row.source === 'meditation' ? medEvents : liveEvents.filter(e => new RegExp(row.match || '.', 'i').test(e.title));
    return {
      key: row.key, chip: row.chip, title: row.title, cadence: row.cadence, description: row.description, streams: row.streams || null,
      locked: !open, badge: open ? '' : badgeFor('ws'), next: open && pool[0] ? slimEvent(pool[0]) : null,
    };
  });
}

// ---- "New since your last visit" ----
// One line per source. seen: { id: iso } of the last time the member opened that source from the hub (null = the store is not
// connected, so no counts). A source never opened counts the last two weeks. ids are real Circle ids, so /api/school/seen can record them.
export function buildNewSince({ cfg, months, current, rawEvents, announcements, bookSection, seen, now, urls }) {
  if (!seen) return [];
  const base = id => (seen[String(id)] ? ms(seen[String(id)]) : now - NEW_WINDOW_MS);
  const out = [];
  const add = (source, id, items, url) => {
    const list = items.filter(x => x.at > base(id)).sort((a, b) => b.at - a.at);
    if (list.length) out.push({ source, count: list.length, latestTitle: list[0].title, url: list[0].url || url || '', seenId: String(id) });
  };
  const medId = cfg.circle.meditation_space_id;
  add('Meditation replays', medId, rawEvents.map(normEvent).filter(e => e.spaceId === String(medId) && e.start && (ms(e.end) || ms(e.start) + 2 * 3600 * 1000) + LIVE_GRACE_MS < now)
    .map(e => ({ at: ms(e.end) || ms(e.start), title: e.title, url: e.replayUrl || e.pageUrl || e.url })), urls[medId]);
  const cm = months.find(m => m.index === current);
  const sec = cm && current ? cm.section : null;
  if (cm && sec) add('This month’s lecture', cm.sectionId, sec.lessons.filter(l => l.at).map(l => ({ at: ms(l.at), title: l.name, url: l.url })), cm.lessonUrl);
  if (bookSection) add('Book club', cfg.circle.book_club_section_id, bookSection.lessons.filter(l => l.at).map(l => ({ at: ms(l.at), title: l.name, url: l.url })), bookSection.lessons[0]?.url);
  add('Announcements', cfg.circle.announcements_space_id, announcements.map(normPost).filter(p => p.at).map(p => ({ at: ms(p.at), title: p.title, url: p.url })), urls[cfg.circle.announcements_space_id]);
  return out;
}

// ---- pathways ----
const lessonsIn = secs => secs.flatMap(s => s.lessons);
export function progressOf(lessons) {
  const total = lessons.length, done = lessons.filter(l => l.done).length;
  if (!total) return null;
  const label = done === 0 ? 'Start' : done >= total ? `Finished · ${total} of ${total}` : `Continue · ${done} of ${total}`;
  const resume = lessons.find(l => !l.done) || lessons[0];
  return { done, total, label, url: resume?.url || '' };
}

export function buildPathways({ rows, plan, courses, yearSections, urls, cfg }) {
  // A row with no order number goes last (a new pathway added in a hurry), in the order it was added
  const ord = r => (String(r.order ?? '').trim() === '' ? 1e9 : num(r.order));
  return [...rows].sort((a, b) => ord(a) - ord(b)).map(r => {
    const need = String(r.plan).toLowerCase() === 'plus' ? 'plus' : 'ws';
    const open = canOpen(plan, need), hours = num(r.ce_hours);
    const lessons = r.section_id ? lessonsIn(yearSections.filter(s => s.id === String(r.section_id))) : courses[String(r.space_id)] ? lessonsIn(courses[String(r.space_id)]) : null;
    const progress = open && lessons ? progressOf(lessons) : null;
    const spaceUrl = urls[String(r.space_id)] || '';
    return {
      key: String(r.space_id) + (r.section_id ? `-${r.section_id}` : ''), name: r.name, teacher: r.teacher || '', note: r.note || '', ceHours: hours || null, plan: need,
      chip: open && plan === 'ws' && r.ws_chip ? r.ws_chip : hours ? `${fmtHours(hours)} CE hrs` : 'In the Project',
      progress, url: open ? progress?.url || spaceUrl || '' : null, locked: !open, badge: open ? '' : badgeFor(need), spaceId: String(r.space_id),
    };
  });
}

// ---- Course Library ----
export function buildLibrary({ cfg, plan }) {
  const open = plan === 'plus', base = cfg.settings.library_url;
  const row = d => ({ key: d.key, title: d.title, line: d.line, locked: !open, badge: open ? '' : badgeFor('plus'), url: open ? `${base}?dept=${encodeURIComponent(d.title)}` : null });
  return {
    locked: !open,
    departments: cfg.library_departments.map(row),
    archive: row({ key: 'past-years', title: 'Past years', line: 'Every earlier year of the Wisdom School, kept in the archive.' }),
  };
}

// ---- Certificates & CE ----
// summary: lib/ce memberSummary (or null); certCourses: { spaceId: [sections] }
export function buildCe({ cfg, plan, pathways, summary, certCourses, urls }) {
  const total = Math.round(pathways.reduce((a, p) => a + num(p.ce_hours), 0) * 10) / 10;
  const counted = pathways.filter(p => num(p.ce_hours) > 0).length;
  const teaser = { hours: total, pathways: counted, certificates: cfg.circle.certificates.map(c => c.title) };
  if (plan !== 'plus') return { ce: null, teaser };
  const certificates = cfg.circle.certificates.map(c => {
    const lessons = certCourses[String(c.space_id)] ? lessonsIn(certCourses[String(c.space_id)]) : null;
    const progress = lessons ? progressOf(lessons) : null;
    return { key: c.key, title: c.title, progress, url: progress?.url || urls[String(c.space_id)] || '', locked: false };
  });
  return {
    teaser,
    ce: {
      hours: summary ? summary.certifiedHours : null, of: total,
      cycle: summary ? { hours: summary.cycle.hours, need: summary.cycle.need, met: summary.cycle.met } : null,
      certificates, trackerUrl: cfg.settings.ce_url,
    },
  };
}

// ---- the year ----
export function buildYear({ cfg, plan, months }) {
  const lockedFor = m => plan === 'none' && m.index !== cfg.free_month;
  const row = m => {
    const locked = lockedFor(m);
    return {
      key: `m${m.index}`, month: m.name, theme: m.theme, state: m.state, locked, badge: locked ? badgeFor('ws') : '', hasLesson: m.hasLesson,
      url: !locked && m.hasLesson && m.state !== 'future' ? m.lessonUrl : null,
    };
  };
  const live = months.filter(m => m.state !== 'future').reverse().map(row);
  const ahead = months.filter(m => m.state === 'future').map(row);
  const archiveOpen = plan === 'plus';
  return {
    rows: live, ahead, closing: { title: `${cfg.settings.year + 1} · The Attention Project`, line: cfg.settings.next_year },
    archive: { title: 'Past years', line: archiveOpen ? 'Every earlier year, in the Course Library.' : 'Earlier years of the Wisdom School.', locked: !archiveOpen, badge: archiveOpen ? '' : badgeFor('plus'), url: archiveOpen ? `${cfg.settings.library_url}?dept=${encodeURIComponent('Past years')}` : null },
  };
}

// ---- Book club ----
// The Book club section's lessons are the quarters, oldest first: the last one is this quarter's book, the rest are past quarters.
export function buildBook({ cfg, plan, section, themeBook, next }) {
  const open = plan !== 'none';
  const lessons = section?.lessons || [];
  const cur = lessons[lessons.length - 1] || null;
  const title = cur?.name || themeBook || cfg.book_fallback.title;
  return {
    locked: !open, badge: open ? '' : badgeFor('ws'), quarter: cfg.book_fallback.quarter,
    current: { title, url: open && cur ? cur.url : null, fromCircle: !!cur },
    past: open ? lessons.slice(0, -1).reverse().map(l => ({ title: l.name, url: l.url || null })) : [],
    next: open && next ? slimEvent(next) : null,
  };
}

/**
 * The whole hub as plain data.
 * in: { cfg (data/ws-hub.json), plan, rows (ws_pathways), yearSections, courses: {spaceId:[sections]}, certCourses, bookSection,
 *       rawEvents, announcements, urls: {spaceId: url}, ceSummary, seen|null, themes:[], themeBook, today, now }
 */
export function buildWisdomHub(i) {
  const { cfg, plan, today, now = Date.now() } = i;
  const yearSections = i.yearSections || [];
  const months = buildMonths({ sections: yearSections, cfg, today, themes: i.themes });
  const cur = currentMonth(today, cfg.settings.year);
  const cm = months.find(m => m.index === cur) || null;
  const open = plan !== 'none';
  const rawEvents = i.rawEvents || [];
  const liveEvents = upcomingEvents(rawEvents, [cfg.circle.live_space_id], now), medEvents = upcomingEvents(rawEvents, [cfg.circle.meditation_space_id], now);
  const merged = [...liveEvents, ...medEvents].sort((a, b) => ms(a.start) - ms(b.start));
  const urls = i.urls || {};

  const withSec = months.map(m => ({ ...m, section: yearSections.find(s => s.id === m.sectionId) }));
  const newSince = open ? buildNewSince({ cfg, months: withSec, current: cur, rawEvents, announcements: i.announcements || [], bookSection: i.bookSection || null, seen: i.seen ?? null, now, urls }) : [];

  const pathways = buildPathways({ rows: i.rows || [], plan, courses: i.courses || {}, yearSections, urls, cfg });
  const { ce, teaser } = buildCe({ cfg, plan, pathways: i.rows || [], summary: i.ceSummary || null, certCourses: i.certCourses || {}, urls });
  const library = buildLibrary({ cfg, plan });
  const live = buildLive({ cfg, liveEvents, medEvents, open });
  const year = buildYear({ cfg, plan, months });
  const book = buildBook({ cfg, plan, section: i.bookSection || null, themeBook: i.themeBook, next: liveEvents.find(e => /book club/i.test(e.title)) });

  // The free lecture shown to a visitor: January's lesson in Circle if it can be read, else the staff-chosen sample
  const jan = months.find(m => m.index === cfg.free_month);
  const sampleUrl = jan?.lessonUrl || cfg.settings.sample_url || cfg.settings.plus_learn_url;

  const monthBlock = {
    index: cur >= 1 && cur <= 12 ? cur : 0, of: 12, sectionId: cm?.sectionId || '', name: cm?.name || '', theme: cm?.theme || '', question: open ? cm?.question || null : null,
    lessonUrl: open ? cm?.lessonUrl || null : null, hasLesson: !!cm?.hasLesson, locked: !open,
  };

  const bySource = Object.fromEntries(newSince.map(n => [n.source, n.count]));
  const fresh = { month: (bySource['This month’s lecture'] || 0) + (bySource.Announcements || 0), live: bySource['Meditation replays'] || 0, book: bySource['Book club'] || 0 };
  const lockedPaths = pathways.filter(p => p.locked).length;
  const tabs = TABS.map(t => {
    let badge = null;
    if (fresh[t.key]) badge = { count: fresh[t.key] };
    else if (t.key === 'library' || t.key === 'ce') badge = plan === 'plus' ? null : { locked: 'Plus' };
    else if (t.key === 'pathways') badge = lockedPaths ? { locked: plan === 'none' ? 'Members' : `${lockedPaths} locked` } : null;
    else if (plan === 'none' && ['live', 'book'].includes(t.key)) badge = { locked: 'Members' };
    return { key: t.key, label: t.label, badge };
  });

  return {
    plan, planLabel: PLAN_LABEL[plan], kicker: cfg.settings.kicker, tabs,
    month: monthBlock,
    upNext: open ? merged.slice(0, 3).map(slimEvent) : [],
    months: months.map(m => ({ name: m.name, theme: m.theme, url: open || m.index === cfg.free_month ? (m.state !== 'future' && m.hasLesson ? m.lessonUrl : null) : null, state: m.state, index: m.index, locked: plan === 'none' && m.index !== cfg.free_month })),
    comingNext: cfg.settings.next_year,
    newSince, countsOn: !!i.seen,
    pathways, ce, ceTeaser: teaser,
    live, year, book, library,
    side: plan === 'plus' ? { kind: 'ce', hours: ce?.hours ?? null, of: ce?.of ?? teaser.hours }
      : plan === 'ws' ? { kind: 'teaser', title: 'Hundreds of hours, certificates and CE.' }
      : { kind: 'sample', title: jan?.theme || '', month: jan?.name || 'January', url: sampleUrl },
    sampleUrl,
    links: { join: cfg.settings.join_url, plusCheckout: cfg.settings.plus_checkout_url, plusLearn: cfg.settings.plus_learn_url, joinPrice: cfg.settings.join_price, plusPrice: cfg.settings.plus_price },
  };
}
