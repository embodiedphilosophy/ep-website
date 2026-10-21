import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { menteeFromBearer, preflight } from '@/lib/mentee/bearer';
import { cors } from '@/lib/member/session';

export const dynamic = 'force-dynamic';

// Token route for hand-in files. The browser sends the file straight to a PRIVATE Blob store (SUBMISSIONS_BLOB_TOKEN, not the public
// ep-media store), so large recordings never pass through a function. Only a signed-in mentee, and only under their own folder.
const TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain',
  'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/webm', 'video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png'];

export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  const h = cors(req, 'GET, POST, OPTIONS');
  if (!process.env.SUBMISSIONS_BLOB_TOKEN) return NextResponse.json({ error: 'File uploads aren’t switched on yet. You can still write your response.' }, { status: 503, headers: h });
  try {
    const json = await handleUpload({
      body: await req.json(), request: req, token: process.env.SUBMISSIONS_BLOB_TOKEN,
      onBeforeGenerateToken: async pathname => {
        if (!pathname.startsWith(`submissions/${me.uid}/`) || pathname.includes('..')) throw new Error('Unexpected upload');
        return { allowedContentTypes: TYPES, maximumSizeInBytes: 500 * 1024 * 1024, addRandomSuffix: true };
      },
    });
    return NextResponse.json(json, { headers: h });
  } catch (e) {
    return NextResponse.json({ error: /Unexpected/.test(e.message) ? e.message : 'We couldn’t start that upload. Please try again.' }, { status: 400, headers: h });
  }
}
export const OPTIONS = preflight;
