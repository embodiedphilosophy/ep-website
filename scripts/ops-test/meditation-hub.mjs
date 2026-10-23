// Checks the Meditation Pass hub rules (lib/hub/meditation.js) with synthetic Circle and Ops data and the real config and seed files.
// No network.   node scripts/ops-test/meditation-hub.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildMeditationHub, planOf, normStreams, streamIn, opsDays, sessionsFrom, joinOpen, nextOf, nextFourOf, parseReplayTitle, orderSections, archiveStamp, tabKey, TABS, etDay, replayTitle } from '../../lib/hub/meditation.js';

const read = f => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url)));
const cfg = read('mm-hub.json'), streams = normStreams(read('mm-streams.json'));
const SPACE = cfg.circle.live_space_id, COURSE = cfg.circle.course_space_id;
const ok = (c, m) => { assert.ok(c, m); console.log('ok  ', m); };

// ---- plan ----
assert.equal(planOf({ pass: true, joinedLive: true }), 'pass');
assert.equal(planOf({ pass: false, joinedLive: true }), 'dropin');
assert.equal(planOf({ pass: false, joinedLive: false }), 'none');
assert.equal(tabKey('replays'), 'replays'); assert.equal(tabKey('x'), 'week'); assert.equal(TABS.length, 4);
ok(streams.length === 5 && streams[4].key === 'neuroscience-yoga', 'the five streams, in order, with a clean key');

// ---- who teaches which Monday (Ops) ----
assert.equal(streamIn('Meditation Monday: Metta', streams).name, 'Metta');
assert.equal(streamIn('Neuroscience with Abha', streams).name, 'Neuroscience & Yoga', 'a first word is enough for the long name');
assert.equal(streamIn('Meditation Mondays', streams), null);
const ops = [
  { date: '2026-10-26', teachers: 'Dr. Abha Rajbhandari', title: 'Meditation Mondays', series: 'meditation-mondays' },
  { date: '2026-11-02', teachers: 'Nataraj Chaitanya', title: 'Meditation Mondays' },
  { date: '2026-11-09', teachers: 'Oneika Mays', title: 'Meditation Mondays' },
  { date: '2026-11-16', teachers: 'Floss Harry', title: 'Meditation Mondays' },
  { date: '2026-11-23', teachers: '', title: 'Meditation Mondays: Mystical' },
];
const days = opsDays(ops, streams);
assert.deepEqual([days['2026-10-26'].stream, days['2026-10-26'].teacher], ['Neuroscience & Yoga', 'Dr. Abha Rajbhandari']);
assert.deepEqual([days['2026-11-02'].stream, days['2026-11-09'].stream, days['2026-11-16'].stream], ['Tantrik', 'Metta', 'Somatic']);
assert.equal(opsDays([{ date: '2026-10-26', teachers: 'Abha Rajbhandari', title: 'Meditation Mondays' }], streams)['2026-10-26'].teacher, 'Dr. Abha Rajbhandari', 'a stream’s teacher is named as the table spells them');
assert.equal(opsDays([{ date: '2026-12-07', teachers: 'Guest Teacher', title: 'Meditation Mondays: Metta' }], streams)['2026-12-07'].teacher, 'Guest Teacher', 'a guest is named as the sheet has them');
assert.deepEqual([days['2026-11-23'].stream, days['2026-11-23'].teacher], ['Mystical', 'Mary Reilly Nichols'], 'a stream named in the title fills in its teacher');
ok(!days['2026-11-30'], 'a date with no entry has none');

// ---- the sessions: 56 weekly events at 12pm ET, "Meditation Mondays" hosted by Jacob (as in Circle) ----
const monday = k => { const d = new Date(Date.UTC(2026, 9, 26 + 7 * k)); return d.toISOString().slice(0, 10); };
const noonET = date => { const [y, m, d] = date.split('-').map(Number); const dst = Date.UTC(y, m - 1, d) < Date.UTC(2026, 10, 1) || Date.UTC(y, m - 1, d) >= Date.UTC(2027, 2, 14) && Date.UTC(y, m - 1, d) < Date.UTC(2027, 10, 7); return new Date(Date.UTC(y, m - 1, d, dst ? 16 : 17)); };
const events = Array.from({ length: 56 }, (_, k) => ({ id: 1000 + k, name: 'Meditation Mondays', space_id: SPACE, starts_at: noonET(monday(k)).toISOString(), duration_in_seconds: 3600, url: `https://ss.example/events/${1000 + k}`, host: { name: 'Jacob Kyle' } }));
events.push({ id: 5, name: 'Some other event', space_id: 2897428, starts_at: noonET(monday(0)).toISOString(), url: 'x' });
const sess = sessionsFrom({ rawEvents: events, opsRows: ops, days, cfg });
ok(sess.length === 56, 'only the live space’s events');
assert.equal(sess[0].date, '2026-10-26');
ok(sess[0].startsAt === '2026-10-26T16:00:00.000Z' && sess[1].startsAt === '2026-11-02T17:00:00.000Z', '12pm ET holds across the clock change (16:00Z, then 17:00Z)');
ok(sess[0].title === 'Neuroscience & Yoga with Dr. Abha Rajbhandari' && sess[1].title === 'Tantrik with Nataraj Chaitanya', 'title is “{Stream} with {Teacher}”');
ok(sess[7].title === 'Meditation Mondays', 'a date with no Ops entry falls back to “Meditation Mondays”');

