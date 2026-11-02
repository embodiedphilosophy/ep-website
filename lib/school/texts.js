// The texts tab on /school/mentee-year (?tab=texts): the manual's three appendices (the translations), moved out of the manual and laid out
// as a small library — a shelf of three texts, then one text at a time as numbered passage cards that open one by one.
// Same source as the manual (data/sahrdaya-manual.json via lib/school/manual.js). Pure helpers (no network): scripts/school-test/texts.mjs.
import { chapters, SUBS, MENTORS_NOTE } from './manual.js';

export const TEXT_IDS = ['appendix-a', 'appendix-b', 'appendix-c'];
const CH = Object.fromEntries(chapters.map(c => [c.id, c]));

// How each text is shown on the shelf: a friendly title, a Devanagari mark, an accent, and a good first passage
export const SHELF = {
  'appendix-a': { title: 'The Svacchandatantra', sub: 'Paṭala 7, with Kṣemarāja’s Uddyota', mark: 'स्व', accent: 'pine', start: 'appendix-a-2-the-keystone-iva-sun-self-and-breath-are-all-hasa-7-2930', refPrefix: 'ST ' },
  'appendix-b': { title: 'The Haṃsasāra', sub: 'The Essence of the Haṃsa', mark: 'हं', accent: 'indigo', start: 'appendix-b-i-the-goddess-asks-12', refPrefix: 'vv. ' },
  'appendix-c': { title: 'Supporting passages', sub: 'From the Pratyabhijñā, Spanda and Krama texts, the Tantrāloka and the Vijñānabhairava', mark: 'त', accent: 'ochre', start: 'appendix-c-c8-1-the-first-breath-practices-vbh-2427', refPrefix: '' },
};
export const textParam = t => (TEXT_IDS.includes(t) ? t : '');
export const textHref = (id, hash) => `?tab=texts${id ? `&text=${id}` : ''}${hash ? `#${hash}` : ''}`;

// Front and back matter: shown apart from the numbered passages
const FRONT = /-(orienting-note|a-note-on-the-text)$/;
const BACK = /-(colophon-note|a-note-on-the-transliteration|textual-notes)$/;
// Passages flagged for mentors (from the manual's own cautions): ST 7 passages 15, 17, 18 stay out of beginner classes; Haṃsasāra IV–VI are mentors' study only
const FLAGS = {
  'appendix-a': { re: /^appendix-a-(15|17|18)-/, tag: 'Not for beginner classes' },
  'appendix-b': { re: /^appendix-b-(iv|v|vi)-/, tag: 'Mentors’ study only' },
};

