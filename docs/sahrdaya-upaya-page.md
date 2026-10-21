# Sahṛdaya Upāya page (mentees only, `/c/mentorship`)

Built from the handoff of 21 Oct 2026. It holds only what is unique to mentees; practice, teaching and the Wednesday sessions stay on Today and the Sādhana School hub.

- **Drawn by** `public/circle/sahrdaya.js` (loaded by `today.js`, no frame). It sets `window.__epMentee` to `yes`/`no`; `season-loader.js` waits for that (up to 12 s) on `/c/mentorship` and shows the hub's mentor tab to non-mentees only.
- **Data:** the same `/api/member/this-week` call as "This week" (`lib/mentee/load.js`), now with a `home` block from `lib/mentee/home.js`: next immersion, Prepare opening (14 days before the Saturday), one-to-one window, peer partner, recent hours.
- **Config:** `data/mentee.json` (space ids, chat/workbook/booking links, `immersions`, `windows`, `pinned`). `message_url` is still a mailto to Jacob until his Circle DM link is added.
- **Peer partners:** sheet tab `Mentee Partners` (season | month | email_a | email_b | name_a | name_b | publish). Card hidden when no pairing. No Ops editor yet (the Settings editors live in ep-ops).
- **Log hours (P1):** mentees log observation, practice-teaching, peer articulation or retreat practicum. Entries are `pending` (`member_formation.status`) and only count toward the 100 hours once Jacob confirms. Existing staff rows stay `credited`.
- **Hand in (P1):** `Mentee Assignments` rows with `type = handin` get a Hand in form. Extra columns: `brief` (shown in the form), `hours_component` (observation | practice-teaching | peer | retreat) and `hours` (offers "Also log N hours"). Stored in `mentee_submissions` (draft, submitted, returned). Never touches the Travelogue.
- **Files:** go straight from the browser to a PRIVATE Vercel Blob store using `SUBMISSIONS_BLOB_TOKEN` (or `SUBMISSIONS_READ_WRITE_TOKEN`, which Vercel creates when the store is connected with the prefix `SUBMISSIONS`) (not the public ep-media store). Without that variable the file field is hidden and text hand-ins still work. The browser upload helper is `public/circle/blob-client.js` (rebuild: `scripts/circle-build/README.md`). Mentors open files through short-lived signed links (`/api/member/file`).
- **Jacob's side:** on `/c/today` the mentor view has a "Waiting for you" card: Confirm / Decline hours, Mark returned for hand-ins (`/api/member/submissions`, Circle admins only).
- **Still to do:** posting to the cohort chat (link-out for now), Calendly slots as chips, automatic reflection hours.

Tests: `node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee-home.mjs`
