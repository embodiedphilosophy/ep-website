'use client';
import { useState } from 'react';

// The three enrol cards: pay in full, payment plan, or join Wisdom School (Monthly/Annual toggle).
// Links and Wisdom School prices come from the site config (Site Links & Prices sheet), passed in by page.js.
const num = p => Number(String(p || '').replace(/[^0-9.]/g, '')) || 0;

export default function Plans({ full, plan, wisdom }) {
  const [period, setPeriod] = useState('annual');
  const monthly = period === 'monthly';
  const m = num(wisdom.monthlyPrice), a = num(wisdom.yearPrice);
  const save = m && a && a < m * 12 ? m * 12 - a : 0;
  return (
    <div className="cm-plans">
      <article className="plan">
        <h3>Pay in full</h3>
        <div className="amt">{full.price}</div>
        <div className="save">One payment</div>
        <p className="plan-sub">The full course: four live sessions with Mary and Floss, and recordings of every session.</p>
        <a className="btn btn-primary" href={full.href}>Enroll — {full.price}</a>
      </article>

      <article className="plan featured">
        <span className="badge-top">Payment plan</span>
        <h3>Pay as you go</h3>
        <div className="amt">{plan.down}<span> today</span></div>
        <div className="save">then {plan.count} weekly payments of {plan.weekly}</div>
        <p className="plan-sub">The same course, spread across the weeks it runs. {plan.total} in total.</p>
        <a className="btn btn-primary" href={plan.href}>Start with {plan.down}</a>
      </article>

      <article className="plan">
        <span className="badge-top">Best value</span>
        <h3>Join Wisdom School</h3>
        <div className="toggle" role="group" aria-label="Billing period">
          {[['monthly', 'Monthly'], ['annual', 'Annual']].map(([v, t]) => (
            <button key={v} type="button" aria-pressed={period === v} onClick={() => setPeriod(v)}>{t}</button>
          ))}
        </div>
        {monthly
          ? <div className="amt">{wisdom.monthlyPrice}<span> / month</span></div>
          : <div className="amt">{wisdom.yearPrice}<span> / year</span></div>}
        <div className="save">{monthly ? 'Cancel any time' : save ? `Save $${save.toFixed(0)} a year` : ' '}</div>
        <p className="plan-sub">Christian Mysticism is included, along with monthly lectures and seasonal workshops, this year’s programming on demand, and every Meditation Monday.</p>
        <a className="btn btn-primary" href={monthly ? wisdom.monthlyHref : wisdom.yearHref}>Join Wisdom School</a>
      </article>
    </div>
  );
}
