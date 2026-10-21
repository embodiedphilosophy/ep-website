// Offline checks for the reading list ("book of the month"): which month shows, required vs suggested, and the Amazon links.
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/books.mjs
import assert from 'assert/strict';
const B = await import('../../lib/mentee/books.js');

const rows = [
  { month: '1', starts: '2026-10-21', theme: 'The Condition', kind: 'required', title: 'Education’s End', author: 'Anthony Kronman' },
  { month: '2', starts: '2026-11-01', theme: 'The Same Condition, Closer to Home', kind: 'required', title: 'The Truth of Yoga', author: 'Daniel Simpson', audio: 'Audible' },
  { month: '2', starts: '', theme: '', kind: 'Suggested', title: 'Yoga Body', author: 'Mark Singleton' },
  { month: '3', starts: '2026-12-01', theme: 'The Pivot', kind: 'required', title: 'What Is Ancient Philosophy?', author: 'Pierre Hadot', asin: 'b000abcdef' },
  { month: '4', starts: '2027-01-01', theme: 'Hidden month', kind: 'required', title: 'Hidden', publish: 'FALSE' },
  { month: '5', starts: 'soon', theme: 'No start date', kind: 'required', title: 'Undated' },
  { month: 'x', starts: '2026-11-01', title: 'No month' },
  { month: '6', starts: '2027-03-01', theme: 'No title', kind: 'required', title: '' },
];
let b = B.booksFrom(rows, '2026-10-21');
assert.equal(b.current.month, 1); assert.equal(b.current.required[0].title, 'Education’s End'); assert.equal(b.next.month, 2); assert.equal(b.total, 3, 'only months with a start date, a book and not hidden');
assert.deepEqual(b.all.map(m => [m.month, m.now, m.past]), [[1, true, false], [2, false, false], [3, false, false]]);
b = B.booksFrom(rows, '2026-11-15');
assert.equal(b.current.month, 2, 'the month moves on by itself'); assert.equal(b.current.theme, 'The Same Condition, Closer to Home');
assert.deepEqual([b.current.required.map(x => x.title), b.current.suggested.map(x => x.title)], [['The Truth of Yoga'], ['Yoga Body']], 'suggested rows join the month of their number');
assert.equal(b.current.required[0].audio, 'Audible'); assert.equal(b.next.month, 3);
assert.deepEqual(b.all.map(m => [m.month, m.now, m.past]), [[1, false, true], [2, true, false], [3, false, false]]);
b = B.booksFrom(rows, '2027-02-01'); assert.equal(b.current.month, 3, 'after the last start date the last month stays'); assert.equal(b.next, null);
b = B.booksFrom(rows, '2026-09-01'); assert.equal(b.current, null, 'before the first month nothing is current'); assert.equal(b.next.month, 1);
assert.equal(B.booksFrom([], '2026-10-21').current, null);

// Amazon: UK students go to .co.uk, everyone else .com
assert.equal(B.amazonHost('Europe/London', 'en-US'), 'www.amazon.co.uk'); assert.equal(B.amazonHost('America/New_York', 'en-GB'), 'www.amazon.co.uk', 'a UK-language browser abroad still gets .co.uk');
assert.equal(B.amazonHost('America/New_York', 'en-US'), 'www.amazon.com'); assert.equal(B.amazonHost('Australia/Sydney', 'en-AU'), 'www.amazon.com'); assert.equal(B.amazonHost('', ''), 'www.amazon.com');
const [req] = B.booksFrom(rows, '2026-11-15').current.required;
assert.equal(B.amazonUrl(req, 'www.amazon.com'), 'https://www.amazon.com/s?k=The%20Truth%20of%20Yoga%20Daniel%20Simpson&i=stripbooks', 'a search for the title and author');
assert.equal(B.amazonUrl(B.booksFrom(rows, '2026-12-05').current.required[0], 'www.amazon.co.uk'), 'https://www.amazon.co.uk/dp/B000ABCDEF', 'a direct link when the Amazon id is given');
console.log('books: ok');
