import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// The ops dashboard calls this after saving to the sheet, so the site shows the change now instead of
// within 5 minutes. Vercel: REVALIDATE_SECRET (the same value on both deployments)
export async function POST(req) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
