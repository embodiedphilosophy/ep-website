import placeholder from '@/data/events.json';

// Programs: lrl | wisdom | sadhana | seasonal
// Sheet columns (header row, any order):
// id, title, date (YYYY-MM-DD), end_date, time (display text, e.g. "7pm ET"), program,
// price (Free | Pay what you can | By donation | Members | Enrolled | Enroll | $79),
// host, note, registration_url, series, publish (TRUE/FALSE)

function parseCSV(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter(r => r.some(x => x.trim()));
  const keys = head.map(h => h.trim().toLowerCase());
  return body.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] || '').trim()])));
}

// "Today" in US Eastern time, as YYYY-MM-DD
export function todayET() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

export async function getEvents() {
  let rows = placeholder;
  const url = process.env.EVENTS_SHEET_CSV_URL;
  if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: 300 } }); // refresh every 5 minutes
      if (res.ok) rows = parseCSV(await res.text());
    } catch (e) { console.error('Events sheet fetch failed, using placeholders', e); }
  }
  const today = todayET();
  return rows
    .filter(e => e.title && e.date && String(e.publish).toUpperCase() !== 'FALSE')
    .filter(e => (e.end_date || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const isFree = e => ['free', 'pay what you can', 'by donation'].includes(String(e.price).toLowerCase());
