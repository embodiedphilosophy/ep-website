// lib/school/doc2manual.js gives exactly what scripts/manual/doc2manual.py gives, on a small doc that has every kind of block.
// Run: node --import ./scripts/ce-test/register.mjs scripts/school-test/doc2manual.mjs   (needs python3)
import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import { execFileSync } from 'child_process';
const { doc2manual, problemsWith } = await import('../../lib/school/doc2manual.js');

const run = (t, st = {}) => ({ textRun: { content: t, textStyle: st } });
const P = (els, style = 'NORMAL_TEXT', extra = {}) => ({ paragraph: { elements: els, paragraphStyle: { namedStyleType: style, ...(extra.indent ? { indentStart: { magnitude: 36 } } : {}) }, ...(extra.bullet ? { bullet: { listId: extra.bullet, nestingLevel: 0 } } : {}) } });
const body = [
  P([run('Sahṛdaya Upāya\n')], 'HEADING_1'), P([run('Teacher Formation\n')]), P([run('A manual for mentors\n')]), P([run('Contents\n')]), P([run('First Edition · 2026\n')]),
  P([run('How to use this manual\n')], 'HEADING_2'),
  P([run('Plain words with '), run('bold', { bold: true }), run(' and '), run('haṃsa', { italic: true }), run(' and a '), run('link', { link: { url: 'https://example.com/x' } }), run(' *star* under_score.\n')]),
  P([run('A note in italics only.\n', { italic: true })]),
  P([run('Part I. Why formation\n')], 'HEADING_2'),
  P([run('1. The twin trainings (prasiddhi)\n')], 'HEADING_3'),
  P([run('First item\n')], 'NORMAL_TEXT', { bullet: 'kO' }), P([run('Second item\n')], 'NORMAL_TEXT', { bullet: 'kO' }),
  P([run('Dot one\n')], 'NORMAL_TEXT', { bullet: 'kU' }),
  P([run('☐ Tick this\n')], 'NORMAL_TEXT', { bullet: 'kU' }),
  P([run('12. ', { italic: true }), run('The haṃsa utters itself\u000babiding in the breast\n', { italic: true })], 'NORMAL_TEXT', { indent: true }),
  P([run('Line one\u000bLine two\n')]),
  { table: { tableRows: [{ tableCells: [{ content: [P([run('Head A\n')])] }, { content: [P([run('Head B\n')])] }] }, { tableCells: [{ content: [P([run('a1\n')]), P([run('a2\n')])] }, { content: [P([run('b1\n', { bold: true })])] }] }] } },
  P([run('Overview of the part\n')], 'HEADING_4'), P([run('  \n')]),
  P([run('Appendix A. The Svacchandatantra, with Kṣemarāja\'s Uddyota\n')], 'HEADING_2'),
  P([run('[3] (MS 4) ', { italic: true }), run('verse text\n', { italic: true })], 'NORMAL_TEXT', { indent: true }),
];
const doc = { revisionId: 'rev1', tabs: [{ documentTab: { body: { content: body }, lists: { kO: { listProperties: { nestingLevels: [{ glyphType: 'DECIMAL' }] } }, kU: { listProperties: { nestingLevels: [{ glyphType: 'GLYPH_TYPE_UNSPECIFIED' }] } } } } }] };
const dir = fs.mkdtempSync(os.tmpdir() + '/d2m-'); fs.writeFileSync(dir + '/doc.json', JSON.stringify(doc));
execFileSync('python3', [new URL('../manual/doc2manual.py', import.meta.url).pathname, dir + '/doc.json', dir + '/out.json'], { stdio: 'ignore' });
const py = JSON.parse(fs.readFileSync(dir + '/out.json', 'utf8')), js = doc2manual(doc);
assert.deepEqual({ ...js, source: '', updated: undefined }, { ...py, source: '', updated: undefined });
assert.ok(js.chapters.length === 3 && js.chapters[1].sections.length === 2);
assert.ok(problemsWith(js).includes('missing part-ii'));
const real = JSON.parse(fs.readFileSync(new URL('../../data/sahrdaya-manual.json', import.meta.url)));
assert.deepEqual(problemsWith(real), [], 'the saved manual has every part');
console.log('doc2manual: ok (matches the Python)');
