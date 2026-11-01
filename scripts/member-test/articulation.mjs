// Peer articulation: the checks (lib/mentee/articulation.js) and the store against an in-memory Postgres (PGlite), with the real code.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/articulation.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';
const A = await import('../../lib/mentee/articulation.js');

const allowed = ['bo@x.com', 'cy@x.com', 'di@x.com'];
const good = { day: '2026-10-28', hours: 1.3, present: ['Bo@x.com'], mine: 'paryavasāna', terms: { 'bo@x.com': 'prāṇāyāma' }, before: 'Relax your belly.', after: 'Let the belly be soft, and notice the breath.', reflected: 'You paused before "relax".' };
const c = A.cleanArticulation('Maya@x.com', good, allowed, '2026-11-01');
assert.deepEqual(c.present, ['maya@x.com', 'bo@x.com']); assert.equal(c.hours, 1.25, 'hours go to the nearest quarter'); assert.deepEqual(c.terms, { 'maya@x.com': 'paryavasāna', 'bo@x.com': 'prāṇāyāma' });
assert.equal(A.cleanArticulation('maya@x.com', { ...good, before: '', after: '' }, allowed, '2026-11-01').cueBefore, '', 'the cue line is optional');
const bad = (patch, re) => assert.throws(() => A.cleanArticulation('maya@x.com', { ...good, ...patch }, allowed, '2026-11-01'), re);
bad({ day: '' }, /Choose the date`?/); bad({ day: '2026-11-02' }, /already happened/); bad({ day: '2026-08-01' }, /last two months/);
bad({ hours: 0 }, /Hours should/); bad({ hours: 7 }, /Hours should/); bad({ hours: 'x' }, /Hours should/);
bad({ present: [] }, /Choose who/); bad({ present: ['maya@x.com'] }, /Choose who/, 'only yourself is nobody'); bad({ present: ['zed@x.com'] }, /from your cohort/); bad({ present: ['bo@x.com', 'cy@x.com', 'di@x.com'] }, /two or three/);
bad({ mine: ' ', terms: {} }, /Write what you articulated/); bad({ before: 'x', after: '' }, /both the line/);
assert.equal(A.cleanArticulation('maya@x.com', { ...good, present: ['bo@x.com', 'cy@x.com'] }, allowed, '2026-11-01').present.length, 3, 'a trio is two others');
assert.equal(A.summaryOf(c, 'bo@x.com'), 'Articulation: prāṇāyāma'); assert.equal(A.summaryOf({ terms: {} }, 'x@x.com'), 'Articulation: a session with your partner');
assert.equal(A.sameSession({ day: 'd', present: ['a', 'b'] }, { day: 'd', present: ['b', 'a', 'c'] }), true); assert.equal(A.sameSession({ day: 'd', present: ['a', 'b'] }, { day: 'e', present: ['a', 'b'] }), false); assert.equal(A.sameSession({ day: 'd', present: ['a', 'b'] }, { day: 'd', present: ['a', 'c'] }), false);

// the store
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite(); const run = (strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows);
const S = await import('../../lib/mentee/store.js'); const F = await import('../../lib/member/formation.js');
S._setSql(run); F._setSql(run);
const maya = { uid: 'u1', email: 'Maya@x.com', name: 'Maya' }, bo = { uid: 'u2', email: 'bo@x.com', name: 'Bo' };
const id = await S.addArticulation(maya, c, { season: 'fall-2026', rotation: 1 });
let m = await F.formationFor('maya@x.com'), b = await F.formationFor('bo@x.com');
assert.equal(m.components.find(x => x.id === 'peer').credited, 1.25, 'credited at once, no wait for Jacob'); assert.equal(m.entries[0].status, 'credited'); assert.equal(m.entries[0].note, 'Articulation: paryavasāna');
assert.equal(b.components.find(x => x.id === 'peer').credited, 1.25, 'and to the partner'); assert.equal(b.entries[0].note, 'Articulation: prāṇāyāma'); assert.equal(b.entries[0].detail, `articulation:${id}`);
// the partner logging the same session is refused, and nothing is credited twice
await assert.rejects(() => S.addArticulation(bo, A.cleanArticulation('bo@x.com', { ...good, present: ['maya@x.com'], mine: 'prāṇāyāma' }, ['maya@x.com'], '2026-11-01'), {}), /Maya logged this session already/);
assert.equal((await F.formationFor('bo@x.com')).entries.length, 1);
// another day is another session
await S.addArticulation(bo, A.cleanArticulation('bo@x.com', { ...good, day: '2026-10-30', present: ['maya@x.com'], mine: 'x', before: '', after: '' }, ['maya@x.com'], '2026-11-01'), {});
assert.equal((await F.formationFor('maya@x.com')).components.find(x => x.id === 'peer').credited, 2.5);
// the cue bank: only sessions with a cue line, newest first, no emails
const cues = await S.cueBank();
assert.deepEqual(cues.map(x => [x.who, x.day, x.before]), [['Maya', '2026-10-28', 'Relax your belly.']]); assert.ok(!JSON.stringify(cues).includes('@'), 'the cue bank carries names, never emails');
// only the one who logged it can take it back, and the hours go for everyone
await assert.rejects(() => S.removeArticulation('bo@x.com', id), /Only Maya can take/);
await S.removeArticulation('MAYA@x.com', id);
assert.equal((await F.formationFor('bo@x.com')).entries.length, 1, 'only the other session is left'); assert.equal((await S.cueBank()).length, 0);
await assert.rejects(() => S.removeArticulation('maya@x.com', 'nope'), /Couldn’t find/);
console.log('articulation: ok');
