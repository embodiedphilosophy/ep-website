// Articulation partners chosen by the mentees each month: the pure rules (lib/mentee/pairing.js).
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/pairing.mjs
import assert from 'assert/strict';
import * as P from '../../lib/mentee/pairing.js';
const fails = (fn, re, why) => assert.throws(fn, e => re.test(e.message), why);

const cohort = ['ana', 'ben', 'cy', 'dee', 'eli'].map(n => ({ email: `${n}@x.com`, name: n[0].toUpperCase() + n.slice(1) }));
const row = (g, n) => ({ group_id: String(g), email: `${n}@x.com`, name: n });

// nobody paired yet: everyone else is free, nothing to join
let v = P.pairingView('ana@x.com', cohort, []);
assert.equal(v.mine, null); assert.deepEqual(v.open.map(p => p.email), ['ben@x.com', 'cy@x.com', 'dee@x.com', 'eli@x.com']); assert.equal(v.alone, false); assert.deepEqual(v.joinable, []);
assert.equal(P.checkChoose('ana@x.com', 'BEN@x.com', cohort, []), 'ben@x.com', 'emails are matched in any case');
fails(() => P.checkChoose('ana@x.com', 'ana@x.com', cohort, []), /^Choose/);
fails(() => P.checkChoose('ana@x.com', 'zed@x.com', cohort, []), /^Choose someone from your cohort/);
fails(() => P.checkJoin('ana@x.com', '1', cohort, []), /^There are still people/, 'no joining a pair while people are free');

// two pairs formed: Eli is the one left over and may join either pair, making a three
const rows = [row(1, 'ana'), row(1, 'ben'), row(2, 'cy'), row(2, 'dee')];
v = P.pairingView('ana@x.com', cohort, rows);
assert.deepEqual(v.partners.map(p => p.email), ['ben@x.com']); assert.deepEqual(v.open.map(p => p.email), ['eli@x.com']);
fails(() => P.checkChoose('ana@x.com', 'eli@x.com', cohort, rows), /^You already have a partner/);
fails(() => P.checkChoose('eli@x.com', 'cy@x.com', cohort, rows), /^That person has just found a partner/);
v = P.pairingView('eli@x.com', cohort, rows);
assert.equal(v.alone, true); assert.deepEqual(v.joinable.map(g => g.id), ['1', '2']);
assert.equal(P.checkJoin('eli@x.com', 2, cohort, rows), '2');

// once a pair is three it can't be joined again
const three = [...rows, row(2, 'eli')], six = [...cohort, { email: 'fay@x.com', name: 'Fay' }];
fails(() => P.checkJoin('fay@x.com', '2', six, three), /^That pair is already a three/);
assert.equal(P.checkJoin('fay@x.com', '1', six, three), '1', 'but the other pair can be');
assert.deepEqual(P.pairingView('cy@x.com', six, three).partners.map(p => p.email).sort(), ['dee@x.com', 'eli@x.com'], 'a three sees both others');
assert.deepEqual(P.groupsFrom(three).map(g => g.members.length), [2, 3]);
console.log('pairing: ok');
