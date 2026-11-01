// Who is a teacher and who is a mentee, for the badges on Reflections (any post or reply, wherever it is written).
// Teachers: Circle admins and moderators (their records say so), plus any Circle member ids listed in data/school-hub.json settings.teacher_member_ids.
// Mentees: the members of the Mentorship Circle space (Admin API, read at most every 6 hours; Circle's Admin API has a monthly request budget),
// plus anyone whose reflection was posted from the Sahṛdaya Upāya page. If the Admin API is not reachable nobody is marked from the space (never an error).
import { spaceMemberIds, circleConfigured } from '../circle';
import { hubSettings } from './hubconfig';

const TTL = 6 * 3600 * 1000;
let hit = null;

export async function peopleIds() {
  const st = hubSettings();
  const teachers = new Set((st.teacher_member_ids || []).map(String));
  if (!st.mentee_space_id || !circleConfigured()) return { menteeIds: new Set(), teacherIds: teachers };
  if (!hit || Date.now() - hit.at > TTL) {
    let ids = hit?.ids || new Set();
    try { ids = await spaceMemberIds(st.mentee_space_id); } catch (e) { console.error('mentee ids', e.message); }
    hit = { at: Date.now(), ids };
  }
  return { menteeIds: hit.ids, teacherIds: teachers };
}
