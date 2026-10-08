import Shell, { opsUser } from '../Shell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Insights — Embodied Philosophy', robots: { index: false, follow: false } };

// Is the business healthy? Director only. Step 6 of the Ops Dashboard v2 plan.
export default async function Insights() {
  const user = await opsUser(u => u.director);
  return (
    <Shell user={user} current="insights" title="Insights">
      <p className="ops-empty" style={{ maxWidth: 640 }}>Coming later in the build: enrollment against target per offering, ad cost per lead against the $1–2 target, Kit list growth, month-to-date revenue and open support handoffs.</p>
      <p className="ops-empty" style={{ maxWidth: 640, marginTop: 12 }}>Still to decide: the enrollment target for each offering (could be a new column in Event Details).</p>
    </Shell>
  );
}
