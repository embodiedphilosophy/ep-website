// The panel's icons, drawn in SVG. They return markup strings (set with dangerouslySetInnerHTML; nothing user-supplied goes in).
import { RAD } from '../../../lib/panchanga/engine.js';

// The lit part of the Moon as an SVG path: elong = degrees ahead of the Sun (0 new, 180 full)
export function moonPath(elong, cx, cy, r) {
  const k = Math.abs(Math.cos(elong * RAD)) * r;
  const waxing = elong < 180;
  const crescent = elong < 90 || elong > 270;
  const s1 = waxing ? 1 : 0;
  const s2 = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
  return `M${cx},${cy - r} A${r},${r} 0 0 ${s1} ${cx},${cy + r} A${k},${r} 0 0 ${s2} ${cx},${cy - r} Z`;
}
const svg = inner => `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

// Tithi: a ring of 15 dots, filled up to the day of the fortnight
export function iconTithi(dayInFortnight) {
  let s = '';
  for (let i = 0; i < 15; i++) {
    const a = (i / 15) * 2 * Math.PI - Math.PI / 2, x = 20 + 15 * Math.cos(a), y = 20 + 15 * Math.sin(a);
    s += i < dayInFortnight ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.3" fill="currentColor" stroke="none"/>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6"/>`;
  }
  return svg(s);
}
// Vāra: a sun for Sunday, a crescent for Monday, an orbit with a planet for the other days
export function iconVara(wd) {
  if (wd === 0) {
    let rays = '';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; rays += `<line x1="${(20 + 11 * Math.cos(a)).toFixed(1)}" y1="${(20 + 11 * Math.sin(a)).toFixed(1)}" x2="${(20 + 16 * Math.cos(a)).toFixed(1)}" y2="${(20 + 16 * Math.sin(a)).toFixed(1)}"/>`; }
    return svg(`<circle cx="20" cy="20" r="7"/>${rays}`);
  }
  if (wd === 1) return svg(`<path d="${moonPath(60, 20, 20, 14)}" fill="currentColor" stroke="none"/><circle cx="20" cy="20" r="14"/>`);
  const a = (wd * 51.4 - 90) * RAD, x = 20 + 15 * Math.cos(a), y = 20 + 15 * Math.sin(a);
  return svg(`<circle cx="20" cy="20" r="15" stroke-dasharray="2 3"/><circle cx="20" cy="20" r="3.5"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="currentColor" stroke="none"/>`);
}
// Nakṣatra: an asterism
export const iconNak = () => svg(`<polyline points="7,28 15,18 24,22 33,10"/><circle cx="7" cy="28" r="2.4" fill="currentColor"/><circle cx="15" cy="18" r="2.4" fill="currentColor"/><circle cx="24" cy="22" r="2.4" fill="currentColor"/><circle cx="33" cy="10" r="3.2" fill="currentColor"/>`);
// Yoga: two overlapping circles
export const iconYoga = () => svg(`<circle cx="15" cy="20" r="10"/><circle cx="25" cy="20" r="10"/><path d="M20,11.3 A10,10 0 0 1 20,28.7 A10,10 0 0 1 20,11.3Z" fill="currentColor" stroke="none"/>`);
// Karaṇa: a half-filled circle
export const iconKarana = () => svg(`<circle cx="20" cy="20" r="14"/><path d="M20,6 A14,14 0 0 0 20,34 Z" fill="currentColor" stroke="none"/>`);
