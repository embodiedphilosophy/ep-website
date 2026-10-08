import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/ops/auth';
import { canEditEvents } from '@/lib/ops/nav';
import { getRow, updateRow, ConflictError } from '@/lib/ops/store';
import { FIELDS, check } from '@/lib/ops/eventfields';

export const dynamic = 'force-dynamic';
const ID = /^E\d{3,}$/;

async function editor() {
  const user = await currentUser();
  if (!user) return [null, NextResponse.json({ error: 'Please sign in again' }, { status: 401 })];
  if (!canEditEvents(user)) return [null, NextResponse.json({ error: 'Only Jacob, Irene and Floss can edit events' }, { status: 403 })];
  return [user];
}

// GET ?id=E028 → the event's editable values, straight from Schedule and Event Details
export async function GET(req) {
  const [user, denied] = await editor(); if (!user) return denied;
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!ID.test(id)) return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
  const [schedule, details] = await Promise.all([getRow('schedule', id), getRow('details', id)]);
  if (!schedule) return NextResponse.json({ error: `${id} isn't on the Schedule tab` }, { status: 404 });
  const values = {}, locked = [...schedule.locked, ...(details?.locked || [])];
  for (const f of FIELDS) values[f.key] = (f.table === 'schedule' ? schedule.fields : details?.fields || {})[f.key] ?? '';
  return NextResponse.json({ id, values, locked });
}

// POST { id, changes: { field: value }, before: { field: value as shown } }
export async function POST(req) {
  const [user, denied] = await editor(); if (!user) return denied;
  const { id, changes = {}, before = {} } = await req.json().catch(() => ({}));
  if (!ID.test(String(id))) return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
  const byTable = { schedule: {}, details: {} }, errors = {};
  for (const [key, raw] of Object.entries(changes)) {
    const f = FIELDS.find(x => x.key === key);
    if (!f) { errors[key] = 'Not an editable field'; continue; }
    const r = check(f, raw);
    if (r.error) errors[key] = r.error; else byTable[f.table][key] = r.value;
  }
  if (Object.keys(errors).length) return NextResponse.json({ error: 'Some fields need fixing', errors }, { status: 400 });
  const who = user.name || user.email, pick = keys => Object.fromEntries(keys.filter(k => k in before).map(k => [k, before[k]]));
  try {
    const written = [
      ...(await updateRow('schedule', id, byTable.schedule, { before: pick(Object.keys(byTable.schedule)), who })),
      // Older events may not have an Event Details row yet: add it
      ...(await updateRow('details', id, byTable.details, { before: pick(Object.keys(byTable.details)), who, create: true })),
    ];
    if (written.length) await refreshSite();
    return NextResponse.json({ ok: true, written });
  } catch (e) {
    if (e instanceof ConflictError) return NextResponse.json({ error: e.message, conflict: e.current }, { status: 409 });
    console.error('Event save failed', id, e.message);
    return NextResponse.json({ error: /^Sheets|^Google/.test(e.message) ? 'Could not save to the sheet. Try again shortly.' : e.message }, { status: 502 });
  }
}

// The website and the dashboard (one app) read the sheet through a 5-minute cache: clear it so edits show now
async function refreshSite() {
  revalidatePath('/', 'layout');
}
