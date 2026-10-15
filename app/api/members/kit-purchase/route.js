import { NextResponse } from 'next/server';
import { authorized } from '@/lib/membersync';
import { kitCredits } from '@/lib/member/credits';
import { setFields, kitConfigured } from '@/lib/kit';

// Kit purchase → seasonal sādhana credit. For pay-what-you-can sādhanas sold through Kit (Navarātri and the rest):
// what someone paid goes into the offer's Kit custom field (lib/member/credits.js), which the Circle Today strip
// turns into a Fall-season / full-year credit for 14 days afterwards.
// Kit webhook (event purchase.purchase_create) → https://<site>/api/members/kit-purchase?key=MEMBERS_WEBHOOK_SECRET
// Purchases of anything else are ignored. Refunds in Kit: clear the field by hand on that subscriber.
export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const found = kitCredits(b).filter(p => Object.keys(p.fields).length);
  if (!found.length) return NextResponse.json({ skipped: 'no seasonal sādhana in this purchase' });
  if (!kitConfigured()) return NextResponse.json({ skipped: 'KIT_API_KEY not set' });
  const results = [];
  for (const p of found) {
    try {
      const fields = Object.fromEntries(Object.entries(p.fields).map(([k, v]) => [k, String(v)]));
      await setFields(p.email, fields, p.name || undefined);
      console.log('Kit credit', p.email, JSON.stringify(fields));
      results.push({ email: p.email, fields });
    } catch (e) {
      console.error('Kit credit failed', p.email, e.message);
      results.push({ email: p.email, error: e.message });
    }
  }
  const failed = results.filter(r => r.error).length;
  return NextResponse.json({ results }, { status: failed ? 500 : 200 });
}
