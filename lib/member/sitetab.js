// A staff-edited tab on the calendar sheet (Ops → Settings → Website), read with the site's service account through
// the usual 5-minute cache (a dashboard save expires it at once). Rows hidden with publish = No, or failing `valid`,
// are left out. If the sheet isn't reachable, the tab isn't made yet or it has no usable rows, `fallback` is used.
import { readRange, googleConfigured } from '../google';

export async function readSiteTab(tab, { cols = 'A1:L300', valid = () => true, fallback = [] } = {}) {
  if (!process.env.CALENDAR_SHEET_ID || !googleConfigured()) return fallback;
  try {
    const [head, ...body] = (await readRange(process.env.CALENDAR_SHEET_ID, `'${tab}'!${cols}`)).filter(r => r.some(c => String(c ?? '').trim()));
    if (!head) return fallback;
    const keys = head.map(h => String(h).trim().toLowerCase());
    const rows = body.map(r => Object.fromEntries(keys.map((k, i) => [k, String(r[i] ?? '').trim()])))
      .filter(r => !/^(false|no|hide)$/i.test(r.publish || '') && valid(r));
    return rows.length ? rows : fallback;
  } catch (e) {
    if (!/\(400\)|: 400|: 404/.test(e.message)) console.error(`Tab "${tab}" failed`, e.message);
    return fallback;
  }
}
