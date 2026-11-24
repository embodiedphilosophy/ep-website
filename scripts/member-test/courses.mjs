// Offline: which Circle spaces become "Your courses" on Today (lib/member/courses.js).
// Run: node --import ./scripts/ce-test/register.mjs scripts/member-test/courses.mjs
import assert from 'assert/strict';
const { shapeCourses } = await import('../../lib/member/courses.js');
const out = shapeCourses([
  { id: 5, name: 'Old pathway', space_type: 'course', url: 'https://ss.embodiedphilosophy.com/c/old', cover_image_url: 'https://x.test/a.jpg' },
  { id: 9, name: 'The Inner Saboteur', space_type: 'course', slug: 'the-inner-saboteur' },
  { id: 7, name: 'Kula chat', space_type: 'chat', url: 'https://ss.embodiedphilosophy.com/c/kula' },
  { id: 8, name: 'Season', space_type: 'basic', url: 'https://ss.embodiedphilosophy.com/c/season' },
  { id: 9, name: 'The Inner Saboteur', space_type: 'course', slug: 'the-inner-saboteur' },
  { id: 3, name: 'No link', space_type: 'course' },
  { id: 4, name: 'Bad link', space_type: 'course', url: 'javascript:alert(1)', cover_image_url: 'http://insecure.test/x.jpg' },
]);
assert.deepEqual(out.map(c => c.title), ['The Inner Saboteur', 'Old pathway'], 'courses only, newest first, once each, only with a safe link');
assert.equal(out[0].url, 'https://ss.embodiedphilosophy.com/c/the-inner-saboteur', 'link built from the slug when Circle sends none');
assert.equal(out[1].image, 'https://x.test/a.jpg'); assert.equal(out[0].image, '');
assert.deepEqual(shapeCourses(null), []);
console.log('courses: ok');
