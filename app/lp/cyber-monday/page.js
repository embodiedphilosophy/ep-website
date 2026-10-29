import './cyber-monday.css';
import { cookies } from 'next/headers';
import { getCatalog } from '@/lib/catalog';
import Art from './Art';
import AccessCookie from './AccessCookie';
import ChoiceCard from './ChoiceCard';
import Countdown from './Countdown';
import CtaLink, { isUrl } from './CtaLink';
import KitForm from '@/components/KitForm';
import MobileBar from './MobileBar';
import PwycModal from './PwycModal';
import { readRequest, remaining } from './state';
import { dates, campaign, pwyc, featuredCourses, libraryExcludeTopics, certificates, archive, pullQuote, testimonials, copy, faqs, endedLinks } from './cyber-2026';

// Time-driven page: the state is worked out on the server from the clock (see state.js), so no wrong state flashes.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: campaign.title,
  description: campaign.description,
  alternates: { canonical: campaign.path },
  openGraph: { title: campaign.title, description: campaign.description, url: campaign.path, type: 'website' },
  twitter: { card: 'summary_large_image', title: campaign.title, description: campaign.description },
};

const KIT_LETTER = process.env.NEXT_PUBLIC_KIT_FORM_LETTER;
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// A TODO left in the data file shows as nothing (or just the part that is known), never as the word TODO.
const clean = s => (/^TODO\b/i.test(String(s || '').trim()) ? '' : String(s || '').trim());
const stripTodo = s => String(s || '').replace(/^TODO\b[:\s]*/i, '').trim();
const money = n => `$${n}`;
const Head = ({ parts }) => <>{parts[0]}<em>{parts[1]}</em></>;

function findOffering(catalog, f) {
  const id = String(f.courseId).toLowerCase();
  const bare = id.replace(/^todo-/, '');
  const t = norm(f.title);
  return catalog.find(o => o.id === id) || catalog.find(o => o.id === bare) || catalog.find(o => norm(o.title) === t) || catalog.find(o => norm(o.title).includes(t) || t.includes(norm(o.title)));
}
const firstSentence = s => { const t = (String(s || '').match(/^.*?[.!?](\s|$)/) || [String(s || '')])[0].trim(); return t.length > 150 ? t.slice(0, 147).replace(/\s+\S*$/, '') + '…' : t; };