// ---- titles: "C7.1 THE TOPKNOT AS ATTENTION TO EVERY BREATH (TA 6.22–23)" → { num: 'C7.1', title: 'The topknot as attention to every breath', ref: 'TA 6.22–23' } ----
const isCaps = s => /\p{L}/u.test(s) && s === s.toUpperCase();
const LOWER = new Set(['in', 'the', 'on', 'and', 'of', 'a', 'to', 'quoted', 'introduction', 'numbering', 'file’s', "file's", 'anonymous', 'with']);
const capWord = w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const fixRef = r => {
  if (!isCaps(r)) return r;
  const out = r.split(/(\s+)/).map(w => (/^\s+$/.test(w) ? w : LOWER.has(w.toLowerCase()) ? w.toLowerCase() : /^[A-Z]{1,3}$/.test(w.replace(/[^\p{L}]/gu, '')) ? w : capWord(w))).join('');
  return out.charAt(0).toUpperCase() + out.slice(1);
};
const sentence = t => { const s = t.toLowerCase().replace(/\bhaṃsa\b/g, 'haṃsa'); return s.replace(/^(["“]?)(\p{L})/u, (m, q, c) => q + c.toUpperCase()); };
export function splitTitle(raw) {
  let t = String(raw).trim(), num = '', ref = '';
  const n = t.match(/^((?:C\d+(?:\.\d+)?)|\d+|[IVX]+)\.?\s+/);
  if (n) { num = n[1]; t = t.slice(n[0].length); }
  const r = t.match(/\s*\(([^()]+)\)\s*$/);
  if (r) { ref = fixRef(r[1].trim()); t = t.slice(0, r.index).trim(); }
  if (isCaps(t)) t = sentence(t);
  return { num, title: t, ref };
}

// ---- reading time: words in a list of blocks ----
const words = s => (String(s).match(/\S+/g) || []).length;
const blockWords = b => (b.s ? words(b.s) : 0) + (b.lines || []).reduce((n, l) => n + words(l), 0) + (b.items || []).reduce((n, x) => n + words(x), 0);
export const minutesOf = blocks => Math.max(1, Math.round(blocks.reduce((n, b) => n + blockWords(b), 0) / 170));

// A paragraph's part in a passage, for its look: the translation, the commentary, a note, or plain
export function roleOf(b) {
  if (!b || b.t !== 'p') return '';
  if (/^\*\*(Translation|Gist|Sūtra|vv?\.\s|\[)/.test(b.s)) return 'tr';
  if (/^\*\*(Commentary|From the commentary)/.test(b.s)) return 'cm';
  if (/^\*\*Note/.test(b.s)) return 'nt';
  return '';
}

// Roles across a passage: a plain paragraph straight after a verse is its translation; plain paragraphs after a commentary label carry on the commentary
export function rolesOf(blocks) {
  let prev = '', inCm = false;
  return blocks.map(b => {
    let r = roleOf(b);
    if (b.t !== 'p') { inCm = false; prev = b.t; return ''; }
    if (!r && prev === 'verse') r = 'tr';
    else if (!r && inCm) r = 'cm';
    inCm = r === 'cm'; prev = 'p';
    return r;
  });
}

// One passage card: { id, num, title, ref, flag, verses, minutes, blocks }
const passage = (textId, s) => {
  const { num, title, ref } = splitTitle(s.title), f = FLAGS[textId];
  const pre = SHELF[textId].refPrefix;
  return { id: s.id, num, title, ref: ref && pre && /^\d/.test(ref) ? pre + ref : ref, flag: f && f.re.test(s.id) ? f.tag : '', verses: s.blocks.filter(b => b.t === 'verse').length, minutes: minutesOf(s.blocks), blocks: s.blocks };
};

// The shelf card for one text
export function shelfOf(id) {
  const ch = CH[id], sh = SHELF[id], list = textOf(id);
  const start = list.passages.flatMap(p => (p.group ? p.items : [p])).find(p => p.id === sh.start);
  return { id, href: textHref(id), label: ch.label, ...sh, about: SUBS[id], count: list.count, minutes: list.minutes, flagged: !!FLAGS[id], start: start ? { href: textHref(id, start.id), num: start.num, title: start.title, ref: start.ref } : null };
}

// One text, ready to draw: intro blocks, "before you begin" notes, passages (C7–C9 grouped with their numbered parts), and notes at the end
export function textOf(id) {
  const ch = CH[id];
  const intro = ch.blocks, front = [], back = [], passages = [];
  for (const s of ch.sections) {
    if (FRONT.test(s.id)) { front.push({ id: s.id, title: splitTitle(s.title).title, blocks: s.blocks }); continue; }
    if (BACK.test(s.id)) { back.push({ id: s.id, title: splitTitle(s.title).title, blocks: s.blocks }); continue; }
    const p = passage(id, s), parent = passages[passages.length - 1];
    if (p.num && /^C\d+$/.test(p.num) && ch.sections.some(x => x.title.startsWith(`${p.num}.`) && /^C\d+\.\d/.test(x.title))) { passages.push({ ...p, group: true, items: [] }); continue; }
    if (parent && parent.group && p.num.startsWith(`${parent.num}.`)) { parent.items.push(p); continue; }
    passages.push(p);
  }
  const all = passages.flatMap(p => (p.group ? p.items : [p]));
  return { id, label: ch.label, ...SHELF[id], intro, mentors: MENTORS_NOTE[id] || '', front, back, passages, count: all.length, minutes: all.reduce((n, p) => n + p.minutes, 0) };
}

// The texts either side of this one
export function siblings(id) {
  const i = TEXT_IDS.indexOf(id), at = j => (j < 0 || j >= TEXT_IDS.length ? null : { id: TEXT_IDS[j], href: textHref(TEXT_IDS[j]), label: CH[TEXT_IDS[j]].label, title: SHELF[TEXT_IDS[j]].title });
  return { prev: at(i - 1), next: at(i + 1) };
}

// Opens the passage named in the address (#id) and wires the Open all / Close all buttons. No framework code: a few lines inline.
export const TEXTS_SCRIPT = `(function(){function open(){var h=decodeURIComponent(location.hash.slice(1));if(!h)return;var el=document.getElementById(h);if(!el)return;var d=el.closest('details')||(el.tagName==='DETAILS'?el:null);if(d){d.open=true;}el.scrollIntoView({block:'start'})}window.addEventListener('hashchange',open);open();document.querySelectorAll('[data-tx-all]').forEach(function(b){b.addEventListener('click',function(){var o=b.getAttribute('data-tx-all')==='open';document.querySelectorAll('details.tx-p').forEach(function(d){d.open=o})})})})()`;
