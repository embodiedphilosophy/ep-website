# Season spaces (/school/[programme]/[season])

One sidebar row per Sādhana School season; each opens a page with the tabs All · Live Sessions · Recordings · Readings · Reflections. Built from the Circle handoff of 16 Oct 2026. Do the Circle setup steps in that handoff first: the code reads the same spaces and topics.

## Wiring a season
Edit `data/school-seasons.json`. Each season needs `hub_space_id` (the post space), `event_space_id` (the event space) and `topic_ids` (`readings`, `reflections`, `recordings`, topics in the hub space). A season with no ids shows "being set up" and is hidden from the sidebar. Dates and titles come from this file too.

## Environment
- `CIRCLE_HEADLESS_TOKEN`: a **Headless Auth** token (Circle → Developers → Tokens). An Admin V2 token returns 403.
- `MEMBER_SECRET` (or `OPS_SECRET`): signs the member cookie, as for `/api/member/*`.
- `CIRCLE_IDENTITY_AUD`: already used by the member sign-in.

## How sign-in works (differs from the handoff, on purpose)
The headless token can act as *any* email, so an email typed into a page must never be enough. Identity comes from Circle's signed identity token, verified by `lib/member/identity.js`:
1. Paste the snippet below into Circle → Settings → Custom code. Any link in Circle to `https://www.embodiedphilosophy.com/school/...` then posts `window.circleUser.identityToken` to `/api/school/enter`, and opens the page named in the link (for example `?tab=live`).
2. The server verifies it, sets an httpOnly cookie `ep_school` (12 hours) holding only the email, and redirects.
3. The server turns that email into a one-hour Circle access token and keeps it in memory. No Circle token reaches the browser, and no refresh token is stored.

```html
<script>
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href*="embodiedphilosophy.com/school/"]');
  if (!a || !window.circleUser || !window.circleUser.identityToken) return;
  e.preventDefault();
  var u = new URL(a.href);
  var f = document.createElement('form');
  f.method = 'post';
  f.action = 'https://www.embodiedphilosophy.com/api/school/enter';
  [['identityToken', window.circleUser.identityToken], ['next', u.pathname + u.search]].forEach(function (p) {
    var i = document.createElement('input'); i.type = 'hidden'; i.name = p[0]; i.value = p[1]; f.appendChild(i);
  });
  document.body.appendChild(f); f.submit();
}, true);
</script>
```

## Not yet checked against the real Circle API
These are the handoff's open questions. The code takes the likeliest answer and keeps each in one place (`lib/school/tabs.js` normalisers, `lib/school/circle.js`):
- Topic filter on posts: filtering is done client side.
- Event fields (start/end, replay, space id, duration) accept several spellings; the replay field is a guess.
- Event list is filtered by space client side.
- The create-post body (`name`, `body`, `topic_ids`) and the event_attendees body are guesses.
- Whether headless calls count against the 5,000 Admin API requests a month.
- Where Today in School, Announcements and the other School spaces go: not part of this build.

## Testing
`node scripts/ops-test/school-tabs.mjs` checks the tab rules. `node scripts/ops-test/circle-mock.mjs` is a stand-in for Circle (port 4600); run the app with `CIRCLE_HEADLESS_BASE=http://localhost:4600 CIRCLE_HEADLESS_TOKEN=test MEMBER_SECRET=x`, temporarily fill the ids in `data/school-seasons.json` (Fall 22/11, Winter 32/31; topics 1/2/3), and sign a cookie `ep_school` for `annual@test`, `fall@test` or `nobody@test`.
