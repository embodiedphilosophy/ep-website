// The next social posts, read-only (edits happen in the EP Social Preview dashboard)
export const SOCIAL_PREVIEW_URL = process.env.OPS_SOCIAL_PREVIEW_URL
  || 'https://script.google.com/a/macros/embodiedphilosophy.com/s/AKfycbwnxnP24WZq9iLSgh-mi6J8qFaLTszXyzvzusoqX7vXPn7Q6bWdEN3nOiCdClUjY4p-iw/exec';
const shortDate = s => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const shortTime = t => {
  const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  const h = +m[1], ap = h >= 12 ? 'pm' : 'am', h12 = h % 12 || 12;
  return `${h12}${m[2] === '00' ? '' : ':' + m[2]}${ap} ET`;
};
export const flagOf = p => !p.thumb ? 'No image yet' : p.review !== 'Kept' ? 'Image not reviewed' : '';

export default function SocialGrid({ social }) {
  if (social.error) return <p className="ops-empty">Couldn’t load the social plan: {social.error}</p>;
  if (!social.posts.length) return <p className="ops-empty">No posts scheduled yet.</p>;
  return (
    <ul className="ops-social-grid">
      {social.posts.map(p => {
        const story = /story/i.test(p.platforms) && !/feed/i.test(p.platforms);
        const flag = flagOf(p);
        return (
          <li key={p.id}>
            <a href={SOCIAL_PREVIEW_URL} target="_blank" rel="noopener" title={(p.caption || p.event || '').slice(0, 220)}>
              <span className="img">
                {p.thumb ? <img src={p.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="none">No image</span>}
                <span className="tag">{story ? 'Story' : 'Feed'}</span>
              </span>
              <span className="when">{shortDate(p.date)} · {shortTime(p.time)}</span>
              <span className={`meta${flag ? ' flag' : ''}`}>{[p.status, flag].filter(Boolean).join(' · ')}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
