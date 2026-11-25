// Everyone in the formation this season, for choosing an articulation partner: the Sahṛdaya Upāya Kit tag (lib/member/cohort.js),
// with names filled in from Mentee Profiles. Mentors are left out. Cached by the Kit and sheet reads underneath (10 and 5 minutes).
import config from '../../data/mentee.json';
import { mentees } from '../member/cohort';
import { readTab, TABS, profilesFrom } from './content';

export async function cohortList() {
  const [list, profileRows] = await Promise.all([mentees().catch(() => []), readTab(TABS.profiles).catch(() => [])]);
  const profiles = profilesFrom(profileRows), mentors = new Set((config.mentor_emails || []).map(e => String(e).toLowerCase()));
  return list.filter(m => m.email && !mentors.has(m.email)).map(m => ({ email: m.email, name: profiles[m.email]?.name || m.name || m.email }));
}
