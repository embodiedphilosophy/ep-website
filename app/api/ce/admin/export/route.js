import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { listCerts } from '@/lib/ce/store';
import { certsCsv } from '@/lib/ce/rules';
import { ceReady } from '@/lib/ce/service';

export const dynamic = 'force-dynamic';

// Every certificate as CSV: the record of who completed what, for a Yoga Alliance audit. Header x-ce-key: CE_ADMIN_KEY.
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function GET(req) {
  if (!process.env.CE_ADMIN_KEY || !same(req.headers.get('x-ce-key') || '', process.env.CE_ADMIN_KEY)) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  if (!ceReady()) return NextResponse.json({ error: 'CE records aren’t connected yet' }, { status: 503 });
  const csv = certsCsv(await listCerts());
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="ep-ce-certificates-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' } });
}
