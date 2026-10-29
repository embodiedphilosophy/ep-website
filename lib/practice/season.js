// Which Sādhana School season is on, which week it is, and who gets the Svādhyāya and Diary parts of the Practice page.
import seasons from '../../data/school-seasons.json';
import { weekNumber } from '../mentee/week';
import { tierFor } from '../member/tier';

// The season that has started and not ended; between seasons, the one just finished; before the first, the first.
export function currentSeason(today, list = seasons) {
  const ss = list.filter(x => x.programme === 'sadhana-school' && x.starts_on).sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  const live = ss.find(x => x.starts_on <= today && (!x.ends_on || today <= x.ends_on));
  return live || ss.filter(x => x.starts_on <= today).pop() || ss[0] || null;
}
export const seasonName = x => String(x?.slug || '').split('-')[0]; // fall-2026 → fall

// Pure: may this tier see the SS parts of the season? (single-season students need that season's Kit tag)
export const canSeeSS = (tier, tagSeasons, season) => tier === 'ss_year' || tier === 'mentee' || (tier === 'ss_season' && (tagSeasons || []).includes(seasonName(season)));

// → { isSS, season, week } for a verified session. An admin previewing with ?as= is treated as that tier.
export async function accessFor(s, today, as) {
  const season = currentSeason(today);
  const tier = s.admin && as ? as : s.tier;
  const tags = tier === 'ss_season' ? (s.admin && as ? [seasonName(season)] : (await tierFor(s.email).catch(() => ({}))).seasons) : [];
  const isSS = !!season && canSeeSS(tier, tags, season);
  return { isSS, tier, season, week: season ? weekNumber(season.starts_on, today) : null };
}
