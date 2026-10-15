import { NextResponse } from 'next/server';
import { CERT_ID, goodKey, verifyUrl } from '@/lib/ce/rules';
import { getCert } from '@/lib/ce/store';
import { certificatePdf } from '@/lib/ce/pdf';
import { yacepId, ceReady } from '@/lib/ce/service';

export const dynamic = 'force-dynamic';

// The certificate PDF. The link carries a key (?k=) made from the id, so only the member (and staff) have it.
export async function GET(req, { params }) {
  const { id } = await params;
  const k = new URL(req.url).searchParams.get('k') || '';
  if (!CERT_ID.test(id || '') || !goodKey(id, k)) return NextResponse.json({ error: 'That link isn’t right' }, { status: 404 });
  if (!ceReady()) return NextResponse.json({ error: 'Not available just now' }, { status: 503 });
  const cert = await getCert(id);
  if (!cert || cert.status !== 'issued') return NextResponse.json({ error: 'This certificate isn’t available' }, { status: 404 });
  const pdf = await certificatePdf(cert, { yacepId: await yacepId(), verify: verifyUrl(id) });
  return new NextResponse(Buffer.from(pdf), { headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${id}.pdf"`,
    'Cache-Control': 'private, no-store',
  } });
}
