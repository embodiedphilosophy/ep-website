import { NextResponse } from 'next/server';
import { describeDay } from '@/lib/panchanga/describe.js';
import { tzParts } from '@/lib/panchanga/engine.js';

// The day's pañcāṅga as JSON, for the practice app, the Weekly Scaffolding email and the ops system, so nobody
// copies the maths. Public (it is only astronomy): no sign-in.
//   GET /api/panchanga?lat=28.61&lon=77.21&tz=Asia/Kolkata[&date=YYYY-MM-DD]
// lat and lon are required; tz defaults to UTC (every time is read in it); date defaults to today in that zone.
// Each limb has its index, name, description, when it ends (ISO, UTC) and what comes next. The day is read at local sunrise.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };
const fail = (error, status = 400) => NextResponse.json({ error }, { status, headers: CORS });
const iso = ms => new Date(ms).toISOString();
const validTz = tz => { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; } };
const num = (s, lo, hi) => { if (s === null || s === '') return null; const n = Number(s); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const lat = num(q.get('lat'), -90, 90), lon = num(q.get('lon'), -180, 180);
  if (lat === null || lon === null) return fail('Please give lat (−90 to 90) and lon (−180 to 180).');
  const tz = q.get('tz') || 'UTC';
  if (!validTz(tz)) return fail('Unknown time zone. Use a name like Asia/Kolkata.');
  let y, m, d;
  const date = q.get('date');
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('date should look like 2026-10-18.');
    [y, m, d] = date.split('-').map(Number);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (y < 1900 || y > 2100 || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return fail('That date doesn’t exist, or is outside 1900–2100.');
  } else { const p = tzParts(tz, Date.now()); y = p.year; m = p.month; d = p.day; }

  const r = describeDay({ lat, lon, tz, y, m, d });
  const limb = x => ({ index: x.index, name: x.name, description: x.description, endsAt: iso(x.endMs), next: x.next });
  const ms = r.nakshatra.moonSign;
  return NextResponse.json({
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    place: { lat, lon, tz },
    sunrise: iso(r.sunrise),
    month: { name: r.month.name, adhika: r.month.adhika, system: 'amānta' },
    paksha: r.paksha, // 'bright' (waxing) or 'dark' (waning) fortnight
    moon: { elongation: Math.round(r.elongation * 100) / 100 }, // degrees ahead of the Sun: 0 new, 180 full
    tithi: { ...limb(r.tithi), dayInFortnight: r.tithi.dayInFortnight },
    vara: { index: r.vara.index, name: r.vara.name, english: r.vara.english, description: r.vara.description },
    nakshatra: { ...limb(r.nakshatra), moonSign: { index: ms.index, name: ms.name, english: ms.english, enters: ms.enters ? { name: ms.enters.name, at: iso(ms.enters.atMs) } : null } },
    yoga: limb(r.yoga),
    karana: limb(r.karana),
  }, { headers: { ...CORS, 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }); }
