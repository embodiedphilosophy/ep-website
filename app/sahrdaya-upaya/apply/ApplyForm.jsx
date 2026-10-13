'use client';

import { useEffect, useRef, useState } from 'react';

const CHECKOUT = 'https://ss.embodiedphilosophy.com/checkout/sadhana-school-sahrdaya-upaya';
const DRAFT_KEY = 'su-apply-draft-2026';

const PREREQS = [
  'I have at least five years of yoga teaching experience.',
  'I have at least one year of regular, daily meditation practice.',
];
const WORK_STUDY = 'I am Interested in a Work Study Arrangement';

// One small field component for text inputs and text areas.
function Field({ name, label, hint, long, required, type = 'text', form, set, err, autoComplete }) {
  const Tag = long ? 'textarea' : 'input';
  return (
    <div className={`su-field${err ? ' bad' : ''}`}>
      <label htmlFor={`f-${name}`}>{label}{required && <span className="req" aria-hidden="true"> *</span>}</label>
      {hint && <p className="hint">{hint}</p>}
      <Tag
        id={`f-${name}`}
        name={name}
        type={long ? undefined : type}
        rows={long ? 4 : undefined}
        required={required}
        autoComplete={autoComplete}
        value={form[name] || ''}
        onChange={e => set(name, e.target.value)}
      />
    </div>
  );
}

