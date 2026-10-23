# Meditation Pass hub (/c/meditation-pass)

From the code handoff of 23 Oct 2026. The Meditation Mondays course (Circle space 2897426) shows this hub on its **landing page only**; lesson pages (`/c/meditation-pass/sections/…/lessons/…`) stay Circle's own, so replays play in Circle's player with completion tracking. Built the same way as the Wisdom School hub (`docs/wisdom-hub.md`): Circle keeps its top bar and sidebar and `public/circle/season-loader.js` draws our page over the content area.

| Piece | Where |
|---|---|
| Page, drawn inside Circle | `app/school/meditation-pass/page.js`, `MeditationView.js`, `meditation.css` (reuses `school.css` and `wisdom.css`) |
| One call for everything | `GET /api/hub/meditation` → `{plan, next, latestReplay, nextFour[4], upcoming[], sections[], streams[5], …}` |
| What the call reads | `lib/hub/meditation-load.js` (Circle as the member, Kit tags, Ops) |
| The rules | `lib/hub/meditation.js`, pure, tested by `node scripts/ops-test/meditation-hub.mjs` |
| Circle ids, checkout links, prices | `data/mm-hub.json` |
| Streams (teacher, one line) | Settings → Website → "Meditation Mondays: streams" (sheet tab `MM Streams`); `data/mm-streams.json` is the fallback and the starting set ("Create it") |

## Loader
`HUBS['meditation-pass']` in `season-loader.js`, with `landingOnly`: it matches `/c/meditation-pass` (and a short-code suffix) but never a path below it, so opening a lesson removes the frame. The Circle address's `?tab=week|replays|upcoming|teachers` and `?stream=` pass through. `?native=1` shows Circle's own page.

## Plan
`/api/me/plan` does not exist in this repo, so (as the Wisdom hub does) the plan is worked out from the member's Kit tags. **pass** = the Meditation Pass tag, or any tier whose `OPEN` list (`lib/member/programmes.js`) includes `mondays` (Wisdom School, Plus, Sādhana School year, Sahṛdaya Upāya). Those with Wisdom School see "Back to Wisdom School" instead of the teaser. **dropin** = no Pass but one-week access to the live space 2897425 (`joinedSpaces`). **none** = everyone else. Admins preview with `?as=pass|dropin|none`.

A drop-in buyer's "own session" is the one they have an RSVP on, else the first session starting within seven days. Live links (`url`) are only sent for sessions the plan opens, and lesson links only to Pass members; the payload for others carries neither.

## Where the data comes from
- **Live sessions:** Circle's `/community_events` as the member, filtered to space 2897425 (the 56 events titled "Meditation Mondays"). When Circle shows a member none (a visitor), the website's schedule stands in (no Circle link). A session counts as on until its end; the hero rolls to the next Monday then (the page re-checks every 30 seconds, so it does not wait for the cache). Join live shows from 15 minutes before the start.
- **Who teaches which Monday:** Ops, from the same events the site's Upcoming list shows (`getEvents` / `getPastEvents`, series `meditation-mondays`), matched to the Circle event by New York date. Teacher = the row's Teachers; stream = the stream named in its title or notes, else the stream that teacher leads in `MM Streams`. A teacher who leads a stream is shown as the table spells them ("Dr. Abha Rajbhandari"). A date with no entry shows "Meditation Mondays".
- **Replays:** Circle `/courses/2897426/sections` as the member (Pass only). Order: Start here (1212933), the current months as Circle lists them (empty months left out), then Archive months newest first (read by name from the API). The date in a lesson title ("Mon 26 Oct · Metta with Oneika Mays") is matched to Ops for teacher and stream; if Ops has no entry the title's own words are used. Latest replay = the newest published lesson outside Start here. Thumbnails are the course's own; a lesson without one gets the sage "Meditation Mondays Library" tile.
- **Not Pass:** replays are locked cards ("Locked · 5-minute preview") built from the website's recent sessions that have a recording (Video ID), since a non-member cannot read the course. The preview button goes to `links.preview` (the site's free-preview players).
- **Cache:** Circle reads 5 minutes per member (`lib/school/circle.js`); Ops side 5 minutes (shared, plus the sheet layer).
- Nothing here writes to Circle, sends a Circle email or notification, or changes a space.

## Today
The Meditation Mondays card on Today (`public/circle/today.js`) fetches this endpoint after drawing and shows the next session with its stream and teacher, the three after it, and Join now / Open the hub / Replays links. If the call fails the card keeps its old lines.

## Replay lesson titles (step 4) — not wired to anything yet
`replayTitle(ev, streams)` (`lib/hub/meditation.js`, re-exported from `lib/ops/circlesync.js`) builds "Mon 26 Oct · {Stream} with {Teacher}". **Ops' Circle sync does not create replay lessons today**: it only makes the live events, and the replay link is filled in by hand. So nothing calls this yet; whatever creates the lesson (staff by hand, a Make scenario, or a later sync using the Admin API) should use it. The hub also copes with titles that are only the date ("Mon 12 Oct").

## For Jake in Circle once it is live
- Hide "Meditation Mondays · Live" from the sidebar (Space settings → Options → Hide space from sidebar). Today's old "Join" fallback still points to its address, which keeps working.
- Keep the course's lock screen. Note that this also stops drop-in buyers and non-members reaching the hub at all (they land on the lock screen), so their two views are only seen through the lock screen being open to them or via the admin preview. Decide whether the lock screen should let drop-in buyers in.

## Not yet checked against the real Circle API
Lesson field names for thumbnail (`thumbnail_url`, `cover_image_url`, …) and length (`duration_in_seconds`, `duration`, …) are guesses (`lessonOf`); section names for the Archive ("Archive · September 2026", read by month name); whether `/spaces` marks a drop-in's one-week access as joined and whether a drop-in's `/community_events` list holds only their session or all of them; whether a drop-in or visitor can read the course (the hub does not depend on it); and the real slug of the course (`meditation-pass`). The approach lines in `data/mm-streams.json` are first drafts for staff to edit. The 5-minute preview link is the site's free-preview page; confirm that is where it should go.

## Testing
`node scripts/ops-test/meditation-hub.mjs` (rules, no network). Browser: `node scripts/ops-test/meditation-hub.cjs` against `circle-mock.mjs` (members `mmpass@test`, `mmdrop@test`, `mmnone@test`, `mmadmin@test`) and the sheet mock, app on :3200 started with `CIRCLE_HEADLESS_BASE=http://localhost:4600 CIRCLE_HEADLESS_TOKEN=test MEMBER_SECRET=mmtest-secret` and `DATABASE_URL` unset. Covers the three plans at desktop and phone width, the tabs and address, filters, locks, Join live at 15:44/15:46/16:40/17:01 UTC on Mon 26 Oct, and the pop-up.
