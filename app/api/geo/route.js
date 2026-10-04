import { NextResponse } from 'next/server';
// Visitor's country (from Vercel), so the cookie banner only appears where consent is required
export const dynamic = 'force-dynamic';
export function GET(req) {
  return NextResponse.json({ country: req.headers.get('x-vercel-ip-country') || '' }, { headers: { 'Cache-Control': 'no-store' } });
}
