# embodiedphilosophy.com

Next.js site, deployed on Vercel.

## Where content comes from
| Section | Source | Setting |
|---|---|---|
| Events (homepage + /events) | Google Sheet "Events" tab, published as CSV | `EVENTS_SHEET_CSV_URL` |
| Chitheads episodes | Podcast RSS feed | `CHITHEADS_RSS_URL` |
| Email signups | Kit forms | `NEXT_PUBLIC_KIT_FORM_*` |
| Links, prices, stats | `lib/site.js` | edit the file |

Until a setting is filled in, the site shows placeholder content (`data/events.json`, placeholder episodes).
Add settings in Vercel > Project > Settings > Environment Variables, then redeploy.

## The EP Website sheet
One Google Sheet runs the site's content. Publish the **entire document** to the web as CSV
(File → Share → Publish to web → Entire document → Comma-separated values) and set
`EVENTS_SHEET_CSV_URL` to the events tab's published link. The site reads the other tabs from the same link.

| Tab | Feeds |
|---|---|
| EP Site Events | Events everywhere, Living Room Lecture replays |
| Teachers | Teachers page (name, role, bio, photo_url, order, publish) |
| Testimonials | Homepage quotes (quote, name, role, program = home, publish) |
| Links & Prices | Every checkout/enroll link, prices, sign-in, catalog, quiz, Tarka, Sādhana theme |
| Stats | Homepage numbers (number, label, order) |
| Recurring | Weekly series (e.g. Meditation Mondays): the site generates the next 10 dates itself. Use skip_dates (comma-separated YYYY-MM-DD) for weeks off |

If a tab can't be read, the site falls back to the copies in `data/` and `lib/site.js`.

## Events sheet columns
`id, title, date, end_date, time, program, price, host, note, registration_url, series, publish`

- `date` / `end_date`: YYYY-MM-DD (Eastern). Events disappear after their end date.
- `time`: shown as written, e.g. `7pm ET`
- `program`: `lrl`, `wisdom`, `sadhana` or `seasonal`
- `price`: `Free`, `Pay what you can`, `By donation`, `Members`, `Enrolled`, `Enroll`, or an amount like `$79`
- `registration_url`: where the Register button goes (Kit landing page, Kajabi offer, Circle event)
- `series`: same value for repeating sessions; only the next one shows on the homepage
- `publish`: `FALSE` hides a row

The site re-reads the sheet every 5 minutes.

## Local development
```
npm install
npm run dev
```

## Meditation Mondays drop-in → Zoom
Kit product purchase → `/api/kit/dropin?key=KIT_WEBHOOK_SECRET` → the buyer is registered in Zoom for the
next session only, and Zoom emails their personal link. Settings: see `.env.example`.
Zoom meeting must be recurring, with registration required and "Attendees register for each occurrence".

## Automatic Zoom meetings
Set `zoom` = TRUE on any row in **EP Site Events** (one-off events) or **Recurring** (weekly series).
Once a day (vercel.json cron), `/api/zoom/sync` creates the Zoom meeting with registration on, or updates it
if the title, date, time or length changed. Run it immediately: `/api/zoom/sync?key=CRON_SECRET`.
- `duration_minutes`: optional, default 90
- Recurring `zoom_registration`: `once` (register once for every session, e.g. a semester) or `each`
- Free events with zoom = TRUE: sign-ups on the Living Room Lectures page register people in Zoom automatically.
Meetings are matched by a tag like `[ep:lrl-2026-11]` in the Zoom agenda, so don't remove it.

## One calendar: the Master Schedule (EP-Programming-Calendar)
When CALENDAR_SHEET_ID and the Google service account are set, the website's events and the Ops dashboard
both read the Master Schedule. Per-row columns (Time, Website, Public Title, Teachers, Course Host, Zoom,
Duration, Registration URL, Video ID, Summary) override the **Track Defaults** tab. Without those settings
the site falls back to the EP Website sheet.

## Ops dashboard (/ops)
- Sign-in: email link (Resend) for anyone on the **Team** tab. Directors see everyone.
- Tasks: Motion is the master list. Tasks labelled with a person's name or one of their roles appear for them;
  ticking one off completes it in Motion.
- Daily job (/api/ops/daily): creates calendar tasks in Motion from **Task Templates** (next 30 days),
  welcomes newly assigned teachers, and emails teachers and course hosts a week before, the day before and
  the day of, with the Zoom link.