// ---- hero, Join live and the roll to the next Monday ----
const at = iso => Date.parse(iso);
assert.equal(nextOf(sess, at('2026-10-23T14:00:00Z')).date, '2026-10-26');
assert.equal(joinOpen(sess[0], at('2026-10-26T15:44:00Z')), false); assert.equal(joinOpen(sess[0], at('2026-10-26T15:45:00Z')), true);
assert.equal(joinOpen(sess[0], at('2026-10-26T16:30:00Z')), true); assert.equal(joinOpen(sess[0], at('2026-10-26T17:00:00Z')), false);
ok(true, 'Join live: closed 16 minutes before, open from 15 minutes before until the end');
assert.equal(nextOf(sess, at('2026-10-26T16:59:00Z')).date, '2026-10-26');
assert.equal(nextOf(sess, at('2026-10-26T17:01:00Z')).date, '2026-11-02');
assert.deepEqual(nextFourOf(sess, at('2026-10-26T17:01:00Z')).map(s => s.date), ['2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']);
ok(true, 'after the session ends the hero moves to Mon 2 Nov, and the next four follow it');
assert.equal(etDay('2026-10-27T03:30:00Z'), '2026-10-26', 'dates are New York days');
// With Circle showing nothing (a visitor), the website’s schedule stands in
const fallback = sessionsFrom({ rawEvents: [], opsRows: [{ ...ops[0], time: '12pm ET' }], days, cfg });
ok(fallback.length === 1 && fallback[0].startsAt === '2026-10-26T16:00:00.000Z' && fallback[0].url === '', 'no Circle events: the site’s schedule at 12pm ET, no link');

// ---- replay titles ----
assert.deepEqual(parseReplayTitle('Mon 26 Oct · Neuroscience & Yoga with Dr. Abha Rajbhandari', '2026-10-27T10:00:00Z'), { date: '2026-10-26', stream: 'Neuroscience & Yoga', teacher: 'Dr. Abha Rajbhandari' });
assert.equal(parseReplayTitle('Mon 28 Dec · Metta with Oneika Mays', '2027-01-04T10:00:00Z').date, '2026-12-28', 'a December session published in January is last year’s');
assert.equal(parseReplayTitle('Mon 9 Nov', '2026-11-10T10:00:00Z').date, '2026-11-09');
assert.deepEqual(parseReplayTitle('Welcome: how to use the library', '2026-10-01T00:00:00Z'), { date: null, stream: '', teacher: '' });
assert.equal(replayTitle({ date: '2026-10-26', teachers: 'Dr. Abha Rajbhandari', title: 'Meditation Mondays' }, streams), 'Mon 26 Oct · Neuroscience & Yoga with Dr. Abha Rajbhandari');
assert.equal(replayTitle({ date: '2026-11-30', teachers: '', title: 'Meditation Mondays' }, streams), 'Mon 30 Nov');
ok(true, 'Ops names new replay lessons “Mon 26 Oct · {Stream} with {Teacher}” and the hub reads that title back');

// ---- the course ----
const les = (id, name, at, extra = {}) => ({ id, name, url: `https://ss.example/c/meditation-pass/sections/1/lessons/${id}`, created_at: at, status: 'incomplete', ...extra });
const raw = [
  { id: 1223520, name: 'Archive · August 2026', lessons: [les(40, 'Mon 3 Aug · Metta with Oneika Mays', '2026-08-04T10:00:00Z')] },
  { id: 1212933, name: 'Start here', lessons: [les(1, 'Welcome to the library', '2026-01-01T00:00:00Z'), les(2, 'How to practise', '2026-01-01T00:00:00Z')] },
  { id: 1223518, name: 'Archive · January 2026', lessons: [les(30, 'Mon 5 Jan · Somatic with Floss Harry', '2026-01-06T10:00:00Z')] },
  { id: 1212934, name: 'October 2026', lessons: [les(10, 'Mon 12 Oct · Metta with Oneika Mays', '2026-10-13T10:00:00Z', { status: 'complete', duration_in_seconds: 2400, thumbnail_url: 'https://img/10.jpg' }), les(11, 'Mon 19 Oct · Tantrik with Nataraj Chaitanya', '2026-10-20T10:00:00Z', { duration_in_seconds: 2700 })] },
  { id: 1212935, name: 'November 2026', lessons: [] },
  { id: 1223529, name: 'Archive · September 2026', lessons: [les(50, 'Mon 7 Sep · Mystical with Mary Reilly Nichols', '2026-09-08T10:00:00Z')] },
];
assert.ok(archiveStamp('Archive · September 2026') > archiveStamp('Archive · January 2026'));
const ord = orderSections(raw, cfg);
assert.deepEqual([ord.start.map(s => s.name), ord.current.map(s => s.name), ord.archive.map(s => s.name)], [['Start here'], ['October 2026', 'November 2026'], ['Archive · September 2026', 'Archive · August 2026', 'Archive · January 2026']]);
ok(true, 'sections: Start here, the current months, then the Archive months newest first');

