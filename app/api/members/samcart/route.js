import { NextResponse } from 'next/server';
import { samcartTags } from '@/lib/membership';
import { applyTags, authorized, tellDirectors } from '@/lib/membersync';

// SamCart → Kit member tags. SamCart > Apps > Webhooks (marketplace-wide rule), notify URL:
//   https://<site>/api/members/samcart?key=MEMBERS_WEBHOOK_SECRET
// Events: Product Purchased / Order (adds tags), Refund and Subscription Canceled (remove tags; Circle follows).
// Product → tag rules live in lib/membership.js (samcartTags).
export const dynamic = 'force-dynamic';

const pick = (...v) => v.find(x => x !== undefined && x !== null && String(x).trim() !== '');

function products(b) {
  const list = [].concat(b.products || [], b.product ? [b.product] : [], b.order?.products || []);
  return list.map(p => String(pick(p.id, p.product_id, p.pid) || '')).filter(Boolean);
}

export async function POST(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const type = String(pick(b.type, b.event, b.event_type) || '').toLowerCase();
  const c = b.customer || {};
  const email = pick(c.email, b.email, b.customer_email);
  const name = pick(c.first_name, b.first_name);
  console.log('SamCart webhook', type, JSON.stringify(b).slice(0, 800));

  const tags = [...new Set(products(b).flatMap(samcartTags))];
  if (!tags.length) return NextResponse.json({ skipped: `no member tags for products ${products(b).join(', ') || '(none)'}` });
  if (!email) return NextResponse.json({ error: 'no customer email' }, { status: 400 });

  try {
    if (/refund|cancel/.test(type)) {
      const r = await applyTags({ email, remove: tags, source: `samcart ${type}` });
      await tellDirectors(`SamCart ${type}: ${email}`, [`${pick(c.first_name, '')} ${pick(c.last_name, '')} <${email}>`, `Products: ${products(b).join(', ')}`, 'Their Sādhana tags were removed in Kit; Circle access follows.']);
      return NextResponse.json(r);
    }
    if (/order|purchase|charge|started/.test(type)) {
      return NextResponse.json(await applyTags({ email, name, add: tags, source: `samcart ${type}` }));
    }
    return NextResponse.json({ ignored: type || 'no type' });
  } catch (e) {
    console.error('SamCart sync failed', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
