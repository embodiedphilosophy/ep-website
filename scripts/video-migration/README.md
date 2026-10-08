# Video migration: Vimeo → Circle

Working folder for moving Embodied Philosophy's video library into Circle (ss.embodiedphilosophy.com).
Nothing here is deployed with the website. Nothing has been changed in Vimeo or Circle so far: Step 1 was read-only.

## Files

| File | What it is |
|---|---|
| `vimeo-inventory.csv` | Every Vimeo video (2,739): folder, showcases, length, date, privacy, file sizes, description |
| `mapping-by-folder.csv` | **Start here.** One row per Vimeo folder with the proposed decision. ~140 rows |
| `mapping-draft.csv` | One row per video: action, Circle space, section, order, lesson title. Fill the `approve` column |
| `vimeo_inventory.py` | Rebuilds the inventory from Vimeo (read-only, ~4 min) |
| `draft_mapping.py` | Rebuilds the two mapping files from the inventory (offline) |

All CSVs open directly in Google Sheets (File → Import → Upload).

## What we found (8 Oct 2026)

**Vimeo:** 2,739 videos, about 3,600 hours. Downloading at 1080p (or lower when that's all there is)
comes to about **2.1 TB**, nearly the same as at the very best quality. Vimeo no longer has the *original*
uploaded files for any video, only its own MP4 copies (up to 4K for a few). 73 videos are broken on
Vimeo (stuck "uploading" or upload errors) and can't be downloaded. 1,185 videos sit in no folder at all.

**Circle can take uploaded video through its API.** The route is: upload the file to Circle's storage,
then attach it as a **course lesson's video** (the "featured media" at the top of a lesson).
Posts in a regular space can carry an uploaded file too, but whether it shows as a player is
untested. **Event recordings can't be attached through the API**, so recordings go into course
lessons or posts instead. Circle can also embed a Vimeo link in a lesson's text, but that keeps
Vimeo running, which defeats the point.

**Limits that matter:**
- **4 GB per file.** 20 videos are bigger at their best quality. For those we upload the 720p
  copy, which fits.
- **Storage.** Circle counts video toward the plan's storage. Third-party pricing pages say about
  200 GB on Professional, 500 GB on Business and 1 TB on Plus; we couldn't confirm this from
  Circle's own docs. **The whole library (≈2 TB) does not fit in any of these.** This is the main
  decision.
- **API calls.** Circle allows 5,000 API calls a month on Business and 30,000 on Plus. Each
  video takes about 2 to 3 calls, so this isn't a constraint.

## Draft mapping, in numbers

| Proposed | Videos | Size | Meaning |
|---|---:|---:|---|
| MIGRATE | 46 | 57 GB | Clear match to a section that already exists in a Circle course (themed courses, Pilgrimage Project 2026, Healing Stress) |
| SUGGEST | 92 | 119 GB | Plausible home: last year's Sadhana School seasons → the four "Recordings & Readings" courses; Meditation Mondays 2026 → the Library; Navarātri 2025 → Navarātri Recordings |
| DECIDE | 2,328 | 1,678 GB | Older programmes and loose videos with no Circle home yet |
| ARCHIVE | 51 | 84 GB | Older Sadhana School cohorts and raw camera files: keep a copy, not in Circle |
| SKIP | 222 | 129 GB | Broken uploads, exact duplicates, "no slides" duplicates, trailers/promo clips |

MIGRATE + SUGGEST is about **176 GB**, which fits comfortably on a Business plan.

## Decisions needed from Jacob

1. **Circle plan and storage.** Which plan is Circle on, and how much storage is free?
   (Circle admin → Settings → Plans & billing, or the Media manager.)
2. **What happens to the ~2,300 "DECIDE" videos.** Options:
   (a) put a curated selection in Circle;
   (b) keep everything as files in cheap storage (e.g. a Google Drive or Backblaze folder, roughly
   $10–20 a month for 2 TB) before Vimeo is cancelled;
   (c) both: the best of it in Circle, everything archived.
   We'd recommend (c).
3. **Review the mapping.** In `mapping-by-folder.csv`, mark each folder Y / N or edit it. For the
   MIGRATE and SUGGEST rows in `mapping-draft.csv`, check the titles and pick one of the three
   sound baths. The Summer Retreat 2025 videos only have Zoom file names, so they need real titles.
4. **Duplicates across courses.** Four Pilgrimage lectures also fit the *Myth, Shadow* course.
   Putting them in both uses double the storage. Is one place enough?

## Step 2 (only after approval)

Videos move one at a time: download from Vimeo → upload to Circle → check → delete the local copy →
log the result in `progress.csv`, so a stopped run picks up where it left off. We start with 2–3
videos and show Jacob the results in Circle before running the rest. Nothing in Vimeo or Uscreen is
ever deleted or changed. Uscreen is left out until its files or an API key arrive.
