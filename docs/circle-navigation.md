# Circle navigation: four doors on top, programmes in the sidebar

From the design handoff of 17 Oct 2026 (Today · Calendar · Practice · Library, and the four programmes Meditation Mondays · Wisdom School · Sādhana School · Sahṛdaya Upāya).

## Built so far
**Phase 1, preview pages (lock screens):** `/programmes/{meditation-mondays|wisdom-school|sadhana-school|sahrdaya-upaya}/preview`. Text is in `data/programmes.json`: title, a paragraph, what is included, one public sample and one button. The first draft was written from the site's own landing pages (`/meditation-pass`, `/wisdom-school`, `/sadhana-school`, `/sahrdaya-upaya`); staff can change any of it by editing that file. No prices, and nothing is read from a private space. Buttons open in the full window (`target="_top"`).

**Today (`/c/today`):** built. One page for every signed-in member (`public/circle/today.js`, data from `/api/member/today`, `lib/member/today.js`). Top half: the free practice layer (today's sit and timer, streak and mālā, the teaching of the week and a question, the moon and sacred days). Below: one card per programme the member is in, then one locked card per programme they aren't (link to its preview page), then one suggestion at most. Which programmes open for which membership is `OPEN` in `lib/member/programmes.js`. The weekly teaching is edited in Ops → Settings → Website → "Today: teaching" (sheet tab `Site Teachings`, fallback `data/teachings.json`); the sacred days are `data/sacred-days.json`. Circle's own space banner ("Today in School", member avatars, New post) is hidden on this page, and the pañcāṅga panel (docs/panchanga.md) sits under the moon. The Home feed is unchanged (the old practice strip is gone). Practice circles and a Calendar door don't exist yet, so those links are left out.

## Not built yet
Programme hubs (Sādhana School exists at `/school/sadhana-school`; Wisdom School with Plus tabs, Meditation Mondays and Sahṛdaya Upāya hubs), Calendar, Practice, Library, and the shared plan call. Several of those pages already exist as pages drawn inside Circle spaces (`public/circle/*.js`).

## Circle questions that decide the wiring (answer in Circle's admin)
1. Can a Private space's lock screen point to an outside address, or only a Circle landing page?
2. How many header links are allowed, and can one be the landing page after sign-in?
3. Is there one tag or space every Wisdom School Plus member is in?
