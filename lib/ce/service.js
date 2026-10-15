// Continuing education: the steps that touch the outside world (Site Pathways, the database, email).
// Rules live in rules.js, records in store.js, the PDF in pdf.js.
import { getPathways } from '../content';
import { readTab } from '../sheet';
import { sendEmail, layout, button, esc } from '../ops/email';
import { cePathways, pathwayForSpace, paceCheck, canCertify, summarise, pdfUrl, verifyUrl, CE_PAGE, CYCLE_HOURS, longDate } from './rules';
import * as store from './store';

export const ceReady = () => store.ceAvailable();

// Pathways with CE hours, from Site Pathways (the same rows as the public Continuing Education page)
export async function loadPathways() { return cePathways(await getPathways()); }

// Site Links & Prices → yacep_id (printed on certificates)
export async function yacepId() {
  const rows = (await readTab('links').catch(() => null)) || [];
  return (rows.find(r => r.key === 'yacep_id') || {}).value || process.env.YACEP_ID || '';
}

// Emails go out only once CE_EMAILS=live (so the first runs can be checked in the ops ledger first)
const emailsLive = () => process.env.CE_EMAILS === 'live';

// ---- Circle workflow webhook ----
export async function handleCircle(parsed, raw) {
  const pathways = await loadPathways();
  const p = pathwayForSpace(pathways, parsed.spaceId);
  await store.logEvent({ kind: parsed.kind, email: parsed.email, spaceId: parsed.spaceId, lessonId: parsed.lessonId, pathway: p ? p.slug : '', raw });
  if (!p || !parsed.email) return { matched: false };
  if (parsed.kind === 'lesson' && parsed.lessonId) await store.recordLesson(parsed.email, p.slug, parsed.lessonId);
  if (parsed.kind === 'course') await store.recordDone(parsed.email, p.slug, 'circle');
  return { matched: true, pathway: p.slug, kind: parsed.kind };
}

// ---- The member's tracker ----
export async function memberSummary(email, tier, today) {
  const [pathways, rec] = await Promise.all([loadPathways(), store.memberRecords(email)]);
  const s = summarise({ pathways, ...rec, today, tier });
  // Links for issued certificates (the member is signed in, so they can have the PDF link)
  for (const r of s.rows) if (r.cert && r.cert.status === 'issued') { r.cert.pdf = pdfUrl(r.cert.id); r.cert.verify = verifyUrl(r.cert.id); }
  return s;
}

// ---- Reflection → certificate ----
const clean = (s, max) => String(s || '').replace(/\s+\n/g, '\n').trim().slice(0, max);
export async function reflect({ email, uid, tier, slug, r1, r2, name, yaId, attest }) {
  if (!canCertify(tier)) throw Object.assign(new Error('Certificates come with Wisdom School Plus'), { status: 403 });
  if (!attest) throw Object.assign(new Error('Please confirm the hours are your own study'), { status: 400 });
  const a = clean(r1, 4000), b = clean(r2, 4000), n = clean(name, 120);
  if (a.split(/\s+/).filter(Boolean).length < 15 || b.split(/\s+/).filter(Boolean).length < 10) throw Object.assign(new Error('Please write a few sentences for each question'), { status: 400 });
  if (!n) throw Object.assign(new Error('Please add the name for your certificate'), { status: 400 });
  const pathways = await loadPathways();
  const p = pathways.find(x => x.slug === slug);
  if (!p) throw Object.assign(new Error('That pathway isn’t part of continuing education'), { status: 404 });
  const rec = await store.memberRecords(email);
  if (!rec.done[slug]) throw Object.assign(new Error('Finish every lesson in Circle first'), { status: 409 });
  const pace = paceCheck(rec.lessons[slug]?.firstAt, rec.done[slug], p.runtimeMinutes);
  const cert = await store.createCert({
    email, uid, name: n, yaId: clean(yaId, 40), pathway: p.slug, title: p.title, hours: p.hours, category: p.category,
    firstAt: rec.lessons[slug]?.firstAt || null, doneAt: rec.done[slug], r1: a, r2: b, pace, status: pace === 'held' ? 'held' : 'issued',
  }).catch(e => { if (e.code === 'exists') e.status = 409; throw e; });
  let emailed = false;
  if (cert.status === 'issued') emailed = await emailCertificate(cert).then(r => !r?.skipped).catch(e => { console.error('CE email failed', cert.id, e.message); return false; });
  return { ...cert, emailed };
}

