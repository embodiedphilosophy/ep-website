import { gate, isResponse, reply, options } from '@/lib/practice/route';
import { setRead } from '@/lib/practice/store';

export const dynamic = 'force-dynamic';

// { read: boolean } → ticks or un-ticks one reading for the signed-in member.
export async function PUT(req, { params }) {
  const g = await gate(req);
  if (isResponse(g)) return g;
  const b = await req.json().catch(() => ({}));
  try { await setRead(g.s.uid, (await params).readingId, b.read !== false); return reply(req, { ok: true }); }
  catch (e) { return reply(req, { error: e.status === 400 ? e.message : 'Couldn’t save that just now' }, e.status === 400 ? 400 : 502); }
}
export const OPTIONS = options;
