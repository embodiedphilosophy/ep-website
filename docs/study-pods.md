# Study pods (Sādhana School)

Student-led study groups. Built 21 Oct 2026 for Jacob Kyle.

**Switched off by default.** The Study pods tab and the student API stay hidden until `STUDY_PODS=on` is set in Vercel (then redeploy); the Ops page works before that, so you can approve leaders first.

**The flow**
1. Any Sādhana School student (a season, the full year, or a mentee; Circle admins too) opens the **Study pods** tab on the Sādhana School dashboard (`/c/sadhana-school?tab=pods`).
2. A student who wants to lead **asks to lead a pod** (a short note). Staff approve or decline in **Ops → Settings → "study pods"** (`/ops/settings/pods`, Jacob, Irene and Floss). A declined student can ask again.
3. An approved leader **starts a pod**: topic, what it will study, rough schedule. Up to 2 running pods per leader (`max_open_per_leader`). The leader is the pod's first member.
4. Anyone eligible **joins** (and can leave). A pod **begins at 5 people (the leader counts)** and holds **up to 10** (`data/pods.json`).
5. When a pod begins, its members see "group chat is being set up". **Staff make a small group chat in Circle and paste its link in Ops** (the "Pods that need a chat" list); the members then see an "Open the pod chat" button. The pod organises its own meetings in Circle's live rooms (an optional shared link, `live_rooms_url` in `data/pods.json`).
6. Only a pod's own members see its chat link and the member names; everyone else sees the topic, leader (first name), places left and how many more are needed.

**Why the chat is made by hand.** Circle's Headless Member API refuses to create group chats for a member ("You can not create group chat room", checked 21 Oct 2026). Creating one automatically would need Circle's Admin API (`CIRCLE_API_TOKEN`) to make a chat space and add the members; that is not built or tested.

**Code.** Rules: `lib/pods/logic.js` (`data/pods.json`). Storage (Neon, `pod_leaders`, `pods`, `pod_members`): `lib/pods/store.js`. Who may use it: `lib/pods/auth.js` (our cookie, then the Kit tier). Student API: `app/api/school/pods`. Staff API: `app/api/ops/pods`. Dashboard tab: `app/school/[programme]/Pods.js` (tab added in `lib/school/hub.js`, `season-loader.js`). Staff page: `app/ops/settings/pods/`.

**Tests.** `scripts/member-test/pods.mjs` (PGlite; rules, joining, the 5-to-begin and 10-to-fill limits, who sees the chat link): `npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/pods.mjs`. `scripts/ops-test/school-hub.mjs` still passes with the new tab.

**Not built yet.** Email or Circle notifications (leaders hear in the dashboard; staff see requests on the Ops page), a pod's end date or archive, a count of waiting requests on the Ops front page, and the "Study pods" summary card on `/c/today`.
