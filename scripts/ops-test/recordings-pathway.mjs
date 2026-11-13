// Run: node --import ./scripts/ce-test/register.mjs scripts/ops-test/recordings-pathway.mjs
// A learning pathway session (Christian Mysticism) gets its "Watch the recording" link on its own session page in the
// pathway's space, plus the lesson in the year course; a Wisdom School session the same day still gets its own page.
import assert from 'node:assert/strict';
import { planRecording } from '../../lib/recordings.js';
const row = { date: '2026-11-12', time: '9am ET', title: 'Christian Mysticism: A Learning Pathway — Knowing Through Love', program: 'wisdom', series: 'christian-mysticism-pathway', zoom_link: 'https://us02web.zoom.us/j/86705298805', status: '' };
const lecture = { date: '2026-11-12', time: '6pm ET', title: 'Monthly Lecture', program: 'wisdom', series: '', zoom_link: 'https://us02web.zoom.us/j/111', status: '' };
const events = [
  { id: 1, name: 'Christian Mysticism · Live Session 1', space_id: 2929518, starts_at: '2026-11-12T14:00:00Z', url: 'https://ss/cm1', body: '' },
  { id: 2, name: 'Monthly lecture', space_id: 2897428, starts_at: '2026-11-12T23:00:00Z', url: 'https://ss/lec', body: '' },
];
const cm = planRecording({ rows: [row, lecture], events, sections: {}, meetingId: '86705298805', topic: 'x', start: '2026-11-12T13:55:00Z' });
assert.deepEqual(cm.actions.map(a => [a.type, a.space_id, a.event_id || a.section_id]), [['lesson', 2897436, 1212923], ['comment', 2929518, 1]]);
const lec = planRecording({ rows: [row, lecture], events, sections: {}, meetingId: '111', topic: 'x', start: '2026-11-12T22:58:00Z' });
assert.deepEqual(lec.actions.map(a => [a.type, a.space_id, a.event_id || a.section_id]), [['lesson', 2897436, 1212923], ['event', 2897428, 2]]);
console.log('ok   pathway session: lesson in the year course + a comment (not a rewrite) on its own session page; same-day lecture keeps its page');
