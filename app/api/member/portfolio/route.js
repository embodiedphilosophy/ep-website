import { NextResponse } from 'next/server';
import { sessionFrom, cors } from '@/lib/member/session';
import { cleanToday } from '@/lib/member/practice';
import { mentees } from '@/lib/member/cohort';
import {
  portfolioAvailable, portfolioView, saveDaily, saveWeekly, sharedPages, addDays, PORTFOLIO_TIERS,
} from '@/lib/member/portfolio';

// The Practice Portfolio (Circle page /c/portfolio). Needs the session from /api/member/session.
//   GET  ?today=YYYY-MM-DD&day=YYYY-MM-DD   → that day's entry, its week, the weekly reflection, past pages
//   GET  ?shared=1                          → (Circle admins) pages mentees chose to share, last 60 days
//   POST { today, day, kind: 'day'|'week', data, shared } → saves, returns the refreshed view
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const fail = (h, msg, status) => NextResponse.json({ error: msg }, { status, headers: h });
const allowed = s => s.admin || PORTFOLIO_TIERS.includes(s.tier);

export async function GET(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return fail(h, 'Please sign in again', 401);
  if (!portfolioAvailable()) return fail(h, 'The Practice Portfolio isn’t connected yet', 503);
  const q = new URL(req.url).searchParams;
  const today = cleanToday(q.get('today'));
  try {
    if (q.get('shared')) {
      if (!s.admin) return fail(h, 'Only mentors can see shared pages', 403);
      const [pages, list] = await Promise.all([sharedPages(addDays(today, -60)), mentees().catch(() => [])]);
      const names = Object.fromEntries(list.map(m => [String(m.email).toLowerCase(), m.name]));
      return NextResponse.json({ pages: pages.map(p => ({ ...p, name: names[p.email] || p.email })) }, { headers: h });
    }
    if (!allowed(s)) return fail(h, 'The Practice Portfolio is part of Sādhana School', 403);
    const day = DAY.test(q.get('day') || '') && q.get('day') <= today ? q.get('day') : today;
    return NextResponse.json(await portfolioView(s, day, today), { headers: h });
  } catch (e) {
    console.error('portfolio GET', e.message);
    return fail(h, 'Couldn’t load your portfolio just now', 502);
  }
}

export async function POST(req) {
  const h = cors(req);
  const s = sessionFrom(req);
  if (!s) return fail(h, 'Please sign in again', 401);
  if (!portfolioAvailable()) return fail(h, 'The Practice Portfolio isn’t connected yet', 503);
  if (!allowed(s)) return fail(h, 'The Practice Portfolio is part of Sādhana School', 403);
  const b = await req.json().catch(() => ({}));
  const today = cleanToday(b.today);
  const day = DAY.test(b.day || '') ? b.day : today;
  try {
    if (b.kind === 'week') await saveWeekly(s, day, today, b.data, b.shared);
    else await saveDaily(s, day, today, b.data, b.shared);
    return NextResponse.json(await portfolioView(s, day, today), { headers: h });
  } catch (e) {
    if (e.status === 400) return fail(h, e.message, 400);
    console.error('portfolio POST', e.message);
    return fail(h, 'Couldn’t save just now. Your words are still on the page; try again in a moment.', 502);
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}
