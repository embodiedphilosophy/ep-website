// The Meditation Pass hub's data. Read only: nothing here writes to Circle, sends a Circle email or changes a space.
// The page (/school/meditation-pass) and GET /api/hub/meditation both call loadMeditationHub, so Today and the hub never disagree.
//   Circle (as the member, cached 5 minutes per member by lib/school/circle.js): the live sessions and, for Pass members, the replay course.
//   Ops (cached 5 minutes here and by the sheet layer): who teaches which Monday (the website's Upcoming list) and the mm_streams table.
import cfg from '../../data/mm-hub.json';
import streamSeed from '../../data/mm-streams.json';
import { headlessConfigured, joinedSpaces, weekEvents, courseSections } from '../school/circle';
import { tierFor } from '../member/tier';
import { OPEN } from '../member/programmes';
import { feedToken } from '../member/schedule';
import { readSiteTab } from '../member/sitetab';
import { getEvents, getPastEvents } from '../events';
import { buildMeditationHub, normStreams, planOf, PLANS } from './meditation';

const TTL = 5 * 60 * 1000;
let shared = null; // Ops' side is the same for everyone

// Settings → Meditation streams (sheet tab "MM Streams"); until it exists, the five streams from data/mm-streams.json
export const mmStreamRows = () => readSiteTab('MM Streams', { cols: 'A1:F50', valid: r => r.stream, fallback: streamSeed });

// Who teaches each Monday and what the streams are: the same events the website's Upcoming list shows, past and to come
export async function loadMmOps() {
  if (shared && Date.now() - shared.at < TTL) return shared.value;
  const mine = e => String(e.series || '').toLowerCase() === cfg.session.series;
  const [rows, up, past] = await Promise.all([
    mmStreamRows().catch(() => streamSeed),
    getEvents().catch(e => { console.error('meditation hub: upcoming', e.message); return null; }),
    getPastEvents().catch(e => { console.error('meditation hub: past', e.message); return null; }),
  ]);
  const value = { streams: normStreams(rows), upcoming: (up || []).filter(mine), past: (past || []).filter(mine), failed: !up || !past };
  shared = { at: Date.now(), value };
  return value;
}

export async function loadMeditationHub({ email, admin = false, as = '', uid = '', now = Date.now() }) {
  if (!headlessConfigured()) { const e = new Error('The hub is being set up'); e.status = 503; throw e; }
  const unavailable = [];
  const settle = async (name, fn, fallback) => { try { return await fn(); } catch (e) { unavailable.push(e.status === 429 ? `${name} (Circle is busy)` : name); return fallback; } };

  const tier = await tierFor(email).catch(() => ({ tier: 'none' }));
  const pass = !!tier.meditation || (OPEN[tier.tier] || []).includes('mondays');
  const wisdom = (OPEN[tier.tier] || []).includes('wisdom');
  // Someone without the Pass may still hold a one-week drop-in: their access to the live space is the only sign
  const spaces = pass ? [] : await settle('spaces', () => joinedSpaces(email), []);
  const joinedLive = spaces.some(s => String(s.id) === String(cfg.circle.live_space_id));
  let plan = planOf({ pass, joinedLive });
  if (admin && PLANS.includes(as)) plan = as; // an admin can preview the other plans

  const [ops, rawEvents, rawSections] = await Promise.all([
    settle('the schedule', loadMmOps, { streams: normStreams(streamSeed), upcoming: [], past: [] }),
    settle('live sessions', () => weekEvents(email), []),
    plan === 'pass' ? settle('replays', () => courseSections(email, cfg.circle.course_space_id, TTL), null) : null,
  ]);
  if (ops.failed) unavailable.push('the schedule');

  const feed = plan === 'pass' && uid && process.env.MEMBER_SECRET ? `https://www.embodiedphilosophy.com/api/member/schedule/ics?t=${feedToken({ uid, email, tier: 'meditation' })}` : '';
  const hub = buildMeditationHub({ cfg, plan, viaWisdom: plan === 'pass' && wisdom, streams: ops.streams, rawEvents, opsUpcoming: ops.upcoming, opsPast: ops.past,
    rawSections, now, feed, admin });
  return { ...hub, unavailable };
}
