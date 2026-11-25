// The monthly articulation pairs against an in-memory Postgres (PGlite), with the real store code.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/pairs-db.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite();
const S = await import('../../lib/mentee/store.js');
const { groupsFrom } = await import('../../lib/mentee/pairing.js');
S._setSql((strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows));
const who = n => ({ email: `${n}@x.com`, name: n });
const fails = (p, re) => assert.rejects(p, e => re.test(e.message));
const groups = async () => groupsFrom(await S.pairRows('fall-2026', '2026-12')).map(g => g.members.map(m => m.name).sort().join('+'));

await S.addPair('fall-2026', '2026-12', who('ana'), who('ben'));
await fails(S.addPair('fall-2026', '2026-12', who('cy'), who('ben')), /^That person has just found a partner/);
assert.deepEqual(await groups(), ['ana+ben'], 'a failed pair leaves nothing half-written');
await S.addPair('fall-2026', '2026-12', who('cy'), who('dee'));
const [g1] = groupsFrom(await S.pairRows('fall-2026', '2026-12'));
await S.joinPair('fall-2026', '2026-12', g1.id, who('eli'));
await fails(S.joinPair('fall-2026', '2026-12', g1.id, who('fay')), /^That pair is already a three/);
assert.deepEqual(await groups(), ['ana+ben+eli', 'cy+dee']);
await S.leavePair('fall-2026', '2026-12', 'eli@x.com'); assert.deepEqual(await groups(), ['ana+ben', 'cy+dee'], 'a three becomes a pair');
await S.leavePair('fall-2026', '2026-12', 'cy@x.com'); assert.deepEqual(await groups(), ['ana+ben'], 'a pair dissolves and the other person is free');
await S.leavePair('fall-2026', '2026-12', 'nobody@x.com');
assert.deepEqual(await S.pairRows('fall-2026', '2027-01'), [], 'months are separate');
console.log('pairs db: ok');
