import { NextResponse } from 'next/server';
import { runPurchaseTags } from '@/lib/kittags/purchases';

// Every 15 minutes (vercel.json cron): tag Circle buyers in Kit by what they bought. See lib/kittags/purchases.js.
// By hand: /api/kit/purchase-tags?key=CRON_SECRET  (&dry=1 lists what it would tag and changes nothing; &days=N)
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers.get('authorization') !== `Bearer ${secret}` && url.searchParams.get('key') !== secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const dry = url.searchParams.get('dry') === '1';
  const days = Math.min(30, Math.max(1, Number(url.searchParams.get('days')) || 3));
  try { return NextResponse.json(await runPurchaseTags({ dry, days })); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
