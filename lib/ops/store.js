import { readRange, writeCells, appendRows, writeRange, addTab, colLetter } from '../google';

// The one way the dashboard writes to EP-Programming-Calendar. The sheet is the hidden source of truth for
// the website, Zoom, reminders and the dashboard, so every write:
//   - finds columns by their header name, never by position (moving a column can't misplace a value)
//   - refuses columns filled by formulas (e.g. Event Details' Date/Track/Event, which come from Schedule)
//   - refuses a change when the cell was edited by someone else since the editor opened it
//   - is recorded on the Change Log tab (the sheet's own history only shows the website's service account)
const SHEET = () => process.env.CALENDAR_SHEET_ID;
const same = (a, b) => String(a ?? '').trim() === String(b ?? '').trim();
const find = (head, name) => head.findIndex(h => h.toLowerCase() === String(name).trim().toLowerCase());

// Tabs the dashboard edits: the row holding the headers, and the column that identifies a row
export const TABLES = {
  schedule: { title: 'Schedule', headerRow: 4, key: 'ID' },
  details: { title: 'Event Details', headerRow: 4, key: 'ID' },
};
const LOG = { title: 'Change Log', head: ['when', 'who', 'tab', 'id', 'field', 'from', 'to'] };

async function readTable(t) {
  const range = `'${t.title}'!A${t.headerRow}:AZ3000`;
  const [vals, forms] = await Promise.all([
    readRange(SHEET(), range, { fresh: true }),
    readRange(SHEET(), range, { fresh: true, render: 'FORMULA' }),
  ]);
  const head = (vals[0] || []).map(h => String(h).trim());
  // A column whose header cell is a formula (an ARRAYFORMULA filling the column) is computed
  const computedCols = new Set(head.map((_, i) => i).filter(i => String(forms[0]?.[i] ?? '').startsWith('=')));
  const k = find(head, t.key);
  if (k < 0) throw new Error(`The ${t.title} tab has no "${t.key}" column`);
  return { head, computedCols, vals: vals.slice(1), forms: forms.slice(1), k };
}

// One row as { header: value }, plus which headers can't be edited. null when the ID isn't on the tab.
export async function getRow(table, id) {
  const t = TABLES[table], tb = await readTable(t);
  const i = tb.vals.findIndex(r => same(r[tb.k], id));
  if (i < 0) return null;
  const fields = Object.fromEntries(tb.head.filter(Boolean).map(h => [h, String(tb.vals[i][find(tb.head, h)] ?? '')]));
  const locked = tb.head.filter((h, c) => h && (tb.computedCols.has(c) || String(tb.forms[i]?.[c] ?? '').startsWith('=')));
  return { fields, locked, row: t.headerRow + 1 + i };
}

export class ConflictError extends Error {
  constructor(fields, current) { super(`Changed by someone else since you opened it: ${fields.join(', ')}`); this.fields = fields; this.current = current; }
}

// Change some cells of the row whose key column equals `id`.
//   changes: { header: newValue }   before: { header: value the editor was showing } (conflict check)
//   create: add the row (with its ID) when it isn't there yet
// Returns the list of { field, from, to } actually written.
export async function updateRow(table, id, changes, { before = {}, who = '', create = false } = {}) {
  const t = TABLES[table], tb = await readTable(t);
  let i = tb.vals.findIndex(r => same(r[tb.k], id));
  if (i < 0 && !create) throw new Error(`${id} isn't on the ${t.title} tab`);
  const cur = i < 0 ? [] : tb.vals[i];
  const writes = [], conflicts = [];
  for (const [field, value] of Object.entries(changes)) {
    const c = find(tb.head, field);
    if (c < 0) throw new Error(`The ${t.title} tab has no "${field}" column`);
    if (tb.computedCols.has(c) || (i >= 0 && String(tb.forms[i]?.[c] ?? '').startsWith('='))) throw new Error(`"${field}" is filled in automatically and can't be edited here`);
    const from = String(cur[c] ?? '');
    if (field in before && !same(before[field], from)) { conflicts.push(field); continue; }
    if (!same(from, value)) writes.push({ field, c, from, to: String(value ?? '').trim() });
  }
  if (conflicts.length) throw new ConflictError(conflicts, Object.fromEntries(conflicts.map(f => [f, String(cur[find(tb.head, f)] ?? '')])));
  if (!writes.length) return [];

  if (i < 0) {
    // New row under the last one, with its ID and the given fields
    const line = tb.head.map((h, c) => c === tb.k ? id : (writes.find(w => w.c === c)?.to ?? ''));
    const row = t.headerRow + 1 + tb.vals.length;
    await writeRange(SHEET(), `'${t.title}'!A${row}:${colLetter(tb.head.length - 1)}${row}`, [line.map((v, c) => tb.computedCols.has(c) ? null : v)]);
  } else {
    const row = t.headerRow + 1 + i;
    await writeCells(SHEET(), writes.map(w => ({ range: `'${t.title}'!${colLetter(w.c)}${row}`, value: w.to })));
  }
  await logChanges(writes.map(w => [new Date().toISOString(), who, t.title, id, w.field, w.from, w.to]));
  return writes.map(({ field, from, to }) => ({ field, from, to }));
}

// Best effort: a failed log line never undoes a saved change, but it is reported in the server log
async function logChanges(lines) {
  if (!lines.length) return;
  const append = () => appendRows(SHEET(), `'${LOG.title}'!A1`, lines);
  try { await append(); }
  catch {
    try { await addTab(SHEET(), LOG.title); await writeRange(SHEET(), `'${LOG.title}'!A1:G1`, [LOG.head]); await append(); }
    catch (e) { console.error('Change Log write failed', e.message); }
  }
}
