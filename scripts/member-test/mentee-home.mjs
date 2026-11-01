// Offline checks for the Sahṛdaya Upāya page (/c/mentorship): next immersion, Prepare opening, windows, peer partner.
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee-home.mjs
import assert from 'assert/strict';
const H = await import('../../lib/mentee/home.js');
const C = await import('../../lib/mentee/content.js');
const config = (await import('../../data/mentee.json', { with: { type: 'json' } })).default;

assert.equal(config.immersions.length, 8);
assert.equal(H.nextImmersion(config.immersions, '2026-10-21').n, 1);
assert.equal(H.nextImmersion(config.immersions, '2026-11-15').n, 1, 'still immersion 1 on its Sunday');
assert.equal(H.nextImmersion(config.immersions, '2026-11-16').n, 2);
assert.equal(H.nextImmersion(config.immersions, '2027-05-31'), null);

const week = { formation: null, due: { items: [] }, sessions: [{ id: 's1', title: 'Sunday Practicum', start: '2026-11-15T15:00:00Z', url: 'https://ss/x', rsvped: false }], oneToOne: null };
const run = today => H.buildHome(week, { config, today, tz: 'Europe/London', partner: null }).home;
let h = run('2026-10-21');
assert.equal(h.immersion.n, 1); assert.equal(h.immersion.daysTo, 24); assert.equal(h.immersion.prepare.open, false); assert.equal(h.immersion.prepare.opens, '2026-10-31');
assert.equal(h.immersion.practicum.id, 's1'); assert.equal(h.startHere, true);
h = run('2026-10-31'); assert.equal(h.immersion.prepare.open, true, 'opens two weeks before the Saturday');
assert.equal(run('2026-11-14').immersion.happening, true);
assert.deepEqual(h.oneToOne.window, { from: '2026-10-26', to: '2026-10-30' }.to < '2026-10-31' ? { from: '2026-11-23', to: '2026-11-27' } : null, 'window passed → next one');
assert.equal(H.windowFor(config.windows, '2026-10-28').from, '2026-10-26');
assert.equal(H.windowFor(config.windows, '2027-06-01'), null);

const rows = [
  { season: 'fall-2026', month: 'November', email_a: 'Maya@x.com', email_b: 'sam@x.com', name_b: 'Sam', publish: '' },
  { season: 'fall-2026', month: 'December', email_a: 'maya@x.com', email_b: 'lee@x.com' },
  { season: 'fall-2026', month: '2026-11', email_a: 'hide@x.com', email_b: 'z@x.com', publish: 'FALSE' },
];
assert.deepEqual(C.partnerFor(rows, 'maya@x.com', 'fall-2026', '2026-11-03'), { month: 'november', rotation: null, name: 'Sam', email: 'sam@x.com', partners: [{ name: 'Sam', email: 'sam@x.com', city: '', tz: '' }], chatUrl: '' });
assert.equal(C.partnerFor(rows, 'sam@x.com', 'fall-2026', '2026-11-03').email, 'maya@x.com');
assert.equal(C.partnerFor(rows, 'maya@x.com', 'fall-2026', '2026-10-21'), null, 'nothing set for October → card hidden');
assert.equal(C.partnerFor(rows, 'hide@x.com', 'fall-2026', '2026-11-03'), null);
console.log('mentee home: ok');

// Reflections count toward the 9 once they are posted to Sādhana School (Jacob, 1 Nov 2026): one automatic line each, nothing before the season
const { reflectionRows } = await import('../../lib/mentee/reflections.js');
const rr = reflectionRows([{ id: 1, title: 'A', day: '2026-11-03' }, { id: 2, title: 'B', day: '2026-12-02' }, { id: 3, title: 'Old', day: '2026-09-01' }], '2026-10-21');
assert.deepEqual(rr.map(r => [r.day, r.hours]), [['2026-11-03', 0.67], ['2026-12-02', 0.67]], 'each posted reflection is 6 hours / 9');
const { summarise, withAuto } = await import('../../lib/member/formation.js');
const base = { ...summarise([{ component: 'immersions', hours: 6 }]), entries: [{ id: '1', component: 'immersions', hours: 6, day: '2026-11-15', status: 'credited' }] };
const merged = withAuto(base, rr);
assert.equal(merged.total, 7.34); assert.equal(merged.components.find(c => c.id === 'reflections').credited, 1.34); assert.equal(merged.entries.length, 3);
assert.equal(withAuto(base, []), base);
const capped = withAuto(base, reflectionRows(Array.from({ length: 9 }, (_, i) => ({ id: i, title: 't', day: '2026-11-0' + (i + 1) })), ''));
assert.equal(capped.components.find(c => c.id === 'reflections').credited, 6, 'nine reflections fill the 6 hours (capped at the component target)');
console.log('reflections: ok');

