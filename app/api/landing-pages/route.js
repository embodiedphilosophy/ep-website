import { NextResponse } from 'next/server';
import pages from '@/lib/lp/pages';
import { getSite } from '@/lib/content';

// Every landing page under /lp/, for the ops dashboard's Landing Pages screen (ops.embodiedphilosophy.com/ops/landing).
// The list is built from the app/lp/ folders at build time (scripts/lp-index.mjs), so a new page shows up on its
// own. Checkout links come from the same place the pages take them: the Site Links & Prices row, else the default.
// Shape: { pages: [{ slug, title, teacher, url, checkoutUrl, publishedAt, startsAt, endsAt }] }
// startsAt/endsAt are New York days (YYYY-MM-DD); neither means evergreen. The dashboard works out the state.
const BASE = 'https://www.embodiedphilosophy.com';
const OPS_ORIGINS = ['https://ops.embodiedphilosophy.com'];
export const revalidate = 300;

const cors = req => {
  const o = req?.headers.get('origin') || '';
  return OPS_ORIGINS.includes(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'GET, OPTIONS', Vary: 'Origin' } : {};
};

export async function GET(req) {
  const site = await getSite().catch(() => ({ links: {} }));
  const out = pages.map(p => ({
    slug: p.slug,
    title: p.title || p.slug,
    teacher: p.teacher || '',
    url: `${BASE}/lp/${p.slug}`,
    checkoutUrl: (p.checkoutKey && site.links?.[p.checkoutKey]) || p.checkout || '',
    publishedAt: p.publishedAt || '',
    startsAt: p.startsAt || '',
    endsAt: p.endsAt || '',
  }));
  return NextResponse.json({ pages: out }, { headers: { ...cors(req), 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
}

export function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: { ...cors(req), 'Access-Control-Allow-Headers': 'Accept, Content-Type', 'Access-Control-Max-Age': '86400' } });
}
