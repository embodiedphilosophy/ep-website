# Sahṛdaya Upāya "This week" (mentees only)

A dashboard for Sahṛdaya Upāya mentees, drawn inside Circle with Circle's own sidebar and top bar around it. **It is drawn straight into the Circle space by `public/circle/this-week.js` (the same way as the Schedule and Portfolio pages), not in a frame.** An earlier frame version froze Chrome and was dropped; the Next page at `/school/sahrdaya-upaya/this-week` remains only as a stand-alone view. Built from the handoff of 16 Oct 2026. **Mentees only for now**: nothing is launched to other students until it has been refined.

Page: `app/school/sahrdaya-upaya/this-week/` (`ThisWeek.js`, `this-week.css`). Logic: `lib/mentee/`. APIs: `app/api/mentee/{week,practice,assignment,travelogue}`. Staff editors: ep-ops → Settings → Sahṛdaya Upāya.

## How it differs from the handoff (and why)
The handoff assumed a new member area in ep-ops with a magic-link sign-in and an iframe inside a Circle post. This repo already had the Circle pieces, so the page reuses them:

| Handoff said | Built instead | Why |
|---|---|---|
| Page in ep-ops, `/m/this-week` | ep-website, `/school/sahrdaya-upaya/this-week` | The season pages, Circle sign-in, practice log and formation record already live here. |
| Magic-link email + 30-day partitioned cookie | Circle's own identity token → our `ep_school` cookie (`/api/school/enter`) | No email step, and it works in Safari. Closes the "who is the member" question. |
| iframe embed in a pinned Circle post | `public/circle/this-week.js`, loaded by `today.js`, draws the page into the space (no frame) | Same pattern as `/c/schedule`, already working in Circle. |
| New `practice_logs` table | The existing `member_practice` (same streak as the Today strip) | The handoff asked to reuse it. |
| New `formation_hours` table | The existing `member_formation` (ten components, Circle admins credit hours) | Same. |
| New booking system + invites | The existing Calendly one-to-one (`oneToOnes()` in `lib/member/schedule.js`); Calendly sends the invites | The handoff left "existing booking tool?" open. |
| Programme content in Programming editor | Four sheet tabs edited in Settings → Sahṛdaya Upāya | Same sheet-first pattern as the rest of Ops. Not yet inside the Programming editor's season/session screen. |

New tables (Neon, made on first use): `mentee_assignments` (ticks) and `mentee_travelogue` (private lines). The Travelogue is read back only to its author; no staff view reads it.

## Setting it up in Circle (Jacob)
1. Make a space called **This Week** at the top of the Sahṛdaya Upāya space group. Access **Secret**, members = mentees. Turn off posting and comments. Its **slug must be `this-week`** (Space settings → Basics) or change the `PAGES` line in the snippet.
2. **Nothing new to paste.** `today.js` (already in Circle → Settings → Code snippets → JavaScript) now also loads `this-week.js`, which draws the page on `/c/this-week` for mentees only. If you added any "season loader" snippet while testing, replace it with the single line `<script src="https://www.embodiedphilosophy.com/circle/season-loader.js"></script>` (or restore the original); an inline copy containing `this-week` or `pageKey` must be removed.
3. Open the space as a mentee: the page appears under Circle's sidebar. Add `?native=1` to see Circle's own empty space.
4. In `data/mentee.json` fill in the Circle space ids (`mentorship_sessions_space_id`, `mentorship_circle_space_id`) and `mentorship_circle_url`; add the Apprentice Workbook link (`workbook_url`). Without them the "Next live" card uses only the Fall season's live-sessions space, and the Mentorship card shows Jacob's notes but no threads.
5. In Ops, Settings → Sahṛdaya Upāya, fill the weekly reading and assignments (`season` = `fall-2026`; week 1 is the week of Session 1).

## Who can see it
Only people with the Sahṛdaya Upāya Kit tag (`tierFor`) or Circle admins. Checked when the page opens and on every call it makes; the space is also Secret, and the loader only acts on the one slug. Writes need a same-origin request. Only ss.embodiedphilosophy.com and the Circle domain may frame the page (`frame-ancestors`, `next.config.mjs`).

## What each part reads
Greeting/week: `data/school-seasons.json` (`starts_on`). Next live and week ahead: Circle events (headless API, 5-min cache) in the season's live-sessions space and the Mentorship Sessions space, plus the events sheet for what Circle doesn't hold (immersions, one-to-one window). Practice, mālā: `member_practice`. Hours: `member_formation`. Reading, assignments, feedback, launches: the four tabs (5-min cache, so edits show within minutes). If one source fails the card says so and the rest still shows.

## Times
Stored and sent as UTC, shown in the member's browser time zone. During the UK→US clock-change fortnight the page shows a plain note.

## Not checked against the real thing
This was built without Circle, Kit or database credentials; it was tested with the offline checks, an in-memory Postgres, and a signed-in browser with sample data.
- Whether the Headless API's event/post field names match (inherited from `lib/school/tabs.js`; the Circle event page link is `post_url`/`url`).
- Circle's Business plan quota for headless calls (see `school-seasons.md`).
- Safari/Chrome inside Circle's frame: the cookie is `SameSite=Lax` as for the season pages. If a browser blocks it the page asks the member to reopen from Circle.
- Which space ids to put in `data/mentee.json` (unknown here).
- "Remind me" uses Circle's RSVP; it needs the headless token to be allowed to RSVP.
- Circle attendance → formation hours automatically: not built (staff credit hours as now).
- Sunday reflection as its own calendar item: only what the events sheet lists shows.
- Mentee view of mentor-only things, other tiers' dashboards, editing Circle content: out of scope.

## Tests
```
node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee.mjs
npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/mentee-db.mjs
```
