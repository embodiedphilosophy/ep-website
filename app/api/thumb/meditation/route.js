import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { lookFor, longDate } from '@/lib/hub/mm-thumb';

export const runtime = 'nodejs';

// A 1280×720 Meditation Mondays thumbnail: /api/thumb/meditation?stream=Metta&teacher=Oneika%20Mays&date=2026-11-09
// Used by the hub's replay cards and as each replay's Vimeo picture. Reads only its own files; sends nothing anywhere.
const W = 1280, H = 720;
const RING = 'M21 4.5C31 4 37 12 35.5 21.5C34 31 26 36.5 17.5 35.5C8.5 34.5 3.5 26.5 5 17.5C6 11.5 10.5 6.5 16.5 5';
const root = process.cwd();
const file = (...p) => readFile(path.join(root, ...p));
const cache = new Map();
const once = (k, f) => { if (!cache.has(k)) cache.set(k, f().catch(e => { cache.delete(k); throw e; })); return cache.get(k); };
const dataUri = buf => `data:image/png;base64,${buf.toString('base64')}`;
const clip = (s, n) => { s = String(s || '').trim().slice(0, 200); return s.length > n ? `${s.slice(0, n - 1).trim()}…` : s; };

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const stream = clip(q.get('stream'), 28), teacher = clip(q.get('teacher'), 40), when = longDate(q.get('date'));
  const look = lookFor(stream);
  const [serif, serifItalic, sans, art, mark] = await Promise.all([
    once('f1', () => file('lib/ce/fonts/Cormorant-SemiBold.ttf')),
    once('f2', () => file('lib/ce/fonts/Cormorant-MediumItalic.ttf')),
    once('f3', () => file('lib/ce/fonts/Inter-SemiBold.ttf')),
    once(`a-${look.art}`, () => file('lib/hub/thumb-art', `${look.art}.png`)),
    once('mark', () => file('lib/hub/thumb-art/ep-wordmark-white.png')),
  ]);
  const title = stream || 'Meditation Mondays';
  const big = title.length > 14 ? 96 : 128;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: look.ground, color: '#F6EEDF', fontFamily: 'Inter',
        backgroundImage: 'radial-gradient(rgba(0,0,0,.30) 1.2px, transparent 1.8px), radial-gradient(rgba(255,240,220,.10) 1px, transparent 1.6px)',
        backgroundSize: '9px 9px, 13px 13px', backgroundPosition: '0 0, 4px 6px' }}>
        {/* hand-drawn ring behind the cutout */}
        <svg width="560" height="560" viewBox="0 0 40 40" style={{ position: 'absolute', right: 70, top: 70 }}>
          <path d={RING} fill="none" stroke={look.ring} strokeWidth="1.1" strokeLinecap="round" />
        </svg>
        <img src={dataUri(art)} height={640} style={{ position: 'absolute', right: 90, bottom: 0, height: 640 }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 0 60px 76px', width: 720, height: H }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 5, color: look.ring, textTransform: 'uppercase' }}>Meditation Mondays · Replay</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontFamily: 'Cormorant', fontSize: big, lineHeight: 1, letterSpacing: -1 }}>{title}</div>
            {teacher && <div style={{ display: 'flex', fontFamily: 'CormorantItalic', fontSize: 52, marginTop: 14 }}>{`with ${teacher}`}</div>}
            <div style={{ display: 'flex', width: 88, height: 3, backgroundColor: look.ring, marginTop: 34, marginBottom: 26 }} />
            {when && <div style={{ display: 'flex', fontSize: 28, opacity: 0.92 }}>{when}</div>}
          </div>
          <img src={dataUri(mark)} width={196} height={48} style={{ width: 196, height: 48 }} />
        </div>
      </div>
    ),
    {
      width: W, height: H,
      fonts: [
        { name: 'Cormorant', data: serif, weight: 600, style: 'normal' },
        { name: 'CormorantItalic', data: serifItalic, weight: 500, style: 'italic' },
        { name: 'Inter', data: sans, weight: 600, style: 'normal' },
      ],
      // The address carries everything that changes the picture (and a version), so it can be kept for a year
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  );
}
