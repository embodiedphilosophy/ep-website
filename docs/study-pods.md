# Study pods (Sādhana School)

Student-led study groups. Built 21 Oct 2026 for Jacob Kyle.

**Switched off by default.** The Study pods tab and the student API stay hidden until `STUDY_PODS=on` is set in Vercel (then redeploy); the Ops page works before that, so you can approve leaders first.

**The flow**
1. Any Sādhana School student (a season, the full year, or a mentee; Circle admins too) opens the **Study pods** tab on the Sādhana School season page (`/c/sadhana-school?tab=pods`; the tab only shows while `STUDY_PODS=on`).
2. A student who wants to lead **asks to lead a pod** (a short note). Staff approve or decline in **Ops → Settings → "study pods"** (`/ops/settings/pods`, Jacob, Irene and Floss). A declined student can ask again.
3. An approved leader **starts a pod**: topic, what it will study, rough schedule. Up to 2 running pods per leader (`max_open_per_leader`). The leader is the pod's first member.
4. Anyone eligible **joins** (and can leave). A pod **begins at 4 people (the leader counts)** and holds **up to 10** (`data/pods.json`).
5. When a pod begins, its members see "group chat is being set up". **Staff make a small group chat in Circle and paste its link in Ops** (the "Pods that need a chat" list); the members then see an "Open the pod chat" button. The pod organises its own meetings in Circle's live rooms (an optional shared link, `live_rooms_url` in `data/pods.json`).
6. Only a pod's own members see its chat link and the member names; everyone else sees the topic, leader (first name), places left and how many more are needed.

**Why the chat is made by hand.** Circle's Headless Member API refuses to create group chats for a member ("You can not create group chat room", checked 21 Oct 2026). Creating one automatically would need Circle's Admin API (`CIRCLE_API_TOKEN`) to make a chat space and add the members; that is not built or tested.

**Code.** Rules: `lib/pods/logic.js` (`data/pods.json`). Storage (Neon, `pod_leaders`, `pods`, `pod_members`): `lib/pods/store.js`. Who may use it: `lib/pods/auth.js` (our cookie, then the Kit tier). Student API: `app/api/school/pods`. Staff API: `app/api/ops/pods`. Dashboard tab: `app/school/[programme]/Pods.js` (tab added in `lib/school/hub.js`, `season-loader.js`). Staff page: `app/ops/settings/pods/`.

**Tests.** `scripts/member-test/pods.mjs` (PGlite; rules, joining, the 4-to-begin and 10-to-fill limits, who sees the chat link): `npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/pods.mjs`. `scripts/ops-test/school-hub.mjs` still passes with the new tab.

**Not built yet.** Email or Circle notifications (leaders hear in the dashboard; staff see requests on the Ops page), a pod's end date or archive, a count of waiting requests on the Ops front page, and the "Study pods" summary card on `/c/today`.

## Update (1 Nov 2026): minimum 4, live rooms, visible cards
- **Minimum 4** (`data/pods.json` `min`); up to 10 as before.
- **A live room for each pod.** The leader makes a room in Circle's live rooms and pastes its link on the pod (the box "Where will your pod meet?" on their pod card); staff can see pods in Ops. Members of the pod then get a **Join the pod's live room** button; before a leader pastes one they see the general **Circle live rooms** button (set `live_rooms_url` in `data/pods.json` to the live rooms address). Column `pods.room_url`, `setRoomUrl` in `lib/pods/store.js`, action `room` on `/api/school/pods`. Creating the room itself is still done in Circle (the API cannot).
- **A Study pods card** on the Sahṛdaya Upāya page and on Circle Today (`GET /api/member/pods`): the open pods (topic, who leads, places left), your own pods with their chat and live room, and "Ask to lead a pod" / "You can lead a pod. Start one". Joining and starting still happen on the Study pods tab. The card stays away while `STUDY_PODS` is not `on` or for people who are not Sādhana School students.
- **Staff side (ep-ops):** the Today page lists requests waiting; approving a leader now emails them (see ep-ops `docs/mentee-ops-port.md`).

## Update (2 Nov 2026): a Google Meet room for every pod
Students can't open Circle live rooms (only staff can), so each new pod now gets its own **Google Meet room** when it is made: study pods (`createPod` in `lib/pods/store.js`) and Sahṛdaya Upāya practicum pods (`createPod` in `lib/pods/practicum.js`, unless the organiser pasted a link). The room is a Meet space made with the Google Meet REST API (`lib/meet.js`), owned by `MEET_HOST_EMAIL` and set to OPEN, so anyone with the link joins straight in, any day, with no host. A pod without a room (made before this, or if Meet failed) shows its leader a **Make our meeting room** button (action `autoroom` on `/api/school/pods` and `/api/member/practicum`); pasting a link of their own still works. Off (the old paste-a-link steps) until `MEET_HOST_EMAIL` is set.

**One-off setup (Jacob):**
1. Google Cloud console, the project of `GOOGLE_SERVICE_ACCOUNT_EMAIL`: APIs & Services → Library → **Google Meet REST API** → Enable. Note the service account's **Unique ID** (IAM & Admin → Service accounts → the account → Details).
2. Google Admin (admin.google.com) → Security → Access and data control → API controls → **Manage domain-wide delegation** → Add new: Client ID = that Unique ID, scope `https://www.googleapis.com/auth/meetings.space.created`.
3. Google Admin → Apps → Google Workspace → Google Meet → Meet safety settings: people outside the organisation must be allowed to join (students use their own Google accounts or none).
4. Vercel, ep-website → Settings → Environment Variables: `MEET_HOST_EMAIL` = the Workspace user who owns the rooms (e.g. team@embodiedphilosophy.com), Production. Redeploy.
