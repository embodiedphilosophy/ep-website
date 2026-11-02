// The Texts tab: the three appendices as a shelf and passage cards. Run: node --import ./scripts/ce-test/register.mjs scripts/school-test/texts.mjs
import assert from 'assert/strict';
const T = await import('../../lib/school/texts.js');
const M = await import('../../lib/school/manual.js');

// every appendix section lands exactly once: as front notes, a passage, a group's part, a group head, or end notes
for (const id of T.TEXT_IDS) {
  const t = T.textOf(id), ch = M.chapterOf(id);
  const seen = [...t.front, ...t.back].map(x => x.id).concat(t.passages.flatMap(p => (p.group ? [p.id, ...p.items.map(x => x.id)] : [p.id])));
  assert.deepEqual([...seen].sort(), ch.sections.map(s => s.id).sort(), `${id}: every section shown once`);
  assert.ok(t.count > 0 && t.minutes > 0);
  const s = T.shelfOf(id); assert.ok(s.start, `${id}: the good first passage exists`); assert.equal(s.href, `?tab=texts&text=${id}`);
}
const A = T.textOf('appendix-a'), B = T.textOf('appendix-b'), C = T.textOf('appendix-c');
assert.equal(A.count, 18); assert.equal(A.front.length, 1); assert.equal(A.back.length, 2);
assert.equal(A.passages.filter(p => p.flag).map(p => p.num).join(','), '15,17,18');
assert.deepEqual(B.passages.filter(p => p.flag).map(p => p.num), ['IV', 'V', 'VI']); assert.equal(B.back[0].title, 'Textual notes');
assert.deepEqual(C.passages.filter(p => p.group).map(p => [p.num, p.items.length]), [['C7', 6], ['C8', 4], ['C9', 5]]);

// titles
assert.deepEqual(T.splitTitle('C7.1 THE TOPKNOT AS ATTENTION TO EVERY BREATH (TA 6.22–23)'), { num: 'C7.1', title: 'The topknot as attention to every breath', ref: 'TA 6.22–23' });
assert.deepEqual(T.splitTitle('C9.3 BREATH DEVOURS TIME (ANONYMOUS MAHĀNAYAPRAKĀŚA 2.15–17)'), { num: 'C9.3', title: 'Breath devours time', ref: 'Anonymous Mahānayaprakāśa 2.15–17' });
assert.deepEqual(T.splitTitle('2. The keystone: Śiva, Sun, Self and Breath are all Haṃsa (7.29–30)'), { num: '2', title: 'The keystone: Śiva, Sun, Self and Breath are all Haṃsa', ref: '7.29–30' });
assert.equal(T.splitTitle('A NOTE ON THE TRANSLITERATION').title, 'A note on the transliteration');
assert.equal(A.passages[1].ref, 'ST 7.29–30'); assert.equal(B.passages.find(p => p.num === 'I').ref, 'vv. 1–2');

// paragraph roles
assert.equal(T.roleOf({ t: 'p', s: '**Translation.** "Śiva…"' }), 'tr'); assert.equal(T.roleOf({ t: 'p', s: '**Commentary.** x' }), 'cm');
assert.equal(T.roleOf({ t: 'p', s: '**Note.** x' }), 'nt'); assert.equal(T.roleOf({ t: 'p', s: 'plain' }), ''); assert.equal(T.roleOf({ t: 'verse' }), '');
assert.equal(T.textParam('appendix-c'), 'appendix-c'); assert.equal(T.textParam('x'), '');
console.log('texts: ok');
assert.deepEqual(T.rolesOf([{ t: 'verse' }, { t: 'p', s: 'He is…' }, { t: 'p', s: '**Commentary.**' }, { t: 'p', s: '"And…"' }, { t: 'verse' }, { t: 'p', s: '**Note.** x' }, { t: 'p', s: 'after' }]), ['', 'tr', 'cm', 'cm', '', 'nt', '']);
console.log('roles: ok');
assert.equal(T.splitTitle('C8.4 THE HAṂSA MANTRA THAT EVERY BEING REPEATS (VBH 152–156 IN THE FILE\'S NUMBERING)').ref, "VBH 152–156 in the file's numbering");
assert.equal(T.splitTitle('C8.3 "I AM THE SUPREME HAṂSA" (KAUMUDĪ ON VBH 65 AND 91)').ref, 'Kaumudī on VBH 65 and 91');
console.log('refs: ok');
