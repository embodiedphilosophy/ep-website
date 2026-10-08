import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/ops/auth';
import { isStaff, canEditSocial } from '@/lib/ops/nav';
import { readPlain, updatePlain, addPlain, ConflictError } from '@/lib/ops/store';
import { viewOf, isLocked, checkSocial, thumbOf } from '@/lib/ops/socialengine';
import { todayET } from '@/lib/events';

export const dynamic = 'force-dynamic';
const SHEET = { sheet: 'social' };
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

// GET ?view=plan | history | quotes | images | captions | rules | categories | sources  (&q=search &offset=)
export async function GET(req) {
  const user = await currentUser();
  if (!isStaff(user)) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  const url = new URL(req.url), v = viewOf(url.searchParams.get('view') || 'plan');
  if (!v) return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
  if (v.director && !user.director) return NextResponse.json({ error: 'Directors only' }, { status: 403 });
  const q = String(url.searchParams.get('q') || '').trim().toLowerCase(), offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  try {
    const data = await readPlain(v.tab, SHEET);
    let rows = data.rows;
    if (v.key === 'plan') {
      // Last week and everything ahead, soonest first; each with its thumbnail
      const from = addDays(todayET(), -7);
      const lib = await readPlain('Image Library', SHEET).catch(() => ({ rows: [] }));
      const byImage = Object.fromEntries(lib.rows.map(r => [r.values.image_id, r.values]));
      rows = rows.filter(r => (r.values.publish_date || '9') >= from)
        .sort((a, b) => (a.values.publish_date || '9').localeCompare(b.values.publish_date || '9') || String(a.values.publish_time_ET).localeCompare(String(b.values.publish_time_ET)))
        .map(r => { const img = byImage[r.values.image_id] || {}; return { ...r, thumb: thumbOf(r.values.image_url || img.public_url, img.drive_file_id) }; });
    } else if (v.key === 'history') {
      rows = rows.sort((a, b) => String(b.values.posted_at).localeCompare(String(a.values.posted_at)));
    }
    if (q && v.search) rows = rows.filter(r => v.search.some(c => String(r.values[c] || '').toLowerCase().includes(q)));
    const total = rows.length, page = v.key === 'plan' ? rows : rows.slice(offset, offset + 60);
    if (v.key === 'images') for (const r of page) r.thumb = thumbOf(r.values.public_url, r.values.drive_file_id);
    return NextResponse.json({ head: data.head, rows: page, total, offset, canEdit: canEditSocial(user) && (!v.director || user.director),
      locked: data.head.filter(h => isLocked(v.tab, h)) });
  } catch (e) {
    return NextResponse.json({ error: /403/.test(e.message) ? 'The Social Engine sheet isn’t shared with the website yet.' : 'Couldn’t read the Social Engine. Try again shortly.' }, { status: 502 });
  }
}

// POST { view, row, changes, before }  one row          { view, add: true, values }  a new library row
//      { view: 'plan', approve: [{ row, before }] }        approve several posts at once
export async function POST(req) {
  const user = await currentUser();
  if (!canEditSocial(user)) return NextResponse.json({ error: 'Only the social team can change posts' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const v = viewOf(body.view);
  if (!v || v.key === 'history') return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
  if (v.director && !user.director) return NextResponse.json({ error: 'Directors only' }, { status: 403 });
  const who = user.name || user.email;
  const clean = obj => {
    const out = {}, errors = {};
    for (const [col, raw] of Object.entries(obj || {})) {
      if (isLocked(v.tab, col)) { errors[col] = 'Can’t be changed here'; continue; }
      const r = checkSocial(v.tab, col, raw);
      if (r.error) errors[col] = r.error; else out[col] = r.value;
    }
    return { out, errors };
  };
  try {
    if (v.key === 'plan' && Array.isArray(body.approve)) {
      let n = 0;
      for (const a of body.approve) {
        if (a.before?.status !== 'Proposed') continue;
        n += (await updatePlain(v.tab, Number(a.row), { status: 'Approved' }, { before: a.before, who, ...SHEET })).length;
      }
      return NextResponse.json({ ok: true, approved: n });
    }
    if (body.add) {
      if (!v.add) return NextResponse.json({ error: 'Rows can’t be added here' }, { status: 400 });
      const { out, errors } = clean(body.values);
      if (Object.keys(errors).length) return NextResponse.json({ error: 'Some fields need fixing', errors }, { status: 400 });
      return NextResponse.json({ ok: true, row: await addPlain(v.tab, out, { who, ...SHEET }) });
    }
    const { out, errors } = clean(body.changes);
    // Needs edit only makes sense with a note saying what to change
    if (out.status === 'Needs edit' && !String(body.changes.jake_notes ?? body.before?.jake_notes ?? '').trim()) errors.jake_notes = 'Say what should change';
    if (Object.keys(errors).length) return NextResponse.json({ error: 'Some fields need fixing', errors }, { status: 400 });
    // A new image: the picture link comes from the Image Library, so the plan and Make agree
    if ('image_id' in out && out.image_id) {
      const img = (await readPlain('Image Library', SHEET)).rows.find(r => r.values.image_id === out.image_id);
      if (!img) return NextResponse.json({ error: 'Not an image in the Image Library', errors: { image_id: 'Unknown image' } }, { status: 400 });
      out.image_url = img.values.public_url;
    }
    const written = await updatePlain(v.tab, Number(body.row), out, { before: body.before || {}, who, ...SHEET });
    return NextResponse.json({ ok: true, written });
  } catch (e) {
    if (e instanceof ConflictError) return NextResponse.json({ error: e.message, conflict: e.current }, { status: 409 });
    console.error('Social save failed', e.message);
    return NextResponse.json({ error: /403/.test(e.message) ? 'The website can only read the Social Engine. Give its service account Editor access.' : /^Sheets|^Google/.test(e.message) ? 'Couldn’t save. Try again shortly.' : e.message }, { status: 502 });
  }
}