// ---- Staff actions (ops ledger) ----
export async function approve(id, by) {
  const c = await store.getCert(id);
  if (!c || c.status !== 'held') throw Object.assign(new Error('Only a held certificate can be approved'), { status: 409 });
  const cert = await store.updateCert(id, { status: 'issued', notes: `Approved by ${by}` });
  await emailCertificate(cert).catch(e => console.error('CE email failed', id, e.message));
  return cert;
}
export async function revoke(id, by, why = '') {
  const c = await store.getCert(id);
  if (!c) throw Object.assign(new Error('No such certificate'), { status: 404 });
  return store.updateCert(id, { status: 'revoked', notes: `Revoked by ${by}${why ? `: ${why}` : ''}` });
}
// A name change: same id, new PDF, sent again
export async function rename(id, name, by) {
  const n = clean(name, 120);
  if (!n) throw Object.assign(new Error('Please give the new name'), { status: 400 });
  const cert = await store.updateCert(id, { name: n, notes: `Name changed by ${by}` });
  if (cert?.status === 'issued') await emailCertificate(cert, { reissue: true }).catch(e => console.error('CE email failed', id, e.message));
  return cert;
}
// For lessons finished before the Circle workflow was on, or anything Circle didn't send: mark a pathway finished
export async function markDone(email, slug, by) {
  const pathways = await loadPathways();
  if (!pathways.some(p => p.slug === slug)) throw Object.assign(new Error('That pathway isn’t part of continuing education'), { status: 404 });
  await store.recordDone(String(email || '').trim().toLowerCase(), slug, `staff:${by}`);
  return { ok: true };
}

export async function ledger() {
  const [certs, events, counts, pathways] = await Promise.all([store.listCerts(), store.unmatchedEvents(), store.counts(), loadPathways()]);
  return { certs, unmatched: events, counts, pathways: pathways.map(p => ({ slug: p.slug, title: p.title, hours: p.hours, category: p.category, spaceIds: p.spaceIds, lessons: p.lessons, runtimeMinutes: p.runtimeMinutes })) };
}

// ---- The "certificate ready" email (Resend, from EP Admin) ----
export async function emailCertificate(cert, { reissue = false } = {}) {
  if (!emailsLive()) return { skipped: 'CE_EMAILS is not live' };
  const rec = await store.memberRecords(cert.email);
  const s = summarise({ pathways: await loadPathways(), ...rec, today: new Date().toISOString().slice(0, 10), tier: { wisdomPlus: true } });
  const first = String(cert.name || '').split(/\s+/)[0];
  const row = (k, v) => `<tr><td style="padding:6px 0;color:#5A5346;width:42%;border-bottom:1px solid #EADDC6">${esc(k)}</td><td style="padding:6px 0;border-bottom:1px solid #EADDC6">${esc(v)}</td></tr>`;
  const cycle = s.cycle.met
    ? `That brings you to <b>${s.cycle.hours} hours</b> this cycle: your ${CYCLE_HOURS}-hour Yoga Alliance requirement is met.`
    : `That brings you to <b>${s.cycle.hours} of ${CYCLE_HOURS} hours</b> this cycle.`;
  const html = layout(reissue ? 'Your updated certificate' : `Well done, ${first}: your certificate is ready`, `
    <p>${reissue ? 'Here is your certificate with the updated name.' : `Thank you for your reflection on <b>${esc(cert.title)}</b>. Your certificate is ready to download and is saved in your CE tracker.`}</p>
    <p>${cycle}</p>
    ${button(pdfUrl(cert.id), 'Download certificate')}
    <p style="font-size:12px;letter-spacing:2px;color:#A5432A;text-transform:uppercase;margin-top:22px">For your Yoga Alliance log</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px">${row('Provider', 'Embodied Philosophy (YACEP)')}${row('Training', cert.title)}${row('Hours', String(cert.hours))}${row('Category', cert.category)}${row('Completed', longDate(cert.issued_at))}</table>
    <p style="margin-top:22px"><a href="${esc(CE_PAGE)}" style="color:#A5432A">See all your CE hours</a> · Verify this certificate at ${esc(verifyUrl(cert.id).replace(/^https?:\/\//, ''))}</p>`);
  return sendEmail({ to: cert.email, subject: reissue ? `Your updated certificate: ${cert.title}` : `Your ${cert.hours} CE hours are certified: ${cert.title}`, html });
}
