'use client';
import Countdown from './Countdown';

// Phone-only bottom bar: the next deadline and a way back to the offers.
export default function MobileBar({ label, target, initialMs }) {
  return (
    <div className="cm-mbar">
      <div><span>{label}</span><Countdown target={target} initialMs={initialMs} label={`${label}`} /></div>
      <a href="#offers" className="cm-btn">See offers</a>
    </div>
  );
}