const base = { cfg, streams, rawEvents: events, opsUpcoming: ops, opsPast: [{ date: '2026-10-19', teachers: 'Nataraj Chaitanya', title: 'Meditation Mondays', video_id: '123' }, { date: '2026-10-12', teachers: 'Oneika Mays', title: 'Meditation Mondays', video_id: '124' }], rawSections: raw, now: at('2026-10-23T14:00:00Z') };
const pass = buildMeditationHub({ ...base, plan: 'pass' });
ok(pass.next.date === '2026-10-26' && pass.next.stream === 'Neuroscience & Yoga' && pass.next.teacher === 'Dr. Abha Rajbhandari', 'hero: Mon 26 Oct, Neuroscience & Yoga, Dr. Abha Rajbhandari');
ok(pass.nextFour.length === 4 && pass.nextFour[0].date === '2026-11-02' && pass.upcoming.length >= 6, 'next four Mondays; upcoming has six or more');
ok(pass.next.url === 'https://ss.example/events/1000' && pass.upcoming.every(s => s.open && s.url), 'a Pass member gets every session’s live link');
ok(pass.sections.map(s => s.name).join('|') === 'Start here|October 2026|Archive · September 2026|Archive · August 2026|Archive · January 2026', 'empty months are left out');
ok(pass.latestReplay.id === '11' && pass.latestReplay.title === 'Tantrik with Nataraj Chaitanya' && pass.latestReplay.minutes === 45 && pass.latestReplay.url, 'latest replay: the newest published lesson, Start here excluded');
ok(pass.sections[1].lessons[0].id === '11' && pass.sections[1].lessons[1].thumb === 'https://img/10.jpg' && pass.sections[1].lessons[1].done, 'newest first within a month; thumbnail and progress kept');
ok(pass.streams.find(s => s.key === 'metta').replays === 2 && pass.streams.find(s => s.key === 'tantrik').replays === 1 && pass.streams.every(s => 'replays' in s), 'replay counts per stream');
ok(pass.sections.flatMap(s => s.lessons).every(l => !l.locked && l.url), 'Pass members can play every replay');
// a lesson published after the first read shows as the latest on the next read
const fresh = buildMeditationHub({ ...base, plan: 'pass', rawSections: raw.map(s => s.id === 1212934 ? { ...s, lessons: [...s.lessons, les(12, 'Mon 26 Oct · Neuroscience & Yoga with Dr. Abha Rajbhandari', '2026-10-27T10:00:00Z')] } : s) });
ok(fresh.latestReplay.id === '12' && fresh.latestReplay.stream === 'Neuroscience & Yoga', 'a new replay becomes the latest');

const drop = buildMeditationHub({ ...base, plan: 'dropin' });
ok(drop.upcoming[0].own && drop.upcoming[0].open && drop.upcoming[0].url, 'a drop-in buyer’s own session (the one this week) is open');
ok(drop.upcoming.slice(1).every(s => !s.open && !s.url && !s.own), 'the other sessions are Pass only, with no link');
const rsvp = buildMeditationHub({ ...base, plan: 'dropin', rawEvents: events.map(e => e.id === 1002 ? { ...e, rsvped_event: true } : e), now: at('2026-10-20T14:00:00Z') });
ok(rsvp.upcoming.find(s => s.own).id === '1002', 'an RSVP marks the drop-in session');
for (const [label, hub] of [['drop-in', drop], ['not enrolled', buildMeditationHub({ ...base, plan: 'none' })]]) {
  const all = hub.sections.flatMap(s => s.lessons);
  ok(all.length === 2 && all.every(l => l.locked && !l.url), `${label}: replays are locked cards with no link into a lesson`);
  ok(hub.sections[0].name === 'Recent sessions' && hub.latestReplay.locked && hub.latestReplay.stream === 'Tantrik', `${label}: the site’s recent recordings stand in, with teacher and stream from Ops`);
}
const none = buildMeditationHub({ ...base, plan: 'none' });
ok(none.upcoming.every(s => !s.open && !s.url), 'not enrolled: no live link anywhere');
ok(JSON.stringify(none).indexOf('ss.example') < 0, 'not enrolled: nothing from Circle’s own pages reaches the page');
ok(buildMeditationHub({ ...base, plan: 'pass', viaWisdom: true }).viaWisdom === true, 'a Wisdom School member sees the Pass view with the Wisdom link');
const dead = buildMeditationHub({ ...base, plan: 'pass', rawSections: null });
ok(dead.sections[0].name === 'Recent sessions' && dead.replaysFromCircle === false, 'if the course can’t be read the page still shows something');
const bare = buildMeditationHub({ ...base, plan: 'pass', rawEvents: [], opsUpcoming: [], opsPast: [], rawSections: [] });
ok(bare.next === null && bare.nextFour.length === 0 && bare.latestReplay === null, 'nothing scheduled: no hero, no crash');
console.log('\nall meditation hub checks passed');
