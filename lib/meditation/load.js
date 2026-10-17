// "My Practice", the Meditation Pass homepage (public/circle/my-practice.js): the member's streak and the next live
// Meditation Monday. Both are read on their own, so one being unavailable leaves the other showing.
import { getEvents, todayET } from '../events';
import { buildSchedule } from '../member/schedule';
import { practiceAvailable, practiceSummary, cleanToday } from '../member/practice';
import config from '@/data/meditation-pass.json';

// The next live session that hasn't finished (a session counts as on until 30 minutes past its end)
export function nextLive(items, now = Date.now()) {
  const i = (items || []).filter(x => x.start && (Date.parse(x.end || x.start) || 0) + 30 * 60000 >= now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  return i ? { title: config.live_title, start: i.start, end: i.end || '' } : null;
}

export async function loadPractice(me, { today: asked } = {}) {
  const today = cleanToday(asked || todayET());
  const unavailable = [];
  const [practice, events] = await Promise.all([
    practiceAvailable() ? practiceSummary(me.uid, today).catch(e => { console.error('my-practice practice', e.message); unavailable.push('practice'); return null; }) : (unavailable.push('practice'), null),
    getEvents().catch(e => { console.error('my-practice events', e.message); unavailable.push('sessions'); return []; }),
  ]);
  const { circle, live_title, ...links } = config; // eslint-disable-line no-unused-vars
  return {
    ok: true, today, firstName: me.firstName,
    practice: practice ? { streak: practice.streak, loggedToday: practice.loggedToday, weekCount: practice.weekCount } : { streak: 0, loggedToday: false, weekCount: 0 },
    next: nextLive(buildSchedule(events, 'meditation', today)),
    links, unavailable,
  };
}
