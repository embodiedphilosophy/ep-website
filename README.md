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
Teachers write their course page during onboarding in the **ep-ops** app (ops.embodiedphilosophy.com/teach). It's
saved to the **Course Pages** tab of EP-Programming-Calendar; set its `status` to `published` and it appears here
(dates, time, price and the Enroll link come from the Master Schedule). Approved bios and headshots from the
**Teacher Profiles** tab (`status` = `approved`) replace the ones on the Teachers page.

## Moving the dashboard to ep-ops
The team dashboard, teacher onboarding and the daily reminder job now live in the ep-ops repo. When
ops.embodiedphilosophy.com is live, set `OPS_ORIGIN=https://ops.embodiedphilosophy.com` here: /ops then redirects
there and this site's daily job stands down (so nobody gets reminders twice). The /ops code here can be deleted after.
