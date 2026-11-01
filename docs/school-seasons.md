# Season spaces (/school/[programme]/[season])

> **One page per season (Nov 2026).** The hub is gone: the Sādhana School sidebar row opens the current season, with six tabs (This week · Sessions · Readings · Reflections · Kula · Resources) and a Season menu. `/school/sadhana-school` redirects to the season the member is in that is running now (else the next, else the last; a member in none gets the one running now, which explains how to join). `?tab=` takes `week` (default) `sessions` `readings` `reflections` `kula` `resources`; the old hub and five-tab names map to the nearest one. Logic in `lib/school/season.js` (tested by `scripts/ops-test/school-season.mjs`), page `app/school/[programme]/[season]/`. The text below about the five old tabs is out of date and is rewritten in the clean-up PR.
> - **Sessions** is one date-ordered list: the Wednesday sessions (recording attached to its row) and the season's Saturday Open Sessions. A term student's Circle feed has none of the weekend events, so those rows come from `immersions` in `data/mentee.json` (date and title, no time) and show "Full year only"; a full-year student's row uses the real event when Circle has one.
> - **Week number** is the session coming up. **Reflect this week** uses the `prompt` readings row for that week (Ops → Reading assignments), else asks about the week's sūtras.
> - **Counts** on Reflections and Kula come from `school_seen` (needs `DATABASE_URL`). Reflections has its own key, `refl-<season space id>`, written when the tab is opened.
> - **Resources** are the rows tagged `resources` in `data/school-hub.json`. Sourcebook and Song of Sādhana have no Circle space id yet, so their cards stay hidden until the ids are filled in.
> - **Times** are shown in the viewer's own time zone.

One sidebar row per Sādhana School season; each opens a page with the tabs All · Live Sessions · Recordings · Readings · Reflections. Built from the Circle handoff of 16 Oct 2026. Do the Circle setup steps in that handoff first: the code reads the same spaces and topics.

## Wiring a season
Edit `data/school-seasons.json`. Each season needs `hub_space_id` (the post space), `event_space_id` (the event space) and `topic_ids` (`readings`, `reflections`, `recordings`, topics in the hub space). A season with no ids shows "being set up" and is hidden from the sidebar. Dates and titles come from this file too.

## Environment
- `CIRCLE_HEADLESS_TOKEN`: a **Headless Auth** token (Circle → Developers → Tokens). An Admin V2 token returns 403.
- `MEMBER_SECRET` (or `OPS_SECRET`): signs the member cookie, as for `/api/member/*`.
- `CIRCLE_IDENTITY_AUD`: already used by the member sign-in.

## How the season view gets into Circle
Circle's own sidebar stays; our page is drawn inside the content area of each season space (an iframe over `circle-ai-shell-workspace-body`). The loader is `public/circle/season-loader.js`, served from the site: in Circle → Settings → Code snippets → **Head code snippets**, put one line, `<script src="https://www.embodiedphilosophy.com/circle/season-loader.js"></script>`, and nothing else for it (no inline copy). It maps each Circle space slug (the post space and the hidden event space) to a season slug. Add `?native=1` to a Circle space address to see Circle's own page (admins need this to post or edit).

Sign-in: the snippet posts Circle's signed identity token (`window.circleUser.identityToken`) to `/api/school/enter`, which verifies it (`lib/member/identity.js`) and sets an httpOnly cookie holding only the email. It does this quietly on any Circle page (`?warm=1`), so the season opens straight away. A typed email is never enough, because the headless token can act as anyone. The server turns the email into a one-hour Circle access token and keeps it in memory; no Circle token reaches the browser.

## Not yet checked against the real Circle API
These are the handoff's open questions. The code takes the likeliest answer and keeps each in one place (`lib/school/tabs.js` normalisers, `lib/school/circle.js`):
- Topic filter on posts: filtering is done client side.
- Event fields (start/end, replay, space id, duration) accept several spellings; the replay field is a guess.
- Event list is filtered by space client side.
- The create-post body (`name`, `body`, `topic_ids`) and the event_attendees body are guesses.
- Whether headless calls count against the 5,000 Admin API requests a month.
- Where Today in School, Announcements and the other School spaces go: not part of this build.

## Testing
`node scripts/ops-test/school-tabs.mjs` checks the tab rules. `node scripts/ops-test/circle-mock.mjs` is a stand-in for Circle (port 4600); run the app with `CIRCLE_HEADLESS_BASE=http://localhost:4600 CIRCLE_HEADLESS_TOKEN=test MEMBER_SECRET=x`, temporarily fill the ids in `data/school-seasons.json` (Fall 22/11, Winter 32/31; topics 1/2/3), and sign a cookie `ep_school` for `annual@test`, `fall@test` or `nobody@test`.
