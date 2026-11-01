// Self-logged hours: competencies, partner co-sign, returned entries and resend, against an in-memory Postgres (PGlite) with the real code.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/hours.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite(); const run = (strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows);
const F = await import('../../lib/member/formation.js'); F._setSql(run);
const maya = 'Maya@x.com', bo = 'bo@x.com';
const obs = { component: 'observation', hours: 1.5, day: '2026-10-28', detail: 'Session 1', competencies: ['attunement', 'speech', 'bogus'] };

assert.equal(F.COMPETENCIES.length, 6);
// observation needs a competency; unknown ones are dropped
await assert.rejects(() => F.addPending(maya, { ...obs, competencies: [] }), /at least one competency/); await assert.rejects(() => F.addPending(maya, { ...obs, competencies: ['bogus'] }), /at least one competency/);
let f = await F.addPending(maya, obs);
assert.deepEqual(f.entries[0].competencies, ['attunement', 'speech'], 'competencies kept, unknown ones dropped'); assert.equal(f.entries[0].status, 'pending');
const c = f.components.find(x => x.id === 'observation'); assert.deepEqual([c.credited, c.pending], [0, 1.5], 'logged hours show as pending, not as credited');

// practice-teaching: who watched
const pt = { component: 'practice-teaching', hours: 2, day: '2026-10-29', detail: 'Wednesday class' };
await assert.rejects(() => F.addPending(maya, { ...pt, watcher: '' }, { partners: [bo] }), /Choose who watched/);
await assert.rejects(() => F.addPending(maya, { ...pt, watcher: 'stranger@x.com' }, { partners: [bo] }), /Choose your partner/);
f = await F.addPending(maya, { ...pt, watcher: 'Bo@x.com' }, { partners: [bo] }); const awaitingId = f.entries[0].id;
assert.deepEqual([f.entries[0].status, f.entries[0].cosigner], ['awaiting_cosign', 'bo@x.com']);
assert.equal(f.components.find(x => x.id === 'practice-teaching').pending, 2, 'waiting for the co-sign still shows as pending hours');
assert.equal((await F.pendingEntries()).filter(e => e.component === 'practice-teaching').length, 0, 'Jacob does not see it until the partner has confirmed');
f = await F.addPending(maya, { ...pt, day: '2026-10-30', watcher: 'nobody' }, { partners: [bo] }); assert.equal(f.entries[0].status, 'pending', 'nobody watched: straight to Jacob');
await F.addPending(maya, { ...pt, day: '2026-10-31' }); assert.equal((await F.formationFor(maya)).entries[0].status, 'pending', 'a hand-in that offers hours has no watcher question');

// the partner sees it, and only the partner can answer
const list = await F.awaitingCosign('bo@x.com'); assert.deepEqual(list.map(x => [x.id, x.by, x.day, x.hours]), [[awaitingId, 'maya@x.com', '2026-10-29', 2]]);
assert.deepEqual(await F.awaitingCosign('other@x.com'), []); await assert.rejects(() => F.cosign('other@x.com', awaitingId, true), /find that/);
assert.deepEqual(await F.cosign('BO@x.com', awaitingId, true), []);
assert.ok((await F.pendingEntries()).some(e => e.id === awaitingId && e.cosigned), 'after the co-sign it is Jacob’s to confirm');
assert.deepEqual((await F.pendingEntries()).find(e => e.component === 'observation').competencies, ['Subtle attunement', 'Ethical speech'], 'Jacob sees the competency names');
// "that's not right" sends it back to the mentee with a note
f = await F.addPending(maya, { ...pt, day: '2026-11-02', watcher: bo }, { partners: [bo] }); const wrongId = f.entries[0].id;
await F.cosign(bo, wrongId, false); let e = (await F.formationFor(maya)).entries.find(x => x.id === wrongId);
assert.equal(e.status, 'returned'); assert.match(e.returnNote, /partner said they did not watch/);
// Jacob returns an entry with a note
const pend = (await F.pendingEntries()).find(x => x.component === 'observation'); await F.returnEntry(pend.id, '  Which session? Add the date.  ');
e = (await F.formationFor(maya)).entries.find(x => x.id === pend.id); assert.deepEqual([e.status, e.returnNote], ['returned', 'Which session? Add the date.']);
assert.equal((await F.pendingEntries()).some(x => x.id === pend.id), false); const w2 = (await F.addPending(maya, { ...pt, day: '2026-11-03', watcher: bo }, { partners: [bo] })).entries[0].id; await F.returnEntry(w2, 'x');
assert.equal((await F.formationFor(maya)).entries.find(x => x.id === w2).status, 'awaiting_cosign', 'only pending entries can be returned (not ones waiting for the partner)'); await F.removePending(maya, w2); assert.equal((await F.formationFor(maya)).entries.some(x => x.id === w2), false, 'a mentee can take back an entry still waiting');
assert.equal((await F.formationFor(maya)).components.find(x => x.id === 'observation').pending, 0, 'a returned entry is not pending hours');
// edit and resend: the same checks, a fresh start, the note cleared
await assert.rejects(() => F.resendEntry(maya, pend.id, { ...obs, competencies: [] }), /at least one competency/); await assert.rejects(() => F.resendEntry('bo@x.com', pend.id, obs), /find that/);
f = await F.resendEntry(maya, pend.id, { ...obs, day: '2026-10-27', detail: 'Session 1 with Nataraj' });
e = f.entries.find(x => x.id === pend.id); assert.deepEqual([e.status, e.returnNote, e.day, e.detail], ['pending', '', '2026-10-27', 'Session 1 with Nataraj']);
await F.resendEntry(maya, wrongId, { ...pt, day: '2026-11-02', watcher: 'nobody' }, { partners: [bo] }); assert.equal((await F.formationFor(maya)).entries.find(x => x.id === wrongId).status, 'pending');
await assert.rejects(() => F.resendEntry(maya, wrongId, obs), /find that/, 'only a returned entry can be resent');
// taking back an entry: pending, awaiting or returned, never a credited one
await F.resolveEntry(pend.id, true); await assert.rejects(async () => { await F.removePending(maya, pend.id); assert.ok((await F.formationFor(maya)).entries.some(x => x.id === pend.id), 'a confirmed entry stays'); throw new Error('stays'); }, /stays/);
console.log('hours: ok');
