# Circle navigation: four doors on top, programmes in the sidebar

From the design handoff of 17 Oct 2026 (Today · Calendar · Practice · Library, and the four programmes Meditation Mondays · Wisdom School · Sādhana School · Sahṛdaya Upāya).

## Built so far
**Phase 1, preview pages (lock screens):** `/programmes/{meditation-mondays|wisdom-school|sadhana-school|sahrdaya-upaya}/preview`. Text is in `data/programmes.json`: title, a paragraph, what is included, one public sample and one button. The first draft was written from the site's own landing pages (`/meditation-pass`, `/wisdom-school`, `/sadhana-school`, `/sahrdaya-upaya`); staff can change any of it by editing that file. No prices, and nothing is read from a private space. Buttons open in the full window (`target="_top"`).

## Not built yet
Programme hubs (Sādhana School exists at `/school/sadhana-school`; Wisdom School with Plus tabs, Meditation Mondays and Sahṛdaya Upāya hubs), Calendar, Today, Practice, Library, and the shared plan call. Several of those pages already exist as pages drawn inside Circle spaces (`public/circle/*.js`).

## Circle questions that decide the wiring (answer in Circle's admin)
1. Can a Private space's lock screen point to an outside address, or only a Circle landing page?
2. How many header links are allowed, and can one be the landing page after sign-in?
3. Is there one tag or space every Wisdom School Plus member is in?
