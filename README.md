# embodiedphilosophy.com

Next.js site, deployed on Vercel.

## Where content comes from
| Section | Source | Setting |
|---|---|---|
| Events (homepage + /events) | Google Sheet "Events" tab, published as CSV | `EVENTS_SHEET_CSV_URL` |
| Chitheads episodes | Podcast RSS feed | `CHITHEADS_RSS_URL` |
| Email signups | Kit forms | `NEXT_PUBLIC_KIT_FORM_*` |
| Links, prices, stats | `lib/site.js` | edit the file |

Until a setting is filled in, the site shows placeholder content (`data/events.json`, placeholder episodes).
Add settings in Vercel > Project > Settings > Environment Variables, then redeploy.

## Events sheet columns
`id, title, date, end_date, time, program, price, host, note, registration_url, series, publish`

- `date` / `end_date`: YYYY-MM-DD (Eastern). Events disappear after their end date.
- `time`: shown as written, e.g. `7pm ET`
- `program`: `lrl`, `wisdom`, `sadhana` or `seasonal`
- `price`: `Free`, `Pay what you can`, `By donation`, `Members`, `Enrolled`, `Enroll`, or an amount like `$79`
- `registration_url`: where the Register button goes (Kit landing page, Kajabi offer, Circle event)
- `series`: same value for repeating sessions; only the next one shows on the homepage
- `publish`: `FALSE` hides a row

The site re-reads the sheet every 5 minutes.

## Local development
```
npm install
npm run dev
```
