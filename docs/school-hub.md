# Sādhana School access rules and config (`data/school-hub.json`)

The hub page is gone: the Sādhana School row opens the current season (`docs/school-seasons.md`). What was the hub's config is still the list of Circle spaces the season page reads besides the season itself. This file says how access, counts and caching work.

## Access
Circle decides who can open what. The page reads the member's spaces (`GET /spaces` with their headless token) and draws every config row as:
- **open**: the member is in one of its spaces. Click opens the Circle space in the top window.
- **upcoming**: a season the member is in that has not started (`starts_on`). The Season menu says "opens January".
- **locked**: not in the space. Shown dashed without a link; nothing is read from the space.
- A row with **no Circle space id** is left out (nothing is guessed).

Plan label (header): in all four seasons = Full year; in some = "Fall term" or "Fall + Winter terms". Mentees are not a plan here: `/c/mentorship` is their own page (`docs/sahrdaya-upaya-page.md`).

## Config: `data/school-hub.json`
`settings` (`upgrade_label`, `upgrade_url`: the "See the full year" button; `reflections_space_id`: Kula Commentary; `mentee_space_id`: the Mentorship Circle, to tell mentees; `teacher_member_ids`: Circle member ids of teachers besides admins and moderators) and `items`, one row per Circle space the season page uses. Seasons take their space ids from `data/school-seasons.json` (`season: "fall-2026"`); every other row needs `circle_space_ids`.
| Field | Notes |
|---|---|
| `key`, `tabs`, `title`, `kind` (`season` `space` `chat` `events`), `order`, `description`, `audience_note` | the page finds rows by `key`: `announcements` (the line on top), `kula-chat` (Kula), `reflections` (Kula Commentary, the Reflections tab), `welcome-orientation` `practice-portfolio` `sourcebook` `song-of-sadhana` `practice-resources` (Resources), `saturday-open-sessions` (the weekend Open Sessions). `tabs` says which tab a row belongs to. |
| `circle_space_ids` | open if the member is in any of them. A row with none is left out |
| `weekday` | events rows sharing one space: 6 = Saturday |
| `kind: file`, `url`, `source_title` | a PDF card (Sourcebook, Song of Sādhana): `url` is the file, or `source_title` names a "What you'll need" reading whose uploaded file is used. No file, no card |
| `requires_plan` | `full-year` keeps a row locked for term students who may be in its space. Not used by any row now: the Saturday Open Sessions belong to every season's weeks |
| `cta_label`, `cta_url`, `preview` | kept for locked cards; the season page does not use them yet |

To add the Song of Sādhana PDF: put its address in `url` of that row (or upload it in Ops → Reading assignments as a "What you'll need" reading called "Song of Sādhana" and the Sourcebook works the same way).

## New-item counts
Circle shows no unread dots once a space is hidden from the sidebar, and its API gives no per-member counts, so the page keeps its own: when a member opens a space from the page (`POST /api/school/seen`), `school_seen (email, space_id, at)` in Neon records it. New = posts in that space newer than that time (a space never opened counts the last 14 days). The Reflections tab uses the key `refl-<Reflections space id>`, written when the tab is opened. Counts show on the Reflections and Kula tabs and on the Kula card. Without `DATABASE_URL` no counts are shown. Only posts are counted, not replies.

## Reads and caching (per member)
Spaces 5 min, events 5 min, latest posts 2 min (one read of the newest posts per open space: announcements, Kula, Resources), comments 30 s, config with each deploy. About 8 to 12 Circle reads on a cold load.

## Not yet checked against the real Circle API
- Whether `/spaces` marks joined vs merely visible spaces. `isJoined` (lib/school/circle.js) honours an explicit `false` on `is_member`, `joined` and similar; otherwise being listed counts as joined. `/api/school/debug` (admins) lists the field names Circle actually sends. **If a term student sees Announcements or Welcome & Orientation locked**, check this first, then the space's Circle access (it must include every term paywall as well as the full year).
- `sort=latest` on posts (the page sorts again itself) and the space `url` field used for links.

## Testing
`node --import ./scripts/ce-test/register.mjs scripts/ops-test/school-hub.mjs` (access rules, counts, the last-visit store) and `school-season.mjs`. For the browser: run `scripts/ops-test/circle-mock.mjs` (members `hubterm@test`, `hubfull@test`), temporarily fill the mock's space ids (101 to 108) into `data/school-hub.json` and Fall's topic ids (1/2/3) into `data/school-seasons.json`, and sign an `ep_school` cookie as in `docs/school-seasons.md`. Restore both files afterwards.
