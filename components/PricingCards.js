'use client';
import { useState } from 'react';

// Three plans. Pass and Wisdom School each toggle Monthly ↔ Annual inside one card.
// Every card lists every feature; the ones a plan doesn't include are struck through.
const FEATURES = [
  'A live Meditation Monday session',
  'Every Meditation Monday, every week',
  'Replays of Meditation Mondays',
  'Free first week',
  'Monthly lectures on the traditions and texts',
  'Workshops and quarterly seminars',
  '1,000+ hours of on-demand courses',
  'The Wisdom School member community',
];
const INCLUDES = {
  dropin: [0],
  pass: [0, 1, 2, 3],
  wisdom: [0, 1, 2, 3, 4, 5, 6, 7],
};
const num = p => Number(String(p || '').replace(/[^0-9.]/g, '')) || 0;

function Toggle({ value, onChange }) {
  return (
    <div className="toggle" role="group" aria-label="Billing period">
      {['monthly', 'annual'].map(v => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{v === 'monthly' ? 'Monthly' : 'Annual'}</button>
      ))}
    </div>
  );
}

function Features({ plan }) {
  return (
    <ul className="feat">
      {FEATURES.map((f, i) => {
        const on = INCLUDES[plan].includes(i);
        return <li key={f} className={on ? 'on' : 'off'}><span aria-hidden="true">{on ? '✓' : '—'}</span>{on ? f : <s>{f}</s>}<span className="sr">{on ? ' (included)' : ' (not included)'}</span></li>;
      })}
    </ul>
  );
}

function Savings({ monthly, annual }) {
  const m = num(monthly), a = num(annual);
  if (!m || !a || a >= m * 12) return null;
  const save = m * 12 - a;
  return <div className="save">Save ${save.toFixed(2)} a year ({Math.round((save / (m * 12)) * 100)}% off)</div>;
}

export default function PricingCards({ prices, links }) {
  const [pass, setPass] = useState('monthly');
  const [ws, setWs] = useState('annual');
  const wsHasMonthly = !!prices.wisdomMonthly;
  return (
    <div className="pricing">
      <article className="plan">
        <h3>Single Drop-In</h3>
        <div className="amt">{prices.dropin}<span> one session</span></div>
        <p className="plan-sub">Join the next live Meditation Monday. Your personal Zoom link arrives by email.</p>
        <a className="btn btn-ghost" href={links.dropinMeditation || links.meditationMonthly}>Drop in this Monday</a>
        <Features plan="dropin" />
      </article>

      <article className="plan featured">
        <span className="badge-top">Most popular</span>
        <h3>Meditation Pass</h3>
        <Toggle value={pass} onChange={setPass} />
        {pass === 'monthly'
          ? <div className="amt">{prices.meditationMonthly}<span> / month</span></div>
          : <div className="amt">{prices.meditationYearly}<span> / year</span></div>}
        {pass === 'annual' ? <Savings monthly={prices.meditationMonthly} annual={prices.meditationYearly} /> : <div className="save">Start with a free week</div>}
        <p className="plan-sub">Every Meditation Monday, live, plus replays of every session.</p>
        <a className="btn btn-primary" href={pass === 'monthly' ? links.meditationMonthly : links.meditationYearly}>Start your free week</a>
        <Features plan="pass" />
      </article>

      <article className="plan">
        <h3>Wisdom School</h3>
        {wsHasMonthly && <Toggle value={ws} onChange={setWs} />}
        {wsHasMonthly && ws === 'monthly'
          ? <div className="amt">{prices.wisdomMonthly}<span> / month</span></div>
          : <div className="amt">{prices.wisdomYear}<span> / year</span></div>}
        {wsHasMonthly && ws === 'annual' ? <Savings monthly={prices.wisdomMonthly} annual={prices.wisdomYear} /> : <div className="save">&nbsp;</div>}
        <p className="plan-sub">Everything in the Pass, plus lectures, workshops and the full library.</p>
        <a className="btn btn-ghost" href={wsHasMonthly && ws === 'monthly' ? (links.wisdomMonthly || links.wisdomJoin) : links.wisdomJoin}>Join Wisdom School</a>
        <Features plan="wisdom" />
      </article>
    </div>
  );
}
