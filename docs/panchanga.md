# Today's Pañcāṅga

A small, self-updating panel for students: the day's five limbs (tithi, vāra, nakṣatra, yoga, karaṇa) with a plain-English
line each, when each ends and what comes next, and a "How to read this" explainer. Worked out from the Sun's and Moon's
positions: no feed, no key, no daily job.

| Where | What |
|---|---|
| `/today/panchanga` | The panel. Framed inside Circle; the site header, footer and chat widget are hidden. The browser does the calculating (the answer depends on each viewer's place and day). |
| `GET /api/panchanga?lat=&lon=&tz=[&date=]` | The same day as JSON, for the practice app, the Weekly Scaffolding email and ops. Public. |
| `lib/panchanga/engine.js` | The maths. Pure, no dependencies; runs in the browser, a serverless function and (later) the native app. |
| `lib/panchanga/content.js` | Everything students read (editorial; edit freely, never touches the maths). |
| `lib/panchanga/describe.js` | Joins the two: one shape for the page and the API. |
| `lib/panchanga/places.js` | The city picker and the default city for a device time zone. |

## Using it
- **Embed in Circle:** an iframe on `https://www.embodiedphilosophy.com/today/panchanga`. Fix a place for the whole embed with
  `?lat=28.61&lon=77.21&tz=Asia/Kolkata&place=New%20Delhi`. `?theme=light|dark` forces a theme; `?date=YYYY-MM-DD` shows another day.
- **Framing:** `next.config.mjs` sends `frame-ancestors 'self' https://ss.embodiedphilosophy.com https://*.circle.so` on this route only
  (no `X-Frame-Options` anywhere, which would override it).
- **Place order:** address → the viewer's saved choice (`localStorage` key `ep-panchanga-place`) → a city from the device time
  zone → an estimate from its offset. "Use my location" may be blocked inside a Circle frame; the city list always works.

- **On Circle's Today page:** `public/circle/today.js` shows the panel as a card under the moon (an iframe of `/today/panchanga`).
  It is the same for every student: it depends on where they are, not on what they have joined. The panel posts its height to
  the page (`{ ep: 'panchanga-height', h }`) so the frame fits with no inner scrollbar; if the student chose an exact location on
  Today, it goes along in the address.

## How it is worked out
- Sun: Meeus ch. 25. Moon: Meeus ch. 47 (full 60-term series, A1/A2, nutation, about 10″). Lahiri ayanāṃśa, 23.853° at J2000 + 50.28″/yr; ΔT fixed at 69 s.
- tithi = ⌊elongation / 12°⌋; nakṣatra = ⌊sidereal Moon / 13°20′⌋; yoga = ⌊(sidereal Sun + Moon) / 13°20′⌋; karaṇa = ⌊elongation / 6°⌋.
- The day is read at **local sunrise** (udaya tithi). End times: 30-minute steps, then bisection to 20 seconds. Sunrise: Sun's centre at −0.833°; 6:00 local in polar conditions.
- Months are **amānta** (new moon to new moon), named from the Sun's sidereal sign at the previous new moon; "Adhika" when two new moons share a sign. Kṣaya months are not handled. A pūrṇimānta option is left for later.
- Accuracy: within about 1 to 2 minutes of drikpanchang-style published times; near a boundary, almanacs can differ by a few minutes.

## Tests
`npm test` (engine against published New Delhi 18 Oct 2026 values, known moons and observances, the JSON endpoint).
`node scripts/panchanga-test/ui.cjs` drives the page in a browser against a running server (`BASE=http://localhost:3200`):
layout at 320px and desktop in light and dark, location memory, the dialog, and framing from Circle.

## Later
Festival layers (a "festivals today" line under the header; opt-in sets for Hindu, Pagan, Buddhist, Christian mysticism), pūrṇimānta month
names, native-app port (the engine and content modules are plain ES modules).
