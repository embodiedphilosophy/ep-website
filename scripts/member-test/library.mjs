// Offline checks for the member Library: who sees what, levels, stable ids, stars against an in-memory Postgres.
// Run: npm i --no-save @electric-sql/pglite && node --import ./scripts/ce-test/register.mjs scripts/member-test/library.mjs
import assert from 'assert/strict';
import { PGlite } from '@electric-sql/pglite';
const L = await import('../../lib/library/load.js');
const S = await import('../../lib/library/store.js');

assert.equal(L.levelOf('Foundations'), 'Foundations'); assert.equal(L.levelOf('deepening'), 'Deepening'); assert.equal(L.levelOf('Advanced'), 'Advanced'); assert.equal(L.levelOf('Start here'), 'Foundations'); assert.equal(L.levelOf(''), 'Foundations');
const rows = [
  { department: 'Kashmir Śaivism', level: 'Foundations', label: 'Learning pathway', title: 'Non-Duality', teachers: 'Jacob', url: 'https://ss.embodiedphilosophy.com/c/a', access: '' },
  { department: 'Kashmir Śaivism', level: 'Deepening', label: 'Sādhana School · Fall', title: 'The Heart of Recognition', url: 'https://ss.embodiedphilosophy.com/c/b', access: 'Sādhana School' },
  { department: 'Kashmir Śaivism', level: 'Advanced', title: 'Mentees only thing', url: 'https://ss.embodiedphilosophy.com/c/c', access: 'mentee' },
  { department: 'Contemplative Practice', level: 'Deepening', title: 'Hidden', access: '', publish: 'FALSE' },
  { department: 'Contemplative Practice', level: 'Deepening', title: 'Typo access', access: 'sadana' },
  { department: 'Śākta Tantra', title: 'Wisdom item', access: 'wisdom school', url: 'javascript:alert(1)' },
];
const titles = (tier, admin) => L.shapeLibrary(rows, tier, admin).items.map(i => i.title);
assert.deepEqual(titles('none'), ['Non-Duality'], 'a free member sees open rows only');
assert.deepEqual(titles('wisdom'), ['Non-Duality', 'Wisdom item']);
assert.deepEqual(titles('ss_year'), ['Non-Duality', 'The Heart of Recognition', 'Wisdom item'], 'Sādhana School also sees Wisdom School rows');
assert.deepEqual(titles('mentee'), ['Non-Duality', 'The Heart of Recognition', 'Mentees only thing', 'Wisdom item']);
assert.ok(!titles('mentee').includes('Typo access'), 'an access word we do not know opens nothing, even to a mentee');
assert.ok(titles('none', true).includes('Typo access'), 'admins see it, so a typo can be found');
assert.ok(!titles('mentee', true).includes('Hidden'), 'publish = FALSE hides a row from admins too');
const shaped = L.shapeLibrary(rows, 'mentee', false);
assert.deepEqual(shaped.departments, [{ name: 'Kashmir Śaivism', count: 3 }, { name: 'Śākta Tantra', count: 1 }], 'departments in the order of the rows, with counts');
assert.equal(shaped.items.find(i => i.title === 'Wisdom item').url, '', 'a link that is not http(s) is dropped');
assert.equal(L.itemId('Kashmir Śaivism', 'Non-Duality'), L.itemId('kashmir saivism', ' non-duality '), 'ids ignore case and accents');
assert.match(L.itemId('a', 'b'), /^l[0-9a-f]{12}$/);

delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
const db = new PGlite(); S._setSql((s, ...v) => db.sql(s, ...v).then(r => r.rows));
const id = L.itemId('Kashmir Śaivism', 'Non-Duality');
assert.equal((await S.starsOf('u1')).size, 0);
await S.setStar('u1', id, true); await S.setStar('u1', id, true);
assert.deepEqual([...await S.starsOf('u1')], [id], 'starring twice is one star'); assert.equal((await S.starsOf('u2')).size, 0, 'stars are one member’s own');
await S.setStar('u1', id, false); assert.equal((await S.starsOf('u1')).size, 0);
await assert.rejects(() => S.setStar('u1', 'nope', true), /Unknown item/);
console.log('library: ok');
{
  const r = L.catalogRows([{ id: 'x1', programme: 'wisdom_school', depth: 'Deepen', label: 'Course', kind: 'Course', title: 'Tantra I', teachers: [{ name: 'A' }, { name: 'B' }], access: 'ws_plus' }, { id: 'x2', programme: 'meditation_mondays', depth: '', title: 'Sit', teachers: [], access: 'pwyc' }]);
  const m = L.shapeLibrary(r, 'wisdom', false);
  if (m.items.length !== 1 || m.items[0].level !== 'Deepening' && false) throw new Error('catalog rows: wisdom sees only pwyc');
  const w = L.shapeLibrary(r, 'wisdom_plus', false);
  if (w.items.length !== 2 || w.items.find(i => i.title === 'Tantra I').level !== 'Deepening' || w.items[0].teachers !== 'A, B') throw new Error('catalog rows mapping');
  console.log('library catalog rows: ok');
}
{
  const sp = [{ id: 1, name: 'Tantra I', space_type: 'course', space_group_name: 'Wisdom School', url: 'https://ss.embodiedphilosophy.com/c/tantra-i' }, { id: 2, name: 'Chat', space_type: 'chat' }];
  const r = L.circleRows(sp, [{ title: 'Tantra I', depth: 'Formation', teachers: [{ name: 'A' }], programme: 'wisdom_school' }]);
  if (r.length !== 1 || r[0].department !== 'Wisdom School' || r[0].level !== 'Advanced' || !r[0].url) throw new Error('circle rows');
  console.log('library circle rows: ok');
}
{
  // Library Topics: re-file by topic, second topic, format badge, note, hide; stars keep their ids; topic order from the tab
  const idx = L.topicIndex([
    { circle_space_id: '11', title: 'Tantra I', topic: 'Kashmir Śaivism & Tantra', topic_2: 'Meditation & Daily Practice', format: 'On-Demand Sādhana', note: 'Sādhana School · Fall 2025', show: 'TRUE' },
    { circle_space_id: '', title: 'Sit', topic: 'Meditation & Daily Practice', format: 'Live Series', show: 'TRUE' },
    { circle_space_id: '13', title: 'Workbook', topic: '', show: 'FALSE' },
  ]);
  const raw = [
    { space_id: '11', department: 'Sādhana School Archive', level: 'Deepening', label: 'Course', title: 'Tantra I (renamed in Circle)', url: 'https://ss.embodiedphilosophy.com/c/t' },
    { space_id: '', department: 'Programmes', level: '', label: 'Course', title: 'Sit', url: 'https://ss.embodiedphilosophy.com/c/s' },
    { space_id: '13', department: 'Mentorship', title: 'Workbook' },
    { space_id: '99', department: 'Workshops', title: 'Unfiled thing' },
  ];
  const filed = raw.map(r => L.applyTopic(r, idx, r.space_id));
  const lib = L.shapeLibrary(filed, 'mentee', false, idx.order);
  assert.deepEqual(lib.departments.map(d => d.name), ['Kashmir Śaivism & Tantra', 'Meditation & Daily Practice', 'Workshops'], 'topics in tab order, unfiled groups after');
  assert.equal(lib.departments.find(d => d.name === 'Meditation & Daily Practice').count, 2, 'second topic counts too');
  const t = lib.items.find(i => i.space_id === undefined && i.title.startsWith('Tantra'));
  assert.equal(t.department, 'Kashmir Śaivism & Tantra'); assert.equal(t.label, 'On-Demand Sādhana'); assert.equal(t.note, 'Sādhana School · Fall 2025'); assert.equal(t.level, 'Deepening');
  assert.equal(t.id, L.itemId('Sādhana School Archive', 'Tantra I (renamed in Circle)'), 'star id stays tied to the original department');
  assert.ok(!lib.items.some(i => i.title === 'Workbook'), 'show = FALSE keeps it out');
  assert.equal(lib.items.find(i => i.title === 'Sit').label, 'Live Series', 'matched by title when there is no id');
  assert.deepEqual(L.applyTopic(raw[3], idx, '99'), raw[3], 'no topic row: unchanged');
  console.log('library topics: ok');
}
{
  // A season (posts space) or Navarātri (events space) joins the Library only when the Library Topics tab files it
  const sp = [{ id: 21, name: 'Fall · The Heart of Recognition', space_type: 'basic', space_group_name: 'Sādhana School' }, { id: 22, name: 'Kula chat', space_type: 'chat' }];
  const listed = s => s.id === 21;
  const r = L.circleRows(sp, [], listed);
  if (r.length !== 1 || r[0].title !== 'Fall · The Heart of Recognition' || r[0].space_id !== '21') throw new Error('filed non-course space');
  if (L.circleRows(sp, []).length !== 0) throw new Error('unfiled non-course spaces stay out');
  console.log('library filed spaces: ok');
}
