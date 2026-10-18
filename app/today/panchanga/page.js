import Panchanga from './Panchanga';
import './panchanga.css';

export const metadata = {
  title: 'Today’s Pañcāṅga · Embodied Philosophy',
  description: 'The day’s five limbs, worked out for where you are.',
  robots: { index: false, follow: false },
};

// "Today's Pañcāṅga": a small panel for the online school (framed inside Circle, see next.config.mjs) and, later, the
// practice app. Nothing is worked out here: the answer depends on each viewer's place and day, so the page is the same
// for everyone and the browser does the calculating (Panchanga.js; maths in lib/panchanga/engine.js).
export default function Page() {
  return <Panchanga />;
}
