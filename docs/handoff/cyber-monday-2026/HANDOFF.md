# Cyber Monday 2026: The Open Library (build handoff)

**Route:** `embodiedphilosophy.com/lp/cyber-monday`
**Repo:** `embodiedphilosophy/ep-website` (Vercel, project `ep-website`)
**Design:** the Claude Design canvas "Cyber Monday 2026 — The Open Library" (artboards *Landing page* and *Components & states*). Its source is in `design-reference/` here.
**Author:** Jacob Kyle · 29 Oct 2026

This is a **new /lp/ page built from the site's existing parts**. Don't write a standalone page with its own header, fonts and colours. Where this document says *reuse*, find the existing thing in the repo first and use it. Only build what doesn't exist yet: the new components listed in §5.

---

## 0. For Jake: how to hand this to Claude Code

1. Unzip this folder.
2. Put the whole `cyber-monday-2026` folder into the ep-website repo at `docs/handoff/cyber-monday-2026/`. Drag it in with Finder or VS Code; no git commands are needed for this step.
3. Open Claude Code in the ep-website repo and paste:

> Read `docs/handoff/cyber-monday-2026/HANDOFF.md` and build the page it describes at `/lp/cyber-monday` on a new branch `lp/cyber-monday-2026`. Start with §1 (survey the repo and report what you'll reuse) and stop to show me that list before writing code. Use `content/cyber-2026.ts` as the data file and the SVGs in `art/`. Don't change any existing page or shared component except to add props. Give me a Vercel preview link when done.

4. Claude Code will show you the reuse list first. Check it, then say "go".
5. When it gives you the preview link, open `/lp/cyber-monday?preview=live`, then `?preview=libraryOnly` and `?preview=evergreen` to see each state.

---

## 1. First: survey the repo (report before building)

Find these and list file paths. The page must plug into each one:

| Find | Why |
|---|---|
| Existing `/lp/*` pages (Navarātri, Haṃsa Sādhana, Tibetan Book of the Dead, and the old enroll-page courses) | Copy their route structure, metadata export and layout wrapper. **The ops dashboard lists /lp/ pages automatically**, so match whatever it reads (route folder, metadata, a registry file, etc.). |
| Site header, footer, layout | Reuse as-is. The design shows the standard header with a "See offers" button; add that as a prop/slot if the header supports a page CTA, otherwise skip it. |
| Design tokens / Tailwind theme / CSS variables | Use the existing names for Pine, Ochre, Terra, Terra Deep, Ivory, Sand, Cream, Ink, Ink Soft, Line. **Never hard-code hexes** if a token exists. |
| Font setup (Cormorant Garamond + Inter) | Already loaded site-wide; don't add another font import. |
| Button, eyebrow, section/container, card components | Reuse. The page uses: terra primary button, ghost (ink outline) button, ochre button on pine, underlined text link. |
| Course Library data source (the EP Website sheet / course data, `photo_url` on the `ep-media` Blob store) | Featured and "See every course" cards read **title, teacher, hours, description, art and PWYC Kit product URL** from here by `courseId`. Don't retype them. Course Library items marked pay what you can already link to their PWYC Kit product, so reuse that link. |
| Circle paywall link helpers / constants (Sādhana School seasons, Wisdom School, Plus, certificates, Meditation Pass) | All Tier 2 and Tier 3 buttons are Circle paywalls. Reuse the existing constants and add the new Cyber-priced paywall URLs next to them. |
| Kalighat images in `public/kalighat/` (`yogi-shiva.webp`, `woman-music.webp`, …) | Hero and closing collages. |
| Testimonial, FAQ/accordion, countdown components (if any exist, e.g. on Navarātri LPs) | Reuse if present; otherwise build per §5. |
| UTM / analytics helper (if any) | §7. |
| The Weekly Scaffolding signup component | Pre-launch state (§3). |

---

## 2. Files in this package

```
HANDOFF.md                    ← this file
content/cyber-2026.ts         ← all dates, prices, links, copy, FAQs, testimonials (data only)
art/collages/                 ← hero + closing collages, pull-quote sun & moon
art/motifs/                   ← card illustrations (eye, lotus, swan-waves, moon, mandala, sun-face, resonance, sri-cakra, sparkle)
art/icons/                    ← offer-navigator icons (use currentColor)
art/stickers/                 ← spinning circular stickers
art/index.html                ← contact sheet of all art (open in a browser)
design-reference/Main.dc.html ← the page as designed (Claude Design format; read for layout, spacing, sizes)
design-reference/States.dc.html ← PWYC modal, countdowns, banners, ended card, mobile
```

Put `content/cyber-2026.ts` where the repo keeps page data (e.g. `src/content/campaigns/`), and the art under `public/lp/cyber-monday/art/` **or** as inline React SVG components (§4).

---

## 3. Page states (time-driven, server-resolved)

Resolve the state on the server from `dates` in the config, so no wrong state flashes on load. Make the page dynamic, or revalidate every 60s.

| State | When (ET) | What changes |
|---|---|---|
| `prelaunch` | before Fri Nov 27 00:00, or Nov 27–29 without member access | Hero only, with "Opens Monday, Nov 30" plus the Weekly Scaffolding signup. *(Not in the handoff: confirm with Jake.)* |
| `early` | Nov 27 00:00 – Nov 30 launch, **with member access** | Full page plus the ochre "Early access for members" banner; top bar shows "Public launch Mon, Nov 30". |
| `live` | Nov 30 launch – Wed Dec 2 11:59pm | Full page. Top-bar countdown targets Dec 2. |
| `libraryOnly` | Dec 3 – Sun Dec 6 11:59pm | Tiers 2 & 3 replace their offers with the "This offer has ended" card (links to regular pricing). Navigator cards 02/03 say "Offer ended Dec 2". Countdowns target Dec 6. |
| `evergreen` | from Dec 7 | No top bar, timers or closing band. Hero eyebrow becomes "The Open Library". Tiers 2/3 stay in their ended state. Pricing copy depends on the open decision (stay PWYC, or back to $97). Keep the page indexed. |

**Member access in `early`:** the Kit email link carries `?access=members&utm_…`. Set a cookie (`ep_cyber_access=members`, 7 days) and drop the param. This is only a visibility gate; the prices live on the Circle and Kit checkouts.

**QA override:** `?preview=prelaunch|early|live|libraryOnly|evergreen` forces a state. Enable it only on preview deployments, or when a `PREVIEW_TOKEN` env var matches.

**Member upgrade strip** (Tier 2, "Already a Wisdom School member? Upgrade to Plus"): show it when `?member=ws` arrived from a Kit link (store the same way) **or** the site already knows the visitor is a Wisdom School member. Hide it otherwise.

---

## 4. The art: how to implement it

The art is original flat vector work in the EP palette, made to sit with the Kalighat cut-outs. Jake loves it, so keep it exactly as drawn.

- **Prefer inline React SVG components** (e.g. `components/lp/cyber/art/HeroCollage.tsx`) over `<img>`. That keeps the icons on `currentColor`, lets colours use tokens, and avoids extra requests. Convert attributes to JSX (`stroke-width` → `strokeWidth`, etc.). Mark decorative SVGs `aria-hidden`; the collages keep their `aria-label`.
- **Hero collage** (`art/collages/hero-collage.svg`, viewBox 480×580): three layers in one `position: relative` box, max-width 480px:
  1. `hero-collage.svg`: sun, rays, moon, eye, arch.
  2. The Kalighat `<img src="/kalighat/yogi-shiva.webp">`, absolutely positioned over the arch. The arch slot is **x 150, y 192, w 180, h 356**, i.e. `left: 31.25%; top: 33%; width: 37.5%; height: 61.4%`. Use `object-fit: contain; object-position: bottom`. Let the figure overflow the arch top a little for the collage feel.
  3. `hero-lotus-foreground.svg` (same viewBox, absolutely filling the box) **over** the image, so the figure sits behind the lotus.
  4. The sticker `stickers/pay-what-you-can.svg`, 136px, `position: absolute; left: -18px; bottom: 96px; transform: rotate(-12deg)`. The inner SVG gets the `spin` class.
- **Closing collage** (`closing-collage.svg`, viewBox 420×500): same method, with `woman-music.webp` in the slot **x 120, y 140, w 180, h 340** (`left: 28.6%; top: 28%; width: 42.9%; height: 68%`), plus sticker `open-all-week.svg` (128px, right −14px, bottom 120px, rotate 10deg).
- **Stickers use `<textPath href="#id">`.** When inlined in React, give each instance a unique id (`useId()`), or two stickers on one page will collide.
- **Course/season cards:** the motif fills the card's art area (16:10 on course cards, 4:3 on season cards), with `preserveAspectRatio="xMidYMid slice"` (already set). Each motif SVG includes its own background. Which motif goes on which course or season is set by `motif` in the config. The course's own site art is still used in the PWYC modal thumbnail and on the Circle/Kit checkout.
- **Pull-quote band:** `pullquote-sun.svg` 300px, absolutely positioned half off the left edge (`left: -110px`, vertically centred). `pullquote-moon.svg` 180px, top-right (`right: 40px; top: 56px`) with the `bob` class. The band is `overflow: hidden`.
- **Motion** (calm, never flashing):
  ```css
  .spin{animation:spin 40s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
  .bob{animation:bob 6s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-8px)}}
  @media (prefers-reduced-motion: reduce){.spin,.bob{animation:none}}
  ```
- On phones (< 640px) hide the pull-quote sun and moon, and shrink stickers to 96px.

---

## 5. Sections and components

Follow `design-reference/Main.dc.html` for exact spacing and type. Container max-width is 1280px with a 24px gutter, and sections are padded 112px top and bottom on desktop. Headings are Cormorant Garamond 600 with one italic phrase (the second element of each `headline` array in the config), in terra on light grounds and ochre (#D3A55A on pine) on dark ones. Eyebrows are Inter 600, 12px, 0.32em tracking, caps, terra (ochre on pine).

1. **Sticky top bar** (Ink): status dot, the state text, the next deadline, a compact countdown and "Jump to offers" (→ `#offers`). New: `CountdownCompact`.
2. **Hero** (Pine): eyebrow, H1, body, primary button → `#library`, text link → `#offers`, three proof items, and the hero collage on the right. Stacks on mobile with the collage below.
3. **Offer navigator** `#offers`: three cards in a grid (`auto-fit, minmax(280px,1fr)`), pulled up 104px over the hero. Cards are Ivory / Sand / Pine, each with number, timing, icon, title, price line, status and a jump link.
4. **Tier 1 — Open Library** `#library` (Ivory):
   - Header row with the PWYC explainer panel: three amount chips plus a custom field, regular price ~~$97~~.
   - **6 featured `CourseCard`s**: motif art, topic eyebrow, title, teacher · hours, one line, ~~$97~~ **PWYC**, and a "Pay what you can" button that opens the `PwycModal`.
   - **"See every course" `<details>`** listing the rest of the PWYC library as rows, each linking "PWYC →" straight to its Kit product.
   - Guarantee seal line, and the Meditation Pass add-on note.
5. **Pull quote** (Pine) with the sun and moon art. The text is in the config.
6. **Tier 2 — Certificates** `#certificates` (Sand): the `ChoiceCard` pair.
   - **Left (Cream):** one certificate, $147 with ~~$297~~, radio list of the four titles, and a ghost button "Choose a certificate" → that certificate's Cyber paywall. Disable the button until one is picked, or default to the first.
   - **Right (Ivory, 2px terra border, "Recommended" tag):** Plus, $297 with ~~$497~~ "first year, then $497/yr", the includes list, the value line, and the terra button → the Plus Cyber paywall.
   - Below: the CE note and the member upgrade link (§3).
   - Countdown to Dec 2 top-right.
7. **Tier 3 — Archive** `#archive` (Pine):
   - Intro, plus the ochre-bordered **credit box**.
   - Price strip (single season / retreat / complete year).
   - For each year: a heading (2025–26 shows its italic subtitle) and an ochre "Open the complete year · $497" button, then `SeasonCard`s with motif art, season, title, line, primary text in italics (2025–26), price, and "Open the Archive →".
   - Footer row: "The current year is never discounted here" and a link to Sādhana School 2026–27.
8. **How it works** (Ivory): three Cream steps with terra top borders and big Cormorant numerals.
9. **Testimonials**: three cards from the config (max 3).
10. **FAQ** (Cream): 8 `<details>` items. Add `FAQPage` JSON-LD.
11. **Closing band** (Sand): eyebrow, headline, body, `CountdownLarge` ×2 (Dec 2 and Dec 6; only the Dec 6 one in `libraryOnly`), terra button → `#offers`, and the closing collage.
12. **Footer**: the site footer. Above it, the line "Contemplative education for the whole human, *without the inhuman cost.*" in Cormorant (an LP-only band, or a footer prop).

**Sticky mobile bottom bar** (< 768px, all states except evergreen): next deadline with a compact countdown, plus a "See offers" button. Add bottom padding to the page so it never covers content. Hide the desktop top bar's countdown text on mobile if it wraps.

### New components (build only these)
- `CountdownCompact` / `CountdownLarge`: days · hours · minutes, **no seconds**, tabular numerals. Server-render the initial value and tick every 30s on the client. At zero, call `router.refresh()` so the state flips. Use `aria-live="off"` and put the deadline text in an `aria-label`.
- `PwycModal` (design in `States.dc.html`): course thumbnail (its real site art), topic, title, three amount buttons (middle pre-selected, `aria-pressed`), custom amount ≥ minimum, Meditation Pass add-on checkbox, "Continue to checkout · $X", and "Secure checkout · 30-day refund guarantee". It needs a focus trap, Esc to close, and focus returned to the triggering button. See §6.1 for how the amount reaches Kit.
- `ChoiceCard`, `SeasonCard`, `CourseCard` (wrap the existing card if there is one), `EndedOfferCard`, `EarlyAccessBanner`, `MemberUpgradeStrip`.

---

## 6. Checkouts: what each button links to

**Every button goes straight to a priced checkout. No discount codes anywhere on the page.**

### 6.1 Open Library (Kit)
- Each course's **existing PWYC Kit product** URL from the Course Library data.
- **Check whether Kit's checkout accepts a pre-filled amount** via a URL param (e.g. `?amount=` / `?price=`).
  - If it does, the modal passes the chosen amount through.
  - If it doesn't, the modal still shows the suggested amounts (as guidance) and then opens the Kit checkout, where the buyer enters the amount. In that case change the button to "Continue to checkout" without the amount. **Report which it is.**
- After purchase, the existing Make route adds the buyer to the matching Circle course space; don't change it. Buyers new to Circle get Circle's invite email.

### 6.2 Certificates and Plus (Circle)
- New **Cyber-priced Circle paywalls** (or new prices on the existing paywalls): one per certificate at $147, and Plus annual at $297 for the first year, renewing at $497.
  - Jake creates these in Circle. Leave `TODO` URLs in the config until he does.
  - Every paywall needs an image, a description and a "What's included" list (the site standard).
- Member upgrade: separate paywall, price TBC.

### 6.3 Archive (Circle)
- One Cyber paywall per past season ($197) or retreat ($297), plus one per complete year ($497). Same paywall standard as above.
- The current-year link goes to the existing Sādhana School page.

### 6.4 Meditation Pass add-on
- Kit and Circle checkouts may not support an order bump. Options, in order:
  1. A Kit "order bump" on PWYC products, if available.
  2. A second checkbox step in the modal that opens the Meditation Pass annual Cyber paywall after the course checkout (thank-you redirect).
  3. A card on the post-purchase thank-you page.
- **Report what's possible** and build the simplest one.

### 6.5 Circle note
- Every checkout confirmation and FAQ says to use Circle **in a web browser**, not the app.

---

## 7. UTMs and analytics

- Inbound traffic arrives with `utm_source` = `email` | `organic` | `retargeting` (+ `utm_medium`, `utm_content`).
- **Carry the inbound UTMs onto every outbound checkout link**, adding `utm_campaign=cyber-2026` if missing. This keeps Cyber sales separate from the PWYC ad campaigns' ROAS.
- If the site has an analytics/event helper, fire `cyber_cta_click` with `{tier, item, state, utm_source}`.
- Set OG/Twitter metadata: title, description, and a share image. Use the hero collage on pine with the headline, 1200×630, made with the site's existing OG-image route if it has one.

---

## 8. Content rules (from the brief)

- **Remove:** discount-code chips, "SALE ENDED" stamps, starbursts, stock photography, red banners and flashing timers. Prices are in Ink, never red; regular prices are struck through in Ink Soft.
- **Topics:** contemplative studies, yoga philosophy and esoteric wisdom only. Nothing from the trauma, somatics or psychedelic pathways.
- **No bundle priced above Plus** ($497/yr).
- **One timer per offer**, tied to its real deadline.

---

## 9. Accessibility and quality bar

- Real `<a>` and `<button>`; touch targets ≥ 44px; one `<h1>`, in order.
- `<fieldset>`/`<legend>` for the chip and radio groups.
- Visible focus rings, in terra.
- Text contrast ≥ 4.5:1. Ochre text on pine uses **#D3A55A**, not #B98A3E, for contrast.
- Lighthouse ≥ 90 on mobile for performance and accessibility. Lazy-load below-the-fold art and images.
- Works at 360px width with no horizontal scroll. The navigator, choice cards and season grid stack.

---

## 10. Open decisions (the config has TODOs for each)

- [ ] After Cyber Week: Open Library back to $97, or PWYC everywhere? This changes the evergreen copy.
- [ ] PWYC suggested amounts and minimum.
- [ ] Confirm prices: $147 certificate, $297 Plus first year, $197 / $297 / $497 Archive.
- [ ] Plus upgrade price for current Wisdom School members.
- [ ] Archive credit cap ($197?) and the January deadline.
- [ ] Full PWYC course list, and `courseId`s for the featured six.
- [ ] 2025–26 season → term mapping (four sādhanas, three named terms), and whether a 2025–26 summer retreat exists.
- [ ] 2025 retreat name: "Radical Yogic Embodiment" vs "Subtle Embodiment".
- [ ] Meditation Pass add-on: price, and mechanism (§6.4).
- [ ] Pre-launch behaviour before Nov 30 for non-members (§3).
- [ ] Public launch time: 00:00 ET or 12:00 ET (Meditation Monday).
- [ ] All Cyber Circle paywall URLs.

## 11. Done means

- [ ] `/lp/cyber-monday` is live on a preview, and **listed by the ops dashboard** like the other /lp/ pages.
- [ ] All five states render via `?preview=` and switch on their own at the real ET deadlines (test by temporarily editing `dates`).
- [ ] Every CTA resolves to the correct Kit or Circle checkout, with UTMs carried through. No codes appear anywhere.
- [ ] Course cards pull from the Course Library data, so editing a course there changes the card.
- [ ] Art matches the design. Stickers spin slowly and stop under reduced motion.
- [ ] Mobile: stacked navigator, sticky bottom bar, no overflow at 360px.
- [ ] Claude Code returns a short list of the TODO values still needed from Jake.
