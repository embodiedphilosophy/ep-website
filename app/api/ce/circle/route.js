import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { parseCircle } from '@/lib/ce/rules';
import { handleCircle, ceReady } from '@/lib/ce/service';

export const dynamic = 'force-dynamic';

// Circle workflows → here ("Send to webhook"). Two workflows, both pointing at
//   https://www.embodiedphilosophy.com/api/ce/circle?key=<CE_WEBHOOK_KEY>&event=lesson   (trigger: Completed lesson)
//   https://www.embodiedphilosophy.com/api/ce/circle?key=<CE_WEBHOOK_KEY>&event=course   (trigger: Completed course)
// Every call is logged (ce_events), matched or not, so the ops CE ledger can show anything that didn't match.
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function POST(req) {
  const q = new URL(req.url).searchParams;
  const key = process.env.CE_WEBHOOK_KEY;
  if (!key || !same(q.get('key') || req.headers.get('x-ce-key') || '', key)) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  if (!ceReady()) return NextResponse.json({ error: 'CE records aren’t connected yet' }, { status: 503 });
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Expected JSON' }, { status: 400 });
  try {
    const r = await handleCircle(parseCircle(raw, q.get('event') || ''), raw);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error('CE webhook failed', e.message);
    return NextResponse.json({ error: 'Couldn’t record that' }, { status: 500 });
  }
}
