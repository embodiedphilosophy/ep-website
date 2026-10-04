import Collage from './Collage';
export default function PageHero({ eyebrow, title, lede, img, ground = 'navy', ring, children }) {
  return (
    <section className="hero page-hero">
      <div className="wrap hero-inner">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {lede && <p className="sub">{lede}</p>}
          {children}
        </div>
        <div className="hero-aside"><Collage img={img} ground={ground} ring={ring} className="hero-collage" /></div>
      </div>
    </section>
  );
}
