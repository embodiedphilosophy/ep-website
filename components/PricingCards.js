'use client';
import { useState } from 'react';

// Drop-in · Meditation Pass · Wisdom School (with a Wisdom School / Plus switch).
// Billing toggles default to Annual. Every card lists every feature; what a plan lacks is struck through.
const features = hours => [
  'A live Meditation Monday session',
  'Every Meditation Monday, every week',
  'Replays of Meditation Mondays',
  'Free first week',
  'Monthly lectures and seasonal workshops',
  'This year’s programming, on demand',
  'A starter learning pathway',
  `All learning pathways (${hours} hours)`,
  'Certificate programs',
  'CE certificates for yoga teachers',
];
const INCLUDES = { dropin: [0], pass: [0, 1, 2, 3], ws: [0, 1, 2, 4, 5, 6], plus: [0, 1, 2, 4, 5, 6, 7, 8, 9] };
const num = p => Number(String(p || '').replace(/[^0-9.]/g, '')) || 0;

function Toggle({ value, onChange, options, label }) {
  return (
    <div className="toggle" role="group" aria-label={label}>
      {options.map(([v, t]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{t}</button>)}
    </div>
  );
}
const PERIOD = [['monthly', 'Monthly'], ['annual', 'Annual']];

function Features({ plan, hours }) {
  return (
    <ul className="feat">
      {features(hours).map((f, i) => {
        const on = INCLUDES[plan].includes(i);
        return <li key={f} className={on ? 'on' : 'off'}><span aria-hidden="true">{on ? '✓' : '—'}</span>{on ? f : <s>{f}</s>}<span className="sr">{on ? ' (included)' : ' (not included)'}</span></li>;
      })}
    </ul>
  );
}
function Savings({ monthly, annual }) {
  const m = num(monthly), a = num(annual);
  if (!m || !a || a >= m * 12) return <div className="save">&nbsp;</div>;
  const save = m * 12 - a;
  return <div className="save">Save ${save.toFixed(2)} a year ({Math.round((save / (m * 12)) * 100)}% off)</div>;
}

export function WisdomCard({ prices, links, hours, defaultTier = 'ws', featured = false }) {
  const [tier, setTier] = useState(defaultTier);
  const [period, setPeriod] = useState('annual');
  const plus = tier === 'plus';
  const yearP = plus ? prices.wisdomPlusYear : prices.wisdomYear;
  const monthP = plus ? prices.wisdomPlusMonthly : prices.wisdomMonthly;
  const hasMonthly = !!monthP;
  const p = hasMonthly ? period : 'annual';
  const href = plus
    ? (p === 'monthly' ? links.wisdomPlusMonthly : links.wisdomPlusJoin) || links.wisdomJoin
    : (p === 'monthly' ? links.wisdomMonthly : links.wisdomJoin) || links.wisdomJoin;
  return (
    <article className={`plan${featured ? ' featured' : ''}`}>
      {featured && <span className="badge-top">For serious students</span>}
      <h3>Wisdom School</h3>
      <Toggle value={tier} onChange={setTier} options={[['ws', 'Wisdom School'], ['plus', 'Plus']]} label="Membership level" />
      {hasMonthly && <Toggle value={period} onChange={setPeriod} options={PERIOD} label="Billing period" />}
      {p === 'monthly'
        ? <div className="amt">{monthP}<span> / month</span></div>
        : <div className="amt">{yearP}<span> / year</span></div>}
      {p === 'annual' ? <Savings monthly={monthP} annual={yearP} /> : <div className="save">Switch to annual any time</div>}
      <p className="plan-sub">{plus
        ? 'Everything in Wisdom School, plus the archive of every learning pathway, our certificate programs and CE certificates.'
        : 'The live rhythm of the year: weekly meditations, monthly lectures, workshops and this year’s recordings.'}</p>
      <a className="btn btn-primary" href={href}>Join Wisdom School{plus ? ' Plus' : ''}</a>
      <Features plan={plus ? 'plus' : 'ws'} hours={hours} />
    </article>
  );
}

export default function PricingCards({ prices, links, hours = '650+' }) {
  const [pass, setPass] = useState('annual');
  return (
    <div className="pricing">
      <article className="plan">
        <h3>Single Drop-In</h3>
        <div className="amt">{prices.dropin}<span> one session</span></div>
        <p className="plan-sub">Join the next live Meditation Monday. Your personal Zoom link arrives by email.</p>
        <a className="btn btn-ghost" href={links.dropinMeditation || links.meditationMonthly}>Drop in this Monday</a>
        <Features plan="dropin" hours={hours} />
      </article>

      <article className="plan featured">
        <span className="badge-top">Most popular</span>
        <h3>Meditation Pass</h3>
        <Toggle value={pass} onChange={setPass} options={PERIOD} label="Billing period" />
        {pass === 'monthly'
          ? <div className="amt">{prices.meditationMonthly}<span> / month</span></div>
          : <div className="amt">{prices.meditationYearly}<span> / year</span></div>}
        {pass === 'annual' ? <Savings monthly={prices.meditationMonthly} annual={prices.meditationYearly} /> : <div className="save">Start with a free week</div>}
        <p className="plan-sub">Every Meditation Monday, live, plus replays of every session.</p>
        <a className="btn btn-primary" href={pass === 'monthly' ? links.meditationMonthly : links.meditationYearly}>{pass === 'monthly' ? 'Start your free week' : 'Join for the year'}</a>
        <Features plan="pass" hours={hours} />
      </article>

      <WisdomCard prices={prices} links={links} hours={hours} />
    </div>
  );
}
