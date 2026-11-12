// Checks lib/school/access.js (the Admin API second opinion behind the season gate) against a tiny local stand-in for
// Circle's Admin API. No real network. Run: node --import ./scripts/ce-test/register.mjs scripts/ops-test/school-access.mjs
import assert from 'node:assert/strict';
import http from 'node:http';

const FALL = 2911545, EVENTS = 2911531, WINTER = 2911552;
let calls = 0;
const srv = http.createServer((req, res) => {
  calls++;
  const u = new URL(req.url, 'http://x');
  const send = b => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(b)); };
  if (u.pathname.endsWith('/community_members/search')) return send(u.searchParams.get('email') === 'student@test' ? { id: 6236549 } : {});
  if (u.pathname.endsWith('/space_members')) {
    const sid = Number(u.searchParams.get('space_id'));
    return send({ records: sid === FALL || sid === EVENTS ? [{ community_member_id: 6236549 }, { community_member_id: 1 }] : [{ community_member_id: 1 }], has_next_page: false });
  }
  res.writeHead(404); res.end('{}');
});
await new Promise(r => srv.listen(4577, r));
process.env.CIRCLE_API_TOKEN = 'test';
process.env.CIRCLE_API_BASE = 'http://127.0.0.1:4577/api/admin/v2';
const { confirmSpaces, adminConfirmsMember } = await import('../../lib/school/access.js');

// The headless list left out Fall (and its event space): the Admin API puts them back, logging that it did
const member = new Set(['102']);
await confirmSpaces('student@test', member, [FALL, EVENTS], [{ id: FALL, is_member: false }]);
assert.ok(member.has(String(FALL)) && member.has(String(EVENTS)), 'Fall restored');
// Not in Winter: stays out, so the gate still shows for seasons they did not buy
assert.equal(await adminConfirmsMember('student@test', WINTER), false);
// Someone Circle doesn't know: no
assert.equal(await adminConfirmsMember('nobody@test', FALL), false);
// Already in the list: no Admin API call at all
const before = calls; await confirmSpaces('student@test', new Set([String(FALL)]), [FALL]); assert.equal(calls, before);
// Admin API down: answers no, never throws
process.env.CIRCLE_API_BASE = 'http://127.0.0.1:1/x';
const { adminConfirmsMember: again } = await import('../../lib/school/access.js?down');
assert.equal(await again('other@test', FALL), false);
srv.close();
console.log('school-access: all checks passed');
