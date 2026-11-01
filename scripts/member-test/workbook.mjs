// The Workbook page's data: Start Here, the immersions' lesson states by date, requirements by section name, progress count.
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/workbook.mjs
import assert from 'assert/strict';
const W = await import('../../lib/mentee/workbook.js');
const les = (id, name, done = false, extra = {}) => ({ id, name, progress: { status: done ? 'complete' : 'incomplete' }, ...extra });
const sections = [
  { id: 1, name: 'Start Here', lessons: [les(10, 'Welcome: How This Workbook Works', true), les(11, 'Your Year at a Glance'), les(12, 'The Practice & Study Imperative'), les(13, 'Your Monthly 1-on-1 with Jacob')] },
  { id: 2, name: '1 · Beneath the Pose · Nov 14–15, 2026', lessons: [les(20, 'Prepare: Beneath the Pose', true), les(21, 'Practicum'), les(22, 'Integrate')] },
  { id: 3, name: '2 · Tasting the Real · Dec 5–6, 2026', lessons: [les(30, 'Prepare'), les(31, 'Practicum'), les(32, 'Integrate')] },
  { id: 9, name: 'Completion Requirements', lessons: [les(90, 'Observation Hours (10 hrs)'), les(91, 'Final Report & Reflective Essay'), les(92, 'Competency Check: Open-Book Quiz', true), les(93, 'Certification')] },
];
const imms = [{ n: 2, title: 'Tasting the Real', sat: '2026-12-05', sun: '2026-12-06' }, { n: 1, title: 'Beneath the Pose', sat: '2026-11-14', sun: '2026-11-15' }];
const BASE = 'https://ss/c/apprentice-workbook';
let v = W.workbookView(sections, BASE, '2026-11-01', imms);
assert.deepEqual([v.total, v.done], [14, 3], 'counts every lesson (4 + 3 + 3 + 4), done ones too');
assert.equal(v.start.length, 4); assert.equal(v.start[0].done, true); assert.equal(v.start[1].url, `${BASE}/sections/1/lessons/11`);
assert.deepEqual(v.requirements.map(r => [r.name, r.note]), [['Observation hours', '10 hours, with notes against the six competencies'], ['Final report and reflective essay', 'By 31 July'], ['Competency check', 'An open-book quiz'], ['Certification', 'What happens in August']]);
assert.deepEqual(v.immersions.map(i => i.n), [1, 2], 'in date order'); assert.equal(v.immersions[0].current, true); assert.equal(v.immersions[1].current, false);
const a = v.immersions[0].lessons, b = v.immersions[1].lessons;
assert.deepEqual([a.prepare.state, a.practicum.state, a.integrate.state], ['done', 'locked', 'locked'], '1 Nov: Prepare done; Practicum opens on the Sunday; Integrate after');
assert.equal(a.practicum.url, '', 'a locked lesson has no link'); assert.deepEqual([a.prepare.opensOn, a.practicum.opensOn, a.integrate.opensOn], ['2026-10-31', '2026-11-15', '2026-11-16']);
assert.deepEqual([b.prepare.state, b.prepare.opensOn], ['locked', '2026-11-21']);
// the week of the weekend, then after it
v = W.workbookView(sections, BASE, '2026-11-14', imms); assert.deepEqual(Object.values(v.immersions[0].lessons).map(l => l.state), ['done', 'locked', 'locked']);
v = W.workbookView(sections, BASE, '2026-11-15', imms); assert.equal(v.immersions[0].lessons.practicum.state, 'open');
v = W.workbookView(sections, BASE, '2026-11-17', imms); assert.deepEqual(Object.values(v.immersions[0].lessons).map(l => l.state), ['done', 'due', 'open'], 'after the weekend: Practicum is due, Integrate is open'); assert.equal(v.immersions[0].current, true, 'Integrate still waiting: this one stays lit');
v = W.workbookView(sections, BASE, '2026-12-01', imms); assert.equal(v.immersions[0].lessons.integrate.state, 'open'); assert.equal(v.immersions[1].lessons.prepare.state, 'open', 'two weeks before the Saturday');
v = W.workbookView(sections, BASE, '2026-12-30', imms); assert.equal(v.immersions[0].lessons.integrate.state, 'due', 'three weeks after, still not done');
// Circle's own lock wins
const lockedSections = JSON.parse(JSON.stringify(sections)); lockedSections[1].lessons[1].locked = true;
v = W.workbookView(lockedSections, BASE, '2026-11-15', imms); assert.equal(v.immersions[0].lessons.practicum.state, 'locked'); assert.equal(v.immersions[0].lessons.practicum.url, '');
// nothing from Circle: an empty page that still has the immersions
v = W.workbookView([], BASE, '2026-11-01', imms); assert.deepEqual([v.total, v.done, v.start.length, v.immersions.length], [0, 0, 0, 2]);
console.log('workbook: ok');
