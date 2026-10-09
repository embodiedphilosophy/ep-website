# Hand-over: Vimeo → Circle video migration (as of 9 Oct 2026)

For the next Claude session. The work lives on the **`video-migration` branch** of
`embodiedphilosophy/ep-website`, in `scripts/video-migration/`. Run it in the **same cloud
environment** as before: it holds the Vimeo and Circle keys and the allowed network addresses.

## Who and how
- Jacob Kyle, director of Embodied Philosophy, isn't a developer. Explain things plainly and
  briefly.
- Ask before anything irreversible. Never delete or change anything in Vimeo or Uscreen.
- Stay on the `video-migration` branch and never change the website code. Merge into main only
  with `git merge --ff-only`, after re-checking origin/main (another session works on main).
- Kajabi, Uscreen and Vimeo are being retired. Circle (ss.embodiedphilosophy.com) and Kit stay.

## Status: main migration DONE
- **262 videos (~191 GB) are in Circle**, each checked (size matches, video attached).
  `progress.csv` lists every video with its Circle lesson ID.
- **Learning Pathways 1–6** (already visible to members) are filled. Each talk went onto its
  existing "… · Overview" lesson; each full course has its own section with "Module 1, 2…" lessons.
- **Pathways 7–13 and 3 certificates** (Embodied Yoga Therapy, Buddhist Psychology, Awakened
  Body) are filled but **hidden**. Jacob unhides them in Circle when ready.
- **Yoga Philosophy Certificate** (Circle space 2900101) is **empty**. Its source is Uscreen
  collection 2193472, which we can't read (see Uscreen below).

## Decisions Jacob made
- **Scope.** Only the 13 Learning Pathways and 4 certificates go into Circle; nothing else from
  Vimeo. Pathways are listed in the website sheet, tab "Site Pathways" (CALENDAR_SHEET_ID), read
  with `lib/google.js` readRange.
- **Whole courses only**, never a single module lifted out of a longer course.
- **Recorded twice:** use the more recent recording.
- **Awakened Body** uses the On Demand version.
- **The long Yoga Philosophy programme** (Vimeo folder "YP CERT 2021/22") is held back for a
  future Yoga Studio library.
- **Seven short talks** were matched by topic and approved by Jacob (see `notes` in
  `pathway-mapping.csv`).

## Open items
1. **For Jacob, in Circle:**
   - Unhide the 10 hidden courses when ready.
   - In Non-Duality, section "1. Upaniṣads & Vedānta Sūtras", drag Modules 3 and 7 into place.
     They were re-uploaded last, so they sit after Module 8.
   - Check the lesson order in Awakened Body and Embodied Yoga Therapy (Vimeo gave no order).
2. **Still missing** (see `pathway-summary.csv`, status "not in Vimeo" / "partial"):
   - **Talk sections with no video:** "2. Classical Yoga" (Classical Yoga), "1. Subtle Body
     Anatomy" (Subtle Body), "1. The Science of Mantras" (Sound, Mantra).
   - **Whole course:** Bhakti Poetry (4 videos, Gītā & Devotion pathway).
   - **Partial:**
     - Four Noble Truths: 1 of 6 (Meditation for Real Life).
     - Mantra Recitation: 1 of 2.
     - Upaniṣads with Daniel Simpson: 1 of 2.
     - Chakras Illuminated: Q&A missing.

   If Jacob names the Vimeo titles: add a rule in `pathway_mapping.py`, rerun it, then run
   `migrate.py --source "<course>"`.
3. **Yoga Philosophy Certificate:** Jacob may send the video titles from the Uscreen collection
   so they can be found in Vimeo. Otherwise someone exports the files from Uscreen.

## Uscreen (dead ends, don't retry)
- The API key can't be obtained; the `USCREEN_API_KEY` variable is empty.
- Zapier's Uscreen connection only covers users, orders and plays. A custom Zapier code action
  (`list_uscreen_programs`) got "Missing private API key". It's harmless and can be deleted.
- Most Uscreen talks are also in Vimeo, many in the "EPTV" folder as "Talk (Teacher)".

## How the tools work
- `vimeo_inventory.py` reads all 2,739 Vimeo videos into `vimeo-inventory.csv` (read-only, ~4 min).
- `pathway_mapping.py` matches rules → `pathway-mapping.csv` (per video) and `pathway-summary.csv`.
- `create_circle_courses.py` created the 11 new course spaces (`circle-spaces.csv`). Already done.
- `migrate.py` moves videos one at a time: Vimeo download (1080p or the largest under 4 GB) →
  Circle upload → lesson → check → delete local copy → log.
  - Options: `--programme`, `--source`, `--vimeo-id`, `--dry-run`, `--retry-failed`.
  - It resumes automatically.
  - For long runs, set `MIGRATION_PROGRESS=/tmp/…/progress.csv`, then copy the file back at the
    end. This avoids constant "uncommitted changes" reminders.
  - Keep each background run under ~1.5 hours: the 2-hour background limit stops it.

## Gotchas learned
- **Circle and Python:** Python's urllib needs a User-Agent header, or Cloudflare returns 403
  (error 1010).
- **Circle upload flow:**
  1. POST `/direct_uploads` with `{blob:{filename, content_type, byte_size, checksum}}`; the
     checksum is the base64 MD5.
  2. PUT the bytes to the returned URL (s3.amazonaws.com).
  3. Create or PATCH a `/course_lessons` with `featured_media: signed_id`. Sections are made via
     `/course_sections`.
- **Limits:** 4 GB per file. Event recordings can't be set via the API.
- **Vimeo's API file size is sometimes a few MB off.** `migrate.py` compares against the file
  server's real size instead.
- **Long uploads/downloads can be cut by the network proxy.** `migrate.py` retries and resumes.
