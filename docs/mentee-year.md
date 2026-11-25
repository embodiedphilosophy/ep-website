# The mentee year (Ops → Mentee year, `/ops/mentee-year`)

A staff version of the Sahṛdaya Upāya "Mentee year" page (Nov 2026): what each mentee does each day, week, month and quarter from October to July, and the dated steps of the two final projects (the 60-minute talk and the three-session offering), so staff can see where the cohort should be.

- **Where:** a "Mentee year" link in the Ops sidebar (staff), and a card on Today with this month's theme and the next three project steps that links to the page.
- **Tabs** (`?tab=`): **Now** (next three project steps, this month, and the next quarterly review as a tick-list) · **The rhythm** (Daily · Weekly · Monthly · Quarterly · Culmination, and a typical four-week month) · **Month by month** (ten cards, this month highlighted) · **Final projects** (the two-lane strip November to July, the dated table with filters `&p=talk|offering`) · **One-to-ones** (how mentees book; the booking-summary template).
- **Content:** `data/mentee-year.json`, drawn from the Mentee Year page. Dates are real (`YYYY-MM-DD`); text marks `**bold**`, `_italic_`, `~quiet~`, `^date^`. To change a step, edit its row in `steps` **and** the same step in its month card in `months` (a test checks they match). `reviews` holds the three quarterly checklists (December Q1, March mid-year, June readiness). Pacing is this schedule's own and can be adjusted.
- **Code:** `lib/ops/menteeyear.js` (pure helpers), `app/ops/mentee-year/page.js`, styles at the end of `app/ops/ops.css`. Everything is read-only; nothing is written anywhere.
- **Tests:** `node --import ./scripts/ce-test/register.mjs scripts/ops-test/mentee-year.mjs` (content integrity, next steps, current month, reviews, lanes); the pages in the ops test harness (`bash scripts/ops-test/run.sh`, then open `/ops/mentee-year`).
- Not built here (the design handoff for the widgets was not attached): per-mentee step status, the Ledger tabs (Schedule, Months, Step status), and the nudges and Monday digest lines. This page is the shared reference they would hang on.

## Cohort numbers (widgets PR)
The Now and Final projects tabs now read the Mentee Schedule and Mentee Step Status tabs (falling back to `data/mentee-year.json` for steps and months): see "Mentee year widgets" in `docs/sahrdaya-upaya-page.md`. The Immersion numbering in the month cards now follows `data/mentee.json` (Immersion 1 is in November).

The mentee year page (`/school/mentee-year`) now has two tabs, the year and the formation manual: see "The formation manual" in `docs/sahrdaya-upaya-page.md`.


## Ticks, skips and "Completed" (Nov 2026)
Every row of a mentee's "This month" list in Circle has a checkbox and a small "skip" under it. Ticking moves the row into "Completed tasks" (a fold under the list, with Undo). Skip first asks "If you skip this, it will go onto your student report as not having been completed. Do you want to Skip?" (Yes / Cancel). Marks are Mentee Step Status rows: tasks keep their own `step_id`; every other row is `m:<YYYY-MM>:<key>` (the `lib/mentee/monthlist.js` key: buddy, reflection, one-to-one, immersion-1, book-…, handin-…), status `done` | `skipped` | `undone`, saved through `/api/member/year/tick` (ep-website; this month or last only). Rows the page already shows as done on its own (reflection posted, buddy session logged, hand-in in, immersion integrated) are recorded once as `done` with note `auto`. Ops → Mentee year → **Progress** (`?tab=progress&m=YYYY-MM`) shows each row by mentee (done / skipped / not yet, with dates) and each mentee's report of everything skipped (`monthProgress`, `skipReport` in `lib/mentee/year.js`).
