# Sahṛdaya Upāya page (mentees only, `/c/mentorship`)

Built from the handoff of 21 Oct 2026. It holds only what is unique to mentees; practice, teaching and the Wednesday sessions stay on Today and the Sādhana School hub.

- **Drawn by** `public/circle/sahrdaya.js` (loaded by `today.js`, no frame). It sets `window.__epMentee` to `yes`/`no`; `season-loader.js` waits for that (up to 12 s) on `/c/mentorship` and shows the hub's mentor tab to non-mentees only.
- **Data:** the same `/api/member/this-week` call as "This week" (`lib/mentee/load.js`), now with a `home` block from `lib/mentee/home.js`: next immersion, Prepare opening (14 days before the Saturday), one-to-one window, peer partner, recent hours.
- **Config:** `data/mentee.json` (space ids, chat/workbook/booking links, `immersions`, `windows`, `pinned`). `message_url` is still a mailto to Jacob until his Circle DM link is added.
- **Peer partners:** sheet tab `Mentee Partners` (season | month | email_a | email_b | name_a | name_b | publish). Card hidden when no pairing. No Ops editor yet (the Settings editors live in ep-ops).
- **P0 limits:** cohort chat is a link-out; Log hours is shown disabled; Hand in is hidden. P1 is in the handoff §6.

Tests: `node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee-home.mjs`