// Calendly: open times and the mentee's own booking, with the API faked (live shapes checked against the real API on 21 Oct 2026)
process.env.CALENDLY_TOKEN = 'test';
const CAL = await import('../../lib/mentee/calendly.js');
const realFetch = globalThis.fetch; const urls = [];
globalThis.fetch = async u => {
  urls.push(String(u));
  const json = b => ({ ok: true, status: 200, json: async () => b });
  if (String(u).includes('/users/me')) return json({ resource: { uri: 'https://api.calendly.com/users/U1' } });
  if (String(u).includes('/event_type_available_times')) return json({ collection: [
    { status: 'available', start_time: '2026-11-24T18:00:00Z', scheduling_url: 'https://calendly.com/embodied-philosophy/x/2026-11-24T18:00:00Z' },
    { status: 'unavailable', start_time: '2026-11-24T19:00:00Z', scheduling_url: 'https://calendly.com/embodied-philosophy/x/b' },
    { status: 'available', start_time: '2026-11-25T18:00:00Z', scheduling_url: 'https://evil.example/x' }] });
  if (/\/scheduled_events\/[^/?]+\/invitees/.test(String(u))) {
    const id = /scheduled_events\/([^/?]+)\/invitees/.exec(String(u))[1];
    return json({ collection: id === 'EV1' ? [{ name: 'Maya R', email: 'Maya@x.com', questions_and_answers: [{ question: 'Where I am on the offering', answer: 'Group named.', position: 1 }, { question: 'What I want to work on', answer: 'Task language in my cueing.', position: 0 }, { question: 'Attached (optional)', answer: '', position: 2 }] }] : [{ name: 'Sam T', email: 'sam@x.com', questions_and_answers: [] }] });
  }
  if (String(u).includes('/scheduled_events')) return json({ collection: [{ uri: 'https://api.calendly.com/scheduled_events/EV1', event_type: 'https://api.calendly.com/event_types/ET1', start_time: '2026-11-25T18:00:00Z', end_time: '2026-11-25T18:45:00Z', location: { join_url: 'https://zoom.us/j/1' } }, { uri: 'https://api.calendly.com/scheduled_events/EV2', event_type: 'https://api.calendly.com/event_types/ET1', start_time: '2026-11-26T18:00:00Z', location: { join_url: 'https://zoom.us/j/2' } }, { uri: 'https://api.calendly.com/scheduled_events/EV3', event_type: 'https://api.calendly.com/event_types/OTHER', start_time: '2026-11-27T18:00:00Z' }] });
  return { ok: false, status: 404 };
};
const now = Date.parse('2026-10-21T07:30:00Z');
const sl = await CAL.openSlots('ET1', '2026-11-23', '2026-11-27', now);
assert.deepEqual(sl.map(s => s.start), ['2026-11-24T18:00:00Z'], 'only available times, only Calendly links');
const q = new URL(urls.find(u => u.includes('available_times'))); assert.ok(Date.parse(q.searchParams.get('end_time')) - Date.parse(q.searchParams.get('start_time')) <= 7 * 864e5, 'never asks for more than 7 days');
assert.deepEqual(await CAL.bookedFor('ET1', 'Maya@x.com', now), { start: '2026-11-25T18:00:00Z', url: 'https://zoom.us/j/1', uuid: 'EV1', answers: [{ q: 'What I want to work on', a: 'Task language in my cueing.' }, { q: 'Where I am on the offering', a: 'Group named.' }] }, 'matches the one-to-one event type only; what the mentee wrote comes with it, in the order asked, blanks left out');
const up = await CAL.upcomingBookings('ET1', { now });
assert.deepEqual(up.map(x => [x.uuid, x.name, x.answers.length]), [['EV1', 'Maya R', 2], ['EV2', 'Sam T', 0]], 'the one-to-one event type only, soonest first, with who booked and what they wrote');
assert.deepEqual(CAL.summaryOf([{ question: 'b', answer: ' two ', position: 1 }, { question: 'a', answer: 'one', position: 0 }, { question: 'c', answer: '  ' }]), [{ q: 'a', a: 'one' }, { q: 'b', a: 'two' }]);
delete process.env.CALENDLY_TOKEN; assert.deepEqual(await CAL.openSlots('ET1', '2026-11-23', '2026-11-27', now + 1), [], 'no token → button only'); assert.deepEqual(await CAL.upcomingBookings('ET1', { now }), []);
globalThis.fetch = realFetch;
console.log('calendly: ok');