const Tick = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default async function CyberMonday({ searchParams }) {
  const params = await searchParams;
  const jar = await cookies();
  const { state, now, member } = readRequest(params || {}, jar);
  const pre = state === 'prelaunch';
  const ended = state === 'libraryOnly' || state === 'evergreen';
  const showTop = ['early', 'live', 'libraryOnly'].includes(state);
  const early = state === 'early';

  let catalog = [];
  if (!pre) { try { catalog = await getCatalog(); } catch (e) { console.error('cyber-monday: catalog read failed', e.message); } }
  const featured = featuredCourses.map(f => ({ f, o: findOffering(catalog, f) }));
  const featuredIds = new Set(featured.map(x => x.o?.id).filter(Boolean));
  const rest = catalog.filter(o => o.access === 'pwyc' && !featuredIds.has(o.id) && !o.topics.some(t => libraryExcludeTopics.includes(t)));

  // deadlines
  const dl = early ? { label: 'Public launch Mon, Nov 30', target: dates.publicLaunch }
    : state === 'libraryOnly' ? { label: 'Open Library closes Sun, Dec 6', target: dates.openLibraryClose }
    : { label: 'Certificates & Archive end Wed, Dec 2', target: dates.plusAndArchiveClose };
  const left = t => remaining(t, now).ms;
  const topText = early ? copy.topBar.early : state === 'libraryOnly' ? copy.topBar.libraryOnly : copy.topBar.live;
  const eyebrow = pre ? 'Cyber Week · Opens Monday, Nov 30' : early ? copy.hero.eyebrow.early : state === 'evergreen' ? copy.hero.eyebrow.evergreen : copy.hero.eyebrow.live;
  const tierStatus = ended ? 'Offer ended Dec 2' : 'Ends Wed, Dec 2';

  const min = pwyc.minimum;
  const filled = {
    '[MIN]': min ? ` (minimum $${min})` : '',
  };
  const faqList = faqs.map(f => {
    let a = f.a;
    a = a.replace(' (minimum $[MIN])', filled['[MIN]']);
    a = a.replace(' to Plus for $[TBC].', certificates.memberUpgrade.price ? ` to Plus for $${certificates.memberUpgrade.price}.` : ' to Plus.');
    a = a.replace(' until [January date].', clean(archive.credit.deadline) ? ` until ${clean(archive.credit.deadline)}.` : '.');
    return { q: f.q, a };
  });
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqList.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };

  const seasonPrice = s => (s.kind === 'retreat' ? archive.prices.retreat : archive.prices.season);
  const certHrefs = certificates.singleCheckout;
  const hero = copy.hero;

  return (
    <div className="cm">
      <AccessCookie />

      {showTop && (
        <div className="cm-top">
          <div className="cm-in">
            <div className="l"><span className="cm-dot" /><b>{topText}</b></div>
            <div className="r">
              <span className="dl">{dl.label}</span>
              <Countdown target={dl.target} initialMs={left(dl.target)} label={`${dl.label}: time left`} />
              <a href="#offers">Jump to offers</a>
            </div>
          </div>
        </div>
      )}

      {early && (
        <div className="cm-early"><div className="cm-in"><strong>{copy.earlyBanner.label}</strong><span>{copy.earlyBanner.text}</span></div></div>
      )}

      <section className={`cm-hero on-pine${pre ? ' is-pre' : ''}`}>
        <div className="cm-in">
          <div className="txt">
            <p className="cm-eyebrow">{eyebrow}</p>
            <h1><Head parts={hero.headline} /></h1>
            <p className="body">{hero.body}</p>
            {pre ? (
              <div className="cm-signup">
                <KitForm formId={KIT_LETTER} button="Tell me when it opens" buttonClass="cm-btn" success="You're on the list. Check your inbox to confirm." hintClass="form-ok" />
                <small>Cyber Week opens Monday, Nov 30. Weekly Scaffolding subscribers get the news first.</small>
              </div>
            ) : (
              <>
                <div className="acts">
                  <a href="#library" className="cm-btn">{hero.primary} <Arrow /></a>
                  <a href="#offers" className="cm-link">{hero.secondary}</a>
                </div>
                <div className="cm-proof">{hero.proof.map(p => <span key={p}>{p}</span>)}</div>
              </>
            )}
          </div>
          <div className="cm-collage">
            <div>
              <Art name="collages/hero-collage" />
              <img className="fig" src="/yogi-shiva.webp" alt="" style={{ left: '31.25%', top: '33%', width: '37.5%', height: '61.4%' }} />
              <div className="over"><Art name="collages/hero-lotus-foreground" attrs='width="100%" height="100%"' /></div>
              <div className="cm-sticker" style={{ left: -18, bottom: 96, width: 136, height: 136 }}>
                <Art name="stickers/pay-what-you-can" suffix="hero" attrs='class="spin"' />
              </div>
            </div>
          </div>
        </div>
      </section>

      {!pre && (
        <>
          <section id="offers" className="cm-nav" aria-label="Three offers">
            <div className="cm-in">
              {copy.navigator.map((n, i) => {
                const cls = ['', 'sand', 'pine'][i];
                const icon = <Art name={`icons/${n.icon}`} attrs='width="40" height="40"' />;
                const when = i === 0 ? (state === 'evergreen' ? 'ALWAYS OPEN' : n.when) : ended ? 'ENDED' : n.when;
                return (
                  <a key={n.n} href={n.anchor} className={cls}>
                    <span className="top"><span>{n.n} · {when}</span>{icon}</span>
                    <span className="t">{n.title}</span>
                    <span className="p">
                      {i === 0 && <>Every on-demand course, <strong>pay what you can</strong> <s>${campaign.regularCoursePrice}</s></>}
                      {i === 1 && <>One certificate for <strong>${certificates.single.cyber}</strong>, or all four with Wisdom School Plus for <strong>${certificates.plus.cyberFirstYear}</strong></>}
                      {i === 2 && <>Past seasons from <strong>${archive.prices.season.cyber}</strong>, credited toward this year&rsquo;s Path of Recognition</>}
                    </span>
                    <span className="foot">{i === 0 ? (state === 'evergreen' ? 'Open now' : 'Closes Sun, Dec 6') : tierStatus} <i>{['Browse ↓', 'Compare ↓', 'Explore ↓'][i]}</i></span>
                  </a>
                );
              })}
            </div>
          </section>

          {/* Tier 1 */}
          <section id="library" className="cm-sec">
            <div className="cm-in" style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
              <div className="cm-split">
                <div className="cm-head">
                  <p className="cm-eyebrow">{copy.tier1.eyebrow}</p>
                  <h2 className="cm-h2"><Head parts={copy.tier1.headline} /></h2>
                  <p className="cm-lede">{copy.tier1.body}</p>
                </div>
                <div className="cm-pwyc" role="group" aria-label="How pay what you can works">
                  <div className="row"><b>How pay what you can works</b><span>Regular <s>${campaign.regularCoursePrice}</s></span></div>
                  {pwyc.suggested.every(n => n > 0) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {pwyc.suggested.map((n, i) => <span key={i} className={`cm-chip${i === 1 ? ' mid' : ''}`}>{money(n)}</span>)}
                    </div>
                  )}
                  <p className="fine">{copy.tier1.pwycNote}{min ? ` Minimum $${min}.` : ''}</p>
                </div>
              </div>

              <div className="cm-grid3">
                {featured.map(({ f, o }) => {
                  const course = { id: f.courseId, title: o?.title || f.title, topic: f.topic, checkout: o?.checkout || '', thumb: o?.cover || '' };
                  const who = o ? [o.teachers.map(t => t.name).join(', '), o.length].filter(Boolean).join(' · ') : '';
                  return (
                    <article className="cm-card" key={f.courseId}>
                      <div className="art"><Art name={`motifs/${f.motif}`} /></div>
                      <div className="bd">
                        <p className="cm-eyebrow">{f.topic}</p>
                        <h3>{course.title}</h3>
                        {who && <p className="who">{who}</p>}
                        {o && (o.promise || o.description) && <p className="line">{o.promise || firstSentence(o.description)}</p>}
                        <div className="buy">
                          <span><s>${campaign.regularCoursePrice}</s> <strong>PWYC</strong></span>
                          <PwycModal course={course} pwyc={pwyc} regular={campaign.regularCoursePrice} state={state} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {rest.length > 0 && (
                <details className="cm-all">
                  <summary>
                    <span className="t">See every course <small>· {rest.length} more, all pay what you can</small></span>
                    <span className="cm-plus" aria-hidden="true">+</span>
                  </summary>
                  <div className="cm-rows">
                    {rest.map(o => (
                      <CtaLink key={o.id} href={o.checkout} className="" tier="open-library" item={o.id} state={state} soon="Opening soon">
                        <span><b>{o.title}</b><small>{o.topics[0] || o.kind}</small></span>
                        <i>PWYC →</i>
                      </CtaLink>
                    ))}
                  </div>
                </details>
              )}

              <div className="cm-foot-row">
                <div className="cm-guar">
                  <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="24" cy="24" r="21" /><circle cx="24" cy="24" r="16" strokeDasharray="2 3" /><path d="M16 24.5l5.5 5.5L32 19" /></svg>
                  <p><strong>100% satisfaction guarantee.</strong> Any course or certificate, refunded within 30 days, no questions asked.</p>
                </div>
                {pwyc.meditationPassAddOn.cyber && <p className="cm-fine-line">At checkout: add a year of the Meditation Pass for ${pwyc.meditationPassAddOn.cyber} <s>${pwyc.meditationPassAddOn.regular}</s></p>}
              </div>
            </div>
          </section>

          {/* Pull quote */}
          <section className="cm-quote on-pine">
            <div className="sun"><Art name="collages/pullquote-sun" attrs='aria-hidden="true"' /></div>
            <div className="moon"><Art name="collages/pullquote-moon" attrs='class="bob" aria-hidden="true"' /></div>
            <figure className="in" style={{ margin: '0 auto' }}>
              <svg width="40" height="32" viewBox="0 0 40 32" fill="#B98A3E" aria-hidden="true"><path d="M0 32V19C0 8 6 1.5 16 0l1.5 4C11 6 8.5 10 8.5 15H16v17H0zm22 0V19c0-11 6-17.5 16-19l1.5 4C33 6 30.5 10 30.5 15H38v17H22z" /></svg>
              <blockquote>{pullQuote.text}</blockquote>
              <figcaption><cite>{pullQuote.name} · {pullQuote.role}</cite></figcaption>
            </figure>
          </section>

          {/* Tier 2 */}
          <section id="certificates" className="cm-sec cm-t2">
            <div className="cm-in" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
              <div className="cm-split" style={{ justifyContent: 'space-between' }}>
                <div className="cm-head">
                  <p className="cm-eyebrow">{copy.tier2.eyebrow}</p>
                  <h2 className="cm-h2"><Head parts={copy.tier2.headline} /></h2>
                  <p className="cm-lede" style={{ maxWidth: 600 }}>{copy.tier2.body}</p>
                </div>
                {!ended && (
                  <div className="cm-when">
                    <span>Ends Wed, Dec 2 · 11:59pm ET</span>
                    <Countdown target={dates.plusAndArchiveClose} initialMs={left(dates.plusAndArchiveClose)} label="Certificate offer ends Wednesday, Dec 2, 11:59pm Eastern" />
                  </div>
                )}
              </div>

              {!ended ? (
                <>
                  <div className="cm-pair">
                    <div className="cm-opt">
                      <div><span className="k">Option one</span><h3>One certificate</h3></div>
                      <div className="cm-price"><b>{money(certificates.single.cyber)}</b><s>{money(certificates.single.regular)}</s></div>
                      <ChoiceCard titles={certificates.titles} checkout={certHrefs} state={state} />
                    </div>
                    <div className="cm-opt rec">
                      <span className="tag">Recommended</span>
                      <div><span className="k">Option two · all four</span><h3>Wisdom School <em>Plus</em></h3></div>
                      <div className="cm-price"><b>{money(certificates.plus.cyberFirstYear)}</b><s>{money(certificates.plus.regular)}</s><span>first year, then ${certificates.plus.regular}/yr</span></div>
                      <ul className="cm-checks">{certificates.plus.includes.map(i => <li key={i}><Tick /><span>{i}</span></li>)}</ul>
                      <p className="cm-value">{certificates.plus.valueLine}</p>
                      <CtaLink href={certificates.plus.checkout} className="cm-btn cm-push" tier="plus" item="wisdom-school-plus" state={state}>Join Wisdom School Plus</CtaLink>
                    </div>
                  </div>
                  <div className="cm-after"><p>{certificates.ceNote}</p></div>
                  {member && (
                    <div className="cm-upgrade">
                      <span><strong>You&rsquo;re a Wisdom School member.</strong> <span>Add every certificate and pathway.</span></span>
                      <CtaLink href={certificates.memberUpgrade.checkout} className="cm-btn" tier="member-upgrade" item="plus-upgrade" state={state} soon="Upgrade opening soon">
                        Upgrade to Plus{certificates.memberUpgrade.price ? ` · $${certificates.memberUpgrade.price}` : ''}
                      </CtaLink>
                    </div>
                  )}
                </>
              ) : (
                <div className="cm-ended">
                  <div className="tx"><h3>This offer has ended.</h3><p>{copy.tier2.ended}</p></div>
                  <div className="acts">
                    <a className="cm-btn cm-btn-ghost" href={endedLinks.certificates}>See certificates</a>
                    <a className="cm-btn" href={endedLinks.plus}>See Wisdom School Plus</a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Tier 3 */}
          <section id="archive" className="cm-sec cm-t3 on-pine">
            <div className="cm-in" style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
              <div className="cm-split" style={{ alignItems: 'flex-start' }}>
                <div className="cm-head">
                  <p className="cm-eyebrow">{copy.tier3.eyebrow}</p>
                  <h2 className="cm-h2"><Head parts={copy.tier3.headline} /></h2>
                  <p className="cm-lede">{copy.tier3.body}</p>
                </div>
                <div className="cm-credit">
                  <span className="k">The Archive credit</span>
                  <p className="big">Every dollar you spend here, up to <strong>${archive.credit.cap}</strong>, comes off Winter 2027 or full-year enrolment.</p>
                  <p className="sm">{clean(archive.credit.deadline) ? `Credit applies automatically until ${clean(archive.credit.deadline)}. ` : 'Credit applies automatically. '}It never expires on your Archive access.</p>
                </div>
              </div>

              {!ended ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
                  <div className="cm-strip">
                    <div><span>Single past season</span><p><strong>{money(archive.prices.season.cyber)}</strong><s>{money(archive.prices.season.regular)}</s></p></div>
                    <div><span>Past summer retreat (online)</span><p><strong>{money(archive.prices.retreat.cyber)}</strong><s>{money(archive.prices.retreat.regular)}</s></p></div>
                    <div><span className="best">Complete past year · 3 seasons + retreat</span><p><strong>{money(archive.prices.fullYear.cyber)}</strong><small>best value</small></p></div>
                  </div>
                  {archive.years.map(y => (
                    <div className="cm-year" key={y.label}>
                      <div className="hd">
                        <h3>{y.label}{y.subtitle ? <> <em>{y.subtitle}</em></> : null}</h3>
                        <CtaLink href={y.fullYearCheckout} className="cm-btn cm-btn-ochre cm-btn-sm" tier="archive-year" item={y.label} state={state} soon="Complete year opening soon">Open the complete year · {money(archive.prices.fullYear.cyber)}</CtaLink>
                      </div>
                      <div className="cm-seasons">
                        {y.seasons.map(s => {
                          const p = seasonPrice(s);
                          return (
                            <article className="cm-season" key={s.season + s.title}>
                              <div className="art"><Art name={`motifs/${s.motif}`} /></div>
                              <div className="bd">
                                <span className="k">{stripTodo(s.season)}</span>
                                <h4>{s.title}</h4>
                                {clean(s.line) && <p className="ln">{clean(s.line)}</p>}
                                {s.text && <p className="tx">{s.text}</p>}
                                <div className="buy">
                                  <span><strong>{money(p.cyber)}</strong> <s>{money(p.regular)}</s></span>
                                  <CtaLink href={s.checkout} className="" tier="archive" item={`${y.label} ${s.season}`} state={state} soon="Opening soon">Open the Archive →</CtaLink>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cm-ended">
                  <div className="tx"><h3>This offer has ended.</h3><p>{copy.tier3.ended}</p></div>
                  <a className="cm-btn cm-btn-ochre" href={endedLinks.archive}>See past seasons</a>
                </div>
              )}

              <div className="cm-cur">
                <p>{copy.tier3.currentYearNote} <span>{archive.currentYear.years} · {archive.currentYear.title} · from ${archive.prices.season.regular} a season.</span></p>
                <a className="cm-link" style={{ color: 'var(--cm-gold)' }} href={archive.currentYear.href}>See Sādhana School {archive.currentYear.years}</a>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="cm-sec" style={{ paddingBottom: 96 }}>
            <div className="cm-in" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
              <div className="cm-center">
                <p className="cm-eyebrow">{copy.howItWorks.eyebrow}</p>
                <h2 className="cm-h2" style={{ fontSize: 'clamp(40px,4.6vw,60px)' }}><Head parts={copy.howItWorks.headline} /></h2>
              </div>
              <ol className="cm-how">
                {copy.howItWorks.steps.map((s, i) => <li key={s.title}><span className="n">{i + 1}</span><strong>{s.title}</strong><span className="tx">{s.body}</span></li>)}
              </ol>
            </div>
          </section>

          <section style={{ padding: '0 0 112px' }}>
            <div className="cm-in cm-voices">
              {testimonials.slice(0, 3).map(q => (
                <figure key={q.name}>
                  <svg width="32" height="26" viewBox="0 0 40 32" fill="#B98A3E" aria-hidden="true"><path d="M0 32V19C0 8 6 1.5 16 0l1.5 4C11 6 8.5 10 8.5 15H16v17H0zm22 0V19c0-11 6-17.5 16-19l1.5 4C33 6 30.5 10 30.5 15H38v17H22z" /></svg>
                  <blockquote>{q.text}</blockquote>
                  <figcaption><strong>{q.name}</strong> · {q.role}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section style={{ background: 'var(--cream)' }}>
            <div className="cm-faq-wrap">
              <div className="cm-head" style={{ gap: 14 }}>
                <p className="cm-eyebrow">Questions</p>
                <h2 className="cm-h2" style={{ fontSize: 'clamp(36px,4vw,52px)', lineHeight: 1.05 }}>Before you <em>begin.</em></h2>
              </div>
              <div style={{ borderTop: '1px solid var(--line)' }}>
                {faqList.map(f => (
                  <details className="cm-faq" key={f.q}>
                    <summary><span>{f.q}</span><span className="cm-plus" aria-hidden="true" style={{ fontSize: 26 }}>+</span></summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }} />
          </section>

          {/* Closing band */}
          {state !== 'evergreen' && (
            <section className="cm-close">
              <div className="cm-in">
                <div className="txt">
                  <p className="cm-eyebrow">{copy.closing.eyebrow}</p>
                  <h2><Head parts={copy.closing.headline} /></h2>
                  <p className="cm-lede">{copy.closing.body}</p>
                  <div className="cm-timers">
                    {state !== 'libraryOnly' && (
                      <div><span>Certificates &amp; Archive · Wed, Dec 2</span><Countdown variant="large" target={dates.plusAndArchiveClose} initialMs={left(dates.plusAndArchiveClose)} label="Certificates and Archive end Wednesday, Dec 2, 11:59pm Eastern" /></div>
                    )}
                    <div><span>Open Library · Sun, Dec 6</span><Countdown variant="large" target={dates.openLibraryClose} initialMs={left(dates.openLibraryClose)} label="The Open Library closes Sunday, Dec 6, 11:59pm Eastern" /></div>
                  </div>
                  <div><a href="#offers" className="cm-btn">{copy.closing.button}</a></div>
                </div>
                <div className="cm-endcol">
                  <div>
                    <Art name="collages/closing-collage" />
                    <img src="/woman-music.webp" alt="" loading="lazy" style={{ position: 'absolute', left: '28.6%', top: '28%', width: '42.9%', height: '68%', objectFit: 'contain', objectPosition: 'bottom' }} />
                    <div className="cm-sticker" style={{ right: -14, bottom: 120, width: 128, height: 128, transform: 'rotate(10deg)' }}>
                      <Art name="stickers/open-all-week" suffix="close" attrs='class="spin"' />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="cm-tag"><p>{copy.footer[0]}<em>{copy.footer[1]}</em></p></div>

          {showTop && <MobileBar label={dl.label} target={dl.target} initialMs={left(dl.target)} />}
        </>
      )}
    </div>
  );
}
