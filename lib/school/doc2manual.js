// Google Docs API JSON (documents.get) → the manual's data (the shape of data/sahrdaya-manual.json). A line-for-line port of
// scripts/manual/doc2manual.py, so the page can read Jake's Google Doc directly (lib/school/manualsource.js) instead of waiting for
// someone to run the script. Pure: scripts/school-test/doc2manual.mjs checks it gives the same result as the Python.

const esc = s => s.replace(/\\/g, '\\\\').replace(/\*/g, '\\*').replace(/_/g, '\\_');

function runsOf(elements) {
  const rs = [];
  for (const r of elements || []) {
    const tr = r.textRun;
    if (!tr) continue;
    const t = String(tr.content || '').replace(/\n/g, '');
    if (!t) continue;
    const st = tr.textStyle || {};
    const key = [!!st.bold, !!st.italic, (st.link && st.link.url) || ''];
    if (t.trim() === '' && rs.length) { rs[rs.length - 1][0] += t; continue; }
    const last = rs[rs.length - 1];
    if (last && last[1].join('|') === key.join('|')) last[0] += t;
    else rs.push([t, key]);
  }
  return rs;
}
// Python's str.strip() and \s: whitespace incl. \x0b
const WS = '[\\s\\u000b]';
function wrap(t, key) {
  const [b, i, url] = key;
  const lead = t.match(new RegExp(`^${WS}*`))[0], trail = t.match(new RegExp(`${WS}*$`))[0], core = pyStrip(t);
  if (!core) return t;
  let x = esc(core);
  if (i) x = `_${x}_`;
  if (b) x = `**${x}**`;
  if (url) x = `[${x}](${url})`;
  return lead + x + trail;
}
const pyStrip = s => String(s).replace(new RegExp(`^${WS}+|${WS}+$`, 'g'), '');
const inline = elements => pyStrip(runsOf(elements).map(([t, k]) => wrap(t, k)).join(''));
function italicShare(elements) {
  let tot = 0, it = 0;
  for (const [t, k] of runsOf(elements)) {
    const n = t.replace(/[\s\d[\]().|\u000b]/g, '').length; tot += n;
    if (k[1]) it += n;
  }
  return tot ? it / tot : 0;
}
const plain = elements => pyStrip((elements || []).map(r => (r.textRun && r.textRun.content) || '').join(''));
// Python: lower → drop non-ASCII → runs of non [a-z0-9] become '-' → collapse → strip '-' → first 60
const slug = s => String(s).toLowerCase().replace(/[^\x00-\x7f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export function doc2manual(raw, { source = '', updated = '' } = {}) {
  const d = raw.content || raw;
  const doc = d.tabs ? d.tabs[0].documentTab : d; // a doc fetched without tabs has body/lists at the top
  const LISTS = doc.lists || {};
  const ordered = pa => {
    const lid = pa.bullet.listId, lvl = pa.bullet.nestingLevel || 0;
    const g = ((LISTS[lid] || {}).listProperties || {}).nestingLevels?.[lvl] || {};
    return ['DECIMAL', 'ALPHA', 'UPPER_ALPHA', 'ROMAN', 'UPPER_ROMAN'].includes(g.glyphType);
  };
  const front = {}, chapters = [];
  let ch = null, sec = null;
  const target = () => (sec ? sec.blocks : ch ? ch.blocks : null);
  const add = b => {
    const t = target();
    if (!t) return;
    const last = t[t.length - 1];
    if (['ul', 'ol', 'checks'].includes(b.t) && last && last.t === b.t) last.items.push(...b.items);
    else t.push(b);
  };

  for (const el of doc.body.content) {
    if (el.table) {
      const rows = el.table.tableRows.map(row => row.tableCells.map(cell => cell.content.filter(c => c.paragraph).map(c => inline(c.paragraph.elements)).filter(Boolean).join(' / ')));
      add({ t: 'table', head: rows[0], rows: rows.slice(1) });
      continue;
    }
    if (!el.paragraph) continue;
    const pa = el.paragraph, ps = pa.paragraphStyle || {}, kind = ps.namedStyleType;
    let txt = plain(pa.elements);
    if (!txt) continue;
    if (ch === null && kind !== 'HEADING_2') {
      txt = txt.replace(new RegExp(`${WS}*\\u000b${WS}*`, 'g'), ' ');
      if (kind === 'HEADING_1') front.title = txt;
      else if (txt === 'Contents') { /* the table of contents heading */ }
      else if (!('eyebrow' in front)) front.eyebrow = txt;
      else if (!('subtitle' in front)) front.subtitle = txt;
      else front.edition = txt;
      continue;
    }
    if (kind === 'HEADING_2') {
      const m = /^(Part [IVX]+|Appendix [A-Z])\.\s*(.*)$/s.exec(txt);
      const [label, title] = m ? [m[1], m[2]] : ['', txt];
      const cid = label ? slug(label) : slug(txt);
      ch = { id: cid, label, title, kind: label.startsWith('Appendix') ? 'appendix' : label ? 'part' : 'front', blocks: [], sections: [] };
      chapters.push(ch); sec = null;
      continue;
    }
    if (kind === 'HEADING_3' || kind === 'HEADING_4') {
      sec = { id: `${ch.id}-${slug(txt)}`, title: txt, level: kind === 'HEADING_3' ? 3 : 4, blocks: [] };
      ch.sections.push(sec);
      continue;
    }
    const s = inline(pa.elements);
    const runs = pa.elements.filter(r => r.textRun && pyStrip(r.textRun.content)).map(r => r.textRun);
    const allit = runs.every(r => (r.textStyle || {}).italic);
    if (pa.bullet) {
      if (txt.startsWith('☐')) add({ t: 'checks', items: [s.replace(/^☐\s*/, '')] });
      else add({ t: ordered(pa) ? 'ol' : 'ul', items: [s] });
    } else if (italicShare(pa.elements) > 0.6 && (txt.includes('\u000b') || ps.indentStart)) {
      const lines = plain(pa.elements).split('\u000b').map(pyStrip).filter(Boolean);
      const v = { t: 'verse', lines };
      const m = /^(\d+\.|\[\d+\](?:\s*\(MS \d+\))?)\s*/.exec(lines[0]);
      if (m) {
        v.n = m[1].replace(/\.+$/, ''); const rest = pyStrip(lines[0].slice(m[0].length));
        v.lines = (rest ? [rest] : []).concat(lines.slice(1));
      }
      add(v);
    } else if (txt.includes('\u000b')) {
      add({ t: 'lines', items: s.split('\u000b').map(pyStrip).filter(Boolean) });
    } else if (allit && runs.length) {
      add({ t: 'note', s: s.replace(/^_(.*)_$/, '$1') });
    } else add({ t: 'p', s });
  }
  for (const c of chapters) for (const x of c.sections) x.id = x.id.slice(0, 70);
  return { source, revision: d.revisionId || '', updated, front, chapters };
}

// The parts the pages need; a doc missing one (a renamed heading, say) is not used, and the last good version stays up
export const REQUIRED = ['how-to-use-this-manual', 'part-i', 'part-ii', 'part-iii', 'part-iv', 'part-v', 'appendix-a', 'appendix-b', 'appendix-c', 'appendices-and-sources'];
export function problemsWith(m) {
  const ids = new Set((m.chapters || []).map(c => c.id)), out = REQUIRED.filter(id => !ids.has(id)).map(id => `missing ${id}`);
  const secs = (m.chapters || []).flatMap(c => c.sections.map(s => s.id));
  if (secs.length !== new Set(secs).size) out.push('two sections with the same heading');
  return out;
}
