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
