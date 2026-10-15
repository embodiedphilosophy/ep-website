// The certificate of completion as a PDF (US Letter, landscape), in the EP look: ivory ground, terra and
// ochre rules, Cormorant Garamond headings, Inter details. Fonts are bundled in lib/ce/fonts (Latin + Latin
// Extended, so names and titles with diacritics print correctly).
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { longDate } from './rules';

const hex = h => { const n = parseInt(h.slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
const C = { ivory: hex('#FAF5EB'), terra: hex('#A5432A'), deep: hex('#83341F'), ochre: hex('#B98A3E'), pine: hex('#20302A'), ink: hex('#1E1A14'), soft: hex('#5A5346'), line: hex('#D8C9AE') };

let fontBytes = null;
async function fonts() {
  if (fontBytes) return fontBytes;
  const dir = path.join(process.cwd(), 'lib', 'ce', 'fonts');
  const [head, italic, body, bold] = await Promise.all(['Cormorant-SemiBold.ttf', 'Cormorant-MediumItalic.ttf', 'Inter-Regular.ttf', 'Inter-SemiBold.ttf'].map(f => readFile(path.join(dir, f))));
  return (fontBytes = { head, italic, body, bold });
}


// cert: a ce_certs row. opts: { yacepId, verify } → Uint8Array
export async function certificatePdf(cert, { yacepId = '', verify = '' } = {}) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Certificate of Completion · ${cert.title}`);
  doc.setAuthor('Embodied Philosophy');
  doc.setSubject(`${cert.hours} CE hours · ${cert.category}`);
  const f = await fonts();
  const head = await doc.embedFont(f.head, { subset: true });
  const italic = await doc.embedFont(f.italic, { subset: true });
  const body = await doc.embedFont(f.body, { subset: true });
  const bold = await doc.embedFont(f.bold, { subset: true });

  const W = 792, H = 612;
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.ivory });
  page.drawRectangle({ x: 26, y: 26, width: W - 52, height: H - 52, borderColor: C.terra, borderWidth: 1.6 });
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: C.ochre, borderWidth: 0.7 });

  // Centred text, shrunk to fit the width if needed
  const centre = (text, y, font, size, color, maxW = W - 150, spacing = 0) => {
    let s = size;
    const width = sz => font.widthOfTextAtSize(text, sz) + spacing * Math.max(0, text.length - 1);
    while (width(s) > maxW && s > 8) s -= 0.5;
    const w = width(s);
    if (!spacing) page.drawText(text, { x: (W - w) / 2, y, size: s, font, color });
    else { let x = (W - w) / 2; for (const ch of text) { page.drawText(ch, { x, y, size: s, font, color }); x += font.widthOfTextAtSize(ch, s) + spacing; } }
    return s;
  };

  // Masthead
  const mast = 'Embodied Philosophy';
  const mw = head.widthOfTextAtSize(mast, 17) + 1.5 * (mast.length - 1);
  centre(mast, 532, head, 17, C.ink, W, 1.5);
  page.drawLine({ start: { x: (W - mw) / 2 - 58, y: 538 }, end: { x: (W - mw) / 2 - 12, y: 538 }, thickness: 0.7, color: C.ochre });
  page.drawLine({ start: { x: (W + mw) / 2 + 12, y: 538 }, end: { x: (W + mw) / 2 + 58, y: 538 }, thickness: 0.7, color: C.ochre });
  centre('WISDOM SCHOOL PLUS · LEARNING PATHWAY', 512, bold, 7.5, C.soft, W, 2.6);

  centre('Certificate of Completion', 452, head, 42, C.terra);
  centre('This certifies that', 418, body, 10.5, C.soft);
  centre(cert.name, 368, italic, 42, C.ink, W - 180);
  page.drawLine({ start: { x: W / 2 - 165, y: 358 }, end: { x: W / 2 + 165, y: 358 }, thickness: 0.7, color: C.line });
  centre('has completed the Learning Pathway', 334, body, 10.5, C.soft);
  centre(cert.title, 302, head, 26, C.ink, W - 180);

  // Details row
  const top = 270, bot = 222, left = 70, right = W - 70, cols = 4, cw = (right - left) / cols;
  page.drawLine({ start: { x: left, y: top }, end: { x: right, y: top }, thickness: 0.7, color: C.line });
  page.drawLine({ start: { x: left, y: bot }, end: { x: right, y: bot }, thickness: 0.7, color: C.line });
  const cells = [['CE HOURS', String(cert.hours)], ['EDUCATIONAL CATEGORY', cert.category || ''], ['COMPLETED', longDate(cert.issued_at)], ['FORMAT', 'Online, self-paced']];
  cells.forEach(([label, value], i) => {
    const x = left + i * cw + 10;
    if (i) page.drawLine({ start: { x: left + i * cw, y: bot }, end: { x: left + i * cw, y: top }, thickness: 0.7, color: C.line });
    let lx = x; for (const ch of label) { page.drawText(ch, { x: lx, y: 252, size: 6.8, font: bold, color: C.deep }); lx += bold.widthOfTextAtSize(ch, 6.8) + 1.4; }
    let s = 12.5; while (bold.widthOfTextAtSize(value, s) > cw - 18 && s > 7) s -= 0.5;
    page.drawText(value, { x, y: 233, size: s, font: bold, color: C.ink });
  });

  // Signature (left)
  page.drawText('Jacob Kyle', { x: 70, y: 92, size: 22, font: italic, color: C.pine });
  page.drawLine({ start: { x: 70, y: 84 }, end: { x: 250, y: 84 }, thickness: 0.7, color: C.ink });
  page.drawText('Jacob Kyle, Founding Director', { x: 70, y: 70, size: 8.5, font: body, color: C.soft });

  // Seal (centre)
  page.drawCircle({ x: W / 2, y: 96, size: 34, color: C.pine });
  page.drawCircle({ x: W / 2, y: 96, size: 30, borderColor: C.ochre, borderWidth: 0.6 });
  const sealTxt = (t, y, font, size, color, sp = 0) => { const w = font.widthOfTextAtSize(t, size) + sp * (t.length - 1); let x = W / 2 - w / 2; for (const ch of t) { page.drawText(ch, { x, y, size, font, color }); x += font.widthOfTextAtSize(ch, size) + sp; } };
  sealTxt('YACEP', 106, bold, 6.5, C.ochre, 1.4);
  sealTxt('EP', 88, head, 17, C.ivory);
  sealTxt('CE PROVIDER', 78, bold, 4.8, C.ochre, 0.9);

  // Provider and id (right)
  const lines = ['Yoga Alliance Continuing Education Provider', yacepId ? `Provider ID ${yacepId}` : '', `Certificate ${cert.id}`, verify ? `Verify at ${verify.replace(/^https?:\/\/(www\.)?/, '')}` : ''].filter(Boolean);
  lines.forEach((t, i) => {
    const font = t.startsWith('Certificate') ? bold : body, size = 7.6;
    page.drawText(t, { x: W - 70 - font.widthOfTextAtSize(t, size), y: 104 - i * 11.5, size, font, color: t.startsWith('Certificate') ? C.ink : C.soft });
  });

  return doc.save();
}
