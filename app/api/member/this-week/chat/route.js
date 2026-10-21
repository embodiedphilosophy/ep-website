import { menteeFromBearer, reply, preflight } from '@/lib/mentee/bearer';
import { headlessConfigured, sendChatMessage, chatMessages } from '@/lib/school/circle';
import { chatLines } from '@/lib/mentee/home';
import config from '@/data/mentee.json';

export const dynamic = 'force-dynamic';

// A mentee (or Circle admin) writes to the cohort chat from the page: { text }. Sent to Circle as that member; returns the latest messages.
const last = new Map(); // uid → time of the last send, so a double click or a loop cannot flood the room
export async function POST(req) {
  const { me, res } = menteeFromBearer(req);
  if (!me) return res;
  if (!headlessConfigured() || !config.chat_room_uuid) return reply(req, { error: 'The cohort chat isn’t connected here yet. Use the Open the cohort chat button.' }, 503);
  const b = await req.json().catch(() => ({}));
  const text = String(b.text ?? '').replace(/\r/g, '').trim();
  if (!text) return reply(req, { error: 'Write a message first.' }, 400);
  if (text.length > 1500) return reply(req, { error: 'Keep it under 1,500 characters, or use the full chat.' }, 400);
  if (Date.now() - (last.get(me.uid) || 0) < 3000) return reply(req, { error: 'One moment, then try again.' }, 429);
  last.set(me.uid, Date.now());
  try {
    await sendChatMessage(me.email, config.chat_room_uuid, text);
    return reply(req, { chat: chatLines(await chatMessages(me.email, config.chat_room_uuid)) });
  } catch (e) {
    console.error('this-week chat send', e.message);
    return reply(req, { error: 'We couldn’t send that just now. You can write it in the full chat instead.' }, 502);
  }
}
export const OPTIONS = preflight;
