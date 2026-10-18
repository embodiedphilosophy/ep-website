# Library by topic (Circle)

A page in Circle at `/c/library`, drawn by `public/circle/library.js` (loaded by `today.js`, no extra snippet), from the "Department with stars" design board. A department name and three columns (Foundations, Deepening, Advanced); each item is a card with a small label, a title (a link into Circle or anywhere else), the teachers, and a star. Starred items gather under the first chip, **★ Starred**.

## Set up in Circle
Make a space whose address is `/c/library` (Circle may add a short code; that works too). Nothing to paste.

## What staff enter: Ops → Settings → Library
One row per item (the tab `Library Items` on the calendar sheet; Ops makes it the first time). Columns: **department** (the order of departments is the order of the rows), **level** (Foundations, Deepening or Advanced), **label** (the small line, e.g. "Learning pathway", "Sādhana School · Fall"), **title**, **teachers**, **url** (the Circle space or course link), **access**, **publish**.

**access** says who sees the row. Memberships build on each other: leave it blank (everyone), `meditation`, `wisdom`, `wisdom plus`, `sadhana` (Sādhana School, which also sees the Wisdom School rows) or `mentee`. A word the site doesn't recognise shows the row to Circle admins only, so a typo never opens something up by accident. Changes show within about five minutes.

## Topics: the "Library Topics" tab
How members browse the Library. One row per Circle space (tab `Library Topics` on the calendar sheet): **circle_space_id**, **title**, **topic** (the heading; topics appear in the order of the rows), **topic_2** (the item is also listed there), **format** (the badge on the card: Upcoming Sādhana, On-Demand Sādhana, Multi-Day Sādhana, Live Series, Course, Workshop, Learning Pathway, Certificate), **note** (small print, e.g. the season), **level** (blank keeps the current level), **show** (`FALSE` keeps it out). Rows are matched by Circle space id, then by title, and apply to every source (Circle, Library Items, Course Library). An item with no topic row keeps its Circle space group as its heading.

## Stars
Each member's stars are kept in the database (`library_stars`), tied to their Circle account, and are private. An item's star is tied to its original department (the Circle space group or Library Items department, before any topic re-filing) and title: renaming either makes it a new item and its old stars no longer count. Moving an item to another topic keeps its stars.

## Code
`lib/library/load.js` (who sees what), `lib/library/store.js` (stars), `/api/member/library` and `/api/member/library/star`. Tests: `node --import ./scripts/ce-test/register.mjs scripts/member-test/library.mjs` (needs `npm i --no-save @electric-sql/pglite`).

## Not built
The design's left rail ("My spaces", "Starred") is Circle's own sidebar. Starred items show on the page instead.
