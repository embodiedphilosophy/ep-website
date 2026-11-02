// The Sahṛdaya Upāya Formation Manual as a reading page (/school/mentee-year?tab=manual): data/sahrdaya-manual.json, made from Jake's Google Doc by
// scripts/manual/doc2manual.py. Pure helpers (no network): scripts/school-test/manual.mjs.
import M from '../../data/sahrdaya-manual.json';

// The appendices (the translations) are on their own tab now (?tab=texts, lib/school/texts.js); old ?part=appendix-x links are sent there
export const ORDER = ['front', 'part-i', 'part-ii', 'part-iii', 'part-iv', 'part-v'];
export const APPENDICES = ['appendix-a', 'appendix-b', 'appendix-c'];
export const ROMAN = { 'part-i': 'I', 'part-ii': 'II', 'part-iii': 'III', 'part-iv': 'IV', 'part-v': 'V' };
export const SUBS = {
  'part-i': 'Why formation; the twin trainings; prasiddhi; the six competencies; the eight immersions; the hundred hours.',
  'part-ii': 'The year at a glance, the reading list, your year step by step, and preparing the two final projects.',
  'part-iii': 'The theory in seven claims, the beginner talk, the five-minute practice, instruction language, vocabulary, images, cautions.',
  'part-iv': 'Session 1, the inspirational talk; Session 2, theory and the haṃsa-upadeśa; Session 3, questions; guardrails.',
  'part-v': 'Requirements for completion, preparing the certification project, and what it shows.',
  'appendix-a': 'Every haṃsa passage of paṭala 7 with Kṣemarāja’s Uddyota, from 7.10 to 7.315.',
  'appendix-b': 'The full text, verses 1–54, with textual notes.',
  'appendix-c': 'PH 17–18, MM 56, the Spanda passages, Tantrāloka 6 and the Vijñānabhairava.',
};
export const MENTORS_NOTE = {
  'appendix-a': 'The tenfold yoga (7.293), the nectar visualization (7.217–225) and the death-omens in this chapter stay out of beginner classes (Part III, Cautions).',
  'appendix-b': 'Sections IV–VI are for mentors’ study only. The secret technique (HS 32–36, [53]–[54]) stays out of beginner classes (Part III, Cautions).',
};
export const front = M.front;
export const updated = M.updated;
const CH = Object.fromEntries(M.chapters.map(c => [c.id, c]));
export const chapters = M.chapters;
export const chapterOf = id => (id === 'front' ? CH['how-to-use-this-manual'] : CH[id]);
// Anything not in ORDER (or missing) opens Start here
export const partParam = p => (ORDER.includes(p) ? p : 'front');
export const hrefOf = id => (id === 'front' ? '?tab=manual' : APPENDICES.includes(id) ? `?tab=texts&text=${id}` : `?tab=manual&part=${id}`);
const strip = t => String(t).replace(/, with Kṣemarāja's Uddyota$/, '');
export const labelOf = id => (id === 'front' ? 'Start here' : ROMAN[id] ? `Part ${ROMAN[id]}` : CH[id].label);
export const titleOf = id => (id === 'front' ? 'How to use this manual' : strip(CH[id].title));
export const shortSection = t => String(t).replace(/\s*\(.*?\)\s*$/, '').replace(/^(\d+)\. /, '$1 · ');

// The blocks of one view: the chapter's own blocks, then each section (h3, or h4) with its blocks. Part V ends with "Appendices and sources".
export function chapterBlocks(id) {
  const ch = chapterOf(id);
  let list = ch.blocks.slice();
  ch.sections.forEach(s => { list.push({ t: s.level === 4 ? 'h4' : 'h3', id: s.id, title: s.title }); list = list.concat(s.blocks); });
  if (id === 'front') list = list.filter(b => !(b.t === 'p' && /^\*\*Reading the labels/.test(b.s)));
  if (id === 'part-v') {
    const src = CH['appendices-and-sources'];
    list.push({ t: 'h3', id: 'sources', title: 'Appendices and sources' }); list = list.concat(src.blocks);
    src.sections.forEach(s => { list.push({ t: 'h3', id: s.id, title: s.title }); list = list.concat(s.blocks); });
  }
  return list;
}
// Contents: every part, with the current one open to its sections
export function tocFor(cur) {
  return ORDER.map(id => ({
    id, href: hrefOf(id), cur: id === cur, label: labelOf(id), title: titleOf(id), grp: '',
    subs: id === cur && id !== 'front' ? CH[id].sections.map(s => ({ href: `#${s.id}`, title: shortSection(s.title), h4: s.level === 4 })) : [],
  }));
}
export function prevNext(id) {
  const i = ORDER.indexOf(id), at = j => (j < 0 || j >= ORDER.length ? null : { id: ORDER[j], href: hrefOf(ORDER[j]), label: labelOf(ORDER[j]), title: titleOf(ORDER[j]) });
  // after Part V the next stop is the Texts tab
  return { prev: at(i - 1), next: id === 'part-v' ? { id: 'texts', href: '?tab=texts', label: 'Seminal Texts', title: 'The translations' } : at(i + 1) };
}
export const cardOf = id => ({ id, href: hrefOf(id), label: labelOf(id), title: titleOf(id), sub: SUBS[id], count: `${CH[id].sections.length} sections` });

// ---- inline text: **bold** _italic_ ~quiet~ ^date^ [label](url) [Text]-style labels, \ escapes → flat styled runs ----
const CHIPS = { Text: 'mn-chip text', Uddyota: 'mn-chip uddyota', Interpretation: 'mn-chip interp', traditional: 'mn-chip trad' };
// The year page stays on the page; private Claude artifacts are shown as plain text (they will not open for mentees); everything else is kept
export function linkFor(url) {
  const u = String(url);
  if (/^https:\/\/(www\.)?embodiedphilosophy\.com\/school\/mentee-year\/?(#.*)?$/.test(u)) return '?tab=year';
  if (/^https:\/\/claude\.ai\/artifact\//.test(u)) return null;
  return u;
}
export function segs(text, st) {
  st = st || {};
  const out = [];
  const re = /\\(.)|\*\*((?:\\.|[^*])+?)\*\*|(?<![A-Za-z0-9])_((?:\\.|[^_])+?)_(?![A-Za-z0-9])|~(.+?)~|\^(.+?)\^|\[(Text|Uddyota|Interpretation|traditional)\]|\[((?:\\.|[^\]])+)\]\((https?:[^)\s]+)\)/g;
  let last = 0, m;
  const key = s => [s.b, s.i, s.q, s.d].join('');
  const style = s => ({ ...(s.b ? { fontWeight: 600 } : {}), ...(s.i ? { fontStyle: 'italic' } : {}), ...(s.q ? { color: '#5A5346' } : {}), ...(s.d ? { font: '500 12.5px "IBM Plex Mono", monospace' } : {}) });
  const run = (t, s) => ({ isText: !s.href, isLink: !!s.href, isChip: false, href: s.href || '', text: t, key: key(s), style: style(s) });
  const push = (t, s) => { if (!t) return; const p = out[out.length - 1]; if (p && p.isText && !p.href && p.key === key(s)) { p.text += t; return; } out.push(run(t, s)); };
  while ((m = re.exec(text))) {
    push(text.slice(last, m.index), st);
    if (m[1] !== undefined) push(m[1], st);
    else if (m[2] !== undefined) out.push(...segs(m[2], { ...st, b: true }));
    else if (m[3] !== undefined) out.push(...segs(m[3], { ...st, i: true }));
    else if (m[4] !== undefined) out.push(...segs(m[4], { ...st, q: true }));
    else if (m[5] !== undefined) out.push(...segs(m[5], { ...st, d: true }));
    else if (m[6] !== undefined) out.push({ isText: false, isLink: false, isChip: true, chip: CHIPS[m[6]], text: `[${m[6]}]` });
    else if (m[7] !== undefined) {
      const href = linkFor(m[8]);
      if (href) out.push(...segs(m[7], { ...st, href }).map(x => ({ ...x, isText: false, isLink: true, isChip: false, href })));
      else out.push(...segs(m[7], st));
    }
    last = re.lastIndex;
  }
  push(text.slice(last), st);
  return out;
}
export const plainOf = t => segs(t).map(x => x.text).join('');
