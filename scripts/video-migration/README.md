# Video migration: Vimeo → Circle

Working folder for moving Embodied Philosophy's video library into Circle (ss.embodiedphilosophy.com).
Nothing here is deployed with the website. Nothing has been changed in Vimeo or Circle so far: Step 1 was read-only.

## Scope

Only the **13 Learning Pathways** (as listed on the website's Wisdom School page, from the
"Site Pathways" tab of the EP Programming Calendar sheet) and the **4 Certificate Programs**
(Embodied Yoga Therapy, Buddhist Psychology, Yoga Philosophy, Awakened Body). Everything else stays
out of Circle.

## Files

| File | What it is |
|---|---|
| `pathway-summary.csv` | **Start here.** One row per pathway/certificate source (short talk or Kajabi course): videos expected, found in Vimeo, missing |
| `pathway-mapping.csv` | One row per video: Circle course, section, order, lesson title, Vimeo source. Fill the `approve` column |
| `vimeo-inventory.csv` | Every Vimeo video (2,739): folder, length, date, privacy, file sizes, description |
| `vimeo_inventory.py` | Rebuilds the inventory from Vimeo (read-only, ~4 min) |
| `pathway_mapping.py` | Rebuilds the two pathway files from the inventory (offline). Matching rules are at the top |

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

## Pathway & certificate mapping (8 Oct 2026)

**Decided with Jacob (8 Oct):**
- **Scope.** Only the 13 Learning Pathways and the 4 certificates go into Circle.
- **Whole courses only.** A pathway holds whole courses (e.g. all 4 modules), never one module
  lifted out of a longer course.
- **Yoga Philosophy Certificate** uses the recent course, which doubles as the plug-in for yoga
  teacher trainings. The longer Yoga Philosophy programmes (the 2021/22 cohort) are held back
  for the planned Yoga Studio library.
- **Awakened Body** uses the more recent On Demand version.
- **Uscreen** may be used.

**Circle:**
- All 13 pathways and 4 certificates now have course spaces. `circle-spaces.csv` lists the 11
  created on 8 Oct.
- The new ones are **hidden** until filled. They're private, self-paced, and send non-members to
  "Join Wisdom School Plus", like the first six.

**Vimeo covers 254 videos, about 190 GB.** Still missing (13 sources, 6 more partial):
- most Uscreen short talks;
- Prāṇa & the Energy Body, Bhakti Poetry, Starting Points;
- parts of Four Noble Truths, Brief History of Yoga, Intro to Sanskrit and others.

These come from Uscreen (blocked until `www.uscreen.io` is allowed in the environment's network
settings), or else from Kajabi.

## Still open

1. **Yoga Philosophy Certificate.** Jacob said a 30-hour course. The best match in Vimeo is the
   8-week Yoga Philosophy series from the Fall 2024 teacher training (8 × ~2½ h ≈ 20 h). Is that
   the one?
2. **Courses recorded twice.** Should the more recent recording win there too (the 2021/22
   cohort versions of Haṭha Yoga Texts, Yoga & Buddhism, Vaiṣṇava Bhakti, Śākta Tantra)?

## Step 2 (only after approval)

Videos move one at a time: download from Vimeo → upload to Circle → check → delete the local copy →
log the result in `progress.csv`, so a stopped run picks up where it left off. We start with 2–3
videos and show Jacob the results in Circle before running the rest. Nothing in Vimeo or Uscreen is
ever deleted or changed.
