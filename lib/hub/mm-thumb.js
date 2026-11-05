// Meditation Mondays replay thumbnails: one branded design, varied by stream (ground colour, ring colour, Kalighat cutout),
// with the teacher and date written on each. Drawn on demand by /api/thumb/meditation, so every past and future replay has one
// without anyone making it. Pure: no network, no writes.

// Bump when the design changes, so Circle, Vimeo and browsers fetch the new picture
export const THUMB_VERSION = '1';

export const STREAM_LOOKS = {
  mystical: { ground: '#1F4A73', ring: '#EBA329', art: 'lady-pitcher' },
  metta: { ground: '#C9441E', ring: '#F3D9A4', art: 'parrot' },
  tantrik: { ground: '#1A1613', ring: '#C9441E', art: 'yogi-shiva' },
  somatic: { ground: '#3F6F70', ring: '#EBA329', art: 'lady-hair' },
  neuroscience: { ground: '#5A2E4A', ring: '#EBA329', art: 'lady-kohl' },
};
export const DEFAULT_LOOK = { ground: '#22332B', ring: '#EBA329', art: 'rui-fish' };

export function lookFor(stream) {
  const s = String(stream || '').toLowerCase();
  const key = Object.keys(STREAM_LOOKS).find(k => s.startsWith(k));
  return key ? STREAM_LOOKS[key] : DEFAULT_LOOK;
}

// "Monday 9 November 2026" for a YYYY-MM-DD day ('' when there is none)
export function longDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return '';
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)).replace(',', '');
}

const SITE = 'https://www.embodiedphilosophy.com';
// The picture's address: the same three facts always give the same address, so it is cached everywhere
export function thumbUrl({ stream, teacher, date }, base = SITE) {
  if (!stream && !teacher && !date) return '';
  const q = new URLSearchParams();
  if (stream) q.set('stream', stream);
  if (teacher) q.set('teacher', teacher);
  if (date) q.set('date', date);
  q.set('v', THUMB_VERSION);
  return `${base}/api/thumb/meditation?${q}`;
}
