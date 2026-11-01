// One-off: rewords the Mentee Schedule and Mentee Months tabs after the "project notebook" wording left the mentee page (and British spellings
// became American). It changes a cell only when it still holds the OLD text below, so anything Jacob or Floss edited in the sheet is left alone.
// Step ids never change. Every change goes through updatePlain, so it is logged on the Change Log tab.
//   node --import ./scripts/ce-test/register.mjs scripts/mentee-year/reword-notebook.mjs            → dry run: prints what would change, writes nothing
//   node --import ./scripts/ce-test/register.mjs scripts/mentee-year/reword-notebook.mjs --write    → writes. Ask Jacob before running with --write.
// Needs CALENDAR_SHEET_ID and the Google service account in the environment.
import { seedRows, seedMonths } from '../../lib/mentee/year.js';
import { TABS } from '../../lib/mentee/content.js';

const write = process.argv.includes('--write');
const OLD_STEPS = {
 "s-2026-11-start-your-project-notebook": {
  "title": "Start your project notebook",
  "detail": "One page per month. After each immersion, reading and observation, note one possible talk theme and one possible Session 1 angle.",
  "evidence": "Notebook started (show it at your December one-to-one)"
 },
 "s-2026-12-longlist-three-possible-talk-topics": {
  "title": "Longlist three possible talk topics",
  "detail": "Three candidate topics for the 60-minute specialized talk, one sentence each, drawn from your notebook.",
  "evidence": "Longlist brought to the Q1 review"
 },
 "s-2026-12-note-two-or-three-session-1-angles-you-c": {
  "title": "Note two or three Session 1 angles you could speak to",
  "detail": "The angles come from the monthly books. Mark the ones you can speak to from your own life.",
  "evidence": "Shortlist in notebook"
 },
 "s-2027-01-name-your-real-group-and-venue": {
  "title": "Name your real group and venue",
  "detail": "Who will you offer the three sessions to (your students, a studio, a community group), and where? Talk to the host now.",
  "evidence": "Group and venue named in your January one-to-one"
 },
 "s-2027-02-bring-a-talk-topic-proposal-to-your-one-": {
  "title": "Bring a talk topic proposal to your one-to-one",
  "detail": "One paragraph: the topic, who it's for, and why you are the person to give it. Mentors confirm or redirect.",
  "evidence": "Proposal in the one-to-one booking summary"
 },
 "s-2027-02-choose-your-session-1-angle": {
  "title": "Choose your Session 1 angle",
  "detail": "Pick one angle and its book. If you haven't read the book yet, schedule it.",
  "evidence": "Angle chosen"
 },
 "s-2027-03-memorise-st-7-59-in-sanskrit-and-english": {
  "title": "Memorise ST 7.59 in Sanskrit and English",
  "detail": "\"There is none who utters it, and none is found who checks it: the Haṃsa utters itself, abiding in the breast of living beings.\"",
  "evidence": "Recited in your March one-to-one"
 },
 "s-2027-03-write-the-session-1-talk": {
  "title": "Write the Session 1 talk",
  "detail": "The whole talk, landing included, in under 1,500 words.",
  "evidence": "Draft shared with your mentor"
 },
 "s-2027-04-rehearse-the-session-2-talk-with-your-pa": {
  "title": "Rehearse the Session 2 talk with your partner",
  "detail": "Check every instruction against the use-and-avoid table in Part III of the manual. Rewrite any line that tasks a student with producing what they already have.",
  "evidence": "Rehearsal noted in articulation log"
 },
 "s-2027-04-book-your-three-dates-and-open-sign-ups": {
  "title": "Book your three dates and open sign-ups",
  "detail": "Session 1, then Session 2 a week later, then Session 3 at least two weeks after Session 2. Latest possible start is Mon 5 Jul. Tell your mentor which Session 2 date they are assessing.",
  "evidence": "Dates confirmed with venue and mentor"
 },
 "s-2027-04-try-a-10-minute-seed-version-on-your-par": {
  "title": "Try a 10-minute seed version on your partner",
  "detail": "Just the opening and the central image. You are testing whether the topic holds, not polishing.",
  "evidence": "Partner feedback noted"
 },
 "s-2027-05-practise-paryavasana-responses-on-five-r": {
  "title": "Practise paryavasāna responses on five recorded reports",
  "detail": "Use five recorded student reports (from your practice-teaching, or provided by mentors). Carry each to its own conclusion without affirming, correcting or psychologising.",
  "evidence": "Five responses written or recorded"
 },
 "s-2027-05-lead-the-full-upadesa-for-peers-under-su": {
  "title": "Lead the full upadeśa for peers, under supervision",
  "detail": "Arrange with your mentor. This comes before you offer it publicly.",
  "evidence": "Mentor sign-off"
 },
 "s-2027-05-bring-the-immersion-8-design-to-a-full-o": {
  "title": "Bring the immersion 8 design to a full outline",
  "detail": "The talk is designed at immersion 8. Turn that design into a full outline with sources, timings and the one practice you'll guide.",
  "evidence": "Outline sent to your mentor"
 },
 "s-2027-06-record-a-full-60-minute-run-through": {
  "title": "Record a full 60-minute run-through",
  "detail": "Deliver it to your partner or a small group, recorded. Watch it once before your one-to-one.",
  "evidence": "Recording shared"
 },
 "s-2027-06-write-the-follow-on-cohort-plan": {
  "title": "Write the follow-on cohort plan",
  "detail": "The 12 to 18 month practice cohort your new students join after Session 3: meeting rhythm, place, how people join.",
  "evidence": "Plan shared with your mentor"
 },
 "s-2027-06-mentor-feedback-on-the-run-through-book-": {
  "title": "Mentor feedback on the run-through; book your delivery slot",
  "detail": "Use your June one-to-one for the recording. Book a live delivery date in the first half of July.",
  "evidence": "Delivery date booked"
 },
 "s-2027-06-draft-the-final-report-outline": {
  "title": "Draft the final report outline",
  "detail": "Positionality, lineage, and how SLBT principles moved into your teaching.",
  "evidence": "Outline in notebook"
 },
 "s-2027-07-deliver-the-60-minute-talk-live-and-reco": {
  "title": "Deliver the 60-minute talk, live and recorded",
  "detail": "Assessed by a mentor. It may be revised once, which is why it lands mid-month.",
  "evidence": "Recording submitted"
 },
 "s-2027-07-complete-all-three-sessions-with-your-gr": {
  "title": "Complete all three sessions with your group",
  "detail": "Latest Session 3 date if you started on 5 Jul. Your mentor assesses the haṃsa-upadeśa you lead in Session 2.",
  "evidence": "Recordings of all three sessions submitted"
 },
 "s-2027-07-revised-talk-if-you-re-revising": {
  "title": "Revised talk, if you're revising",
  "detail": "The one permitted revision, delivered and recorded.",
  "evidence": "Revision submitted"
 },
 "s-2027-07-submit-the-final-report-and-sit-the-comp": {
  "title": "Submit the final report and sit the competency check",
  "detail": "The competency check is an open-book examination on terminology and framework.",
  "evidence": "Both submitted"
 }
};
const OLD_MONTHS = {
  '2026-10': { focus: 'Set up the year: practice baseline, practice log, project notebook. Meet your first articulation partner.' },
  '2026-11': { focus: 'Settle the weekly rhythm. Start your project notebook in earnest: one line after every immersion, reading and observation. First quarterly review.' },
};

