// The texts tab on /school/mentee-year (lib/mentee/texts.js). No network.
// Run: node --import ./scripts/ce-test/register.mjs scripts/ops-test/mentee-texts.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { textsFor, parseReadBullet, isReadBullet } from '../../lib/mentee/texts.js';
const data = JSON.parse(readFileSync(new URL('../../data/mentee-year.json', import.meta.url)));

assert.ok(isReadBullet('**Read** X, _Y_') && !isReadBullet('**Read a little** of the book'));
const p = parseReadBullet('**Read** Michael Polanyi, _The Tacit Dimension_. ~Suggested: Jean Lave and Etienne Wenger, _Situated Learning_.~ Reflection due ^Mon 31 May^.');
assert.deepEqual([p.required[0].author, p.required[0].title, p.suggested[0].author, p.suggested[0].title, p.due], ['Michael Polanyi', 'The Tacit Dimension', 'Jean Lave and Etienne Wenger', 'Situated Learning', 'Mon 31 May']);
const w = parseReadBullet(data.months.find(m => m.id === '2027-06').items.find(isReadBullet));
assert.equal(w.required[0].note, 'the essay on the right use of school studies'); assert.equal(w.suggested[0].note, 'optional');
assert.equal(parseReadBullet('**Read** Anthony Kronman, _Education\'s End_ Reflection due ^Sat 31 Oct^.').required[0].note, '');

// no sheet rows: read from the page, one entry per month with a book, every one with a required book and a due date
const page = textsFor(data.months, [], [], '2026-11-02');
assert.equal(page.source, 'page'); assert.ok(page.months.length >= 9);
assert.ok(page.months.every(m => m.required.length === 1 && m.required[0].title && m.due));
assert.equal(page.months.filter(m => m.current).map(m => m.id).join(), '2026-11');

// sheet rows win, grouped by start month; Mentee Months reflection_due overrides the bullet date
const rows = [{ month: '1', starts: '2026-11-01', theme: 'T', kind: 'required', title: 'Book A', author: 'Auth' }, { month: '1', starts: '2026-11-01', kind: 'suggested', title: 'Book B', author: 'B' }, { month: '2', starts: '2026-12-01', kind: 'required', title: 'Hidden', publish: 'No' }];
const s = textsFor(data.months, rows, [{ month: '2026-11', reflection_due: '2026-11-28' }], '2026-11-02');
assert.equal(s.source, 'sheet'); assert.equal(s.months.length, 1);
assert.deepEqual([s.months[0].id, s.months[0].required[0].title, s.months[0].suggested[0].title, s.months[0].due, s.months[0].theme], ['2026-11', 'Book A', 'Book B', 'Sat 28 Nov', 'T']);
console.log('mentee-texts ok');
