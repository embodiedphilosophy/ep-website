import { NextResponse } from 'next/server';
import { runAutoComplete } from '@/lib/ops/autocomplete';

// Every 15 minutes (vercel.json cron): tick off tasks the calendar sheet proves are done.
// By hand: /api/ops/auto?key=CRON_SECRET  (&dry=1 lists what it would close and changes nothing)
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers.get('authorization') !== `Bearer ${secret}` && url.searchParams.get('key') !== secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try { return NextResponse.json(await runAutoComplete({ dry: url.searchParams.get('dry') === '1' })); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
