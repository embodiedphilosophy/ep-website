// Practicum pods (Sahṛdaya Upāya): a mentee organises a time to practise teaching with other mentees, and others join. Anyone in the cohort can organise one;
// there is no approval. (Articulation buddies are different: the two or three people the team pairs each rotation. Study pods are the Sādhana School ones.)
// Pure rules at the top (tested in scripts/member-test/practicum.mjs); storage in Neon (tables made on first use) below.
import { neon } from '@neondatabase/serverless';
import { autoMeetLink } from '../meet';

export const MAX = 6;                       // people in one pod, the organiser included
export const MINUTES = [30, 45, 60, 90, 120];
export const WINDOW_DAYS = 90;              // how far ahead a pod can be planned
export const ELIGIBLE_TIERS = ['mentee'];
export const eligible = (tier, admin) => !!admin || ELIGIBLE_TIERS.includes(tier);
const clean = (s, max) => String(s ?? '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
const https = u => /^https:\/\/\S+$/.test(String(u || '').trim()) ? String(u).trim() : '';

// → { topic, description, startsAt (ISO), minutes } or throws a plain-English message
export function cleanPod(b, now = Date.now()) {
  const topic = clean(b?.topic, 80).replace(/\s*\n\s*/g, ' '), description = clean(b?.description, 600);
  if (topic.length < 4) throw new Error('Give your pod a focus (a few words).');
  const t = Date.parse(b?.startsAt);
  if (Number.isNaN(t)) throw new Error('Choose a day and time.');
  if (t < now) throw new Error('Choose a time in the future.');
  if (t > now + WINDOW_DAYS * 864e5) throw new Error(`Choose a time within the next ${WINDOW_DAYS} days.`);
  const minutes = MINUTES.includes(Number(b?.minutes)) ? Number(b.minutes) : 60;
  return { topic, description, startsAt: new Date(t).toISOString(), minutes };
}
export const endsAt = p => Date.parse(p.starts_at) + Number(p.minutes || 60) * 60000;

// What one pod looks like to the member asking. members: [{ uid, name }]. The live room and chat links, and names, are only for members.
export function podView(pod, members, me, now = Date.now()) {
  const mine = members.some(m => m.uid === me.uid), count = members.length, organiser = pod.organiser_uid === me.uid, over = endsAt(pod) < now;
  return {
    id: String(pod.id), topic: pod.topic, description: pod.description, organiser: pod.organiser_name || 'A mentee', startsAt: new Date(pod.starts_at).toISOString(), minutes: Number(pod.minutes),
    count, spots: Math.max(0, MAX - count), max: MAX, mine, isOrganiser: organiser, over,
    names: mine ? members.map(m => m.name) : [], roomUrl: mine ? pod.room_url || '' : '', chatUrl: mine ? pod.chat_url || '' : '',
    canJoin: !mine && !over && pod.status === 'open' && count < MAX, canLeave: mine && !organiser && !over, canCancel: organiser && !over, canSetRoom: organiser && !over, canEdit: organiser && !over,
  };
}
export const podsFor = (pods, membersBy, me, now) => pods.map(p => podView(p, membersBy[String(p.id)] || [], me, now));

// ---- storage ----
const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let sqlFn = null, testSql = null;
const sql = () => { if (testSql) return testSql; if (!url()) throw new Error('Practicum pods aren’t connected yet'); return (sqlFn ||= neon(url())); };
export const practicumAvailable = () => !!testSql || !!url();
export function _setSql(fn) { testSql = fn; ready = null; } // tests only
let ready = null;
function ensure() {
  return (ready ||= (async () => {
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS practicum_pods (
      id bigserial PRIMARY KEY, organiser_uid text NOT NULL, organiser_email text NOT NULL, organiser_name text NOT NULL DEFAULT '', topic text NOT NULL, description text NOT NULL DEFAULT '',
      starts_at timestamptz NOT NULL, minutes int NOT NULL DEFAULT 60, status text NOT NULL DEFAULT 'open', room_url text NOT NULL DEFAULT '', chat_url text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS practicum_members (pod_id bigint NOT NULL, uid text NOT NULL, email text NOT NULL, name text NOT NULL DEFAULT '', joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (pod_id, uid))`;
  })().catch(e => { ready = null; throw e; }));
}
const lower = e => String(e || '').trim().toLowerCase();
const num = id => { const n = Number(id); if (!Number.isInteger(n) || n < 1) throw new Error('That pod isn’t there.'); return n; };

// Pods that have not finished (plus the last day's, so a pod you just left a call with does not vanish mid-sentence), soonest first
export async function listPods(now = Date.now()) {
  await ensure();
  const since = new Date(now - 3 * 3600e3).toISOString();
  const pods = await sql()`SELECT * FROM practicum_pods WHERE status = 'open' AND starts_at + (minutes * interval '1 minute') > ${since}::timestamptz ORDER BY starts_at`;
  const members = pods.length ? await sql()`SELECT pod_id, uid, email, name FROM practicum_members WHERE pod_id = ANY(${pods.map(p => Number(p.id))}) ORDER BY joined_at` : [];
  const membersBy = {};
  for (const m of members) (membersBy[String(m.pod_id)] ||= []).push({ uid: m.uid, email: m.email, name: m.name });
  return { pods, membersBy };
}
// The organiser is the first member
export async function createPod(me, b, now = Date.now()) {
  await ensure();
  const p = cleanPod(b, now);
  const open = (await sql()`SELECT count(*)::int AS n FROM practicum_pods WHERE organiser_uid = ${me.uid} AND status = 'open' AND starts_at > now()`)[0].n;
  if (open >= 3) throw new Error('You can organise up to 3 upcoming pods at a time.');
  const row = (await sql()`INSERT INTO practicum_pods (organiser_uid, organiser_email, organiser_name, topic, description, starts_at, minutes, room_url) VALUES (${me.uid}, ${lower(me.email)}, ${me.name}, ${p.topic}, ${p.description}, ${p.startsAt}, ${p.minutes}, ${https(b?.roomUrl) || await autoMeetLink()}) RETURNING id`)[0];
  await sql()`INSERT INTO practicum_members (pod_id, uid, email, name) VALUES (${row.id}, ${me.uid}, ${lower(me.email)}, ${me.name})`;
  return String(row.id);
}
export async function join(me, podId, now = Date.now()) {
  await ensure();
  const id = num(podId), pod = (await sql()`SELECT * FROM practicum_pods WHERE id = ${id} AND status = 'open'`)[0];
  if (!pod || endsAt(pod) < now) throw new Error('This pod isn’t open any more.');
  if ((await sql()`SELECT 1 FROM practicum_members WHERE pod_id = ${id} AND uid = ${me.uid}`).length) throw new Error('You are already in this pod.');
  const n = (await sql()`SELECT count(*)::int AS n FROM practicum_members WHERE pod_id = ${id}`)[0].n;
  if (n >= MAX) throw new Error(`This pod is full (${MAX} people).`);
  await sql()`INSERT INTO practicum_members (pod_id, uid, email, name) VALUES (${id}, ${me.uid}, ${lower(me.email)}, ${me.name})`;
}
export async function leave(me, podId) {
  await ensure();
  const id = num(podId), pod = (await sql()`SELECT organiser_uid FROM practicum_pods WHERE id = ${id}`)[0];
  if (pod && pod.organiser_uid === me.uid) throw new Error('As the organiser you can cancel the pod instead of leaving it.');
  await sql()`DELETE FROM practicum_members WHERE pod_id = ${id} AND uid = ${me.uid}`;
}
export async function cancelPod(me, podId) {
  await ensure();
  const r = await sql()`UPDATE practicum_pods SET status = 'cancelled' WHERE id = ${num(podId)} AND organiser_uid = ${me.uid} AND status = 'open' RETURNING id`;
  if (!r.length) throw new Error('Only the organiser can cancel a pod.');
}
// The organiser changes the pod: focus, description, day and time, length (cleaned like a new pod, so the time must still be ahead).
// → { before, after, members } so the route can tell the members what changed.
export async function updatePod(me, podId, b, now = Date.now()) {
  await ensure();
  const id = num(podId), before = (await sql()`SELECT * FROM practicum_pods WHERE id = ${id} AND status = 'open'`)[0];
  if (!before || endsAt(before) < now) throw new Error('This pod isn’t open any more.');
  if (before.organiser_uid !== me.uid) throw new Error('Only the organiser can change this pod.');
  const p = cleanPod(b, now);
  const after = (await sql()`UPDATE practicum_pods SET topic = ${p.topic}, description = ${p.description}, starts_at = ${p.startsAt}, minutes = ${p.minutes} WHERE id = ${id} AND organiser_uid = ${me.uid} AND status = 'open' RETURNING *`)[0];
  if (!after) throw new Error('This pod isn’t open any more.');
  const members = await sql()`SELECT uid, email, name FROM practicum_members WHERE pod_id = ${id} ORDER BY joined_at`;
  return { before, after, members };
}

// The pod's live room (and an optional chat) are links the organiser pastes from Circle
export async function setLinks(me, podId, { roomUrl, chatUrl }) {
  await ensure();
  const bad = u => u && !https(u);
  if (bad(roomUrl) || bad(chatUrl)) throw new Error('A full link starting with https://');
  const r = await sql()`UPDATE practicum_pods SET room_url = ${https(roomUrl)}, chat_url = ${https(chatUrl)} WHERE id = ${num(podId)} AND organiser_uid = ${me.uid} AND status = 'open' RETURNING id`;
  if (!r.length) throw new Error('Only the organiser can change the live room.');
}

// "Make our meeting link" on a practicum pod with none: the organiser gets a new Google Meet room (lib/meet.js)
export async function autoRoom(me, podId) {
  await ensure();
  const id = num(podId);
  const r = await sql()`SELECT room_url FROM practicum_pods WHERE id = ${id} AND organiser_uid = ${me.uid} AND status = 'open'`;
  if (!r.length) throw new Error('Only the organiser can change the live room.');
  if (r[0].room_url) return;
  const room = await autoMeetLink();
  if (!room) throw new Error('We couldn’t make a meeting link just now. Please try again, or paste a link of your own.');
  await sql()`UPDATE practicum_pods SET room_url = ${room} WHERE id = ${id} AND (room_url IS NULL OR room_url = '')`;
}
