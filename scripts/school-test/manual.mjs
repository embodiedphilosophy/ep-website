// The formation manual page: content integrity and the inline-text parser. Run: node --import ./scripts/ce-test/register.mjs scripts/school-test/manual.mjs
import assert from 'assert/strict';
const M = await import('../../lib/school/manual.js');

// 10 chapters, 83 sections (update when the Google Doc changes); every part in ORDER exists; section ids are unique
assert.equal(M.chapters.length, 10); assert.equal(M.chapters.reduce((n, c) => n + c.sections.length, 0), 83);
for (const id of M.ORDER) assert.ok(M.chapterOf(id), `chapter ${id} exists`);
const ids = M.chapters.flatMap(c => c.sections.map(s => s.id)); assert.equal(new Set(ids).size, ids.length, 'section ids are unique');
assert.equal(M.partParam('nope'), 'front'); assert.equal(M.partParam('part-iii'), 'part-iii'); assert.equal(M.partParam(undefined), 'front');

// every string parses: links well formed, no raw ** or stray _ or backslash left in the text
const strings = [];
const walk = b => { for (const k of ['s']) if (typeof b[k] === 'string') strings.push(b[k]); (b.items || []).forEach(x => (typeof x === 'string' ? strings.push(x) : null)); (b.head || []).forEach(x => strings.push(x)); (b.rows || []).forEach(r => r.forEach(x => strings.push(x))); };
for (const c of M.chapters) { c.blocks.forEach(walk); c.sections.forEach(s => s.blocks.forEach(walk)); }
assert.ok(strings.length > 500);
let links = 0;
for (const t of strings) {
  for (const g of M.segs(t)) {
    if (g.isLink) { links++; assert.match(g.href, /^(https?:\/\/|\?tab=)/); }
    if (g.isText) { assert.ok(!/\*\*/.test(g.text), `raw ** in: ${t.slice(0, 80)}`); assert.ok(!/\\/.test(g.text), `raw backslash in: ${t.slice(0, 80)}`); assert.ok(!/(^|[^A-Za-z0-9])_[^_\s]/.test(g.text) || /\*/.test(t), `stray _ in: ${t.slice(0, 80)}`); }
  }
}
assert.ok(links > 0);

// the parser
const r = M.segs('**Bold** and _italic_ and [Text] and [Uddyota] and [Interpretation] and [traditional], see [the year](https://www.embodiedphilosophy.com/school/mentee-year) and [a guide](https://claude.ai/artifact/abc) and [docs](https://docs.google.com/x) \\* done');
assert.deepEqual(r.filter(g => g.isChip).map(g => g.chip), ['mn-chip text', 'mn-chip uddyota', 'mn-chip interp', 'mn-chip trad']);
assert.deepEqual(r.filter(g => g.isLink).map(g => g.href), ['?tab=year', 'https://docs.google.com/x'], 'the year link stays on the page; the private Claude artifact is plain text');
assert.ok(M.plainOf('see [a guide](https://claude.ai/artifact/abc)').includes('a guide') && !M.segs('[a guide](https://claude.ai/artifact/abc)').some(g => g.isLink));
assert.equal(M.plainOf('a \\* b'), 'a * b', 'an escaped asterisk is kept');
assert.equal(M.segs('**Bold**')[0].style.fontWeight, 600);

// the views
assert.deepEqual(M.prevNext('front'), { prev: null, next: M.prevNext('front').next }); assert.equal(M.prevNext('front').next.id, 'part-i'); assert.equal(M.prevNext('part-v').next.href, '?tab=texts', 'after Part V comes the Texts tab'); assert.equal(M.partParam('appendix-a'), 'front', 'the appendices are not manual parts any more'); for (const id of M.APPENDICES) assert.ok(M.chapterOf(id)); assert.equal(M.hrefOf('appendix-b'), '?tab=texts&text=appendix-b'); assert.equal(M.prevNext('part-i').prev.id, 'front');
assert.equal(M.hrefOf('front'), '?tab=manual'); assert.equal(M.hrefOf('part-iii'), '?tab=manual&part=part-iii');
assert.ok(!M.chapterBlocks('front').some(b => b.t === 'p' && /^\*\*Reading the labels/.test(b.s)), 'the label key is drawn as a strip, not twice');
assert.ok(M.chapterBlocks('part-v').some(b => b.id === 'sources'), 'Part V ends with Appendices and sources');
const toc = M.tocFor('part-iii'); assert.equal(toc.length, 6); assert.equal(toc.filter(c => c.cur).length, 1); assert.ok(toc.find(c => c.id === 'part-iii').subs.length > 0);
assert.equal(M.titleOf('appendix-a').includes('Uddyota'), false, 'the long title is shortened in lists');
console.log('manual: ok');
