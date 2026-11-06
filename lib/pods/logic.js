// Study pods (self-organising study groups for Sādhana School students). Pure rules, shared by the API and the tests.
//  - Anyone with Sādhana School (a season or the full year, and mentees) can join a pod or ask to lead one.
//  - Staff approve leaders. An approved leader opens a pod on a topic.
//  - A pod needs `min` people (the leader counts as one) to begin, and holds up to `max`. When it begins its members get a small-group chat
//    (staff open it in Circle and paste the link in Ops: Circle does not let the API create group chats) and organise their own meetups in Circle's live rooms.
import config from '@/data/pods.json';
import { cleanMeetup, nextMeetup, repeatLabel, calendarUrl } from './meetup';

// Study pods stay hidden until switched on: set STUDY_PODS=on in Vercel (or "enabled": true in data/pods.json)
export const podsEnabled = () => process.env.STUDY_PODS === 'on' || config.enabled === true;
export const MIN = Number(config.min) || 5;
export const MAX = Number(config.max) || 10;
export const MAX_OPEN_PER_LEADER = Number(config.max_open_per_leader) || 2;
export const LIVE_ROOMS_URL = /^https:\/\/\S+$/.test(config.live_rooms_url || '') ? config.live_rooms_url : '';

// Who counts as a Sādhana School student: a season, the full year, or a mentee (Circle admins always)
export const ELIGIBLE_TIERS = ['ss_season', 'ss_year', 'mentee'];
export const eligible = (tier, admin) => !!admin || ELIGIBLE_TIERS.includes(tier);

const clean = (s, max) => String(s ?? '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);

// → { topic, description, schedule } or throws a plain-English message
export function cleanPod(b) {
  const topic = clean(b?.topic, 80).replace(/\s*\n\s*/g, ' '), description = clean(b?.description, 1000), schedule = clean(b?.schedule, 200).replace(/\s*\n\s*/g, ' ');
  if (topic.length < 4) throw new Error('Give your pod a topic (a few words).');
  if (description.length < 20) throw new Error('Say a little about what the pod will study (a sentence or two).');
  return { topic, description, schedule };
}
// Everything a leader can change on their pod: the title, description and schedule note, plus the meetup (lib/pods/meetup.js)
export const cleanEdit = (b, now = Date.now()) => ({ ...cleanPod(b), ...cleanMeetup(b, now) });
// The optional note a student sends the leader when joining (may be empty)
export const cleanJoinNote = b => clean(b?.message, 600);
// The Circle message the leader receives
export const joinMessage = (name, topic, note) => `Hello! I have just joined your study pod “${topic}”.\n\n${note}\n\n${name}`;
export const cleanNote = b => { const n = clean(b?.note, 800); if (n.length < 10) throw new Error('Tell us a little about why you would like to lead a pod.'); return n; };

// What one pod looks like to the member asking. members: [{ uid, name }]. The chat link is only ever given to the pod's own members.
export function podView(pod, members, me, now = Date.now()) {
  const mine = members.some(m => m.uid === me.uid);
  const count = members.length, leader = pod.leader_uid === me.uid, running = ['open', 'active'].includes(pod.status);
  const meetAt = nextMeetup(pod, now), meetRepeat = pod.meet_at ? (pod.meet_repeat || 'once') : '', meetMinutes = Number(pod.meet_minutes) || 60;
  return {
    meetAt, meetRepeat, meetRepeatLabel: meetAt ? repeatLabel(meetRepeat) : '', meetMinutes, meetTz: pod.meet_tz || '', canEdit: (leader || !!me.admin) && running,
    calendarUrl: mine && meetAt ? calendarUrl({ title: `Study pod: ${pod.topic}`, details: [pod.description, pod.room_url ? `Live room: ${pod.room_url}` : ''].filter(Boolean).join('\n\n'), startIso: meetAt, minutes: meetMinutes, repeat: meetRepeat, tz: pod.meet_tz }) : '',
    id: String(pod.id), topic: pod.topic, description: pod.description, schedule: pod.schedule || '', leader: pod.leader_name || 'A student',
    status: pod.status, count, min: MIN, max: MAX, spots: Math.max(0, MAX - count), needs: Math.max(0, MIN - count), started: pod.status === 'active',
    mine, isLeader: leader,
    roomUrl: mine ? (pod.room_url || '') : '', canSetRoom: leader && ['open', 'active'].includes(pod.status),
    names: mine ? members.map(m => m.name) : [],
    notes: leader ? members.filter(m => m.uid !== me.uid && m.note).map(m => ({ name: m.name, note: m.note })) : [], // only the leader sees what joiners wrote
    chatUrl: mine && pod.chat_url ? pod.chat_url : '', chatPending: mine && pod.status === 'active' && !pod.chat_url,
    canJoin: !mine && ['open', 'active'].includes(pod.status) && count < MAX, canLeave: mine && !leader && ['open', 'active'].includes(pod.status), canCancel: leader && pod.status === 'open',
  };
}
export const podsFor = (pods, membersBy, me, now) => pods.map(p => podView(p, membersBy[p.id] || [], me, now));
