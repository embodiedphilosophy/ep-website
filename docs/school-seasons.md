# Sādhana School: one page per season (/school/[programme]/[season])

Each season is one page. The Sādhana School sidebar row in Circle opens the **current season** directly (no hub page in between), with six tabs and a Season menu. Built from the handoff of 1 Nov 2026 (it replaced the hub of 17 Oct and the five-tab season page of 16 Oct). Do the Circle setup steps from the 16 Oct handoff first: the code reads the same spaces and topics.

## The page
- **Landing:** `/school/sadhana-school` redirects to the season the member is in that is running now (by `starts_on` / `ends_on`), else the next one, else the last. A member in none gets the one running now, whose page explains how to join. Old addresses still work: the hub's `?tab=` names (home, seasons, practice, workshops) and the old season tabs (all, live, recordings) map to the nearest new tab.
- **Header:** the latest announcement as a slim line (under 30 days old), "SĀDHANA SCHOOL · FULL YEAR / FALL TERM", the season title, "season · text · week n of 8 · Wednesdays 9:00 am your time", and the **Season** menu (seasons the member can't open say "full year only" or "opens January"). Week n is the session coming up.
- **Tabs** (`?tab=`): `week` (default) · `sessions` · `readings` · `reflections` · `kula` · `resources`. Study pods (behind `STUDY_PODS=on`, `docs/study-pods.md`) add a seventh, `pods`, only while switched on. Counts on Reflections and Kula are new items since the member last opened them.
- **This week:** Next live (RSVP, Add to calendar, Join now while live), this week's reading, latest recording, Reflect this week (the `prompt` readings row for the week, else a question about the week's sūtras), "The eight weeks", New in Reflections, Kula.
- **Sessions:** one date-ordered list of the Wednesday sessions (a session's recording attaches to its row) and the season's Saturday Open Sessions. A term student's Circle feed holds none of the weekend events, so those rows are built from `immersions` in `data/mentee.json` (date and title, no time) and say "Full year only"; a full-year student's row uses the real event when Circle has one.
- **Readings:** the season's reading assignments (`lib/school/readings.js`; Ops → Settings → Sādhana School → Reading assignments).
- **Kula:** the kula chat and Kula Commentary spaces. **Resources:** Welcome & Orientation, Practice Portfolio, The Sādhaka's Sourcebook, Song of Sādhana, Practice Resources. These are rows of `data/school-hub.json` (see `docs/school-hub.md`); a row with no Circle space id is not drawn (Sourcebook and Song of Sādhana are waiting for theirs).
- **"With the full year":** a dashed line at the bottom for anyone not in the full year, with a button to `settings.upgrade_url`.
- **Times** are shown in the viewer's own time zone, never a fixed one.
- Logic in `lib/school/season.js` (pure; `scripts/ops-test/school-season.mjs`), page in `app/school/[programme]/[season]/`.

## Reflections
Posts in the season's post space with the Reflections topic, newest first, with filters All · From the mentees · Mine and a composer (`/api/school/reflection`). Each card has the author, week, opening lines (`lib/school/reflections.js` `opening`) and its thread: `GET /api/school/reflection?programme=&season=&post=` reads the post's Circle comments as the member and `POST /api/school/reflection/reply` writes a reply as the member (`parent` = the comment answered; rate limited, 4,000 characters). Two levels are shown: a reply to a reply joins its comment's replies with "@name". **Mentee badge:** a post is marked SAHṚDAYA UPĀYA MENTEE only if its Circle post id is in `mentee_reflections.posted_post_id` with status `posted` (written by the Sahṛdaya Upāya Reflections page when a mentee presses Post to Sādhana School; `lib/school/menteeposts.js`). Until that page ships, or without `DATABASE_URL`, nobody is marked. In a thread, the post author's own replies on a mentee post carry a small MENTEE chip (other mentees' replies are not marked: the comment list gives no reliable way to tell). **Not yet verified against the real Circle API:** the comments read (`GET /posts/{id}/comments`) and the reply write (`POST /posts/{id}/comments` with `parent_comment_id` and a `tiptap_body`), the author/body field names, and that a member may reply as themselves. Like the cohort chat send, the first real reply after deploy is the test: on failure the reader sees "We could not post your reply" and can still open the post in Circle. Replies are not counted in the tab's new count (the posts list gives only a total).

## Wiring a season
Edit `data/school-seasons.json`. Each season needs `hub_space_id` (the post space), `event_space_id` (the event space) and `topic_ids` (`readings`, `reflections`, `recordings`, topics in the hub space). A season with no ids shows "being set up" and is hidden from the sidebar. Dates and titles come from this file too.

## Environment
- `CIRCLE_HEADLESS_TOKEN`: a **Headless Auth** token (Circle → Developers → Tokens). An Admin V2 token returns 403.
- `MEMBER_SECRET` (or `OPS_SECRET`): signs the member cookie, as for `/api/member/*`.
- `CIRCLE_IDENTITY_AUD`: already used by the member sign-in.

## How the page gets into Circle
Circle's own sidebar stays; our page is drawn inside the content area (an iframe over `circle-ai-shell-workspace-body`). The loader is `public/circle/season-loader.js`, served from the site: in Circle → Settings → Code snippets → **Head code snippets**, put one line, `<script src="https://www.embodiedphilosophy.com/circle/season-loader.js"></script>`, and nothing else for it (no inline copy). It maps each Circle space slug (the post space and the hidden event space) to a season slug, and the Sādhana School row (slug `sadhana-school`) to `/school/sadhana-school`, which redirects to the current season. `/c/mentorship` is no longer part of it: mentees get `public/circle/sahrdaya.js`, everyone else Circle's own page. Add `?native=1` to a Circle space address to see Circle's own page (admins need this to post or edit).

Sign-in: the snippet posts Circle's signed identity token (`window.circleUser.identityToken`) to `/api/school/enter`, which verifies it (`lib/member/identity.js`) and sets an httpOnly cookie holding only the email. It does this quietly on any Circle page (`?warm=1`), so the season opens straight away. A typed email is never enough, because the headless token can act as anyone. The server turns the email into a one-hour Circle access token and keeps it in memory; no Circle token reaches the browser.

## Not yet checked against the real Circle API
These are the handoff's open questions. The code takes the likeliest answer and keeps each in one place (`lib/school/tabs.js` normalisers, `lib/school/circle.js`):
- Topic filter on posts: filtering is done client side.
- Event fields (start/end, replay, space id, duration) accept several spellings; the replay field is a guess.
- Event list is filtered by space client side.
- The create-post body (`name`, `body`, `topic_ids`) and the event_attendees body are guesses.
- Whether headless calls count against the 5,000 Admin API requests a month.
- Comments and replies (`GET`/`POST /posts/{id}/comments`, `parent_comment_id`) on the Reflections tab.
- Whether `/community_events` returns the Weekend Workshops events to full-year students, and the field names of announcement and Kula posts.

## Testing
`node --import ./scripts/ce-test/register.mjs scripts/ops-test/school-season.mjs` (the page), `school-reflections.mjs` (Reflections), `school-hub.mjs` (who can open what, the last-visit store) and `school-tabs.mjs` (events, posts, readings) run with no network. `node scripts/ops-test/circle-mock.mjs` is a stand-in for Circle (port 4600); run the app with `CIRCLE_HEADLESS_BASE=http://localhost:4600 CIRCLE_HEADLESS_TOKEN=test MEMBER_SECRET=x`, temporarily fill the ids in `data/school-seasons.json` (Fall 22/11, Winter 32/31; topics 1/2/3), and sign a cookie `ep_school` for `annual@test`, `fall@test` or `nobody@test`.
