// Mentee reflections: the pure helpers and the store against an in-memory Postgres (PGlite), with the real code.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/reflections.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';
const R = await import('../../lib/mentee/reflections.js');

assert.equal(R.hoursEach(), 0.67, '6 hours over 9 reflections'); assert.equal(R.COUNT_TARGET, 9);
assert.deepEqual(R.paragraphs('One.\n\n  Two.  \nThree.'), ['One.', 'Two.', 'Three.']);
assert.deepEqual(R.changedParagraphs('A\nB', 'A\nB2\nC').map(p => p.changed), [false, true, true], 'paragraphs new or changed since the version before');
assert.deepEqual(R.changedParagraphs('', 'A\nB').map(p => p.changed), [false, false], 'the first version has nothing to compare with');
assert.deepEqual(R.cleanReflection({ title: '  ', body: 'The pose was never the point, and more words here for later.' }), { title: 'The pose was never the point, and', body: 'The pose was never the point, and more words here for later.' }, 'no title: the first words');
assert.throws(() => R.cleanReflection({ body: '  ' }), /Write something first/); assert.throws(() => R.cleanReflection({ body: 'x'.repeat(20001) }), /20,000/);
assert.deepEqual([R.stepOf({ status: 'draft' }), R.stepOf({ status: 'shared', sharedVersions: 1 }), R.stepOf({ status: 'shared', sharedVersions: 2 }), R.stepOf({ status: 'posted', sharedVersions: 2 })], [1, 2, 3, 4]);
assert.equal(R.postContent('T', 'Body').body, 'Body\n\nFrom the Sahṛdaya Upāya cohort');
assert.deepEqual(R.reflectionRows([{ id: 5, title: 'T', day: '2026-11-06' }, { id: 6, title: 'Old', day: '2026-09-01' }], '2026-10-21'), [{ id: 'auto-reflection-5', component: 'reflections', hours: 0.67, day: '2026-11-06', note: 'Posted to Sādhana School: T', status: 'credited', auto: true }], 'counts when posted, from the season start');
assert.equal(R.cardLine({ version: 2, status: 'shared' }, 3), 'Version 2 · 3 comments from the cohort · ready when you are'); assert.equal(R.cardLine({ version: 1, status: 'draft' }, 0), 'Version 1 · a draft, only you can see it'); assert.equal(R.cardLine(null, 0), '');

delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite(); const run = (strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows);
const S = await import('../../lib/mentee/reflectionstore.js'); S._setSql(run);
const maya = { email: 'Maya@x.com', name: 'Maya' }, bo = { email: 'bo@x.com', name: 'Bo' }, jacob = { email: 'jacob@x.com', name: 'Jacob', admin: true };
const id = await S.createDraft(maya, { title: 'The pose was never the point', body: 'First paragraph.\nSecond paragraph.' }, { season: 'fall-2026', month: '2026-11', topic: 'The Same Condition' });
// a draft is private
assert.equal((await S.listReflections(bo)).length, 0); await assert.rejects(() => S.getReflection(bo, id), /find that/);
assert.equal((await S.listReflections(maya))[0].step, 1);
await S.saveDraft(maya, id, { title: 'The pose was never the point', body: 'First paragraph.\nSecond paragraph, better.' });
await assert.rejects(() => S.saveDraft(bo, id, { body: 'x' }), /Only the author/);
await assert.rejects(() => S.addComment(bo, id, { kind: 'landed', body: 'Nice' }), /hasn’t been shared/);
// sharing puts it in front of the cohort
assert.equal(await S.shareVersion(maya, id), 1); await assert.rejects(() => S.shareVersion(maya, id), /already shared/);
let list = await S.listReflections(bo); assert.equal(list.length, 1); assert.deepEqual([list[0].step, list[0].unread, list[0].mine, list[0].author], [2, true, false, 'Maya']);
await assert.rejects(() => S.saveDraft(maya, id, { body: 'edit after sharing' }), /Press Revise/);
// feedback: three kinds, a reply, no feedback on your own
const c1 = await S.addComment(bo, id, { kind: 'landed', body: 'The line about Triangle stayed with me.' });
const c2 = await S.addComment(jacob, id, { kind: 'suggestion', body: 'Try the next version without the title.' });
await S.addComment(maya, id, { parentId: c1, body: 'Thank you.' });
await assert.rejects(() => S.addComment(bo, id, { kind: 'nonsense', body: 'x' }), /Choose what kind/); await assert.rejects(() => S.addComment(maya, id, { kind: 'landed', body: 'x' }), /other people/); await assert.rejects(() => S.addComment(bo, id, { kind: 'landed', body: ' ' }), /Write something/);
const reply2 = await S.addComment(bo, id, { parentId: (await S.getReflection(maya, id)).comments.find(c => c.parent).id, body: 'Reply to the reply stays one level deep.' });
let d = await S.getReflection(maya, id);
assert.equal(d.comments.length, 4); assert.ok(d.comments.filter(c => c.parent).every(c => c.parent === c1), 'replies stay one level deep'); assert.equal(d.comments.find(c => c.id === c1).kind, 'landed');
assert.equal((await S.listReflections(maya))[0].comments, 4);
// reading marks it read for the reader; a new version makes it unread again
await S.getReflection(bo, id); assert.equal((await S.listReflections(bo))[0].unread, false);
// revise from the feedback: version 2 starts from version 1, earlier versions are kept, the cohort sees only shared versions
assert.equal(await S.startRevision(maya, id), 2); assert.equal(await S.startRevision(maya, id), 2, 'a second press does not make a third');
await S.saveDraft(maya, id, { title: 'Version two', body: 'First paragraph.\nA new second paragraph.\nA third.' });
assert.equal((await S.getReflection(bo, id)).versions.length, 1, 'the cohort still sees version 1'); assert.equal((await S.getReflection(maya, id)).workingN, 2);
await S.setAddressed(maya, id, [c1], 2); await assert.rejects(() => S.setAddressed(bo, id, [c1], 2), /Only the author/);
assert.equal(await S.shareVersion(maya, id), 2);
assert.equal((await S.listReflections(bo))[0].unread, true, 'a new shared version is new to those who read the old one');
d = await S.getReflection(bo, id);
assert.deepEqual(d.versions.map(v => [v.n, v.shared]), [[1, true], [2, true]]); assert.deepEqual(d.versions[1].paragraphs.map(p => p.changed), [false, true, true], 'the changed paragraphs are marked'); assert.equal(d.step, 3);
assert.equal(d.comments.find(c => c.id === c1).addressedIn, 2); assert.equal(d.comments.find(c => c.id === c2).addressedIn, null);
await S.setAddressed(maya, id, [], 2); assert.equal((await S.getReflection(maya, id)).comments.find(c => c.id === c1).addressedIn, null, 'un-ticking clears it');
// posting to Sādhana School
await assert.rejects(() => S.finalVersion(bo, id), /Only the author/);
const fv = await S.finalVersion(maya, id); assert.equal(fv.version.n, 2);
await S.markPosted(id, { postId: 'p99', url: 'https://ss.example/p/99' }); await S.markPosted(id, { postId: 'p100', url: 'x' });
let st = await S.postedState(maya, id); assert.deepEqual([st.status, st.postId], ['posted', 'p99'], 'posting twice keeps the first post');
assert.equal((await S.getReflection(maya, id)).step, 4); await assert.rejects(() => S.discardDraft(maya, id), /draft that/);
let sum = await S.summaryFor(maya, '2026-11'); assert.deepEqual([sum.mine.status, sum.mine.version, sum.posted.length], ['posted', 2, 1]); assert.equal(sum.posted[0].title, 'Version two');
// take down: back to shared, the Circle post forgotten
await S.markUnposted(maya, id); st = await S.postedState(maya, id); assert.deepEqual([st.status, st.postId], ['shared', '']);
assert.equal((await S.summaryFor(maya, '2026-11')).posted.length, 0, 'a taken-down reflection no longer counts');
// a draft can be deleted; a shared one cannot
const id2 = await S.createDraft(maya, { body: 'Another one.' }, { month: '2026-12' }); await S.discardDraft(maya, id2); assert.equal((await S.listReflections(maya)).length, 1);
assert.equal((await S.summaryFor(bo, '2026-11')).unread, 0, 'bo has read it');
console.log('reflections: ok');
