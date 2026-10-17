// Stand-in for Circle's Headless Member API, for the season pages. Port 4600.
// Set CIRCLE_HEADLESS_BASE=http://localhost:4600 CIRCLE_HEADLESS_TOKEN=test. Writes are applied in memory and logged.
// Members: annual@test (all spaces), fall@test (Fall spaces only), nobody@test (none).
import http from 'node:http';
const day = n => new Date(Date.now() + n * 86400e3).toISOString();
const sess = (id, n, extra = {}) => ({ id, name: `Session ${id}`, starts_at: day(n), ends_at: new Date(Date.parse(day(n)) + 2 * 3600e3).toISOString(), space_id: 11, ...extra });
const events = [sess(1, -7, { replay_url: 'https://example.test/replay/1', replay_duration: 6000 }), sess(2, 0.0001), sess(3, 7), sess(4, 14), { ...sess(5, 3), space_id: 99 }];
const nextSat = () => { const d = new Date(Date.now() + 86400e3); while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1); d.setUTCHours(14, 0, 0, 0); return d; };
const hubEvents = [{ id: 71, name: 'Saturday Open Session', space_id: 108, starts_at: nextSat().toISOString(), ends_at: new Date(+nextSat() + 5400e3).toISOString() }, { id: 72, name: 'Sunday Practicum', space_id: 108, starts_at: new Date(+nextSat() + 86400e3).toISOString(), ends_at: new Date(+nextSat() + 86400e3 + 5400e3).toISOString() }, { id: 73, name: 'Fall Session 2', space_id: 2911531, starts_at: day(5), ends_at: new Date(Date.parse(day(5)) + 7200e3).toISOString() }];
const posts = [
  { id: 10, name: 'Reading: Pratyabhijñāhṛdaya, sūtras 1–5', topics: [{ id: 1 }], created_at: day(-9), position: 1, is_pinned: true },
  { id: 11, name: 'Reading: Introduction', topics: [1], created_at: day(-10), position: 2 },
  { id: 12, name: 'What I noticed after Session 1', topics: [2], created_at: day(-5), comments_count: 3, user: { name: 'Maya R.' } },
  { id: 13, name: 'Session 1 replay notes', topics: [3], created_at: day(-6), duration: 5400 },
];
// Hub members use the real season space ids from data/school-seasons.json plus 101-111 (synthetic ids for the other hub rows)
const core = [101, 102, 103, 104, 105, 106, 107];
const spacesFor = { 'annual@test': [22, 11, 32, 31], 'fall@test': [22, 11], 'nobody@test': [],
  'hubterm@test': [...core, 2911545, 2911531], 'hubfull@test': [...core, 108, 2911545, 2911552, 2911553, 2911554, 2911531],
  'hubmentee@test': [...core, 108, 109, 110, 111, 2911545, 2911552, 2911553, 2911554, 2911531] };
const tokens = new Map();
const log = [];
http.createServer(async (req, res) => {
  const body = await new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => r(b)); });
  const send = (o, s = 200) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  const url = new URL(req.url, 'http://x');
  const who = tokens.get((req.headers.authorization || '').replace('Bearer ', ''));
  if (url.pathname === '/api/v1/headless/auth_token') {
    const email = JSON.parse(body || '{}').email;
    if (!spacesFor[email]) return send({ error: 'No such member' }, 404);
    const t = `tok-${email}`; tokens.set(t, email); return send({ access_token: t, refresh_token: 'r', access_token_expires_at: day(0.04) });
  }
  if (!who) return send({ error: 'unauthorised' }, 401);
  const p = url.pathname.replace('/api/headless/v1', '');
  if (p === '/spaces') return send({ records: spacesFor[who].map(id => ({ id, url: `https://ss.example.test/c/space-${id}` })), has_next_page: false });
  if (p === '/community_events') return send({ records: [...events, ...hubEvents].filter(e => spacesFor[who].includes(e.space_id)), has_next_page: false });
  let m;
  if ((m = p.match(/^\/spaces\/(\d+)\/posts$/))) {
    if (req.method === 'POST') { log.push(`POST post ${body}`); console.log('WROTE post', body); posts.unshift({ id: 99, name: JSON.parse(body).name, topics: JSON.parse(body).topic_ids, created_at: day(0) }); return send({ id: 99 }, 201); }
    return send({ records: spacesFor[who].includes(Number(m[1])) ? posts : [], has_next_page: false });
  }
  if ((m = p.match(/^\/events\/(\d+)\/event_attendees$/)) && req.method === 'POST') { console.log('WROTE rsvp', m[1], who); return send({ ok: true }, 201); }
  send({ error: 'not mocked ' + p }, 404);
}).listen(4600, () => console.log('circle mock on 4600'));
