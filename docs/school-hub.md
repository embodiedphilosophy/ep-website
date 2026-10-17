# Sādhana School hub (/school/sadhana-school)

One Circle sidebar row ("Sādhana School") that opens a hub with tabs: This term · Seasons · Kula · Practice · Weekend workshops · Sahṛdaya Upāya. Built from the design handoff of 17 Oct 2026. Same project, sign-in and data layer as the season pages (`docs/school-seasons.md`); the season pages stay at `/school/sadhana-school/<season>`.

`?tab=home|seasons|kula|practice|workshops|mentor` opens a tab directly (default `home`). Inside Circle the loader (`public/circle/season-loader.js`) passes the Circle address's own `?tab=` through to the frame.

## Access
Circle decides who can open what. The hub reads the member's spaces (`GET /spaces` with their headless token) and draws every config row as:
- **open**: the member is in one of its spaces. Click opens the Circle space in the top window.
- **upcoming**: in the space but the season has not started (`starts_on`). Shows "Opens January".
- **locked**: not in the space. Dashed card with the description, the staff-chosen preview and one call to action. Nothing is read from the space, and the card carries no link into it.

Plan label (header): all four seasons = Full year; Mentorship Circle (the row with `mentee_marker`) = mentee; some seasons = "Fall term". The Sahṛdaya Upāya tab shows for full-year students and mentees; a full-year non-mentee sees one locked formation card, a term student no tab.

## Config: `data/school-hub.json`
`settings` (upgrade and formation links) and `items`, one row per card. Seasons take their space ids from `data/school-seasons.json` (`season: "fall-2026"`); every other row needs `circle_space_ids`.
| Field | Notes |
|---|---|
| `key`, `tabs`, `title`, `kind` (`season` `space` `chat` `events` `info`), `order`, `description`, `audience_note` | `tabs` is a list because Announcements and Welcome & Orientation appear on two tabs |
| `circle_space_ids` | open if the member is in any of them. **A row with none is left out until you fill it in** (nothing is guessed) |
| `weekday` | events rows sharing one space (6 = Saturday, 0 = Sunday): picks the next session of that day |
| `requires_plan` | `full-year` or `mentee`. Bridge for rows that share a space (Saturday and Sunday are both in Weekend Workshops) and for term students who may already be in it. Remove once the spaces are split |
| `preview` | staff text, or a public web address (shown as "Read a short preview"). Locked cards only |
| `cta_label`, `cta_url` | locked cards only. Seasons fall back to the season's `enrol_url`, workshops to `settings.upgrade_url`, formation to `settings.formation_url` |
| `mentee_marker` | marks the Mentorship Circle row (decides the mentee plan) |
| `collapse_to`, `always_locked` | the three mentorship rows fold into the single locked `formation` card when the member is not a mentee |

Launch checklist: copy the Circle space ids into the rows above, choose a `preview` for each locked season and the weekend workshops, and set `cta_url`s (Circle paywall or landing pages).

## New-item counts
Circle shows no unread dots once a space is hidden from the sidebar, and its API gives no per-member counts, so the hub keeps its own: when a member opens a space from the hub (`POST /api/school/seen`), `school_seen (email, space_id, at)` in Neon records it. New = posts in that space newer than that time (a space never opened from the hub counts the last 14 days). Counts show on cards, on tab pills and in "New since your last visit" on This term. Without `DATABASE_URL` no counts are shown. Only posts are counted; event spaces (Saturday, Sunday, mentorship sessions) show the next session instead.

## Reads and caching (per member)
Spaces 5 min, events 5 min (shared with This week), latest posts 2 min (one read of 20 posts per open space, deduplicated), config with each deploy. About 8 to 12 Circle reads on a cold load.

## Not yet checked against the real Circle API
- Whether `/spaces` marks joined vs merely visible spaces. `isJoined` (lib/school/circle.js) honours an explicit `false` on `is_member`, `joined` and similar; otherwise being listed counts as joined. `/api/school/debug` (admins) lists the boolean and membership-like field names Circle actually sends.
- `sort=latest` on posts (the hub sorts again itself) and the space `url` field used for links.
- Circle space slugs for the hub and the Mentorship row (`HUBS` in the loader: `sadhana-school`, `mentorship`).

## Testing
`node scripts/ops-test/school-hub.mjs` (rules, previews, counts, store). For the browser: run `scripts/ops-test/circle-mock.mjs` (members `hubterm@test`, `hubfull@test`, `hubmentee@test`, which use ids 101 to 111 for the non-season rows), temporarily fill those ids into `data/school-hub.json`, and sign an `ep_school` cookie as in `docs/school-seasons.md`.
