# Wisdom School hub (/c/wisdom-school)

From the code handoff of 23 Oct 2026. The Wisdom School space in Circle (ID 2913549) shows this hub instead of the empty "No posts yet" feed. It is built the same way as the Sādhana School hub (`docs/school-hub.md`): Circle keeps its own top bar and sidebar, and our page is drawn over the content area by `public/circle/season-loader.js`.

| Piece | Where |
|---|---|
| Page, drawn inside Circle | `app/school/wisdom-school/page.js`, `WisdomView.js`, `wisdom.css` (reuses `school.css`) |
| One call for everything | `GET /api/hub/wisdom-school` (`app/api/hub/wisdom-school/route.js`) |
| What the call reads | `lib/hub/wisdom-load.js` (Circle, Kit, the CE system, the sheet) |
| The rules (plan, locks, months, counts) | `lib/hub/wisdom.js`, pure, tested by `node scripts/ops-test/wisdom-hub.mjs` |
| Circle ids, links, prices, the four Live rows, library departments | `data/ws-hub.json` |
| Pathways | Settings → Website → "Wisdom School hub: pathways" (sheet tab `WS Pathways`); `data/ws-pathways.json` is the fallback and the starting set |

## How it gets into Circle
`season-loader.js` now knows three hubs (`HUBS`): `sadhana-school`, `mentorship` and `wisdom-school`. On `/c/wisdom-school` it frames `/school/wisdom-school`; the Circle address's own `?tab=month|live|year|book|pathways|library|ce` passes through, so Today and emails can deep-link. No new snippet is needed in Circle: the loader is already there. Add `?native=1` to see Circle's own feed (admins need it to post).

## Plan and locks
The plan is worked out on the server from the member's Kit tags (`lib/member/tier.js`, the same source as Today): **plus** = the Wisdom School Plus tag, **ws** = the Wisdom School tag or a Sādhana School year / Sahṛdaya Upāya (both include Wisdom School), **none** = everyone else. The handoff names `/api/me/plan`; that endpoint does not exist in this repo yet, so the hub reads the tier directly (it can switch to that endpoint when the nav work lands).

A locked item stays visible (dashed Terra border, grey text, a "Plus" or "Members" badge). Nothing is read from a locked space and a locked row carries no link into it: Wisdom School members get the upgrade pop-up, visitors go to checkout. Admins get a "Preview as" menu (`?as=ws|plus|none`).

| Tab | Wisdom School | Plus | Not enrolled |
|---|---|---|---|
| This month | full; side card = Plus teaser | full; side card = CE progress | preview banner, locked; side card = free January lecture |
| Live, Book club | open | open | locked |
| The year | 2026 open | 2026 + Past years | January open, rest locked |
| Pathways | row's `plan` column: `ws` rows open, `plus` rows locked | all open | all locked |
| Course Library | locked + banner | open, each row filtered (`/c/library?dept=…`) | locked |
| Certificates & CE | locked ("115 CE hours across 6 pathways") | CE record + certificates | locked |

## Where the data comes from
- **Events, posts, lessons, progress**: Circle's Headless Member API as the member (`lib/school/circle.js`, cached 5 minutes per member): `/community_events` (Up next, Live, replays), `/spaces/{id}/posts` (Announcements), `/courses/{id}/sections` (months, Book club, Hellenism, pathways, certificate programmes). Access and progress are their own.
- **Month theme**: the section name after " · " (September has none and is used as it stands). The month of a section is its position in `circle.month_sections` (January 1212912 … December 1212924, no 1212913).
- **Question for practice**: the first paragraph of the month's first lesson. The month's lecture button opens that same first lesson. A month with no lesson shows its theme and "Recording coming after the lecture", never a link.
- **Book club**: the section's lessons are the quarters, oldest first; the last is this quarter's book. If the section has none, the title in the Annual Themes sheet is used, then `book_fallback`.
- **Pathways**: the `WS Pathways` sheet tab (columns `order, name, teacher, space_id, section_id, ce_hours, plan, ws_chip, note, publish`). A new pathway is one row. Hellenism is a row with `section_id` 1223514 inside the Pilgrimage course. Until the tab exists the seven 2026 pathways come from `data/ws-pathways.json`; **Create it** in Settings makes the tab and fills them in.
- **CE hours and certificates**: `lib/ce` (`memberSummary`), the same record as the CE tracker; "of 115" is the sum of the pathways' `ce_hours`.
- **Fallback for visitors**: if a visitor's Circle read fails, theme names come from Settings → Annual themes and "Watch a sample lecture" goes to `settings.sample_url` (or the Wisdom School page when empty).

## New since your last visit
Circle shows no unread dots for hidden spaces, so the hub keeps its own (same store as the Sādhana hub, `school_seen`): opening a source from the hub records the time (`POST /api/school/seen`); new = items newer than that (a source never opened counts the last 14 days). Sources: Meditation replays (ended events in Meditation Mondays · Live), the month's lecture (lessons in the current month's section), Book club, Announcements. Needs `DATABASE_URL`; without it the block is left out. Cache is 5 minutes, so a new lesson or post appears within 5 minutes.

## Today
The Wisdom School card on Today (`public/circle/today.js`) fetches this endpoint after it has drawn and shows the month, its theme, the question and the next three sessions from it, so Today and the hub cannot disagree. If the call fails the card keeps its old lines.

## Not yet checked against the real Circle API
Circle's field names for course sections and lessons are not in the public docs; `normSection` / `normLesson` (lib/hub/wisdom.js) accept the likely spellings. To confirm with a real member token: `lessons` inside `/courses/{id}/sections`; the lesson text field (`body`, `description`, `rich_text_body`, `tiptap_body`); lesson `status` for progress; lesson `url`; a timestamp (`published_at` / `created_at`) for "new"; whether a non-member can read the Pilgrimage sections (the visitor's January lecture). Also: whether the Book club lessons are the quarters (above), and the real Circle slug of the hub space (`wisdom-school`; the loader also matches a short-code suffix).

## Testing
`node scripts/ops-test/wisdom-hub.mjs` (plan, locks, months, Up next, pathways, counts). For the browser run `scripts/ops-test/circle-mock.mjs` (members `wsmember@test`, `wsplus@test`, `wsnone@test`), start the app with `CIRCLE_HEADLESS_BASE=http://localhost:4600 CIRCLE_HEADLESS_TOKEN=test MEMBER_SECRET=x`, and sign an `ep_school` cookie with `"admin":true` to use the Preview-as menu.
