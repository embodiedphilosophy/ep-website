// Offline checks for the peer-partner setup (Settings → Peer partners): grouping, the sheet diff, suggestions, and what mentees see.
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/partners.mjs
import assert from 'assert/strict';
const P = await import('../../lib/ops/partners.js');
const C = await import('../../lib/mentee/content.js');

assert.deepEqual(P.monthsFrom('2026-11-20', 3), ['2026-11', '2026-12', '2027-01']); assert.equal(P.monthLabel('2026-11'), 'November 2026');
assert.equal(P.defaultMonth('2026-10-21'), '2026-11'); assert.equal(P.defaultMonth('2026-10-19'), '2026-10'); assert.equal(P.defaultMonth('2026-12-25'), '2027-01');
const tab = [
  { row: 2, values: { season: 'fall-2026', month: '2026-11', email_a: 'A@x.com', email_b: 'b@x.com', publish: '' } },
  { row: 3, values: { season: 'fall-2026', month: 'November', email_a: 'c@x.com', email_b: 'd@x.com', publish: '' } }, // typed by hand with a month name
  { row: 4, values: { season: 'fall-2026', month: '2026-12', email_a: 'a@x.com', email_b: 'c@x.com' } },
  { row: 5, values: { season: 'fall-2026', month: '2026-11', email_a: 'e@x.com', email_b: 'f@x.com', publish: 'FALSE' } },
];
const ex = P.monthRows(tab, '2026-11', 'fall-2026');
assert.deepEqual(ex.map(r => r.row), [2, 3, 5], 'rows for November only, by ISO month or month name; the hidden one is included for the diff');
assert.deepEqual(P.groupsFrom(ex.filter(r => !r.hidden)), [['a@x.com', 'b@x.com'], ['c@x.com', 'd@x.com']]);
assert.deepEqual(P.groupsFrom([{ a: 'a@x.com', b: 'b@x.com' }, { a: 'a@x.com', b: 'c@x.com' }, { a: 'b@x.com', b: 'c@x.com' }]), [['a@x.com', 'b@x.com', 'c@x.com']], 'three pairs are one group of three');

// groups → pairs
assert.deepEqual(P.pairsOf([['a@x.com', 'b@x.com', 'c@x.com'], ['d@x.com', 'e@x.com'], ['f@x.com']]), [['a@x.com', 'b@x.com'], ['a@x.com', 'c@x.com'], ['b@x.com', 'c@x.com'], ['d@x.com', 'e@x.com']], 'a group of three is three pairs; an unfinished group is skipped');
assert.throws(() => P.pairsOf([['a@x.com', 'b@x.com'], ['b@x.com', 'c@x.com']]), /more than one group/);
assert.throws(() => P.pairsOf([['a@x.com', 'A@x.com']]), /themselves/);
assert.throws(() => P.pairsOf([['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com']]), /two or three/);

// The sheet diff: keep what is unchanged, hide what is gone, show again what returns, add what is new. Never deletes.
const nameOf = e => ({ 'a@x.com': 'Ann', 'g@x.com': 'Gus', 'f@x.com': 'Fay', 'e@x.com': 'Eli' })[e] || e;
const d = P.diffPairs(ex, [['a@x.com', 'b@x.com'], ['e@x.com', 'f@x.com'], ['g@x.com', 'a@x.com']], { ym: '2026-11', season: 'fall-2026', nameOf });
assert.deepEqual(d.updates.map(u => [u.row, u.changes.publish]), [[3, 'FALSE'], [5, '']], 'c–d is hidden, e–f comes back');
assert.deepEqual(d.adds, [{ season: 'fall-2026', month: '2026-11', email_a: 'g@x.com', email_b: 'a@x.com', name_a: 'Gus', name_b: 'Ann', publish: '' }]);
assert.deepEqual(P.diffPairs(ex.filter(r => !r.hidden), [['a@x.com', 'b@x.com'], ['c@x.com', 'd@x.com']], { ym: '2026-11', season: 'fall-2026' }), { updates: [], adds: [] }, 'saving with no change changes nothing');
assert.equal(P.diffPairs([...ex, { row: 9, a: 'b@x.com', b: 'a@x.com', hidden: false, values: {} }], [['a@x.com', 'b@x.com']], { ym: '2026-11', season: 'x' }).updates.filter(u => u.row === 9).length, 1, 'a duplicate row is hidden');

// Suggestions
const cohort = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(x => x + '@x.com');
const hist = new Set(['a@x.com|b@x.com', 'c@x.com|d@x.com']);
const s1 = P.suggestGroups(cohort, hist, 1);
assert.equal(s1.length, 4); assert.deepEqual(s1.flat().sort(), cohort); assert.equal(P.repeatsIn(s1, hist), 0, 'avoids earlier pairs when it can');
assert.deepEqual(P.suggestGroups(cohort, hist, 1), s1, 'the same seed gives the same suggestion'); assert.notDeepEqual(P.suggestGroups(cohort, hist, 2), s1, 'a new seed gives another');
const odd = P.suggestGroups(cohort.slice(0, 7), new Set(), 3); assert.deepEqual(odd.map(g => g.length).sort(), [2, 2, 3], 'an odd cohort makes one group of three');
assert.deepEqual(P.suggestGroups(['a@x.com'], new Set(), 1), []); assert.equal(P.suggestGroups(['a@x.com', 'b@x.com'], new Set([P.pairKey('a@x.com', 'b@x.com')]), 1).length, 1, 'two people repeat if there is no other choice');

// What a mentee sees: every partner, hidden pairs ignored, a trio shows both others
const rows = [
  { season: 'fall-2026', month: '2026-11', email_a: 'a@x.com', email_b: 'b@x.com', name_a: 'Ann', name_b: 'Bo' },
  { season: 'fall-2026', month: '2026-11', email_a: 'a@x.com', email_b: 'c@x.com', name_a: 'Ann', name_b: 'Cy' },
  { season: 'fall-2026', month: '2026-11', email_a: 'b@x.com', email_b: 'c@x.com', name_a: 'Bo', name_b: 'Cy' },
  { season: 'fall-2026', month: '2026-11', email_a: 'a@x.com', email_b: 'z@x.com', publish: 'FALSE' },
];
const pa = C.partnerFor(rows, 'A@x.com', 'fall-2026', '2026-11-03');
assert.deepEqual(pa.partners.map(p => p.name), ['Bo', 'Cy']); assert.equal(pa.name, 'Bo and Cy'); assert.equal(pa.month, 'november');
assert.deepEqual(C.partnerFor(rows, 'c@x.com', 'fall-2026', '2026-11-03').partners.map(p => p.name), ['Ann', 'Bo']);
assert.equal(C.partnerFor(rows, 'a@x.com', 'fall-2026', '2026-12-03'), null, 'nothing for December');
console.log('partners: ok');
