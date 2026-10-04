import { NextResponse } from 'next/server';
import { nextOccurrence, addRegistrant } from '@/lib/zoom';

// Kit calls this when someone buys a product. If it's the Meditation Mondays drop-in,
// the buyer is registered in Zoom for the next session only, and Zoom emails their personal link.
//
// Vercel settings: KIT_WEBHOOK_SECRET, DROPIN_PRODUCT_ID (Kit product id), MEDITATION_MONDAYS_MEETING_ID,
// plus the Zoom credentials in lib/zoom.js.
export const dynamic = 'force-dynamic';

const pick = (...v) => v.find(x => typeof x === 'string' && x.trim());

export async function POST(req) {
  const key = new URL(req.url).searchParams.get('key');
  if (!process.env.KIT_WEBHOOK_SECRET || key !== process.env.KIT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const p = body.purchase || body;
  const sub = body.subscriber || p.subscriber || {};

  // Only act on the drop-in product
  const products = p.products || [];
  const want = String(process.env.DROPIN_PRODUCT_ID || '');
  const isDropIn = products.length === 0 || products.some(x =>
    (want && [x.pid, x.product_id, x.id].map(String).includes(want)) || /drop-?in/i.test(String(x.name || '')));
  if (!isDropIn) {
    console.log('Kit purchase skipped (not the drop-in):', products.map(x => x.name).join(', '));
    return NextResponse.json({ skipped: 'not the drop-in product' });
  }

  const email = pick(p.email_address, sub.email_address, body.email_address);
  if (!email) return NextResponse.json({ error: 'no email in payload' }, { status: 400 });
  const fullName = pick(sub.first_name, p.first_name, body.first_name) || '';
  const [first_name, ...rest] = fullName.split(' ');

  const meetingId = process.env.MEDITATION_MONDAYS_MEETING_ID;
  try {
    const occ = await nextOccurrence(meetingId);
    if (!occ) throw new Error('No upcoming Meditation Mondays session found in Zoom');
    const reg = await addRegistrant(meetingId, { email, first_name, last_name: rest.join(' ') }, occ.id);
    console.log('Drop-in registered', email, occ.start);
    return NextResponse.json({ ok: true, session: occ.start, join_url: reg.join_url ? 'sent by Zoom' : null });
  } catch (e) {
    console.error('Drop-in registration failed', email, e.message);
    // 500 so Kit retries the webhook
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
