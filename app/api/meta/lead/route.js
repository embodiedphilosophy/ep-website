import { NextResponse } from 'next/server';
import { THANKS } from '@/lib/meta/thanks';

// Server-side copy of a lead-magnet sign-up for Meta's Conversions API.
// The thank-you page (/thanks/[slug]) fires the browser pixel Lead with an event_id and posts the
// same event_id here, so Meta counts the sign-up once even when the browser pixel is blocked.
// Needs META_CAPI_TOKEN (Events Manager → the pixel → Settings → Conversions API → Generate access token).
// Without it this route does nothing, so the browser pixel still works on its own.
export const dynamic = 'force-dynamic';

const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_TOKEN;
const TEST_CODE = process.env.META_CAPI_TEST_CODE; // optional: route events to Events Manager → Test events

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { slug, event_id, fbp, fbc, url } = body;
  const page = THANKS[slug];
  if (!page || !/^[\w-]{8,64}$/.test(String(event_id || ''))) {
    return NextResponse.json({ error: 'unknown page or bad event_id' }, { status: 400 });
  }
  if (!PIXEL || !TOKEN) return NextResponse.json({ ok: true, sent: false });

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const user_data = { client_user_agent: req.headers.get('user-agent') || '' };
  if (ip) user_data.client_ip_address = ip;
  if (typeof fbp === 'string' && fbp.startsWith('fb.')) user_data.fbp = fbp.slice(0, 200);
  if (typeof fbc === 'string' && fbc.startsWith('fb.')) user_data.fbc = fbc.slice(0, 500);
  const country = req.headers.get('x-vercel-ip-country');
  if (country) user_data.country = [await sha256(country.toLowerCase())];

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: 'website',
      event_source_url: typeof url === 'string' && url.startsWith('https://') ? url.slice(0, 500) : `https://www.embodiedphilosophy.com/thanks/${slug}`,
      user_data,
      custom_data: { content_name: page.contentName, content_category: 'lead_magnet' },
    }],
  };
  if (TEST_CODE) payload.test_event_code = TEST_CODE;

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${encodeURIComponent(TOKEN)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Meta CAPI Lead failed', slug, res.status, (await res.text()).slice(0, 300));
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error('Meta CAPI Lead error', slug, err.message);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
