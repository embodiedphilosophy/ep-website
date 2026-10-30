'use client';
import { useState } from 'react';
import CtaLink from './CtaLink';

// The "one certificate" card: pick one of the titles, then go to that certificate's Cyber checkout.
export default function ChoiceCard({ titles, checkout, hours = {}, state }) {
  const [pick, setPick] = useState(titles[0]);
  return (
    <>
      <fieldset className="cm-radios">
        <legend>Choose one</legend>
        {titles.map(t => (
          <label key={t}>
            <input type="radio" name="cert" value={t} checked={pick === t} onChange={() => setPick(t)} />
            <span>{t}</span>
            {hours[t] ? <em>{hours[t]}</em> : null}
          </label>
        ))}
      </fieldset>
      <CtaLink href={checkout[pick]} className="cm-btn cm-btn-ghost cm-push" tier="certificate" item={pick} state={state}>Choose a certificate</CtaLink>
    </>
  );
}
