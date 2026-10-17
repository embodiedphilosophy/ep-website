import { notFound } from 'next/navigation';
import programmes from '@/data/programmes.json';

// The lock screen for a programme the member is not in (docs/circle-navigation.md). Only staff-written text from
// data/programmes.json: nothing is read from a private space, and there are no prices here.
export const generateStaticParams = () => programmes.map(p => ({ slug: p.slug }));
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = programmes.find(x => x.slug === slug);
  return { title: p ? `${p.title} · Embodied Philosophy` : 'Embodied Philosophy' };
}

export default async function Preview({ params }) {
  const { slug } = await params;
  const p = programmes.find(x => x.slug === slug);
  if (!p) notFound();
  return (
    <article className="prog" style={{ '--prog': p.color }}>
      <p className="sch-eyebrow">Preview · {p.locked_note}</p>
      <h1>{p.title}</h1>
      <p className="prog-lede">{p.description}</p>
      <h2 className="sch-sub">What’s included</h2>
      <ul className="prog-list">{p.included.map(i => <li key={i}>{i}</li>)}</ul>
      {p.plus_note && <p className="prog-plus">{p.plus_note}</p>}
      <figure className="prog-sample">
        <blockquote>{p.sample.text}</blockquote>
        <figcaption>{p.sample.from}</figcaption>
      </figure>
      <a className="sch-btn" href={p.cta_url} target="_top">{p.cta_label}</a>
    </article>
  );
}
