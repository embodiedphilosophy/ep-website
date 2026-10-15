import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { ledger, approve, revoke, rename, markDone, ceReady } from '@/lib/ce/service';
import { pdfUrl } from '@/lib/ce/rules';

export const dynamic = 'force-dynamic';

// For the ops dashboard's CE ledger (ep-ops, server to server). Header x-ce-key: CE_ADMIN_KEY (same value in both projects).
// GET → { certs, unmatched, counts, pathways }. POST { action: approve|revoke|rename|done, id, name, email, slug, why, by }
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const allowed = req => !!process.env.CE_ADMIN_KEY && same(req.headers.get('x-ce-key') || '', process.env.CE_ADMIN_KEY);

export async function GET(req) {
  if (!allowed(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  if (!ceReady()) return NextResponse.json({ off: true });
  try {
    const l = await ledger();
    l.certs = l.certs.map(c => ({ ...c, pdf: c.status === 'issued' ? pdfUrl(c.id) : '' }));
    return NextResponse.json(l);
  } catch (e) { return NextResponse.json({ error: 'Couldn’t load the CE ledger' }, { status: 502 }); }
}

export async function POST(req) {
  if (!allowed(req)) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  if (!ceReady()) return NextResponse.json({ error: 'CE records aren’t connected yet' }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const by = String(b.by || 'staff').slice(0, 80);
  try {
    if (b.action === 'approve') return NextResponse.json(await approve(b.id, by));
    if (b.action === 'revoke') return NextResponse.json(await revoke(b.id, by, String(b.why || '').slice(0, 200)));
    if (b.action === 'rename') return NextResponse.json(await rename(b.id, b.name, by));
    if (b.action === 'done') return NextResponse.json(await markDone(b.email, b.slug, by));
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.status ? e.message : 'Couldn’t save that' }, { status: e.status || 500 });
  }
}
