import { gate, isResponse, reply, options } from '@/lib/practice/route';
import { saveEntry } from '@/lib/practice/store';
import { shareEntry } from '@/lib/practice/share';

export const dynamic = 'force-dynamic';

// "Save to my diary": { body, post, today } turns the draft into a private entry; post:true also shares it to SS Reflections.
// If sharing fails the entry stays saved and private, and the answer says so.
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const g = await gate(req, { today: b.today });
  if (isResponse(g)) return g;
  let entry;
  try { entry = await saveEntry(g.s.uid, b.body); }
  catch (e) {
    if (e.status === 400) return reply(req, { error: e.message }, 400);
    console.error('diary save', e.message); return reply(req, { error: 'Couldn’t save just now. Your words are still on the page.' }, 502);
  }
  if (b.post === true) return reply(req, await shareEntry(g.s, g.access.season, entry));
  return reply(req, { entry });
}
export const OPTIONS = options;
