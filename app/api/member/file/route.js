import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { checkFileLink, blobToken, filesConfigured } from '@/lib/mentee/filelink';
import { fileOf } from '@/lib/mentee/store';

export const dynamic = 'force-dynamic';

// A hand-in file for the mentor view, by a short-lived signed link (lib/mentee/filelink.js). Streams from the private store.
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const id = q.get('id');
  if (!filesConfigured() || !checkFileLink(id, q.get('exp'), q.get('sig'))) return new NextResponse('This link has expired. Open the hand-in again from your page.', { status: 403 });
  const f = await fileOf(id).catch(() => null);
  if (!f) return new NextResponse('Not found', { status: 404 });
  const r = await get(f.path, { access: 'private', token: blobToken() }).catch(() => null);
  if (!r || r.statusCode !== 200) return new NextResponse('Not found', { status: 404 });
  const name = String(f.name || 'hand-in').replace(/[^\w.\- ]+/g, '_');
  return new NextResponse(r.stream, { headers: { 'Content-Type': r.blob.contentType || 'application/octet-stream', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'private, no-store' } });
}