## Course pages (/courses/[slug])
Teachers write their course page during onboarding (/teach). It's saved to the **Course Pages** tab of
EP-Programming-Calendar; set its `status` to `published` and it appears at /courses/[slug] (dates, time, price and the
Enroll link come from the Master Schedule). Drafts: /teach/preview/[slug] (directors and that course's teachers).
Approved bios and headshots from the **Teacher Profiles** tab (`status` = `approved`) replace the ones on the Teachers page.

## The Weekly Scaffolding (Kit newsletter draft)
Every Thursday (vercel.json cron) `/api/scaffolding` builds a **Kit draft** for the coming Sunday. It never schedules or sends.
- Words come from the **Weekly Scaffolding** tab of EP-Programming-Calendar (one row per Sunday). Blank required
  fields show as yellow `[FILL IN]` and the subject starts `[NEEDS CONTENT]`.
- Events come from the **Master Schedule**: the Sunday through the following Saturday, plus multi-day events still running.
- Buttons per Track come from the **Track Defaults** newsletter columns: `newsletter` (show / enrolled_only / hide),
  `enrolled_tags` (Kit tag names, comma-separated), `enrolled_label`, `enrolled_url`, `open_label`, `open_url`, `button_color`.
  A subscriber with any enrolled tag sees the enrolled button; everyone else sees the open one. The Master Schedule's
  `Enrolled Tag` column adds tags for a single row. A row's Registration URL replaces `open_url`.
- Re-run after editing the sheet: `/api/scaffolding?key=CRON_SECRET&date=YYYY-MM-DD` (overwrites the unsent draft, including edits made in Kit).
  Look first: `&preview=1` (web page) or `&dry=1` (JSON). Nothing is created in either.
- Settings: `KIT_API_KEY` (Kit API v4 key). Optional `SCAFFOLDING_SEGMENT_ID` or `SCAFFOLDING_TAG_ID` (default: all subscribers),
  `SCAFFOLDING_TEMPLATE_ID` (default 5578308, "Text only"). Uses the existing Google, Resend and CRON_SECRET settings.

## Teacher onboarding
1. **Bio & headshot** (60–100 words, square photo, uploaded to the ep-media Blob store). Returning teachers confirm
   what's on file (Teacher Profiles tab, or the website's Teachers tab) or update it.
2. **Their offering**, once per upcoming offering (a Series, or a single event): title, subtitle, description,
   what students will explore, who it's for, plus, when that track's **Task Templates** have a Teacher row for it:
   - readings: share them all now (links or uploads) or send them a week before each session;
   - three promotional email blurbs (rows mentioning "blurbs"/"promotional": EVENT, i.e. courses a teacher leads
     on their own; Wisdom School and Sādhana School don't ask, since EP writes those);
   - a promo clip link (rows mentioning a "clip", e.g. LRL).
3. **Course page preview**; "This looks right" sends it to directors for review.
4. **Circle** (tracks in `CIRCLE_TRACKS`, default `SS,SSWW,EVENT`; `ALL` after the full move to Circle): invite,
   Teachers access group, course space; then how to teach there.
5. **Dashboard tour**, **emails to expect**, a welcome email, and a row on the **Team** tab.

What onboarding closes in Motion (and the daily job then stops creating): bio/headshot, title/description, promo
blurbs, and readings if shared up front. The day after each session, the daily job asks that session's teachers for
their slides as a PDF (tracks with a Teacher "slides" row); EP staff on the Team tab are left out.

### Data: EP-Programming-Calendar (the service account needs edit access)
| Tab | One row per | Set by hand |
|---|---|---|
| Master Schedule, Track Defaults, Task Templates, Team | (existing) | |
| Teacher Profiles | teacher (email) | `status` = `approved` puts their bio/photo on the website's Teachers page |
| Course Pages | offering (Series or event ID) | `status` = `published` puts embodiedphilosophy.com/courses/[slug] live |
| Circle Groups | offering (Series or event ID) | `circle_access_group_ids`: the Circle access group(s) that offering's teachers join (comma-separated) |


Settings for onboarding (Vercel → ep-website): `CIRCLE_API_TOKEN` (Admin API v2), `CIRCLE_TEACHER_ACCESS_GROUP_ID`,
optional `CIRCLE_SPACE_<TRACK>` (default Circle space per track, e.g. `CIRCLE_SPACE_SS`), `CIRCLE_TRACKS`
(default `SS,SSWW,EVENT`; `ALL` after the full move to Circle), `BLOB_READ_WRITE_TOKEN` (ep-media store).

## Member sync (Uscreen / SamCart → Kit tags → Circle)
- **Uscreen** (Settings > Webhooks: Subscription Assigned, Ownership Lifecycle Changed, Access Canceled) →
  `/api/members/uscreen?key=MEMBERS_WEBHOOK_SECRET`. Assigned adds tags; access ending removes them;
  a cancellation request only emails the directors (access runs to the end date).
- **SamCart** (Apps > Webhooks, marketplace rule) → `/api/members/samcart?key=MEMBERS_WEBHOOK_SECRET`.
  Orders add tags; refunds and subscription cancellations remove them and email the directors.
- **Kit → Circle**: Kit webhooks for each mapped tag (added + removed) and for the Hold tag (removed) →
  `/api/members/kit?key=MEMBERS_WEBHOOK_SECRET&tag=<id>&action=add|remove`.
  `GET /api/members/kit?key=…` checks that every mapped Circle group exists.
- Rules: `lib/membership.js` (plan → tag, product → tag, tag → Circle group).
- **Hold tag** ("Hold: Not yet welcomed"): until `MEMBERS_GO_LIVE=1`, new buyers added to Kit also get it.
  Held people are kept out of Circle (so Circle sends nothing) and out of the Weekly Scaffolding.
  Removing the Hold tag releases them: Circle invites them and opens their groups.
- Vercel: `KIT_API_KEY`, `MEMBERS_WEBHOOK_SECRET`, `CIRCLE_API_TOKEN` (Admin V2), optional `MEMBERS_GO_LIVE`,
  `CIRCLE_GROUPS_JSON`, `HOLD_TAG_ID`.
