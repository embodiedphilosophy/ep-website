// Collage panel in the Practice Report style: riso-grain ground, hand-drawn ring, Kalighat cutout.
const RING = 'M21 4.5C31 4 37 12 35.5 21.5C34 31 26 36.5 17.5 35.5C8.5 34.5 3.5 26.5 5 17.5C6 11.5 10.5 6.5 16.5 5';

export default function Collage({ img, ground = 'navy', ring = '#EBA329', ringPos = 'tr', alt = '', className = '' }) {
  return (
    <div className={`collage grain-${ground} ${className}`}>
      <svg className={`ring ring-${ringPos}`} viewBox="0 0 40 40" aria-hidden="true">
        <path d={RING} fill="none" stroke={ring} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <img className="cut" src={`/kalighat/${img}.webp`} alt={alt} />
    </div>
  );
}
