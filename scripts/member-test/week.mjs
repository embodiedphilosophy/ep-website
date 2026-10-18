import assert from 'assert/strict';
const P = await import('../../lib/member/programmes.js');
const ev = [
 { date:'2026-10-11', end_date:'2026-10-20', time:'9am ET', program:'seasonal', title:'Song of the Goddess: Navarātri', registration_url:'https://enroll.embodiedphilosophy.com/navaratri-2026' },
 { date:'2026-10-18', time:'10am ET', program:'sadhana', series:'sadhana-school', title:'Orientation', registration_url:'https://ss.embodiedphilosophy.com/checkout/sadhana-school-year' },
 { date:'2026-10-19', time:'10am ET', program:'wisdom', series:'meditation-mondays', title:'Meditation Mondays', registration_url:'https://enroll.embodiedphilosophy.com/wisdom-school' },
 { date:'2026-10-21', time:'9am ET', program:'sadhana', series:'sadhana-fall-2026', title:'Session 1', registration_url:'https://ss.embodiedphilosophy.com/checkout/sadhana-school-fall' },
 { date:'2026-10-26', time:'12pm ET', program:'wisdom', series:'meditation-mondays', title:'Meditation Mondays' },
 { date:'2026-10-22', time:'7pm ET', program:'public', title:'Living Room Lecture' },
];
const w = (t) => P.weekAhead(ev, t, '2026-10-18');
const yr = w('ss_year');
assert.equal(yr.length, 5); // 26th is outside the 7 days
assert.deepEqual(yr.map(i => [i.key, i.locked]), [['seasonal',true],['ss',false],['mondays',false],['ss',false],['open',false]]);
assert.equal(yr[0].starts['2026-10-19'], '2026-10-19T13:00:00.000Z'); assert.equal(Object.keys(yr[0].starts).length, 3);
assert.equal(yr[0].href, 'https://enroll.embodiedphilosophy.com/navaratri-2026'); assert.equal(yr[0].end_date, '2026-10-20');
assert.equal(yr[1].start, '2026-10-18T14:00:00.000Z');
const none = w('none');
assert.ok(none.filter(i=>i.key!=='open').every(i => i.locked)); assert.equal(none[2].href, 'https://enroll.embodiedphilosophy.com/wisdom-school');
const med = w('meditation'); assert.equal(med.find(i=>i.key==='mondays').locked, false); assert.equal(med.find(i=>i.key==='ss').locked, true);
assert.equal(P.weekAhead([{date:'2026-10-20',time:'9am',program:'sadhana',title:'x'}],'wisdom','2026-10-18')[0].href,'https://www.embodiedphilosophy.com/programmes/sadhana-school/preview');
const m = w('mentee'); assert.ok(m.some(i => i.key === 'mentor') === false); // one-to-one window (25–31 Oct) starts after the week
assert.ok(P.weekAhead(ev,'mentee','2026-10-24').some(i=>i.key==='mentor'));
console.log('week ahead: ok');
