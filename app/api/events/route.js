import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/events';

// Public list of upcoming EP events for the Circle "Coming Up" panel
// (ss.embodiedphilosophy.com custom code snippet). Read-only, cached for 10 minutes.
const ALLOWED = ['https://ss.embodiedphilosophy.com', 'https://embodied-philosophy.circle.so'];

function headers(req) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
  };
}

export async function GET(req) {
  const rows = (await getEvents()).slice(0, 40).map((e) => ({
    id: e.id || '',
    title: e.title || '',
    date: e.date || '',
    end_date: e.end_date || null,
    time: e.time || '',
    program: e.program || '',
    series: e.series || '',
    host: e.host || '',
    price: e.price || '',
    url: e.registration_url || '',
  }));
  return NextResponse.json({ events: rows }, { headers: headers(req) });
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: headers(req) });
}
