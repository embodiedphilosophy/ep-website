import { dates, cookies, campaign } from './cyber-2026';

// The page state, resolved on the server from the real clock (all deadlines are US Eastern instants in cyber-2026.js).
export const STATES = ['prelaunch', 'early', 'live', 'libraryOnly', 'evergreen'];
const t = s => Date.parse(s);

export function resolveState(now, hasMemberAccess) {
  if (now < t(dates.earlyAccessOpens)) return 'prelaunch';
  if (now < t(dates.publicLaunch)) return hasMemberAccess ? 'early' : 'prelaunch';
  if (now < t(dates.plusAndArchiveClose)) return 'live';
  if (now < t(dates.openLibraryClose)) return 'libraryOnly';
  return 'evergreen';
}

// ?preview=<state> forces a state, but only on preview deployments or with a matching PREVIEW_TOKEN (?token=...).
export function previewAllowed(params) {
  if (process.env.VERCEL_ENV !== 'production' && process.env.NODE_ENV !== 'production') return true;
  if (process.env.VERCEL_ENV === 'preview') return true;
  const tok = process.env.PREVIEW_TOKEN;
  return !!tok && params.token === tok;
}

const first = v => (Array.isArray(v) ? v[0] : v);

// Reads the request: state, whether the visitor came through the members' link, whether to show the upgrade strip.
export function readRequest(params, jar) {
  const access = first(params.access) === 'members' || jar.get(cookies.access)?.value === 'members';
  const member = first(params.member) === 'ws' || jar.get(cookies.member)?.value === 'ws';
  const forced = first(params.preview);
  const allowed = STATES.includes(forced) && previewAllowed({ token: first(params.token) });
  const now = Date.now();
  const state = allowed ? forced : campaign.forceState || resolveState(now, access);
  return { state, now, member, access, forced: allowed };
}

// Time left, split for display. Never negative.
export function remaining(target, now) {
  const ms = Math.max(0, t(target) - now);
  const mins = Math.floor(ms / 60000);
  return { ms, d: Math.floor(mins / 1440), h: Math.floor((mins % 1440) / 60), m: mins % 60 };
}
