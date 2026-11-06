// Telling a pod's members that their leader changed it: one Circle direct message to each member, sent as the leader (students may
// message each other). Best effort and quiet: a member Circle can't reach is skipped, and the change is saved either way. → how many were told.
import { findMember } from '../circle';
import { startDirectChat, sendChatMessage } from '../school/circle';

export async function tellMembers(fromEmail, members, text, { skipUid } = {}) {
  let sent = 0;
  for (const m of members || []) {
    if (!m?.email || m.uid === skipUid || String(m.email).toLowerCase() === String(fromEmail).toLowerCase()) continue;
    try {
      const them = await findMember(m.email);
      if (!them?.id) continue;
      const room = await startDirectChat(fromEmail, them.id);
      if (!room) continue;
      await sendChatMessage(fromEmail, room, text);
      sent++;
    } catch (e) { console.error('pod change message', e.message); }
  }
  return sent;
}
