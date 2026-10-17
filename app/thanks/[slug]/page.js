import { notFound } from 'next/navigation';
import { THANKS } from '@/lib/meta/thanks';
import LeadPing from './LeadPing';

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(THANKS).map(slug => ({ slug }));
}
export async function generateMetadata({ params }) {
  const p = THANKS[(await params).slug];
  return { title: p ? `${p.title} — Embodied Philosophy` : 'Thank you — Embodied Philosophy', robots: { index: false, follow: false } };
}

export default async function Thanks({ params }) {
  const { slug } = await params;
  const p = THANKS[slug];
  if (!p) notFound();
  return (
    <section className="sec"><div className="wrap" style={{ maxWidth: 680, textAlign: 'center' }}>
      <LeadPing slug={slug} contentName={p.contentName} />
      <img src={p.image} alt={p.imageAlt} style={{ width: 'min(220px, 55%)', height: 'auto', margin: '0 auto 24px', display: 'block' }} />
      <span className="eyebrow">Thank you</span>
      <h1 style={{ margin: '10px 0 16px' }}>{p.title}</h1>
      <p style={{ fontSize: 18 }}>{p.deliver}</p>
      <p style={{ color: 'var(--ink-soft)' }}>Not there? Check your Promotions or Spam folder, and drag the email to your inbox so the rest of the series reaches you.</p>
      <div style={{ marginTop: 40, padding: '28px 24px', background: 'var(--sand)', textAlign: 'left' }}>
        <span className="eyebrow">{p.next.eyebrow}</span>
        <p style={{ margin: '10px 0 18px' }}>{p.next.text}</p>
        <a className="btn btn-primary" href={p.next.href}>{p.next.label}</a>
      </div>
    </div></section>
  );
}
