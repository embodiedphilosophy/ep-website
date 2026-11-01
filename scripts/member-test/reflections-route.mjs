// The mentee Reflections API (app/api/member/reflections/route.js) with the real route, an in-memory Postgres (PGlite) and the Circle mock for posting.
// Nothing real is touched. Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/reflections-route.mjs
import assert from 'assert/strict';
import { spawn } from 'child_process';
import { PGlite } from '@electric-sql/pglite';

process.env.MEMBER_SECRET = 'test-secret'; process.env.CIRCLE_HEADLESS_BASE = 'http://localhost:4600'; process.env.CIRCLE_HEADLESS_TOKEN = 'test';
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.CALENDAR_SHEET_ID;
const mock = spawn('node', ['scripts/ops-test/circle-mock.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
let log = ''; mock.stdout.on('data', d => { log += d; });
await new Promise(r => setTimeout(r, 800));
try {
  const db = new PGlite(); const run = (strings, ...vals) => db.sql(strings, ...vals).then(r => r.rows);
  const S = await import('../../lib/mentee/reflectionstore.js'); S._setSql(run);
  const { signSession } = await import('../../lib/member/session.js');
  const { GET, POST } = await import('../../app/api/member/reflections/route.js');
  const bearer = (email, first) => 'Bearer ' + signSession({ uid: email, email, tier: 'mentee', firstName: first });
  const maya = bearer('hubfull@test', 'Maya'), bo = bearer('hubterm@test', 'Bo');
  const post = async (auth, body) => { const r = await POST(new Request('https://x.test/api/member/reflections', { method: 'POST', headers: { authorization: auth, 'content-type': 'application/json' }, body: JSON.stringify({ today: '2026-11-03', ...body }) })); return [r.status, await r.json()]; };
  const get = async (auth, qs = '') => { const r = await GET(new Request('https://x.test/api/member/reflections?today=2026-11-03' + qs, { headers: { authorization: auth } })); return [r.status, await r.json()]; };
  const wait = () => new Promise(r => setTimeout(r, 1600)); // the route spaces writes 1.5 s apart per person

  // not a mentee / not signed in
  assert.equal((await get('Bearer nope'))[0], 401);
  assert.equal((await GET(new Request('https://x.test/api/member/reflections', { headers: { authorization: 'Bearer ' + signSession({ uid: 'u', email: 'x@x.com', tier: 'none' }) } }))).status, 403);

  // write, share
  let [st, j] = await post(maya, { action: 'save', title: 'The pose was never the point', body: 'First.\nSecond.' });
  assert.equal(st, 200); const id = j.id; assert.equal(j.detail.status, 'draft'); assert.equal(j.meta.month, '2026-11'); assert.equal(j.meta.canPost, true);
  assert.equal((await get(bo))[1].list.length, 0, 'a draft is private');
  await wait(); [st, j] = await post(maya, { action: 'share', id }); assert.equal(j.detail.status, 'shared'); assert.equal(j.detail.step, 2);
  assert.equal((await get(bo))[1].list[0].unread, true);
  // the cohort gives feedback
  [st, j] = await post(bo, { action: 'comment', id, kind: 'landed', body: 'The first line stayed with me.' }); assert.equal(st, 200); assert.equal(j.detail.comments.length, 1);
  await wait(); [st, j] = await post(bo, { action: 'comment', id, kind: 'bad', body: 'x' }); assert.equal(st, 400); assert.match(j.error, /Choose what kind/);
  await wait(); [st, j] = await post(maya, { action: 'comment', id, kind: 'landed', body: 'On my own?' }); assert.equal(st, 400, 'no feedback on your own reflection');
  // posting before sharing, by someone else, and the real thing
  await wait(); [st, j] = await post(bo, { action: 'post', id }); assert.equal(st, 400); assert.match(j.error, /Only the author/);
  await wait(); [st, j] = await post(maya, { action: 'post', id }); assert.equal(st, 200); assert.equal(j.detail.status, 'posted'); assert.equal(j.detail.step, 4);
  await wait(); [st, j] = await post(maya, { action: 'post', id }); assert.equal(st, 200);
  assert.equal((log.match(/WROTE post /g) || []).length, 1, 'pressing Post twice makes one post in Circle'); assert.match(log, /From the Sahṛdaya Upāya cohort/, 'the post carries the cohort line');
  assert.match(log, /"space_id":2896660/, 'it goes to Kula Commentary');
  // it counts once posted
  assert.equal((await S.summaryFor({ email: 'hubfull@test' }, '2026-11')).posted.length, 1);
  // take down: the Circle post is deleted, the reflection goes back to shared and stops counting
  await wait(); [st, j] = await post(maya, { action: 'takedown', id }); assert.equal(st, 200); assert.equal(j.detail.status, 'shared');
  assert.match(log, /WROTE delete post 99/); assert.equal((await S.summaryFor({ email: 'hubfull@test' }, '2026-11')).posted.length, 0);
  assert.equal((await post(maya, { action: 'nonsense' }))[0], 429, 'writes are spaced out'); await wait();
  assert.equal((await post(maya, { action: 'nonsense' }))[0], 400);
  console.log('reflections route: ok');
} finally { mock.kill(); }