// Cohort chat: real message shape (body, sent_at, sender.community_admin), newest last, mentor tag for admins/moderators
const msg = (id, who, at, extra = {}) => ({ id, body: 'Hello ' + id, sent_at: at, sender: { name: who, community_admin: false, moderator: false, ...extra } });
const lines = H.chatLines([msg(1, 'Jacob', '2026-10-21T07:32:01Z', { community_admin: true }), msg(2, 'Maya', '2026-10-21T08:00:00Z'), { id: 3, body: '', sent_at: '2026-10-21T09:00:00Z', sender: {} }, msg(4, 'Sam', '2026-10-21T09:30:00Z', { moderator: true })]);
assert.deepEqual(lines.map(l => [l.who, l.mentor]), [['Jacob', true], ['Maya', false], ['Sam', true]], 'empty messages dropped, mentor tag for admins and moderators');
assert.equal(H.chatLines(Array.from({ length: 40 }, (_, i) => msg(i, 'x', '2026-10-21T07:' + String(i % 60).padStart(2, '0') + ':00Z'))).length, 30);
console.log('chat: ok');

// Apprentice Workbook: lesson completion on the immersion steps (section/lesson shapes checked against the real course, 21 Oct 2026)
const sections = [
  { id: 10, name: 'Start Here', lessons: [{ id: 1, name: 'Welcome: How This Workbook Works', progress: { status: 'complete' } }, { id: 2, name: 'Your Year at a Glance', progress: { status: 'incomplete' } }] },
  { id: 11, name: '1 · Beneath the Pose · Nov 14–15, 2026', lessons: [{ id: 21, name: 'Prepare: Beneath the Pose', progress: { status: 'complete' } }, { id: 22, name: 'Practicum: Beneath the Pose', progress: { status: 'incomplete' } }, { id: 23, name: 'Integrate: Beneath the Pose', progress: { status: 'incomplete' } }] },
  { id: 12, name: '2 · Tasting the Real · Dec 5–6, 2026', lessons: [{ id: 31, name: 'Prepare: Tasting the Real', progress: { status: 'incomplete' } }, { id: 33, name: 'Integrate: Tasting the Real', progress: { status: 'incomplete' } }] },
  { id: 99, name: 'Completion Requirements', lessons: [{ id: 91, name: 'Certification', progress: {} }] },
];
const wbk = H.workbookFor(sections, 'https://ss.x/c/apprentice-workbook/');
assert.deepEqual(Object.keys(wbk.immersions), ['1', '2']); assert.equal(wbk.immersions['1'].prepare.done, true); assert.equal(wbk.immersions['1'].integrate.url, 'https://ss.x/c/apprentice-workbook/sections/11/lessons/23');
assert.deepEqual(wbk.start.map(l => l.done), [true, false]);
const wkWeek = { formation: null, due: { items: [] }, sessions: [], oneToOne: null };
let hh = H.buildHome(wkWeek, { config, today: '2026-11-11', tz: 'Europe/London', workbook: wbk }).home;
assert.equal(hh.immersion.prepare.done, true); assert.match(hh.immersion.prepare.url, /lessons\/21$/); assert.equal(hh.integrate, null, 'nothing to integrate before the first weekend');
hh = H.buildHome(wkWeek, { config, today: '2026-11-17', tz: 'Europe/London', workbook: wbk }).home;
assert.equal(hh.immersion.n, 2); assert.deepEqual([hh.integrate.n, hh.integrate.title], [1, 'Beneath the Pose'], 'after the weekend the Integrate lesson is offered');
const done = JSON.parse(JSON.stringify(wbk)); done.immersions['1'].integrate.done = true;
assert.equal(H.buildHome(wkWeek, { config, today: '2026-11-17', tz: 'Europe/London', workbook: done }).home.integrate, null, 'gone once completed');
assert.equal(H.buildHome(wkWeek, { config, today: '2026-12-10', tz: 'Europe/London', workbook: wbk }).home.integrate?.n, 2, 'the most recent immersion');
assert.equal(H.buildHome(wkWeek, { config, today: '2026-11-17', tz: 'Europe/London' }).home.integrate, null, 'no Circle data → nothing shown');
console.log('workbook: ok');

