# Meditation Pass homepage: "My Practice"

The homepage for Meditation Pass members inside Circle, from the "My Practice · Meditation Pass" design board. Drawn straight into the Circle space by `public/circle/my-practice.js` (loaded by `today.js`), the same way as "This week": no frame, only for members with the Meditation Pass tag (`meditation`) and Circle admins, and it removes itself when the member goes to another page.

## Set up in Circle
Make (or rename) the space **My Practice** so its address is `/c/my-practice` (Circle may add a short code, e.g. `my-practice-a1b2c3`; that works too). Posting can be left off. Nothing to paste: `today.js` is already in Circle.

## What it shows
- **Next in your practice:** the next live Meditation Monday, from the events sheet (series `meditation-mondays`, the same source as the Schedule page). "Live now" with a Join button from ten minutes before until 30 minutes after.
- **Weekly:** Meditation Mondays, with **Live this Monday** and **Replays** links.
- **Your practice:** Replays, **Log today's practice** (opens a minutes box and saves to the same practice log as the Today strip, so it is one streak), and the learning pathway.
- **When you're ready:** the Wisdom School upsell.

## Links to check: `data/meditation-pass.json`
`live_url`, `replays_url`, `pathway_url`, `path_url` are best guesses at your Circle space addresses (`/c/meditation-mondays-live`, `/c/meditation-mondays`). Correct them to the real ones. `path_url` goes to the Wisdom School page on the website.

## Code
Data: `/api/member/my-practice` (`lib/meditation/load.js`). Gate: `memberFromBearer(req, ['meditation'])` in `lib/mentee/bearer.js`.

## Not built
The left rail (My spaces, Starred) is Circle's own sidebar. The "preview as" chips in the design are a prototype control, not part of the page.
