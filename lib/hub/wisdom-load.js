// The Wisdom School hub's data, read as the signed-in member (so access and progress are their own) and cached server side for
// five minutes by lib/school/circle.js. Read only: nothing here writes to Circle, sends a Circle email or changes a space.
// The page (/school/wisdom-school) and GET /api/hub/wisdom-school both call loadWisdomHub, so Today and the hub never disagree.
import cfg from '@/data/ws-hub.json';
import seedRows from '@/data/ws-pathways.json';
import { headlessConfigured, joinedSpaces, weekEvents, latestPosts, courseSections } from '../school/circle';
import { seenOf } from '../school/seen';
import { nyDay } from '../school/config';
import { tierFor } from '../member/tier';
import { readSiteTab } from '../member/sitetab';
import { getThemes } from '../themes';
import { memberSummary, ceReady } from '../ce/service';
import { buildWisdomHub, planOf, canOpen, normSection, MONTHS, PLANS } from './wisdom';

const TTL = 5 * 60 * 1000;

// The pathways staff keep in Settings → Wisdom School hub: pathways (sheet tab "WS Pathways"). Until that tab exists, the seven for 2026.
export const wsPathwayRows = () => readSiteTab('WS Pathways', { cols: 'A1:J100', valid: r => r.name && /^\d+$/.test(r.space_id), fallback: seedRows });

export async function loadWisdomHub({ email, admin = false, as = '', now = Date.now() }) {
  if (!headlessConfigured()) { const e = new Error('The hub is being set up'); e.status = 503; throw e; }
  const C = cfg.circle, today = nyDay(new Date(now)), unavailable = [];
  const settle = async (name, fn, fallback) => { try { return await fn(); } catch (e) { unavailable.push(e.status === 429 ? `${name} (Circle is busy)` : name); return fallback; } };

  const tier = await tierFor(email).catch(() => ({ tier: 'none' }));
  let plan = planOf(tier);
  if (admin && PLANS.includes(as)) plan = as; // an admin can preview the other plans
  const open = plan !== 'none';

  // Round one: everything that does not depend on anything else
  const [rows, spaces, rawEvents, yearRaw, announcements, themes, seen] = await Promise.all([
    settle('pathways', wsPathwayRows, seedRows),
    open ? settle('spaces', () => joinedSpaces(email), []) : [],
    open ? settle('events', () => weekEvents(email), []) : [],
    settle('the year', () => courseSections(email, C.year_course_id, TTL), []),
    open ? settle('announcements', () => latestPosts(email, C.announcements_space_id), []) : [],
    settle('themes', getThemes, null),
    open ? seenOf(email) : null,
  ]);
  const yearSections = yearRaw.map(normSection);
  const urls = Object.fromEntries(spaces.filter(s => s.url).map(s => [String(s.id), s.url]));
  const bookSection = yearSections.find(s => s.id === String(C.book_club_section_id)) || null;

  // Round two: the courses this member can open (nothing is read from one they can't), and their CE record
  const need = new Set(rows.filter(r => !r.section_id && String(r.space_id) !== String(C.year_course_id) && canOpen(plan, String(r.plan).toLowerCase() === 'plus' ? 'plus' : 'ws')).map(r => String(r.space_id)));
  const certIds = plan === 'plus' ? C.certificates.map(c => String(c.space_id)) : [];
  const ids = [...new Set([...need, ...certIds])];
  const [lists, ceSummary] = await Promise.all([
    Promise.all(ids.map(id => settle(`course ${id}`, () => courseSections(email, id, TTL), undefined))),
    plan === 'plus' && ceReady() ? settle('CE record', () => memberSummary(email, { wisdomPlus: true }, today), null) : null,
  ]);
  const courses = {}; ids.forEach((id, i) => { if (lists[i]) courses[id] = lists[i].map(normSection); });
  const certCourses = Object.fromEntries(certIds.filter(id => courses[id]).map(id => [id, courses[id]]));

  // The annual theme sheet backs up the month names when Circle cannot be read (a visitor), and names the book
  const yearTheme = themes?.themes?.find(t => t.year === cfg.settings.year);
  const themeTitles = MONTHS.map((m, k) => { const hit = yearTheme?.months?.find(x => x.month.slice(0, 3).toLowerCase() === m.slice(0, 3).toLowerCase()); return hit ? hit.title : ''; });

  const hub = buildWisdomHub({ cfg, plan, rows, yearSections, courses, certCourses, bookSection, rawEvents, announcements, urls, ceSummary, seen,
    themes: themeTitles, themeBook: yearTheme?.book_club || '', today, now });
  return { ...hub, admin: !!admin, unavailable };
}
