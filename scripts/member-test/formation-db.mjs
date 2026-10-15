// Formation record against an in-memory Postgres (PGlite), with the real formation code.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/formation-db.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';

delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite();
const F = await import('../../lib/member/formation.js');
F._setSql((strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows));

assert.equal(F.COMPONENTS.reduce((a, c) => a + c.target, 0), 101, 'the design’s targets add up to 101; the total is capped at 100');
assert.equal(F.summarise(F.COMPONENTS.map(c => ({ component: c.id, hours: c.target }))).total, 100);
assert.equal(F.summarise(F.COMPONENTS.map(c => ({ component: c.id, hours: c.target }))).complete, true);
let r = await F.formationFor('maya@example.com');
assert.equal(r.total, 0); assert.equal(r.entries.length, 0); assert.equal(r.complete, false);

await assert.rejects(() => F.addEntry('jacob@x.com', { email: 'maya@example.com', component: 'nope', hours: 2, day: '2026-10-21' }), /Choose which part/);
await assert.rejects(() => F.addEntry('jacob@x.com', { email: 'maya@example.com', component: 'peer', hours: 0, day: '2026-10-21' }), /Hours should/);
await assert.rejects(() => F.addEntry('jacob@x.com', { email: 'maya@example.com', component: 'peer', hours: 2, day: 'soon' }), /Choose the date/);
await assert.rejects(() => F.addEntry('jacob@x.com', { email: 'nobody', component: 'peer', hours: 2, day: '2026-10-21' }), /Choose a mentee/);

r = await F.addEntry('jacob@x.com', { email: 'Maya@Example.com', component: 'immersions', hours: 6.5, day: '2026-10-21', note: '  Open Session  ' });
assert.equal(r.total, 6.5); assert.equal(r.entries[0].note, 'Open Session');
r = await F.addEntry('jacob@x.com', { email: 'maya@example.com', component: 'one-to-ones', hours: 0.75, day: '2026-10-28' });
assert.equal(r.total, 7.25); assert.equal(r.components.find(c => c.id === 'one-to-ones').done, 0.75);
assert.equal(r.next, 'observation', 'the next step is the least-complete component (first of the untouched)');

// Hours past a target don't count twice toward the 100
for (let i = 0; i < 3; i++) r = await F.addEntry('jacob@x.com', { email: 'maya@example.com', component: 'one-to-ones', hours: 3, day: '2026-11-01' });
const o = r.components.find(c => c.id === 'one-to-ones');
assert.equal(o.done, 9.75); assert.equal(o.credited, 6); assert.equal(r.total, 12.5);

// Other mentees are separate; totals for the mentor view
await F.addEntry('jacob@x.com', { email: 'sam@example.com', component: 'observation', hours: 2, day: '2026-10-22' });
assert.deepEqual(await F.formationTotals(['maya@example.com', 'sam@example.com', 'none@example.com']), { 'maya@example.com': 12.5, 'sam@example.com': 2 });

// Removing an entry only works for the right person
const id = r.entries[0].id;
r = await F.removeEntry('sam@example.com', id); assert.equal(r.total, 2, 'wrong person: nothing removed from maya');
assert.equal((await F.formationFor('maya@example.com')).entries.length, 5);
r = await F.removeEntry('maya@example.com', id); assert.equal(r.entries.length, 4);
await assert.rejects(() => F.removeEntry('maya@example.com', 'abc'), /Couldn’t find/);
console.log('formation: ok');
