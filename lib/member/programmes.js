// The "Your enrolment" half of Today: one live card per programme the member is in, and a quiet locked card for
// each they aren't (linking to that programme's preview page). Which programmes open for which membership is
// OPEN below; the cards' "what's next" lines come from the schedule, the CE tracker and the formation record.
import meditation from '../../data/meditation-pass.json';
import { buildSchedule, oneToOnes, parseTime, zonedToUtc, kindOf, LIVE_LINKS } from './schedule';

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

// ---- "The week ahead" on Today: every event in the next seven days, for everyone. Each is tagged with its programme;
// one the member's membership doesn't open is locked and links to its landing page (the event's own enrol link from
// the events sheet, else the programme's preview page). Open-to-everyone events are never locked.
const addDay = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export function programmeOf(e) {
  const p = String(e.program || '').toLowerCase(), s = String(e.series || '').toLowerCase();
  if (s === 'meditation-mondays') return 'mondays';
  if (p === 'sadhana') return 'ss';
  if (p === 'wisdom') return 'wisdom';
  return p || 'event'; // seasonal sādhanas, workshops, courses: bought on their own
}
const PROG_NAME = { mondays: 'Meditation Mondays', ss: 'Sādhana School', wisdom: 'Wisdom School', seasonal: 'Seasonal sādhana', open: 'Open to everyone' };
const MIN = { session: 150, immersion: 180, orientation: 90, meditation: 60, event: 90 };
export function weekAhead(events, tier, today, n = 7) {
  const last = addDay(today, n - 1), open = OPEN[tier] || [];
  const out = (events || []).filter(e => /^\d{4}-\d{2}-\d{2}$/.test(e.date || '') && e.date <= last && (e.end_date || e.date) >= today).map(e => {
    const key = OPEN_TO_ALL.test(e.title || '') ? 'open' : programmeOf(e);
    const locked = key !== 'open' && !open.includes(key);
    const lp = e.registration_url || e.url || (LOCKED[key] ? `${SITE}/programmes/${LOCKED[key].slug}/preview` : `${SITE}/events`);
    const t = parseTime(e.time), multi = e.end_date && e.end_date !== e.date;
    const item = { id: e.id || `${e.date}-${e.title}`, key, programme: PROG_NAME[key] || 'Event', title: e.title || 'Event', date: e.date, end_date: multi ? e.end_date : null, locked,
      href: locked ? lp : key === 'mondays' ? meditation.live_url : key === 'ss' ? (LIVE_LINKS.sadhana || '/c/schedule') : key === 'wisdom' ? '/c/wisdom-school' : lp };
    if (t && !multi) { const st = zonedToUtc(e.date, t.h, t.m, t.zone); item.start = st.toISOString(); item.end = new Date(st.getTime() + (MIN[kindOf(e)] || 90) * 60000).toISOString(); }
    else if (t) { // a multi-day event that meets at the same time each day: that start on each day of the week
      item.starts = {};
      for (let d = e.date < today ? today : e.date; d <= e.end_date && d <= last; d = addDay(d, 1)) item.starts[d] = zonedToUtc(d, t.h, t.m, t.zone).toISOString();
    }
    return item;
  });
  if (tier === 'mentee') out.push(...oneToOnes(today, 2).filter(o => o.date <= last).map(o => ({ id: o.id, key: 'mentor', programme: 'Sahṛdaya Upāya', title: o.title, date: o.date, end_date: o.end_date, locked: false, href: o.book || '/c/this-week' })));
  return out.sort((a, b) => (a.start || a.date + 'T00').localeCompare(b.start || b.date + 'T00'));
}

// ---- The Schedule page (/c/schedule): every upcoming session from every programme, for everyone. Each is tagged
// with its programme; one the member's membership doesn't open is locked, has no Join link, and points to its enrol
// link from the events sheet (else the programme's preview page). The private calendar feed stays the member's own.
export function fullSchedule(events, tier, today) {
  const open = OPEN[tier] || [];
  const items = buildSchedule(events, 'none', today).map(i => {
    const key = OPEN_TO_ALL.test(i.title || '') ? 'open' : programmeOf(i);
    const locked = key !== 'open' && !open.includes(key);
    const enrol = i.url || (LOCKED[key] ? `${SITE}/programmes/${LOCKED[key].slug}/preview` : `${SITE}/events`);
    const live = locked ? '' : key === 'mondays' ? meditation.live_url : key === 'wisdom' ? '/c/wisdom-school' : i.live;
    return { ...i, key, programme: PROG_NAME[key] || 'Event', locked, live, url: locked ? enrol : i.url };
  });
  if (tier === 'mentee') items.push(...oneToOnes(today).map(o => ({ ...o, key: 'mentor', programme: 'Sahṛdaya Upāya', locked: false })));
  return items.sort((a, b) => (a.start || a.date + 'T00').localeCompare(b.start || b.date + 'T00'));
}

// Pure: the live cards, worded as in the design. next: a session (shown in the member's own time zone by the page).
// ctx: { events, tier, today, ce (CE summary or null), formation (or null) }
export function openCards({ events, tier, today, ce = null, formation = null, due = null }) {
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
      const hours = formation ? `Formation: ${Math.round(formation.total * 100) / 100} of ${formation.target} hours` : '';
      const dueLine = due == null ? '' : due === 0 ? 'nothing due this week' : `${due} ${due === 1 ? 'thing' : 'things'} due this week`;
      cards.push({ key: k, title: 'Sahṛdaya Upāya', tag: 'Mentorship',
        nextLine: win ? (win.book ? `${month} one-to-one · book a time ${day(win.date)}–${day(win.end_date)} ${month}` : `${month} one-to-one · booking opens nearer the time`) : '',
        sub: [hours, dueLine].filter(Boolean).join(' · ') + (hours || dueLine ? '.' : ''),
        primary: win?.book ? { label: 'Book a time', href: win.book, external: true } : { label: 'This week', href: '/c/this-week' }, links: [{ label: 'Formation record', href: '/c/this-week' }, { label: due ? 'Due this week' : 'This week', href: '/c/this-week' }] });
    }
  }
  return cards;
}
