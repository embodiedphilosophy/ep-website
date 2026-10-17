// The "Your enrolment" half of Today: one live card per programme the member is in, and a quiet locked card for
// each they aren't (linking to that programme's preview page). Which programmes open for which membership is
// OPEN below; the cards' "what's next" lines come from the schedule, the CE tracker and the formation record.
import meditation from '../../data/meditation-pass.json';
import { buildSchedule, oneToOnes } from './schedule';

const SITE = 'https://www.embodiedphilosophy.com';
export const KEYS = ['mondays', 'wisdom', 'ce', 'ss', 'mentor'];

// Annual Sādhana School includes Wisdom School and Meditation Mondays, not Plus (CE). A single season doesn't
// include Meditation Mondays. Sahṛdaya Upāya is shown (locked) only to the annual year, the only people who can join it.
export const OPEN = {
  none: [], course: [],
  meditation: ['mondays'],
  wisdom: ['mondays', 'wisdom'],
  wisdom_plus: ['mondays', 'wisdom', 'ce'],
  ss_season: ['ss'],
  ss_year: ['mondays', 'wisdom', 'ss'],
  mentee: ['mondays', 'wisdom', 'ss', 'mentor'],
};
export function programmesFor(tier) {
  const open = OPEN[tier] || [];
  const locked = KEYS.filter(k => !open.includes(k) && (k !== 'mentor' || tier === 'ss_year'));
  return { open, locked };
}

// What each locked card says: one line about it, and what opens it. Links go to the lock-screen preview pages.
export const LOCKED = {
  mondays: { title: 'Meditation Mondays', line: 'A live sit with EP faculty every Monday.', opens: 'the Meditation Pass', slug: 'meditation-mondays' },
  wisdom: { title: 'Wisdom School', line: 'The Pilgrimage Project, monthly lectures and a learning pathway.', opens: 'Wisdom School', slug: 'wisdom-school' },
  ce: { title: 'CE hours', line: 'Every pathway, the certificates and your CE hours.', opens: 'Wisdom School Plus', slug: 'wisdom-school' },
  ss: { title: 'Sādhana School', line: 'Live Wednesday sessions, a cohort, the Portfolio and Sourcebook.', opens: 'Sādhana School', slug: 'sadhana-school' },
  mentor: { title: 'Sahṛdaya Upāya', line: 'The 100-hour teacher formation, with a monthly one-to-one.', opens: 'Sahṛdaya Upāya (annual students)', slug: 'sahrdaya-upaya' },
};
export const lockedCard = k => ({ key: k, title: LOCKED[k].title, line: LOCKED[k].line, opens: LOCKED[k].opens, href: `${SITE}/programmes/${LOCKED[k].slug}/preview` });

// Events anyone can come to, shown on Today to everyone
const OPEN_TO_ALL = /living room lecture|chitheads live/i;
const slim = i => ({ id: i.id, title: i.title, label: i.label, start: i.start || null, end: i.end || null, date: i.date, end_date: i.end_date, time: i.time, allDay: !!i.allDay, book: i.book || '', live: i.live || '' });

// Pure: the right-hand "Coming up" list: the member's own sessions, then open-to-everyone events
export function comingUp(events, tier, today, n = 4) {
  const all = (tier === 'none' || tier === 'course') ? [] : buildSchedule(events, tier, today);
  const mine = all.filter(i => i.kind !== 'one').slice(0, n - 1).concat(all.filter(i => i.kind === 'one').slice(0, 1));
  const ids = new Set(mine.map(i => i.id));
  const open = buildSchedule(events, 'none', today).filter(i => OPEN_TO_ALL.test(i.title) && !ids.has(i.id)).map(i => ({ ...i, open: true }));
  return [...mine, ...open.slice(0, 2)].sort((a, b) => (a.start || a.date + 'T00').localeCompare(b.start || b.date + 'T00')).slice(0, n + 1).map(i => ({ ...slim(i), open: !!i.open }));
}

// Pure: the live cards, worded as in the design. next: a session (shown in the member's own time zone by the page).
// ctx: { events, tier, today, ce (CE summary or null), formation (or null) }
export function openCards({ events, tier, today, ce = null, formation = null }) {
  const { open } = programmesFor(tier);
  const cards = [];
  for (const k of open) {
    if (k === 'mondays') {
      const next = buildSchedule(events, 'meditation', today).find(i => i.kind === 'meditation');
      cards.push({ key: k, title: 'Meditation Mondays', tag: 'Meditation Pass', next: next ? slim(next) : null, nextLine: next ? '' : 'Every Monday · 12:00 ET',
        sub: 'A live sit with EP faculty.', primary: { label: 'Join on Monday', liveLabel: 'Join now', href: meditation.live_url, live: true }, links: [{ label: 'Past sits', href: meditation.replays_url }] });
    } else if (k === 'wisdom') {
      cards.push({ key: k, title: 'Wisdom School', tag: 'The Pilgrimage Project', nextLine: meditation.pathway_title,
        sub: 'This year’s project, the monthly lecture and a learning pathway.', primary: { label: 'Continue the pathway', href: meditation.pathway_url }, links: [{ label: 'All of Wisdom School', href: meditation.path_url }] });
    } else if (k === 'ce') {
      const c = ce?.cycle;
      cards.push({ key: k, title: 'CE hours', tag: 'Wisdom School Plus', nextLine: c ? `${c.hours} of ${c.need} hours this Yoga Alliance cycle` : 'Your continuing-education hours',
        sub: 'Every pathway, four certificate programmes, certificates to download.', primary: { label: 'See your CE hours', href: '/c/ce-credits' }, links: [{ label: 'All pathways', href: meditation.path_url }] });
    } else if (k === 'ss') {
      const next = buildSchedule(events, 'ss_year', today).find(i => i.kind === 'session' || i.kind === 'immersion');
      cards.push({ key: k, title: 'Sādhana School', tag: tier === 'ss_season' ? 'Your season' : 'The Path of Recognition', next: next ? slim(next) : null, nextLine: next ? '' : 'Your next session will appear here',
        sub: next ? next.title : 'Live sessions, recordings and readings.', primary: { label: 'Schedule', href: '/c/schedule' },
        links: [{ label: 'Practice Portfolio', href: '/c/portfolio' }, { label: 'Recordings', href: '/c/fall-recordings-readings' }, { label: 'Open Sādhana School', href: '/school/sadhana-school' }] });
    } else if (k === 'mentor') {
      const win = oneToOnes(today, 1)[0];
      const day = d => String(Number(d.slice(8)));
      const month = win ? new Date(win.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }) : '';
      cards.push({ key: k, title: 'Sahṛdaya Upāya', tag: 'Mentorship',
        nextLine: win ? (win.book ? `${month} one-to-one · book a time ${day(win.date)}–${day(win.end_date)} ${month}` : `${month} one-to-one · booking opens nearer the time`) : '',
        sub: formation ? `Formation: ${Math.round(formation.total * 100) / 100} of ${formation.target} hours.` : '',
        primary: win?.book ? { label: 'Book a time', href: win.book, external: true } : { label: 'This week', href: '/c/this-week' }, links: [{ label: 'Formation record', href: '/c/this-week' }, { label: 'This week', href: '/c/this-week' }] });
    }
  }
  return cards;
}