function Radios({ name, label, hint, options, required, form, set, err }) {
  return (
    <fieldset className={`su-field${err ? ' bad' : ''}`}>
      <legend>{label}{required && <span className="req" aria-hidden="true"> *</span>}</legend>
      {hint && <p className="hint">{hint}</p>}
      <div className="su-choices">
        {options.map(([value, text]) => (
          <label key={value} className={form[name] === value ? 'on' : ''}>
            <input type="radio" name={name} value={value} checked={form[name] === value} required={required} onChange={() => set(name, value)} />
            <span>{text || value}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const opts = list => list.map(v => (Array.isArray(v) ? v : [v]));

export default function ApplyForm() {
  const [form, setForm] = useState({ prereqs: [] });
  const [missing, setMissing] = useState([]);
  const [state, setState] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);
  const top = useRef(null);
  const loaded = useRef(false);

  // Keep a draft in this browser so a long application isn't lost on a refresh.
  useEffect(() => {
    try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); if (d) setForm({ prereqs: [], ...d }); } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current || state === 'done') return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
  }, [form, state]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setMissing(m => m.filter(x => x !== k)); };
  const togglePrereq = v => set('prereqs', form.prereqs.includes(v) ? form.prereqs.filter(x => x !== v) : [...form.prereqs, v]);
  const p = { form, set };
  const bad = k => missing.includes(k);
  const workStudy = form.payment === WORK_STUDY;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setState('sending');
    try {
      const res = await fetch('/api/apply/sahrdaya-upaya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMissing(out.missing || []);
        throw new Error(out.error || 'Something went wrong. Please try again.');
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setState('done');
      setTimeout(() => document.querySelector('.su-apply-done')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  }

  if (state === 'done') {
    const first = String(form.name || '').trim().split(/\s+/)[0];
    const enrolled = form.enrolled === 'Yes';
    return (
      <div className="su-apply-done" ref={top} role="status">
        <span className="eyebrow">Application received</span>
        <h2>Thank you{first ? `, ${first}` : ''}.</h2>
        <p>Your application is with Jacob. We&apos;ll write to you at <b>{form.email}</b> once it has been reviewed.</p>

        {enrolled ? (
          <div className="su-next">
            <h3>You&apos;re already a Sādhana School student</h3>
            <p>There&apos;s nothing more to pay right now. Please don&apos;t use the combined checkout, which includes the full Sādhana School year. We&apos;ll be in touch with your apprenticeship tuition ($1,300) once your application has been reviewed.</p>
          </div>
        ) : workStudy ? (
          <div className="su-next">
            <h3>About Work Study</h3>
            <p>Because you&apos;ve asked about a Work Study arrangement, we&apos;ll be in touch before you pay anything for the apprenticeship. If you&apos;d like to secure your place in Sādhana School in the meantime, you can <a href="https://ss.embodiedphilosophy.com/checkout/sadhana-school-year">enroll for the year here</a>.</p>
          </div>
        ) : (
          <div className="su-next">
            <span className="k">Final step</span>
            <h3>Complete your enrollment</h3>
            <p>To hold your place in the cohort, enroll in Sādhana School and Sahṛdaya Upāya together:</p>
            <div className="su-sum">
              <div><span>Sādhana School, full year 2026–27</span><b>$1,797</b></div>
              <div><span>Sahṛdaya Upāya apprenticeship</span><b>$1,300</b></div>
            </div>
            <div className="su-refund">
              <b>If you&apos;re not accepted, you&apos;ll receive a full refund.</b>
              <p>Applications are reviewed after the Oct 16 deadline. If we can&apos;t offer you a place, we refund your payment in full, or, if you&apos;d rather stay on in Sādhana School, we refund the $1,300 apprenticeship tuition.</p>
            </div>
            <label className="su-agree">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
              <span>I understand that I&apos;m paying before my application is reviewed, and that I&apos;ll receive a full refund if I&apos;m not accepted.</span>
            </label>
            <a
              className={`btn btn-primary${agree ? '' : ' disabled'}`}
              href={agree ? CHECKOUT : undefined}
              aria-disabled={!agree}
              onClick={e => { if (!agree) e.preventDefault(); }}
            >Continue to checkout →</a>
            <p className="hint">Pay-over-time options are available at checkout.</p>
          </div>
        )}
        <p className="hint" style={{ marginTop: 22 }}>Questions? Write to <a href="mailto:hello@embodiedphilosophy.com">hello@embodiedphilosophy.com</a>.</p>
      </div>
    );
  }

  return (
    <form className="su-form" onSubmit={submit} ref={top}>
      <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        value={form.website || ''} onChange={e => set('website', e.target.value)} />
      <p className="su-form-note"><span className="req">*</span> Required. Your answers are saved in this browser as you go.</p>

      {/* ELIGIBILITY */}
      <div className="su-block">
        <div className="su-block-head"><span className="num">i</span><div><h2>Eligibility</h2><p>Sahṛdaya Upāya is held alongside the full Sādhana School year.</p></div></div>
        <Radios name="enrolled" label="Are you already enrolled in Sādhana School 2026–27?"
          hint="No one can be accepted to the apprenticeship without enrolling in the Sādhana School year. If you haven't yet, you'll enroll in both together after you apply."
          options={opts([['Yes', 'Yes, I’m already enrolled'], ['No', 'Not yet']])} {...p} err={bad('enrolled')} />
        <fieldset className={`su-field${bad('prereqs') ? ' bad' : ''}`}>
          <legend>Please confirm you meet both prerequisites<span className="req" aria-hidden="true"> *</span></legend>
          <p className="hint">If you don&apos;t have five years of yoga teaching experience, describe an equivalent below (therapy, coaching, facilitation, etc.).</p>
          <div className="su-choices">
            {PREREQS.map(v => (
              <label key={v} className={form.prereqs.includes(v) ? 'on' : ''}>
                <input type="checkbox" checked={form.prereqs.includes(v)} onChange={() => togglePrereq(v)} />
                <span>{v}</span>
              </label>
            ))}
          </div>
          <input className="su-other" type="text" placeholder="Other equivalent experience" aria-label="Other equivalent experience"
            value={form.prereqsOther || ''} onChange={e => { set('prereqsOther', e.target.value); setMissing(m => m.filter(x => x !== 'prereqs')); }} />
        </fieldset>
      </div>

      {/* PERSONAL */}
      <div className="su-block">
        <div className="su-block-head"><span className="num">ii</span><div><h2>About you</h2><p>The basics.</p></div></div>
        <div className="su-row">
          <Field name="name" label="Name" required autoComplete="name" {...p} err={bad('name')} />
          <Field name="email" label="Email" type="email" required autoComplete="email" {...p} err={bad('email')} />
        </div>
        <div className="su-row">
          <Field name="phone" label="Phone" type="tel" autoComplete="tel" {...p} />
          <Field name="pronouns" label="Pronouns (optional)" {...p} />
        </div>
        <div className="su-row">
          <Field name="location" label="City & country" required {...p} err={bad('location')} />
          <Field name="timezone" label="Time zone" hint="For scheduling your one-on-ones." required {...p} err={bad('timezone')} />
        </div>
        <Field name="heard" label="How did you find out about this apprenticeship?" required {...p} err={bad('heard')} />
      </div>

      {/* TEACHING */}
      <div className="su-block">
        <div className="su-block-head"><span className="num">iii</span><div><h2>Teaching experience</h2><p>Your past and current teaching.</p></div></div>
        <Field name="teachYears" label="How many years have you been actively teaching yoga?" required {...p} err={bad('teachYears')} />
        <Field name="credentials" label="Which teaching credentials do you hold?" hint="RYT-200, RYT-500, E-RYT, other, none, etc." long required {...p} err={bad('credentials')} />
        <Field name="schools" label="Certifying school(s) / lineage(s)" required {...p} err={bad('schools')} />
        <Field name="teaching" label="Briefly describe your teaching: what you teach, where, and how regularly" long required {...p} err={bad('teaching')} />
      </div>

      {/* MEDITATION */}
      <div className="su-block">
        <div className="su-block-head"><span className="num">iv</span><div><h2>Meditation practice</h2><p>Your practice and experience.</p></div></div>
        <Field name="medYears" label="How many years have you maintained a regular meditation practice?" required {...p} err={bad('medYears')} />
        <Field name="medPractice" label="Describe your meditation practice: tradition(s), technique(s), and how often you currently sit" long required {...p} err={bad('medPractice')} />
        <Field name="dailyPractice" label="Have you had a consistent daily or near-daily practice? For roughly how long?" required {...p} err={bad('dailyPractice')} />
        <Field name="tantra" label="Have you studied non-dual tantra, Kashmir Śaivism, or Pratyabhijñā? Please describe" long required {...p} err={bad('tantra')} />
        <Field name="sanskrit" label="Sanskrit exposure" hint="None / a little / through chanting / can read some / reading fluency. No Sanskrit knowledge is required." required {...p} err={bad('sanskrit')} />
        <Field name="priorCourses" label="Have you taken Sādhana School or other Embodied Philosophy courses before? If so, which ones?" long required {...p} err={bad('priorCourses')} />
      </div>

      {/* WHY */}
      <div className="su-block">
        <div className="su-block-head"><span className="num">v</span><div><h2>Why this? Why now?</h2><p>Your desire to pursue this course of study and training.</p></div></div>
        <Field name="why" label="Why do you want to undertake this apprenticeship, and why now?" long required {...p} err={bad('why')} />
        <Field name="communities" label="What communities do you currently serve? How do you see yourself serving as a teacher in the future?" long required {...p} err={bad('communities')} />
        <Field name="landed" label="Describe a moment when a teaching truly landed, in your own practice or in your teaching. What made it land?" long required {...p} err={bad('landed')} />
        <Field name="positionality" label="Is there anything about your positionality, lineage, or relationship to these traditions you'd like us to know?" long required {...p} err={bad('positionality')} />
      </div>

      {/* COMMITMENTS */}
      <div className="su-block">
        <div className="su-block-head"><span className="num">vi</span><div><h2>Commitments &amp; requirements</h2><p>Over the year, every apprentice is expected to complete:</p></div></div>
        <ul className="su-reqs">
          <li>A daily Sahṛdaya Meditation practice</li>
          <li>A written reflection posted in the community group each month</li>
          <li>A monthly 45-minute one-on-one with Jacob (booking opens after the October orientation)</li>
          <li>Attendance at the monthly live immersion weekends</li>
          <li>A final teaching project: a 60-minute live online teaching, offered freely to the Sādhana School and EP community</li>
          <li>A final written report</li>
        </ul>
        <p className="su-small">An in-person summer practicum is offered as an optional capstone at the Sahṛdaya Sādhana Summer Retreat, July 10–16, 2027.</p>
        <Radios name="attendLive" required label="Can you attend the live immersions?"
          hint="One weekend a month: 11/14, 12/5, 2/6, 2/20, 3/13, 4/10, 5/8 and 5/29, plus the summer retreat (July 10–16) with the final practicum and presentations."
          options={opts(['Yes', 'Mostly'])} {...p} err={bad('attendLive')} />
        <Field name="unavailable" label="If you can't attend every weekend workshop and practicum, which dates are you unavailable?" {...p} />
        <Radios name="summer" required label="The summer practicum is offered in person during the retreat. Do you expect to attend?"
          options={opts(['Yes', 'Maybe', 'Unlikely'])} {...p} err={bad('summer')} />
        <Radios name="commitments" required label="Are you able to meet all of the commitments described above?"
          options={opts(['Yes', 'Yes, with some scheduling conflicts', 'Not Sure'])} {...p} err={bad('commitments')} />
      </div>

      {/* TUITION */}
      <div className="su-block">
        <div className="su-block-head"><span className="num">vii</span><div><h2>Tuition</h2><p>$1,300 for the apprenticeship, on top of the $1,797 Sādhana School year.</p></div></div>
        <p className="su-small">Includes nine monthly 45-minute one-on-ones with Jacob, eight small-group practicum and coaching sessions, feedback on your presentations, and a private Mentorship space for ongoing conversation.</p>
        <Radios name="payment" required label="How would you prefer to arrange payment?"
          options={opts([['Pay in Full'], ['Payment Plan', 'Pay over time'], [WORK_STUDY, 'I’m interested in a Work Study arrangement']])} {...p} err={bad('payment')} />

        {workStudy && (
          <div className="su-ws">
            <p><b>Please read.</b> Based on financial need and relevant work experience, a limited number of students may be considered for Work Study with Embodied Philosophy. Anyone accepted is expected to show an ongoing commitment to the agreement and carry out agreed tasks with minimal oversight. Because the cohort is capped at twelve, and hosting the program takes real time and resources, applicants paying full tuition or on a payment plan are prioritized, so applying for Work Study may lower your chances of acceptance.</p>
            <Field name="wsWhy" label="Why are you applying for Work Study?" hint="You don't need to share sensitive information." long {...p} />
            <Field name="wsSkills" label="What administrative, project-management or other relevant work experience would you offer?" long {...p} />
            <label className="su-agree">
              <input type="checkbox" checked={form.wsAck1 === 'Yes'} onChange={e => set('wsAck1', e.target.checked ? 'Yes' : '')} />
              <span>I understand that Work Study opportunities are limited, and that the financial limitations of EP and Sādhana School may not guarantee me an apprenticeship.</span>
            </label>
            <label className="su-agree">
              <input type="checkbox" checked={form.wsAck2 === 'Yes'} onChange={e => set('wsAck2', e.target.checked ? 'Yes' : '')} />
              <span>I understand that, should I be offered Work Study and my schedule or personal life become an obstacle to the arrangement, I may be removed from the apprenticeship.</span>
            </label>
          </div>
        )}
      </div>

      {/* ANYTHING ELSE */}
      <div className="su-block">
        <div className="su-block-head"><span className="num">viii</span><div><h2>Anything else?</h2></div></div>
        <Field name="anythingElse" label="Is there anything else you'd like us to know that's relevant to your application?" long {...p} />
      </div>

      {error && <p className="su-err" role="alert">{error}</p>}
      <div className="su-submit">
        <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Submit application'}
        </button>
        <p className="hint">Next, you&apos;ll see how to complete your enrollment. If you&apos;re not accepted, you receive a full refund.</p>
      </div>
    </form>
  );
}
