// Checks the Wisdom School hub rules (lib/hub/wisdom.js) with synthetic Circle data and the real config and seed files. No network.
//   node scripts/ops-test/wisdom-hub.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildWisdomHub, planOf, themeOf, questionOf, normSection, currentMonth, progressOf, tabKey, TABS } from '../../lib/hub/wisdom.js';

const read = f => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url)));
const cfg = read('ws-hub.json'), seed = read('ws-pathways.json');
const C = cfg.circle;
const now = Date.parse('2026-10-23T14:00:00Z'), today = '2026-10-23';

// ---- plan from the member's Kit tags / tier ----
assert.equal(planOf({ tier: 'wisdom_plus', wisdom: true, wisdomPlus: true }), 'plus');
assert.equal(planOf({ tier: 'ss_year', wisdom: false, wisdomPlus: true }), 'plus', 'a Sādhana School year student who also has Plus is Plus');
assert.equal(planOf({ tier: 'wisdom', wisdom: true }), 'ws');
assert.equal(planOf({ tier: 'ss_year' }), 'ws', 'the Sādhana School year includes Wisdom School');
assert.equal(planOf({ tier: 'mentee' }), 'ws');
assert.equal(planOf({ tier: 'meditation', meditation: true }), 'none');
assert.equal(planOf({ tier: 'ss_season' }), 'none', 'a single season does not include Wisdom School');
assert.equal(planOf(null), 'none');

// ---- naming ----
assert.equal(themeOf('October · The Return with Wisdom', 'October'), 'The Return with Wisdom');
assert.equal(themeOf('Tantric Buddhism: Inner and Outer Pilgrimage', 'September'), 'Tantric Buddhism: Inner and Outer Pilgrimage', "Circle's names as they stand");
assert.equal(themeOf('September: Tantric Buddhism', 'September'), 'Tantric Buddhism');
assert.equal(questionOf('  \n\nWhat are you carrying home?\nSecond paragraph'), 'What are you carrying home?');
assert.equal(questionOf(''), null);
assert.equal(currentMonth('2026-10-23', 2026), 10); assert.equal(currentMonth('2025-12-31', 2026), 0); assert.equal(currentMonth('2027-01-02', 2026), 13);
assert.equal(tabKey('pathways'), 'pathways'); assert.equal(tabKey('nope'), 'month'); assert.equal(TABS.length, 7);

