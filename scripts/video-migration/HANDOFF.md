# Hand-over: video migration (as of 8 Oct 2026)

For the next Claude session. Read this, then `README.md`, `pathway-summary.csv` and `pathway-mapping.csv`.

## Ground rules (from Jacob)
- Branch `video-migration` only. Never change the website code. Merge into main only with
  `git merge --ff-only` after re-checking origin/main.
- Never delete or change anything in Vimeo or Uscreen. Ask Jacob before anything irreversible.
- Jacob isn't a developer: explain things plainly.
- Hold at most one or two videos on disk at a time. Log each video in `progress.csv` so a
  stopped run can resume.

## Decided
- **Scope.** Only the 13 Learning Pathways (website "Site Pathways" tab, read via
  `lib/google.js` readRange on CALENDAR_SHEET_ID) and 4 certificates: Yoga Philosophy,
  Embodied Yoga Therapy, Buddhist Psychology, Awakened Body.
- **Whole courses only** (all modules), never one module lifted out of a longer course.
- **Yoga Philosophy Certificate** = Uscreen collection **2193472** (Jacob). The longer YP
  programme (Vimeo folder "YP CERT 2021/22") is held back for a future Yoga Studio library.
- **Awakened Body** = Vimeo folder "Awakened Body Cert On Demand".
- **Uscreen** may be used (read-only).

## Done
- Vimeo inventory (`vimeo-inventory.csv`, 2,739 videos) and pathway mapping (`pathway_mapping.py`).
- **11 Circle course spaces created, hidden until filled** (`circle-spaces.csv`). All 13
  pathways (group 1220854) and 4 certificates (group 1221044) now exist.

## Circle API notes
- Python's urllib needs a User-Agent header, or Cloudflare returns 403 / 1010.
- **Upload flow:**
  1. POST `/direct_uploads` with `{blob: {key, filename, content_type, byte_size, checksum
     (base64 MD5)}}`.
  2. PUT the bytes to `direct_upload.url` with the returned headers.
  3. Use the `signed_id` as `featured_media` on POST `/course_lessons` (needs `section_id`
     and `name`).
- **Limits:** 4 GB per file (use 720p above that). Event recordings can't be set via the API.
- Sections are made via `/course_sections`.

## Blocked: needs Jacob
1. **The Uscreen key is empty.** `USCREEN_API_KEY` exists but has length 0. Jacob must paste
   the key in the environment settings; it takes effect in a new session.
   - API: `https://www.uscreen.io/publisher_api/v1/`, header `Authorization: Bearer <key>`.
   - `www.uscreen.io` is already allowed.
2. **Vimeo downloads.** `player.vimeo.com` is allowed. It redirects to
   `vod-progressive-ak.vimeocdn.com`, which still needs adding (`*.vimeocdn.com`). Circle's
   upload host may also need allowing; find out at the first test upload.
3. **Open question:** for courses recorded twice (Haṭha Yoga Texts, Yoga & Buddhism, Vaiṣṇava
   Bhakti, Śākta Tantra), use the more recent recording?

## Next steps
1. Once the key works: read Uscreen (collection 2193472 plus the missing short talks and
   courses listed in `pathway-summary.csv`). Update the mapping and show Jacob.
2. With Jacob's OK: test with Roots & Branches I (4 modules, Circle space 2900094).
   Download → upload → lesson → verify → delete local copy → log. Show Jacob in Circle before
   doing the rest.
