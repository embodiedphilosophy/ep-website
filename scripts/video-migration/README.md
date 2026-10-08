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

- **323 Vimeo videos, about 238 GB** cover the 13 pathways and 4 certificates.
- **Circle has course spaces only for pathways 1–6.** These sit in the "Learning Pathways" group.
  Their sections are the short talks. The "Certificate Programs" group exists but is empty.
  Pathways 7–13 and the four certificates need course spaces created first.
- **Missing from Vimeo (10 sources).** Most are the Uscreen short talks. Two Kajabi courses are
  missing entirely: Prāṇa & the Energy Body, and Bhakti Poetry. Starting Points is missing too.
  Six courses are only partly there, e.g. 1 of 6 Four Noble Truths videos. These have to come
  from Uscreen or Kajabi.
- **Two versions of some courses.** Several Yoga Philosophy courses exist twice: the 2020–21
  recording and the 2021/22 certificate cohort re-recording. The mapping picks one and says so
  in `notes`.

## Decisions needed from Jacob

1. **Create the missing Circle courses?** That means 7 pathways and 4 certificates, made as course
   spaces in the "Learning Pathways" and "Certificate Programs" groups. Should they be visible
   now, or hidden until filled?
2. **Where the Kajabi courses go in pathways 1–6.** Proposal: the short-talk sections stay as they
   are, then one new section per Kajabi course follows (e.g. "7. Sāṃkhya with Jacob Kyle").
3. **Uscreen and Kajabi access** for the missing material. A Uscreen API key now appears in this
   environment: OK to use it, read-only? Kajabi: is there an export or API key?
4. **Which version** where a course exists twice, and for the certificates: Awakened Body On
   Demand (19 videos) or the LIVE 2023 cohort (20)? The whole Yoga Philosophy 2021/22 cohort
   (85), or only the courses already in pathways?
5. **Circle plan and storage free.** About 240 GB is needed.

## Step 2 (only after approval)

Videos move one at a time: download from Vimeo → upload to Circle → check → delete the local copy →
log the result in `progress.csv`, so a stopped run picks up where it left off. We start with 2–3
videos and show Jacob the results in Circle before running the rest. Nothing in Vimeo or Uscreen is
ever deleted or changed. Uscreen is left out until its files or an API key arrive.
