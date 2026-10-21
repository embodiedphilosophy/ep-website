// Offline checks for the mentee polls (mentorship orientation survey): time parsing, what mentees see, what they may submit.
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/polls.mjs
import assert from 'assert/strict';
const P = await import('../../lib/mentee/polls.js');

// Times in ET / UK / UTC → UTC (BST ends 25 Oct 2026; US clocks change 1 Nov 2026)
assert.equal(P.parseSlot('2026-10-24 10:00 ET'), '2026-10-24T14:00:00.000Z', 'EDT is UTC-4');
assert.equal(P.parseSlot('2026-10-24 15:00 UK'), '2026-10-24T14:00:00.000Z', 'BST is UTC+1');
assert.equal(P.parseSlot('2026-10-25 15:00 UK'), '2026-10-25T15:00:00.000Z', 'the UK clocks have gone back by Sunday afternoon');
assert.equal(P.parseSlot('2026-11-02 09:00 ET'), '2026-11-02T14:00:00.000Z', 'EST is UTC-5');
assert.equal(P.parseSlot('2026-10-24T09:30 utc'), '2026-10-24T09:30:00.000Z');
for (const bad of ['', 'Saturday 10am', '2026-10-24 10:00', '2026-13-24 10:00 ET', '2026-10-24 25:00 ET', '2026-10-24 10:00 PST']) assert.equal(P.parseSlot(bad), '', bad);

const rows = [
  { poll: 'orientation', title: 'Mentorship orientation', note: 'About 60 minutes, on Zoom.', start: '2026-10-24 10:00 ET', closes: '2026-10-23 18:00 ET', publish: '' },
  { poll: 'orientation', start: '2026-10-24 14:00 ET' },
  { poll: 'orientation', start: '2026-10-25 10:00 ET' },
  { poll: 'orientation', start: '2026-10-25 12:00 ET', publish: 'FALSE' },
  { poll: 'orientation', start: 'soon' },
  { poll: '', start: '2026-10-25 10:00 ET' },
];
const before = Date.parse('2026-10-22T12:00:00Z');
let p = P.pollsFrom(rows, { orientation: ['2026-10-24T14:00:00.000Z'] }, before);
assert.equal(p.length, 1); assert.equal(p[0].title, 'Mentorship orientation'); assert.equal(p[0].note, 'About 60 minutes, on Zoom.');
assert.deepEqual(p[0].options.map(o => [o.start, o.mine]), [['2026-10-24T14:00:00.000Z', true], ['2026-10-24T18:00:00.000Z', false], ['2026-10-25T14:00:00.000Z', false]], 'sorted, hidden and invalid rows left out, own picks marked');
assert.equal(p[0].closed, false);
assert.equal(P.pollsFrom(rows, {}, Date.parse('2026-10-23T23:00:00Z')).length, 0, 'closed without a decision: no longer shown');

// A confirmed time replaces the survey, then goes away
const fin = rows.map((r, i) => i === 2 ? { ...r, final: 'Yes', link: 'https://zoom.us/j/1' } : r);
p = P.pollsFrom(fin, {}, before);
assert.equal(p[0].closed, true); assert.deepEqual(p[0].final, { start: '2026-10-25T14:00:00.000Z', link: 'https://zoom.us/j/1' });
assert.equal(P.pollsFrom(fin, {}, Date.parse('2026-10-25T15:00:00Z')).length, 1, 'still shown during the session');
assert.equal(P.pollsFrom(fin, {}, Date.parse('2026-10-25T17:00:00Z')).length, 0, 'gone two hours after');
assert.equal(P.pollsFrom([{ ...fin[2], link: 'javascript:alert(1)' }, { ...fin[0] }], {}, before)[0].final.link, '', 'only https links');

// Submitting
const open = P.pollsFrom(rows, {}, before);
assert.deepEqual(P.checkVotes(open, 'orientation', ['2026-10-24T14:00:00.000Z', '2026-10-24T14:00:00.000Z']), ['2026-10-24T14:00:00.000Z'], 'duplicates collapse');
assert.deepEqual(P.checkVotes(open, 'orientation', []), [], 'clearing all picks is allowed');
assert.throws(() => P.checkVotes(open, 'orientation', ['2026-10-26T14:00:00.000Z']), /isn’t an option/);
assert.throws(() => P.checkVotes(open, 'nope', []), /isn’t open/);
assert.throws(() => P.checkVotes(P.pollsFrom(fin, {}, before), 'orientation', []), /closed/);
console.log('polls: ok');
