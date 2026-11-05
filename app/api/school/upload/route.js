import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { currentMember } from '@/lib/school/session';
import { ATTACH_TYPES, ATTACH_MAX_BYTES } from '@/lib/school/attachments';

export const dynamic = 'force-dynamic';

// Files students attach to a reflection or a reply. The browser sends the file straight to the ep-media Blob store
// (BLOB_READ_WRITE_TOKEN), so large files never pass through a function. Only a signed-in member may start an upload, and only
// under school/; the random suffix keeps the address unguessable. The link then goes into the Circle post (lib/school/circle.js).
// Vercel calls this route back when an upload finishes; handleUpload verifies that call itself (no cookie on it), so the member check
// lives in onBeforeGenerateToken, which only runs for the browser's request.
export async function POST(req) {
  try {
    const json = await handleUpload({
      body: await req.json(), request: req,
      onBeforeGenerateToken: async pathname => {
        if (!(await currentMember())) throw new Error('Please sign in again from Circle.');
        if (!pathname.startsWith('school/') || pathname.includes('..')) throw new Error('Unexpected upload');
        return { allowedContentTypes: ATTACH_TYPES, maximumSizeInBytes: ATTACH_MAX_BYTES, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: /sign in|Unexpected/.test(e.message) ? e.message : 'We couldn’t start that upload. Please try again.' }, { status: 400 });
  }
}
