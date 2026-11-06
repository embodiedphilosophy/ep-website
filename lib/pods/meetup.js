// Pod meetups: when a study pod meets (the next date and time, how often, how long), worked out in the leader's own time zone so a
// weekly 7pm stays 7pm for them across clock changes. Pure functions, shared by the study pods (lib/pods/logic.js) and the tests.
// Stored on the pod as meet_at (the first meetup of the series, or the one-off), meet_repeat, meet_minutes, meet_tz.

export const REPEATS = ['once', 'weekly', 'fortnightly', 'monthly'];
export const LENGTHS = [30, 45, 60, 75, 90, 120];
export const WINDOW_DAYS = 365;            // how far ahead the next meetup can be set
const LABEL = { once: 'One meetup', weekly: 'Every week', fortnightly: 'Every two weeks', monthly: 'Once a month' };
export const repeatLabel = r => LABEL[r] || '';

export const validTz = tz => { try { if (!tz) return ''; new Intl.DateTimeFormat('en-GB', { timeZone: tz }); return tz; } catch { return ''; } };

// Wall-clock parts of an instant in a time zone
function partsIn(tz, ms) {
  const o = {};
  for (const p of new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short' }).formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday) };
}
const offsetAt = (tz, ms) => { const p = partsIn(tz, ms); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi) - Math.floor(ms / 60000) * 60000; };
// The instant at which it is y-m-d h:mi on the wall clock in tz (month may overflow: Date.UTC normalises it)
function wallToUtc(tz, y, m, d, h, mi) {
  const guess = Date.UTC(y, m - 1, d, h, mi), o1 = offsetAt(tz, guess - offsetAt(tz, guess));
  return guess - o1;
}

// The k-th meetup of a series that began at `anchor` (ms), in tz
function occurrence(anchor, repeat, tz, k) {
  if (k === 0) return anchor;
  const a = partsIn(tz, anchor);
  if (repeat === 'weekly' || repeat === 'fortnightly') return wallToUtc(tz, a.y, a.m, a.d + k * (repeat === 'weekly' ? 7 : 14), a.h, a.mi);
  // Monthly: the same weekday in the same week of the month (2nd Thursday…); a 5th one becomes the last one
  const n = Math.ceil(a.d / 7), mm = new Date(Date.UTC(a.y, a.m - 1 + k, 1)), y = mm.getUTCFullYear(), m = mm.getUTCMonth() + 1;
  const firstWd = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), len = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let d = 1 + ((a.wd - firstWd + 7) % 7) + (n - 1) * 7;
  if (d > len) d -= 7;
  return wallToUtc(tz, y, m, d, a.h, a.mi);
}
const STEP = { weekly: 7 * 864e5, fortnightly: 14 * 864e5, monthly: 28 * 864e5 };

// The next meetup that has not finished yet (ISO), or '' when none is set or a one-off is over
export function nextMeetup(pod, now = Date.now()) {
  const anchor = pod?.meet_at ? Date.parse(pod.meet_at) : NaN;
  if (Number.isNaN(anchor)) return '';
  const minutes = Number(pod.meet_minutes) || 60, repeat = REPEATS.includes(pod.meet_repeat) ? pod.meet_repeat : 'once', tz = validTz(pod.meet_tz) || 'UTC';
  const over = t => t + minutes * 60000 <= now;
  if (repeat === 'once') return over(anchor) ? '' : new Date(anchor).toISOString();
  let k = Math.max(0, Math.floor((now - anchor) / STEP[repeat]) - 2);
  for (let i = 0; i < 800; i++, k++) { const t = occurrence(anchor, repeat, tz, k); if (!over(t)) return new Date(t).toISOString(); }
  return '';
}

// What the leader sends → { meetAt (ISO or null), meetRepeat, meetMinutes, meetTz }. An empty date clears the meetup ("not set yet").
export function cleanMeetup(b, now = Date.now()) {
  const raw = String(b?.meetAt ?? '').trim();
  const meetMinutes = LENGTHS.includes(Number(b?.meetMinutes)) ? Number(b.meetMinutes) : 60;
  const meetRepeat = REPEATS.includes(b?.meetRepeat) ? b.meetRepeat : 'weekly';
  const meetTz = validTz(String(b?.meetTz || '').trim()) || 'UTC';
  if (!raw) return { meetAt: null, meetRepeat, meetMinutes, meetTz };
  const t = Date.parse(raw);
  if (Number.isNaN(t)) throw new Error('Choose a day and time for the next meetup.');
  if (t < now - 5 * 60000) throw new Error('Choose a time in the future for the next meetup.');
  if (t > now + WINDOW_DAYS * 864e5) throw new Error('Choose a next meetup within the coming year.');
  return { meetAt: new Date(Math.round(t / 60000) * 60000).toISOString(), meetRepeat, meetMinutes, meetTz };
}

// "Thu 12 Nov, 7:00 pm GMT" in a given time zone (for messages, where we can't know the reader's)
export function whenIn(iso, tz) {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '';
  const z = validTz(tz) || 'UTC';
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: z, weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: z, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(d);
  return `${day}, ${time}`;
}

// A Google Calendar "add this event" link for the pod's meetups (repeating ones repeat in the calendar too)
const gcal = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export function calendarUrl({ title, details, startIso, minutes, repeat, tz }) {
  const s = Date.parse(startIso);
  if (Number.isNaN(s)) return '';
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${gcal(s)}/${gcal(s + (Number(minutes) || 60) * 60000)}`, details: details || '' });
  const z = validTz(tz);
  if (z) q.set('ctz', z);
  if (repeat === 'weekly' || repeat === 'fortnightly') q.set('recur', `RRULE:FREQ=WEEKLY${repeat === 'fortnightly' ? ';INTERVAL=2' : ''}`);
  if (repeat === 'monthly') {
    const p = partsIn(z || 'UTC', s), n = Math.ceil(p.d / 7);
    q.set('recur', `RRULE:FREQ=MONTHLY;BYDAY=${n >= 5 ? -1 : n}${['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][p.wd]}`);
  }
  return `https://calendar.google.com/calendar/render?${q}`;
}

// The Circle message pod members get when the leader changes the pod (only when the title or the meetup changed)
export function changeMessage({ kind = 'study pod', oldTopic, topic, meetAt, repeat, minutes, tz, note, from }) {
  const lines = [oldTopic && oldTopic !== topic ? `Our ${kind} “${oldTopic}” is now called “${topic}”.` : `An update to our ${kind} “${topic}”.`];
  if (meetAt) lines.push(`Next meetup: ${whenIn(meetAt, tz)}${repeat && repeat !== 'once' ? ` (${repeatLabel(repeat).toLowerCase()})` : ''}, ${minutes || 60} minutes. Your dashboard shows it in your own time.`);
  else if (meetAt === null) lines.push('We haven’t set the next meetup yet. I’ll let you know.');
  if (note) lines.push(note);
  lines.push(from);
  return lines.join('\n\n');
}
