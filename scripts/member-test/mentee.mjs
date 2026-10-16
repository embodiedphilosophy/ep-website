// Offline checks for the Sahṛdaya Upāya "This week" page: week numbering, mālā, sheet shaping, the week builder.
// No network, no database. Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee.mjs
import assert from 'assert/strict';
const C = await import('../../lib/mentee/content.js');
const W = await import('../../lib/mentee/week.js');
const { summarise } = await import('../../lib/member/practice.js');

// Week 1 is the week holding Session 1 (Wed 21 Oct 2026) and stays Week 1 until then
assert.equal(W.weekNumber('2026-10-21', '2026-10-16'), 1);
assert.equal(W.weekNumber('2026-10-21', '2026-10-19'), 1);
assert.equal(W.weekNumber('2026-10-21', '2026-10-25'), 1);
assert.equal(W.weekNumber('2026-10-21', '2026-10-26'), 2);
assert.equal(W.weekNumber('2026-10-21', '2026-12-09'), 8);
assert.deepEqual(W.weekDays('2026-10-16')[0], '2026-10-12'); assert.equal(W.weekDays('2026-10-25')[6], '2026-10-25');

// Mālā
assert.deepEqual(W.mala(0), { days: 0, filled: 0, round: 0, next: 7 });
assert.equal(W.mala(39).next, 40); assert.equal(W.mala(108).filled, 108); assert.equal(W.mala(109).filled, 1); assert.equal(W.mala(109).round, 2);

// Time zones: a 2 pm BST session is the same day in London; for Sydney it is the next morning
assert.equal(W.dayIn('2026-10-21T13:00:00Z', 'Europe/London'), '2026-10-21');
assert.equal(W.dayIn('2026-10-21T13:00:00Z', 'Australia/Sydney'), '2026-10-22');
assert.equal(W.validZone('Europe/London'), true); assert.equal(W.validZone('Not/AZone'), false);

// Sheet shaping
const readings = [{ season: 'Fall-2026', week: '1', sanskrit: 'चितिः स्वतन्त्रा', translation: 'Consciousness is free', citation: 'PH 1', reading_url: 'https://ss/x', workbook_url: '', publish: '' }, { season: 'fall-2026', week: '2', sanskrit: 'x', publish: 'FALSE' }];
assert.equal(C.readingFor(readings, 'fall-2026', 1).citation, 'PH 1'); assert.equal(C.readingFor(readings, 'fall-2026', 2), null, 'hidden row');
const rows = [
  { season: 'fall-2026', week: '1', title: 'Read PH 1', where: 'Circle · Readings', url: 'https://ss/r', due: '2026-10-28', audience: 'all' },
  { season: 'fall-2026', week: '1', title: 'Reflection', audience: 'Mentees only', due: 'soon' },
  { season: 'fall-2026', week: '1', title: 'Other tier only', audience: 'Wisdom School' },
  { season: 'fall-2026', week: '2', title: 'Next week', audience: '' },
];
const a = C.assignmentsFor(rows, 'fall-2026', 1);
assert.deepEqual(a.map(x => x.title), ['Read PH 1', 'Reflection']); assert.equal(a[1].due, '', 'a bad date is dropped');
assert.equal(a[0].id, C.assignmentId('Fall-2026', 1, 'read ph 1'), 'id ignores case');
assert.match(a[0].id, /^a[0-9a-f]{12}$/);
const fb = [{ email: 'Maya@x.com', date: '2026-10-19', notes: 'Lovely' }, { email: 'sam@x.com', date: '2026-10-19', notes: 'Not hers' }, { email: 'maya@x.com', date: '2026-10-26', notes: 'Newer' }];
assert.deepEqual(C.feedbackFor(fb, 'maya@x.com').map(f => f.notes), ['Newer', 'Lovely'], 'only her own notes, newest first');
const launches = [{ title: 'Winter', date: '2026-11-01', audience: 'Sahṛdaya Upāya, Sādhana' }, { title: 'Past', date: '2026-09-01' }, { title: 'Not for us', date: '2026-12-01', audience: 'Meditation Mondays' }, { title: 'Soon', date: 'January' }];
assert.deepEqual(C.launchesFor(launches, '2026-10-16').map(l => l.title), ['Winter', 'Soon']);

// The week builder
const season = { title: 'Fall · The Heart of Recognition', starts_on: '2026-10-21' };
const practice = summarise(['2026-10-18', '2026-10-19', '2026-10-20'], '2026-10-21');
const sessions = [{ id: '1', title: 'Session 1', start: '2026-10-21T13:00:00.000Z', end: '2026-10-21T15:30:00.000Z', url: 'https://ss/s1', rsvped: false }];
const schedule = [
  { kind: 'session', title: 'Wednesday session (sheet copy)', date: '2026-10-21', start: '2026-10-21T13:00:00.000Z' },
  { kind: 'immersion', title: 'Weekend immersion', date: '2026-10-24', end_date: '2026-10-25', allDay: true },
  { kind: 'one', title: 'October one-to-one', date: '2026-10-25', end_date: '2026-10-31', book: 'https://calendly/x' },
];
const w = W.buildWeek({ today: '2026-10-21', tz: 'Europe/London', now: Date.parse('2026-10-21T08:00:00Z'), season, firstName: 'Asha', practice, practiceDays: 3, sessions, schedule,
  assignments: a, doneIds: new Set([a[0].id]), formation: { total: 5, target: 100, components: [{ type: 'Live contact', credited: 3 }, { type: 'Live contact', credited: 1.5 }, { type: 'Self-directed', credited: 0.5 }], entries: [] } });
assert.equal(w.greeting.week, 1); assert.equal(w.greeting.seasonTitle, 'The Heart of Recognition'); assert.equal(w.greeting.firstName, 'Asha');
assert.equal(w.practice.streak, 3, 'Sun–Tue, today not yet logged'); assert.equal(w.mala.filled, 3); assert.equal(w.nextLive.title, 'Session 1');
assert.deepEqual([w.due.done, w.due.total], [1, 2]);
assert.equal(w.week.length, 7); assert.equal(w.week[0].day, '2026-10-19'); assert.equal(w.week[1].dot, 'done'); assert.equal(w.week[2].dot, 'today'); assert.equal(w.week[3].dot, 'future');
const wed = w.week.find(d => d.day === '2026-10-21'); assert.deepEqual(wed.items.map(i => i.title), ['Session 1'], 'a session Circle already lists is not shown twice');
assert.equal(w.week.find(d => d.day === '2026-10-24').items[0].title, 'Weekend immersion');
assert.equal(w.oneToOne.url, 'https://calendly/x'); assert.equal(w.oneToOne.from, '2026-10-25');
assert.deepEqual(w.formation.byType, [{ type: 'Live contact', hours: 4.5 }, { type: 'Self-directed', hours: 0.5 }]);
// With Circle unreachable the sheet's own session shows instead, and nothing throws
const w2 = W.buildWeek({ today: '2026-10-21', tz: 'Europe/London', season, practice, practiceDays: 0, sessions: [], schedule, assignments: [], doneIds: new Set(), unavailable: ['sessions'] });
assert.equal(w2.week.find(d => d.day === '2026-10-21').items[0].title, 'Wednesday session (sheet copy)'); assert.equal(w2.nextLive, null); assert.equal(w2.due.total, 0);
console.log('mentee: ok');
