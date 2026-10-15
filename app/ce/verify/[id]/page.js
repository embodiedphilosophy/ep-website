import PageHero from '@/components/PageHero';
import { CERT_ID, longDate } from '@/lib/ce/rules';
import { getCert } from '@/lib/ce/store';
import { ceAvailable as ceReady } from '@/lib/ce/store';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Verify a certificate — Embodied Philosophy', robots: { index: false, follow: false } };

// Public check that a CE certificate is genuine: anyone with the id (it's printed on the certificate) can confirm
// the name, pathway, hours, category and date. Reflections and email addresses are never shown.
export default async function Verify({ params }) {
  const { id } = await params;
  const cert = CERT_ID.test(id || '') && ceReady() ? await getCert(id).catch(() => null) : null;
  const ok = cert && cert.status === 'issued';
  const row = (k, v) => (<div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--line, #D8C9AE)' }}><span>{k}</span><b style={{ textAlign: 'right' }}>{v}</b></div>);
  return (
    <>
      <PageHero eyebrow="Certificate check" title={ok ? 'This certificate is genuine' : 'We couldn’t confirm this certificate'} img="lady-kohl" ground="slate"
        lede={ok ? 'Issued by Embodied Philosophy, a Yoga Alliance Continuing Education Provider (YACEP).'
          : cert && cert.status === 'revoked' ? 'This certificate has been withdrawn.'
          : 'Check the certificate number and try again, or write to us and we’ll help.'} />
      <section className="sec"><div className="wrap prose" style={{ maxWidth: 640 }}>
        {ok ? (<div>
          {row('Certificate', cert.id)}
          {row('Name', cert.name)}
          {row('Learning Pathway', cert.title)}
          {row('CE hours', String(cert.hours))}
          {row('Educational category', cert.category)}
          {row('Completed', longDate(cert.issued_at))}
          {row('Format', 'Online, self-paced')}
        </div>) : (<p><a className="btn btn-primary" href="/contact">Contact us</a></p>)}
      </div></section>
    </>
  );
}
