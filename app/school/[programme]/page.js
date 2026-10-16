import { redirect, notFound } from 'next/navigation';
import { PROGRAMMES, programmeSeasons, defaultSeason } from '@/lib/school/config';

export default async function Page({ params }) {
  const { programme } = await params;
  if (!PROGRAMMES[programme]) notFound();
  const s = defaultSeason(programmeSeasons(programme));
  if (!s) notFound();
  redirect(`/school/${programme}/${s.slug}`);
}
