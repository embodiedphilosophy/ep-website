# CE credits (Yoga Alliance continuing education)

Wisdom School Plus members earn certificates for Learning Pathways. Design: Claude Design canvas "CE Credit System"
(https://claude.ai/code/artifact/26abd06d-412e-46ab-bd26-20a7c58dc86f).

## How it works
1. **Study in Circle.** Each CE pathway is a Circle course space. Two Circle workflows ("Send to webhook") tell the
   site when a member completes a lesson or a course: `POST /api/ce/circle?key=<CE_WEBHOOK_KEY>&event=lesson|course`.
   Every call is logged in `ce_events`; unmatched ones show on ops → CE credits → Set-up.
2. **Track.** The member's page is `ss.embodiedphilosophy.com/c/ce-credits` (`public/circle/ce.js`, loaded by
   `public/circle/today.js`; signed in with Circle's identity token like the Today strip). Data: `/api/member/ce`.
3. **Reflect.** When a pathway's course is complete, the page asks for two short answers, the name for the
   certificate and an attestation. `lib/ce/service.js reflect()` then issues the certificate, or holds it for a staff
   look when the pathway was finished in under 40% of its runtime (`PACE_SHARE` in `lib/ce/rules.js`).
4. **Certificate.** `/api/ce/certificate/<id>?k=<key>` renders the PDF (`lib/ce/pdf.js`, fonts in `lib/ce/fonts`).
   `/ce/verify/<id>` is the public check. The "certificate ready" email goes by Resend once `CE_EMAILS=live`.
5. **Staff.** ep-ops `/ops/ce` reads and acts through `/api/ce/admin` (header `x-ce-key: CE_ADMIN_KEY`): approve held
   certificates, change a name (re-sends the PDF), withdraw, mark a pathway finished, download every record as CSV.

## Records (Neon, `DATABASE_URL`; tables made on first use)
`ce_events` (raw Circle calls), `ce_lessons`, `ce_done`, `ce_certs` (a copy of title, hours and category at issue),
`ce_members` (renewal date).

## Set-up
- Site Pathways tab: for each CE pathway fill `circle_space_id` (comma-separated if several), `circle_url`
  (the course link members click), `lessons` (count, for the progress bar) and `runtime_minutes` (for the pace check).
  Optional `ce_slug` pins the pathway's id if its title will change. Site Links & Prices: `yacep_id`.
- Vercel (ep-website): `CE_WEBHOOK_KEY`, `CE_ADMIN_KEY`, then `CE_EMAILS=live` when ready. Existing: `DATABASE_URL`,
  `MEMBER_SECRET`, `RESEND_API_KEY`, `KIT_API_KEY`. Vercel (ep-ops): `CE_ADMIN_KEY` (same value).
- Circle: a space with the slug `ce-credits` (its content is replaced by the tracker), visible to Wisdom School and
  Wisdom School Plus. Two workflows: triggers "Completed lesson" and "Completed course" (the CE course spaces),
  action "Send to webhook" with the URLs above.

## Tests (no network, no database)
- `node --import ./scripts/ce-test/register.mjs scripts/ce-test/check.mjs`: rules + a sample PDF
- `npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/ce-test/db.mjs`: the whole flow in an in-memory Postgres
- `node scripts/ce-test/ui.cjs`: the Circle page click-through, desktop and phone screenshots