// Cohort chat sending: the request Circle asked for (rich_text_body, a document of paragraphs), with Circle faked. Never sent for real in tests.
process.env.CIRCLE_HEADLESS_TOKEN = 'test';
const CI = await import('../../lib/school/circle.js');
const sent = []; const f0 = globalThis.fetch;
globalThis.fetch = async (u, init = {}) => {
  const url = String(u), ok = b => ({ ok: true, status: 200, text: async () => JSON.stringify(b) });
  if (url.includes('/headless/auth_token')) return ok({ access_token: 'T', community_member_id: 7 });
  sent.push({ url, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null, auth: init.headers?.Authorization });
  return ok({ id: 1 });
};
const room = 'df53fdc0-302b-405a-9261-f0a83adbe4fb';
await CI.sendChatMessage('maya@x.com', room, 'Hello cohort\nSecond line');
const sc = sent.at(-1);
assert.equal(sc.method, 'POST'); assert.ok(sc.url.endsWith(`/messages/${room}/chat_room_messages`)); assert.equal(sc.auth, 'Bearer T', 'sent as the member, with their own token');
assert.deepEqual(sc.body, { rich_text_body: { body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello cohort' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'Second line' }] }] } } });
await assert.rejects(() => CI.sendChatMessage('maya@x.com', 'not-a-room', 'x'), /Unknown chat room/);
globalThis.fetch = f0; delete process.env.CIRCLE_HEADLESS_TOKEN;
console.log('chat send: ok');

// Round 2 · evergreen row: rotation, articulation dots, hours split, questions
const cfg = { ...config, rotations: [{ n: 1, from: '2026-10-01', to: '2026-11-30', label: 'Oct–Nov' }, { n: 2, from: '2026-12-01', to: '2027-01-31', label: 'Dec–Jan' }], articulation_target: 2, questions_space_id: 99 };
let rot = H.rotationFor(cfg.rotations, '2026-11-01');
assert.equal(rot.n, 1); assert.equal(rot.weeksLeft, 5); assert.equal(rot.next.from, '2026-12-01');
assert.equal(H.rotationFor(cfg.rotations, '2026-11-30').weeksLeft, 1, 'last day still counts as a week left');
assert.equal(H.rotationFor(cfg.rotations, '2026-12-01').n, 2);
assert.equal(H.rotationFor(cfg.rotations, '2027-02-01'), null);
const form = { total: 0.5, target: 100, components: [{ id: 'peer', target: 8 }], entries: [
  { component: 'peer', hours: 1, day: '2026-10-28', status: 'pending' }, { component: 'peer', hours: 1.5, day: '2026-09-01', status: 'credited' },
  { component: 'observation', hours: 1.5, day: '2026-10-28', status: 'pending' }] };
const art = H.articulationFor(form, cfg, '2026-11-01');
assert.deepEqual([art.sessions, art.target, art.hours, art.hoursTarget], [1, 2, 2.5, 8], 'one session in this rotation; 2.5 hrs logged for the year');
assert.deepEqual(H.hoursSplit(form), { confirmed: 0.5, pending: 2.5, target: 100 });
assert.deepEqual(H.hoursSplit(null), { confirmed: 0, pending: 0, target: 100 });
const hq = H.buildHome({ formation: form, due: { items: [] }, sessions: [], oneToOne: null }, { config: cfg, today: '2026-11-01', tz: 'UTC', partner: null, questions: [{ id: '1', title: 'Q1' }, { id: '2', title: 'Q2' }, { id: '3', title: 'Q3' }] }).home;
assert.equal(hq.questions.on, true); assert.equal(hq.questions.latest.length, 2); assert.equal(hq.questions.total, 3);
assert.equal(H.questionsFor([], config).on, false, 'no space id → card hidden');
assert.equal(H.questionsFor([], config, 123).on, true, 'a space found by its address switches the card on');
console.log('evergreen row: ok');

// Rotations (two-month blocks), where people live, the pair chat, and the cohort for "add a third"
const prof = C.profilesFrom([{ email: 'Sam@x.com', name: 'Sam', city: 'Milan', tz: 'Europe/Rome' }, { email: 'bad@x.com', city: 'Nowhere', tz: 'Not/AZone' }, { email: '', city: 'x', tz: 'Europe/Rome' }]);
assert.deepEqual(prof, { 'sam@x.com': { name: 'Sam', city: 'Milan', tz: 'Europe/Rome' }, 'bad@x.com': { name: '', city: 'Nowhere', tz: '' } }, 'a made-up zone is dropped, a blank email skipped');
const rrows = [
  { season: 'fall-2026', month: '', rotation: '1', email_a: 'maya@x.com', email_b: 'sam@x.com', name_b: 'Sam', chat_url: 'https://ss.x/chat/1' },
  { season: 'fall-2026', month: 'December', rotation: '2', email_a: 'maya@x.com', email_b: 'lee@x.com' },
  { season: 'fall-2026', month: 'November', email_a: 'maya@x.com', email_b: 'old@x.com', publish: 'FALSE' },
  { season: 'fall-2026', rotation: '1', email_a: 'di@x.com', email_b: 'cy@x.com', name_a: 'Di', name_b: 'Cy' },
];
let pr = C.partnerFor(rrows, 'maya@x.com', 'fall-2026', '2026-11-03', { rotation: 1, profiles: prof });
assert.equal(pr.rotation, 1); assert.equal(pr.name, 'Sam'); assert.deepEqual(pr.partners[0], { name: 'Sam', email: 'sam@x.com', city: 'Milan', tz: 'Europe/Rome' }); assert.equal(pr.chatUrl, 'https://ss.x/chat/1', 'rotation rows match whatever the month says; the pair chat comes with them');
assert.equal(C.partnerFor(rrows, 'maya@x.com', 'fall-2026', '2026-12-03', { rotation: 2 }).name, 'lee@x.com', 'next rotation, a new partner');
assert.equal(C.partnerFor([{ ...rrows[0], chat_url: 'http://insecure' }], 'maya@x.com', 'fall-2026', '2026-11-03', { rotation: 1 }).chatUrl, '', 'only https chat links');
assert.deepEqual(C.cohortFrom(rrows, 'fall-2026', 'maya@x.com', ['sam@x.com']).map(c => c.email), ['cy@x.com', 'di@x.com', 'lee@x.com'], 'the cohort without me or my partner; hidden rows left out')
console.log('rotations: ok');

// Round 2 · hours: pending includes entries waiting for a co-sign; recent entries carry their state; the reflection month circles
const hf = { total: 1, target: 100, components: [{ id: 'observation', target: 10, credited: 1, pending: 1.5 }], entries: [
  { id: '1', component: 'observation', hours: 1.5, day: '2026-10-28', status: 'pending', competencies: ['attunement'] },
  { id: '2', component: 'practice-teaching', hours: 2, day: '2026-10-29', status: 'awaiting_cosign', cosigner: 'bo@x.com' },
  { id: '3', component: 'observation', hours: 1, day: '2026-10-20', status: 'returned', returnNote: 'Which session?' },
  { id: '4', component: 'observation', hours: 1, day: '2026-10-10', status: 'credited' }] };
assert.deepEqual(H.hoursSplit(hf), { confirmed: 1, pending: 3.5, target: 100 }, 'pending = waiting for Jacob + waiting for the partner; returned entries are neither');
const hr = H.buildHome({ formation: hf, due: { items: [] }, sessions: [], oneToOne: null }, { config, today: '2026-11-03', tz: 'UTC', partner: null }).home.recent;
assert.deepEqual(hr.map(r => r.state), ['pending', 'awaiting', 'returned', 'credited']); assert.equal(hr[2].returnNote, 'Which session?'); assert.deepEqual(hr[0].competencies, ['attunement']);
const rmo = H.reflectionMonths({ all: [{ starts: '2026-10-21' }, { starts: '2026-11-01' }, { starts: '2026-12-01' }] }, [{ day: '2026-10-30' }], '2026-11-03');
assert.deepEqual(rmo.months.map(m => [m.label, m.filled, m.now]), [['O', true, false], ['N', false, true], ['D', false, false]]); assert.equal(rmo.counted, 1); assert.equal(rmo.target, 9);
assert.deepEqual(H.reflectionMonths(null, null, '2026-11-03'), { counted: 0, target: 9, months: [] });
console.log('hours card data: ok');
