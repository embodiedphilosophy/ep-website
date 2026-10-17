// The hub's config rows (data/school-hub.json) joined to the season records. Cached by the module system, so a change
// goes live with the next deploy; the sheet-tab option in the handoff can replace this file later without touching hub.js.
import hub from '@/data/school-hub.json';
import { allSeasons, programmeSeasons } from './config';

export const hubItems = () => hub.items;
export const hubSettings = () => hub.settings || {};
export const hubSeasons = () => programmeSeasons('sadhana-school').length ? programmeSeasons('sadhana-school') : allSeasons();

// Every space id the hub may open or mark as seen (a visit is only recorded for ids we know)
export function knownSpaceIds() {
  const out = new Set();
  for (const s of hubSeasons()) if (s.hub_space_id) out.add(String(s.hub_space_id));
  for (const it of hub.items) for (const id of it.circle_space_ids || []) out.add(String(id));
  return out;
}
