import { gate, isResponse, reply, options } from '@/lib/practice/route';
import { getEntry } from '@/lib/practice/store';
import { shareEntry } from '@/lib/practice/share';

export const dynamic = 'force-dynamic';

// Share an existing private entry to SS Reflections. Pressing twice returns the same post, never a second one.
export async function POST(req, { params }) {
  const g = await gate(req);
  if (isResponse(g)) return g;
  const entry = await getEntry(g.s.uid, (await params).id);
  if (!entry) return reply(req, { error: 'That entry wasn’t found' }, 404);
  return reply(req, await shareEntry(g.s, g.access.season, entry));
}
export const OPTIONS = options;
