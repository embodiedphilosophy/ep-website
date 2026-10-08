import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/ops/auth';
import { isStaff, canEditSite } from '@/lib/ops/nav';
import { readPlain, updatePlain, addPlain, ConflictError } from '@/lib/ops/store';
import { tableOf, typeOf, checkCell } from '@/lib/ops/sitetables';

export const dynamic = 'force-dynamic';

// GET ?tab=links → the tab's rows (staff can look; only editors can save)
export async function GET(req) {
  const user = await currentUser();
  if (!isStaff(user)) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  const t = tableOf(new URL(req.url).searchParams.get('tab'));
  if (!t) return NextResponse.json({ error: 'Unknown tab' }, { status: 400 });
  try { return NextResponse.json({ ...(await readPlain(t.title)), canEdit: canEditSite(user) }); }
  catch (e) {
    const missing = /\(400\)|: 400/.test(e.message);
    return NextResponse.json({ error: missing ? `The "${t.title}" tab isn’t in the calendar sheet yet.` : 'Couldn’t read the sheet. Try again shortly.', missing }, { status: missing ? 404 : 502 });
  }
}

// POST { tab, row (omit to add a row), changes: { column: value }, before: { column: value } (the whole row as shown) }
export async function POST(req) {
  const user = await currentUser();
  if (!canEditSite(user)) return NextResponse.json({ error: 'Only Jacob, Irene and Floss can edit the website' }, { status: 403 });
  const { tab, row, changes = {}, before = {} } = await req.json().catch(() => ({}));
  const t = tableOf(tab);
  if (!t) return NextResponse.json({ error: 'Unknown tab' }, { status: 400 });
  if (row == null && !t.add) return NextResponse.json({ error: 'Rows can’t be added to this tab' }, { status: 400 });
  const clean = {}, errors = {}, ctx = { ...before, ...changes };
  for (const [col, raw] of Object.entries(changes)) {
    if ((t.locked || []).includes(col)) { errors[col] = 'Can’t be changed here'; continue; }
    const r = checkCell(typeOf(t.key, col, ctx), raw);
    if (r.error) errors[col] = r.error; else clean[col] = r.value;
  }
  if (Object.keys(errors).length) return NextResponse.json({ error: 'Some fields need fixing', errors }, { status: 400 });
  const who = user.name || user.email;
  try {
    const result = row == null ? { added: await addPlain(t.title, clean, { who }) } : { written: await updatePlain(t.title, Number(row), clean, { before, who }) };
    revalidatePath('/', 'layout'); // the site and dashboard show it now, not in 5 minutes
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof ConflictError) return NextResponse.json({ error: e.message, conflict: e.current }, { status: 409 });
    console.error('Site save failed', tab, e.message);
    return NextResponse.json({ error: /^Sheets|^Google/.test(e.message) ? 'Could not save to the sheet. Try again shortly.' : e.message }, { status: 502 });
  }
}
