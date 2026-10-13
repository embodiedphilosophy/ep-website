import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { SHEET_TAG } from '@/lib/google';

// Called by the ops app (ep-ops) after it saves to the sheet, so the website shows the change on the next
// request instead of within 5 minutes. Needs REVALIDATE_SECRET (same value on both Vercel projects).
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  revalidateTag(SHEET_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
