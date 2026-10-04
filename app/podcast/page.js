import PageHero from '@/components/PageHero';
import { getEpisodes } from '@/lib/podcast';
import { site } from '@/lib/site';
export const revalidate = 3600;
export const metadata = { title: 'Chitheads Podcast — Embodied Philosophy' };
export default async function Podcast() {
  const episodes = await getEpisodes(300);
  const p = site.links.podcast;
  return (
    <>
      <PageHero eyebrow="The Podcast" title="Chitheads" img="parrot" ground="black"
        lede="Long-form conversations at the edge of the contemplative life, with the teachers, scholars and practitioners shaping how we understand these traditions.">
        <div className="subs dark-subs">
          <a href={p.spotify}>Spotify</a><a href={p.apple}>Apple Podcasts</a><a href={p.youtube}>YouTube</a><a href={p.rss}>RSS</a>
        </div>
      </PageHero>
      <section className="sec"><div className="wrap">
        <div className="ep-archive">
          {episodes.map(ep => (
            <a className="ep-row" href={ep.url} key={ep.url + ep.title}>
              {ep.image ? <img src={ep.image} alt="" width="72" height="72" loading="lazy" /> : <span className="ep-ph" />}
              <div>
                <div className="ep-t">{ep.num && <span className="ep-n">Ep. {ep.num}</span>}{ep.title}</div>
                <div className="ep-m">{[ep.guest, ep.duration].filter(Boolean).join(' · ')}</div>
              </div>
            </a>
          ))}
        </div>
      </div></section>
    </>
  );
}
