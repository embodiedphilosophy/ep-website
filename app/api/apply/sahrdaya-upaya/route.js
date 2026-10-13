import { NextResponse } from 'next/server';

// Sahṛdaya Upāya application. The site's own form posts here, and we pass the answers on to the
// original Google Form, so every application still lands in the same Form responses / sheet as before.
export const dynamic = 'force-dynamic';

const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSex5mpzL7oFWnaT7kED8PBSqn8vXjcBiR2hSMWRy45AybwPKA/formResponse';

// Our field name → Google Form entry ID. `req` marks questions the Google Form requires.
const FIELDS = {
  enrolled:        { id: '286475043' },
  prereqs:         { id: '1837068804', req: true, multi: true },
  name:            { id: '758761421', req: true },
  email:           { id: '502460690', req: true },
  phone:           { id: '767732188' },
  location:        { id: '315606938', req: true },
  timezone:        { id: '192337302', req: true },
  pronouns:        { id: '2066713713' },
  heard:           { id: '2137370812', req: true },
  teachYears:      { id: '435211971', req: true },
  credentials:     { id: '575475721', req: true },
  schools:         { id: '1236276687', req: true },
  teaching:        { id: '961082766', req: true },
  medYears:        { id: '344807837', req: true },
  medPractice:     { id: '2125662302', req: true },
  dailyPractice:   { id: '1020647111', req: true },
  tantra:          { id: '97001354', req: true },
  sanskrit:        { id: '198065568', req: true },
  priorCourses:    { id: '1024558171', req: true },
  why:             { id: '218157905', req: true },
  communities:     { id: '83798370', req: true },
  landed:          { id: '1906721401', req: true },
  positionality:   { id: '1669081083', req: true },
  attendLive:      { id: '1127284731', req: true },
  unavailable:     { id: '1391235269' },
  summer:          { id: '214108157', req: true },
  commitments:     { id: '377849619', req: true },
  payment:         { id: '284804156', req: true },
  wsWhy:           { id: '566620770' },
  wsSkills:        { id: '1520701426' },
  wsAck1:          { id: '2053945952' },
  wsAck2:          { id: '1997078032' },
  anythingElse:    { id: '1072811718' },
};

// The prerequisite checkboxes, word for word as they appear on the Google Form.
const PREREQS = [
  'I have at least five years of yoga teaching experience.',
  'I have at least one year of regular, daily meditation practice.',
];

const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

export async function POST(req) {
  const data = await req.json().catch(() => null);
  if (!data) return NextResponse.json({ error: 'We could not read your application. Please try again.' }, { status: 400 });
  if (data.website) return NextResponse.json({ ok: true }); // honeypot: bots fill the hidden field

  const missing = Object.entries(FIELDS)
    .filter(([key, f]) => f.req && (f.multi ? !(data[key] || []).length && !data.prereqsOther : !String(data[key] || '').trim()))
    .map(([key]) => key);
  if (missing.length) return NextResponse.json({ error: 'Please answer every required question.', missing }, { status: 400 });
  if (!isEmail(data.email)) return NextResponse.json({ error: 'Please enter a valid email address.', missing: ['email'] }, { status: 400 });

  const body = new URLSearchParams();
  body.append('emailAddress', String(data.email).trim()); // the Form's own "collect email" field
  for (const [key, f] of Object.entries(FIELDS)) {
    if (key === 'prereqs') {
      for (const v of data.prereqs || []) if (PREREQS.includes(v)) body.append(`entry.${f.id}`, v);
      if (String(data.prereqsOther || '').trim()) {
        body.append(`entry.${f.id}`, '__other_option__');
        body.append(`entry.${f.id}.other_option_response`, String(data.prereqsOther).trim());
      }
      continue;
    }
    const v = String(data[key] ?? '').trim();
    if (v) body.append(`entry.${f.id}`, v.slice(0, 5000));
  }

  try {
    const res = await fetch(FORM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      redirect: 'manual',
    });
    // Google answers 200 (or a redirect) when the response is saved, 400 when something is rejected.
    if (res.status >= 400) throw new Error(`Google Form answered ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Sahrdaya Upaya application failed', err.message);
    return NextResponse.json(
      { error: 'Your application could not be sent just now. Please try again, or write to hello@embodiedphilosophy.com.' },
      { status: 502 },
    );
  }
}
