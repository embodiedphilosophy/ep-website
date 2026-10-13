import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import crypto from 'crypto';
import { SHEET_TAG } from '@/lib/google';

// Called by ep-ops after it Publishes, Updates or Unpublishes a catalog row, so /courses and the offering's page
// change on the next request. Header: x-revalidate-secret (or "Authorization: Bearer …"), the value of
// COURSES_REVALIDATE_SECRET (or REVALIDATE_SECRET, which the site already uses). Optional JSON body: { "offering_id": "hamsa-sadhana-21" } to refresh that page too.
export const dynamic = 'force-dynamic';

const same = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export async function POST(req) {
  const secret = process.env.COURSES_REVALIDATE_SECRET || process.env.REVALIDATE_SECRET;
  const sent = req.headers.get('x-revalidate-secret') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secret || !same(sent, secret)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { offering_id } = await req.json().catch(() => ({}));
  revalidateTag(SHEET_TAG, { expire: 0 }); // the catalog tab is one of the cached sheet reads
  revalidatePath('/courses');
  const id = typeof offering_id === 'string' && /^[a-z0-9][a-z0-9-]{0,80}$/i.test(offering_id) ? offering_id.toLowerCase() : null;
  if (id) revalidatePath(`/courses/${id}`); else revalidatePath('/courses/[offering_id]', 'page');
  return NextResponse.json({ ok: true, refreshed: id ? ['/courses', `/courses/${id}`] : ['/courses', '/courses/*'] });
}
