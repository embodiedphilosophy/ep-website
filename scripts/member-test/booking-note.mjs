// The one-to-one summary: the note a mentee adds when the booking has none, and what the Ops dashboard sees (lib/ops/onetoones.js).
// Calendly is faked; Postgres is PGlite. Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/booking-note.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';
process.env.CALENDLY_TOKEN = 'test'; delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const cfg = (await import('../../data/mentee.json', { with: { type: 'json' } })).default;
const ET = cfg.calendly_event_type, ETU = `https://api.calendly.com/event_types/${ET}`;
globalThis.fetch = async u => {
  const json = b => ({ ok: true, status: 200, json: async () => b });
  const url = String(u);
  if (url.includes('/users/me')) return json({ resource: { uri: 'https://api.calendly.com/users/U1' } });
  const inv = /scheduled_events\/([^/?]+)\/invitees/.exec(url);
  if (inv) return json({ collection: [inv[1] === 'EV1' ? { name: 'Maya R', email: 'maya@x.com', questions_and_answers: [{ question: 'What do you want to work on?', answer: 'Task language in my cueing.', position: 0 }] } : { name: 'Sam T', email: 'sam@x.com', questions_and_answers: [] }] });
  if (url.includes('/scheduled_events')) return json({ collection: [{ uri: 'https://api.calendly.com/scheduled_events/EV1', event_type: ETU, start_time: '2026-11-25T18:00:00Z' }, { uri: 'https://api.calendly.com/scheduled_events/EV2', event_type: ETU, start_time: '2026-11-26T18:00:00Z' }] });
  return { ok: false, status: 404 };
};
const db = new PGlite(); const run = (strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows);
const S = await import('../../lib/mentee/store.js'); S._setSql(run);
const { oneToOnes } = await import('../../lib/ops/onetoones.js');
const now = Date.parse('2026-11-01T12:00:00Z');

// Maya wrote her summary in Calendly; Sam's booking has none yet
let r = await oneToOnes({ days: 60, now });
assert.equal(r.configured, true);
assert.deepEqual(r.items.map(x => [x.name, x.source, x.summary.length]), [['Maya R', 'calendly', 1], ['Sam T', '', 0]], 'Ops sees the summary from Calendly, and who has none');
// Sam adds a note on his page; Ops now shows it
await assert.rejects(() => S.saveBookingNote('sam@x.com', 'EV2', '  '), /Write a few lines/); await assert.rejects(() => S.saveBookingNote('sam@x.com', 'EV2', 'x'.repeat(3001)), /3,000/); await assert.rejects(() => S.saveBookingNote('sam@x.com', '../x', 'hi'), /find your booking/);
await S.saveBookingNote('Sam@x.com', 'EV2', 'Where I am on the talk: three topics, none chosen.');
r = await oneToOnes({ days: 60, now: now + 1 });
assert.deepEqual(r.items.map(x => [x.source, x.summary[0]?.a]), [['calendly', 'Task language in my cueing.'], ['note', 'Where I am on the talk: three topics, none chosen.']]);
// a note is per booking and per person; updating replaces it
await S.saveBookingNote('sam@x.com', 'EV2', 'Updated.'); assert.deepEqual(await S.bookingNotes([{ email: 'sam@x.com', uuid: 'EV2' }, { email: 'maya@x.com', uuid: 'EV1' }]), { 'sam@x.com|EV2': 'Updated.' });
assert.deepEqual(await S.bookingNotes([]), {});
// Calendly's own answer wins over a note
await S.saveBookingNote('maya@x.com', 'EV1', 'A note that should not replace the Calendly answer.');
assert.equal((await oneToOnes({ days: 60, now: now + 2 })).items[0].summary[0].a, 'Task language in my cueing.');
// no token → not configured, no error
delete process.env.CALENDLY_TOKEN; assert.deepEqual(await oneToOnes({ now: now + 3 }), { configured: false, items: [] });
console.log('booking note: ok');