// ---- synthetic Circle ----
const lesson = (id, name, extra = {}) => ({ id, name, url: `https://ss.example/lessons/${id}`, status: 'incomplete', created_at: '2026-10-01T10:00:00Z', ...extra });
const names = ['The Call to Depth', 'Refusal and Resistance', 'Crossing the Threshold', 'The Descent', 'The Abyss', 'Return of the Light', 'The Companion', 'The Gift', 'Tantric Buddhism: Inner and Outer Pilgrimage', 'The Return with Wisdom', 'Gratitude', 'Rest'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const rawYear = C.month_sections.map((id, k) => ({
  id, name: k === 8 ? names[k] : `${MONTHS[k]} · ${names[k]}`,
  lessons: k >= 10 ? [] : [lesson(id * 10, `${MONTHS[k]} lecture`, { status: k < 9 ? 'complete' : 'incomplete', ...(k === 9 ? { body: '<p>What are you carrying home from the road?</p><p>Longer note.</p>', created_at: '2026-10-20T10:00:00Z' } : {}) })],
}));
rawYear.push({ id: C.book_club_section_id, name: 'Book club', lessons: [lesson(1, 'Q1 · The Pilgrim’s Way', { created_at: '2026-01-10T00:00:00Z' }), lesson(2, 'Pilgrimage: Past and Present in the World Religions', { created_at: '2026-10-15T00:00:00Z' })] });
rawYear.push({ id: C.hellenism_section_id, name: 'Hellenism & Neoplatonism', lessons: [lesson(31, 'One', { status: 'complete' }), lesson(32, 'Two', { status: 'complete' }), lesson(33, 'Three'), lesson(34, 'Four')] });
const yearSections = rawYear.map(normSection);
const ev = (id, name, space, startsAt, mins = 60, { host = 'Floss Harry', ...extra } = {}) => ({ id, name, space_id: space, starts_at: startsAt, ends_at: new Date(Date.parse(startsAt) + mins * 60000).toISOString(), host: { name: host }, ...extra });
const rawEvents = [
  ev(1, 'Meditation Monday: Somatic', C.meditation_space_id, '2026-10-26T16:00:00Z', 45),   // Mon 26 Oct, 12pm EDT
  ev(2, 'The Circle Reopens', C.live_space_id, '2026-11-03T23:00:00Z', 90, { host: 'Jacob Kyle' }), // Tue 3 Nov, 6pm EST
  ev(3, 'Meditation Monday: Metta', C.meditation_space_id, '2026-11-02T17:00:00Z', 45),
  ev(4, 'Autumn workshop', C.live_space_id, '2026-11-14T15:00:00Z', 150),
  ev(5, 'Book club meet-up', C.live_space_id, '2026-12-05T17:00:00Z', 60),
  ev(6, 'Meditation Monday: Mystical', C.meditation_space_id, '2026-10-19T16:00:00Z', 45, { replay_url: 'https://ss.example/replay/6' }), // last week: a replay
  ev(7, 'Somebody else’s event', 12345, '2026-10-24T16:00:00Z'),
];
const announcements = [{ id: 1, name: 'The Circle Reopens: details', created_at: '2026-10-22T10:00:00Z' }, { id: 2, name: 'Old news', created_at: '2026-08-01T10:00:00Z' }];
const urls = Object.fromEntries([C.year_course_id, C.starter_course_id, 2897811, 2897812, 2897813, 2897814, 2897815, 2900101, 2900102, 2900103, 2900104, C.meditation_space_id, C.announcements_space_id].map(i => [String(i), `https://ss.example/c/${i}`]));
const course = (n, done) => [{ id: 'x', name: 'S', lessons: Array.from({ length: n }, (_, i) => normSection({ id: 's', lessons: [lesson(500 + i, `L${i}`, { status: i < done ? 'complete' : 'incomplete' })] }).lessons[0]) }];
const courses = { [C.starter_course_id]: course(4, 2), 2897811: course(10, 0), 2897812: course(5, 5) };
const certCourses = { 2900101: course(6, 1) };
const ceSummary = { certifiedHours: 33.5, cycle: { hours: 20, need: 30, met: false } };
const view = (plan, extra = {}) => buildWisdomHub({ cfg, plan, rows: seed, yearSections, courses, certCourses, bookSection: yearSections.find(s => s.id === String(C.book_club_section_id)), rawEvents, announcements, urls, ceSummary: plan === 'plus' ? ceSummary : null, seen: {}, today, now, ...extra });

// ---- October is the current month, theme from Circle's section name, question from the first lesson ----
const ws = view('ws'), plus = view('plus'), none = view('none');
assert.equal(ws.month.name, 'October'); assert.equal(ws.month.index, 10); assert.equal(ws.month.of, 12);
assert.equal(ws.month.theme, 'The Return with Wisdom');
assert.equal(ws.month.question, 'What are you carrying home from the road?');
assert.ok(ws.month.lessonUrl.endsWith('/lessons/12129220'));
assert.deepEqual(ws.months.map(m => m.state), ['past', 'past', 'past', 'past', 'past', 'past', 'past', 'past', 'past', 'current', 'future', 'future']);
assert.equal(ws.months[8].theme, 'Tantric Buddhism: Inner and Outer Pilgrimage');
assert.equal(ws.months[10].url, null, 'a future month has no link'); assert.equal(ws.months[0].url?.endsWith('/lessons/12129120'), true);
assert.ok(ws.comingNext.includes('The Attention Project'));

// ---- a month with no lesson: theme and "recording coming", no link ----
const nov = buildWisdomHub({ cfg, plan: 'ws', rows: seed, yearSections, courses, rawEvents, urls, seen: {}, today: '2026-11-04', now: Date.parse('2026-11-04T14:00:00Z') });
assert.equal(nov.month.name, 'November'); assert.equal(nov.month.theme, 'Gratitude'); assert.equal(nov.month.lessonUrl, null); assert.equal(nov.month.hasLesson, false);
assert.equal(nov.months[10].url, null);

// ---- Up next: Mon 26 Oct meditation, then Mon 2 Nov, then Tue 3 Nov lecture (UTC instants; the page shows the viewer's own zone) ----
assert.deepEqual(ws.upNext.map(e => e.title), ['Meditation Monday: Somatic', 'Meditation Monday: Metta', 'The Circle Reopens']);
assert.equal(ws.upNext[0].startsAt, '2026-10-26T16:00:00Z'); assert.equal(ws.upNext[2].startsAt, '2026-11-03T23:00:00Z');
assert.equal(ws.upNext[2].teacher, 'Jacob Kyle');
assert.ok(!ws.upNext.some(e => /Somebody/.test(e.title)), 'only the two live spaces');
assert.deepEqual(none.upNext, [], 'visitors see no schedule');

// ---- Live: four rows ----
assert.deepEqual(ws.live.map(r => r.key), ['meditation-mondays', 'monthly-lecture', 'workshops', 'book-club']);
assert.equal(ws.live[0].streams.length, 5); assert.equal(ws.live[0].next.title, 'Meditation Monday: Somatic');
assert.equal(ws.live[1].next.title, 'The Circle Reopens'); assert.equal(ws.live[2].next.title, 'Autumn workshop'); assert.equal(ws.live[3].next.title, 'Book club meet-up');
assert.ok(ws.live.every(r => !r.locked)); assert.ok(none.live.every(r => r.locked && r.badge === 'Members' && !r.next));

// ---- Pathways ----
assert.deepEqual(ws.pathways.map(p => p.name), ['Meditation for Real Life', 'Hellenism & Neoplatonism', 'Classical Yoga & the Yoga Sūtras', 'The Subtle Body', 'Death, Dreams & the Luminous Mind', 'Myth, Shadow & the Inner Journey', 'Sound, Mantra & Sacred Speech']);
assert.deepEqual(ws.pathways.map(p => p.locked), [false, false, true, true, true, true, true], 'WS: the starter and Hellenism open, the other five locked');
assert.deepEqual(ws.pathways.filter(p => p.locked).map(p => p.ceHours), [56, 19.5, 12, 10, 3.5], 'locked rows show their CE hours');
assert.ok(ws.pathways.filter(p => p.locked).every(p => p.badge === 'Plus' && p.url === null));
assert.equal(ws.pathways[0].chip, 'Starter · included'); assert.equal(plus.pathways[0].chip, '14 CE hrs');
assert.equal(ws.pathways[0].progress.label, 'Continue · 2 of 4'); assert.ok(ws.pathways[0].url.endsWith('/lessons/502'), 'continues at the next unfinished lesson');
assert.equal(ws.pathways[1].progress.label, 'Continue · 2 of 4', 'Hellenism is read from its section inside the Pilgrimage course');
assert.equal(ws.pathways[1].teacher, 'Dr. Athena Potari');
const extra = view('ws', { rows: [{ name: 'Gnosticism', space_id: '2900999', ce_hours: '8', plan: 'plus', order: '' }, ...seed] });
assert.equal(extra.pathways.at(-1).name, 'Gnosticism', 'a new row with no order number goes last'); assert.equal(extra.pathways.at(-1).locked, true, 'and a new pathway needs no code');
assert.ok(plus.pathways.every(p => !p.locked)); assert.equal(plus.pathways[3].progress.label, 'Finished · 5 of 5');
assert.ok(none.pathways.every(p => p.locked && p.url === null));

// ---- Course Library, Certificates & CE ----
assert.ok(ws.library.locked && ws.library.departments.every(d => d.locked && d.url === null && d.badge === 'Plus')); assert.equal(ws.library.departments.length, 4);
assert.ok(!plus.library.locked); assert.ok(plus.library.departments[0].url.endsWith('?dept=Yoga%20philosophy'));
assert.equal(ws.ce, null); assert.equal(ws.ceTeaser.hours, 115); assert.equal(ws.ceTeaser.pathways, 6, '"115 CE hours across 6 pathways"');
assert.equal(plus.ce.hours, 33.5); assert.equal(plus.ce.of, 115); assert.deepEqual(plus.ce.certificates.map(c => c.title), ['Yoga Philosophy', 'Embodied Yoga Therapy', 'Buddhist Psychology', 'Awakened Body']);
assert.equal(plus.ce.certificates[0].progress.label, 'Continue · 1 of 6'); assert.equal(none.ce, null);

// ---- The year ----
assert.equal(ws.year.rows[0].month, 'October'); assert.equal(ws.year.rows[0].state, 'current'); assert.equal(ws.year.rows.at(-1).month, 'January', 'newest first');
assert.deepEqual(ws.year.ahead.map(r => r.month), ['November', 'December']);
assert.ok(ws.year.rows.every(r => !r.locked) && ws.year.archive.locked && ws.year.archive.badge === 'Plus', 'WS: 2026 open, past years need Plus');
assert.ok(!plus.year.archive.locked && plus.year.archive.url);
assert.deepEqual(none.year.rows.filter(r => !r.locked).map(r => r.month), ['January'], 'visitors: January open, the rest locked');
assert.ok(none.year.rows.filter(r => r.month !== 'January').every(r => r.locked && r.url === null));
assert.ok(none.year.rows.at(-1).url, 'the free January lecture links to its lesson');
assert.ok(ws.year.closing.title.startsWith('2027'));

// ---- Book club ----
assert.equal(ws.book.current.title, 'Pilgrimage: Past and Present in the World Religions'); assert.deepEqual(ws.book.past.map(p => p.title), ['Q1 · The Pilgrim’s Way']);
assert.equal(ws.book.next.title, 'Book club meet-up'); assert.ok(none.book.locked && none.book.past.length === 0);
const noBook = view('ws', { bookSection: null });
assert.equal(noBook.book.current.title, 'Pilgrimage: Past and Present in the World Religions', 'falls back to the configured title when the section is empty'); assert.equal(noBook.book.current.fromCircle, false);

// ---- Side card by plan, banners data ----
assert.equal(ws.side.kind, 'teaser'); assert.equal(ws.side.title, 'Hundreds of hours, certificates and CE.');
assert.equal(plus.side.kind, 'ce'); assert.equal(plus.side.hours, 33.5); assert.equal(none.side.kind, 'sample'); assert.equal(none.side.month, 'January');
assert.equal(none.planLabel, 'Preview'); assert.equal(none.links.join, 'https://ss.embodiedphilosophy.com/checkout/wisdom-school');
assert.equal(none.month.lessonUrl, null, 'visitors get no link to this month'); assert.equal(none.month.theme, 'The Return with Wisdom');
assert.ok(none.sampleUrl, 'there is always somewhere for "Watch a sample lecture" to go');
assert.ok(!JSON.stringify(ws.side).match(/\b\d{3,}\s+hours/), 'never a number of hours of course content');

// ---- New since your last visit ----
assert.deepEqual(ws.newSince.map(n => n.source), ['Meditation replays', 'This month’s lecture', 'Book club', 'Announcements']);
const n = Object.fromEntries(ws.newSince.map(x => [x.source, x]));
assert.equal(n['Meditation replays'].count, 1); assert.equal(n['Meditation replays'].latestTitle, 'Meditation Monday: Mystical');
assert.equal(n['This month’s lecture'].count, 1); assert.equal(n['This month’s lecture'].latestTitle, 'October lecture');
assert.equal(n['Announcements'].count, 1, 'a post older than two weeks is not new'); assert.equal(n['Announcements'].latestTitle, 'The Circle Reopens: details');
assert.equal(n['Book club'].count, 1);
const seen = view('ws', { seen: { [String(C.announcements_space_id)]: '2026-10-23T00:00:00Z', [String(C.meditation_space_id)]: '2026-10-23T00:00:00Z' } });
assert.ok(!seen.newSince.some(x => x.source === 'Announcements' || x.source === 'Meditation replays'), 'opening a source clears it');
assert.deepEqual(view('ws', { seen: null }).newSince, [], 'no store, no counts'); assert.equal(view('ws', { seen: null }).countsOn, false);
assert.deepEqual(none.newSince, []);
const justPosted = view('ws', { announcements: [...announcements, { id: 3, name: 'Fresh', created_at: '2026-10-23T13:58:00Z' }] });
assert.equal(justPosted.newSince.find(x => x.source === 'Announcements').latestTitle, 'Fresh', 'a new post shows as soon as the (5 minute) cache turns over');

// ---- Tabs and locks ----
assert.deepEqual(ws.tabs.map(t => t.key), ['month', 'live', 'year', 'book', 'pathways', 'library', 'ce']);
assert.equal(ws.tabs.find(t => t.key === 'pathways').badge.locked, '5 locked'); assert.equal(ws.tabs.find(t => t.key === 'ce').badge.locked, 'Plus');
assert.equal(plus.tabs.find(t => t.key === 'ce').badge, null);

// ---- Nothing readable (Circle down, or a visitor): still a page, themes from the sheet ----
const bare = buildWisdomHub({ cfg, plan: 'none', rows: seed, yearSections: [], themes: ['The Call to Depth', '', '', '', '', '', '', '', '', 'The Return with Wisdom', '', ''], today, now, seen: null });
assert.equal(bare.month.theme, 'The Return with Wisdom'); assert.equal(bare.months[0].theme, 'The Call to Depth'); assert.equal(bare.months[0].url, null);
assert.equal(bare.sampleUrl, cfg.settings.plus_learn_url);
assert.equal(progressOf([]), null);

// ---- Seed matches the brief ----
assert.equal(seed.length, 7); assert.equal(Math.round(seed.reduce((a, r) => a + Number(r.ce_hours || 0), 0) * 10) / 10, 115);
assert.deepEqual(seed.map(r => r.space_id), ['2897437', '2897436', '2897811', '2897812', '2897814', '2897815', '2897813']);
assert.deepEqual(cfg.circle.month_sections, [1212912, 1212914, 1212915, 1212916, 1212917, 1212918, 1212919, 1212920, 1212921, 1212922, 1212923, 1212924], 'Feb is 1212914 and there is no 1212913');
console.log('wisdom hub: all checks passed');
