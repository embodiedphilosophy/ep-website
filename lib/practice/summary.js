// Everything the Practice page needs in one object. Sit stats are for everyone; the readings, prompt and diary are
// built only when the viewer is in Sādhana School (the server never sends them to anyone else).
import { practiceAvailable, practiceSummary, QUALITIES, EXTRAS } from '../member/practice';
import { readTab } from '../mentee/content';
import { neon } from '@neondatabase/serverless';
import { WEEKLY_TAB, readingsOf, weekPlan } from './readings';
import * as store from './store';

// Sits and practice hours so far in the season, from the practice log (member_practice). Hours = minutes ÷ 60.
export async function seasonSits(run, uid, from, to) {
  const [r] = await run`SELECT count(*)::int AS sits, COALESCE(sum(minutes), 0)::int AS minutes FROM member_practice WHERE uid = ${uid} AND day >= ${from} AND day <= ${to}`;
  return { sits: r.sits, hours: Math.round(r.minutes / 6) / 10 };
}
let testRun = null;
export function _setRun(fn) { testRun = fn; } // tests only
const run = () => testRun || neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

export async function practiceView({ uid, access, today }) {
  const { isSS, season, week } = access;
  const sit = practiceAvailable() ? await practiceSummary(uid, today).catch(() => null) : null;
  const base = { isSS, today, season: season ? { slug: season.slug, title: season.title, short: season.short, subtitle: season.subtitle, hubSlug: season.circle_slug } : null, week,
    sit: sit && { ...sit, qualities: QUALITIES, extras: EXTRAS }, join: { enrol: season?.enrol_url || '', landing: 'https://www.embodiedphilosophy.com/sadhana-school' } };
  const totals = season && practiceAvailable() ? await seasonSits(run(), uid, season.starts_on, today > (season.ends_on || today) ? season.ends_on : today).catch(() => null) : null;
  if (!isSS) return { ...base, totals: totals && { sits: totals.sits, hours: totals.hours } };

  const rows = await readTab(WEEKLY_TAB);
  const plan = weekPlan(rows, season.slug, today, week);
  const [read, draft, entries, diaryCount] = await Promise.all([
    store.readIds(uid), store.getDraft(uid), store.listEntries(uid, 20), store.entryCount(uid, season.slug),
  ]);
  const all = readingsOf(rows, season.slug);
  const readings = plan ? plan.readings.map(r => ({ ...r, read: read.has(r.id) })) : [];
  return {
    ...base,
    plan: plan ? { week: plan.week, readings, done: readings.filter(r => r.read).length, prompt: plan.prompt } : null,
    draft, entries,
    totals: { ...(totals || { sits: 0, hours: 0 }), readingsDone: all.filter(r => read.has(r.id)).length, readingsTotal: all.length, diary: diaryCount },
    sharing: process.env.PRACTICE_POST === 'live',
  };
}