const { readPlain, updatePlain } = await import('../../lib/ops/store.js');
const plans = [];
const sched = await readPlain(TABS.schedule).catch(() => null);
if (!sched) console.log(`${TABS.schedule} tab not found: nothing to reword there (the page uses data/mentee-year.json).`);
else for (const s of seedRows().filter(r => r.kind === 'step')) {
  const old = OLD_STEPS[s.step_id], row = sched.rows.find(r => r.values.step_id === s.step_id);
  if (!old || !row) continue;
  const changes = {}; for (const f of ['title', 'detail', 'evidence']) if (old[f] !== s[f] && row.values[f] === old[f]) changes[f] = s[f];
  if (Object.keys(changes).length) plans.push({ tab: TABS.schedule, row: row.row, id: s.step_id, changes, before: Object.fromEntries(Object.keys(changes).map(f => [f, row.values[f]])) });
}
const months = await readPlain(TABS.months).catch(() => null);
if (months) for (const m of seedMonths()) {
  const old = OLD_MONTHS[m.month], row = months.rows.find(r => r.values.month === m.month);
  if (!old || !row || row.values.focus !== old.focus) continue;
  plans.push({ tab: TABS.months, row: row.row, id: m.month, changes: { focus: m.focus }, before: { focus: row.values.focus } });
}
for (const p of plans) { console.log(`${p.tab} row ${p.row} (${p.id})`); for (const [f, v] of Object.entries(p.changes)) console.log(`  ${f}: ${JSON.stringify(p.before[f])}\n   → ${JSON.stringify(v)}`); }
console.log(`\n${plans.length} row(s) to change.`);
if (!write) { console.log('Dry run: nothing written. Add --write to write.'); process.exit(0); }
for (const p of plans) await updatePlain(p.tab, p.row, p.changes, { before: p.before, who: 'reword-script' });
console.log('Done.');
