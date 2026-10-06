import Events from '@/components/Events';
import Collage from '@/components/Collage';
import KitForm from '@/components/KitForm';
import { getEvents } from '@/lib/events';
import { getEpisodes } from '@/lib/podcast';
import { longDate } from '@/lib/dates';
import { getSite, getTestimonials } from '@/lib/content';

export const revalidate = 300; // re-check the events sheet every 5 minutes

const KIT = {
  reading: process.env.NEXT_PUBLIC_KIT_FORM_READING_LIST,
  letter: process.env.NEXT_PUBLIC_KIT_FORM_LETTER,
  join: process.env.NEXT_PUBLIC_KIT_FORM_JOIN,
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);


export default async function Home() {
  const site = await getSite();
  const quotes = (await getTestimonials('home')).slice(0, 3);
  const [events, episodes] = await Promise.all([getEvents(), getEpisodes(5)]);
  const nextPublic = events.find(e => e.program === 'lrl' || e.program === 'seasonal');
  const sadhanaNext = events.filter(e => e.program === 'sadhana').slice(0, 2);
  const wisdomNext = events.filter(e => e.program === 'wisdom').slice(0, 3);
  const [latest, ...older] = episodes;

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-inner">
          <div>
            <span className="lead-tag">◈ Serving seekers &amp; scholar-practitioners since 2015</span>
            <h1 className="h1-aphorism">The spirit ponders.<br /><em>The heart concludes.</em></h1>
            <p className="sub">Yoga philosophy, meditation, and contemplative teachings from the world’s wisdom and esoteric traditions, for serious students who want to refine their knowledge and deepen their practice.</p>
            <div className="hero-cta">
              <a className="btn btn-primary" href={site.links.quiz}>Get your free Practice Report →</a>
              <div className="hint">◇&nbsp; Answer a few questions about your practice and get a <b>customized practice report</b> grounded in ancient wisdom. Free, and takes a few minutes.</div>
            </div>
            <div className="next-live">
              <span className="dot" />
              {nextPublic
                ? <>Next live: <a href="/events">{nextPublic.title.split(':')[0]}</a>, {longDate(nextPublic.date)}</>
                : <a href="/events">See upcoming events</a>}
            </div>
          </div>
          <div className="hero-aside"><Collage img="yogi-shiva" ground="navy" className="hero-collage" alt="Kalighat painting of a yogi" /></div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="trust">
        <div className="wrap trust-inner">
          {site.stats.map(s => <div className="stat" key={s.l}><div className="n">{s.n}</div><div className="l">{s.l}</div></div>)}
        </div>
      </section>

      {/* THE PATH */}
      <section className="sec path" id="path">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow">The Path</span>
            <h2>Where to begin, and when to go deep.</h2>
            <p>Three ways to study with us, from free monthly lectures to a full school year.</p>
          </div>
          <div className="path-grid">
            <div className="tier">
              <div className="step">Start here — Free</div>
              <h3>Living Room Lectures</h3>
              <div className="price">Free · Returns January 2027</div>
              <p>A monthly live series where we explore the meeting point of the contemplative traditions and contemporary life. No commitment — just come, think, and practice with us.</p>
              <a className="go" href="/living-room-lectures">See what’s coming <span className="arw">→</span></a>
            </div>
            <div className="tier" style={{ borderTopColor: 'var(--ochre)' }}>
              <div className="step">Build fluency</div>
              <h3>Wisdom School</h3>
              <div className="price">{site.prices.wisdomYear} / year · Rolling enrollment</div>
              <p>Weekly meditations, monthly lectures and seasonal workshops, with the archive of every learning pathway in Wisdom School Plus. Become fluent in the foundational concepts of the traditions.</p>
              <p className="tier-note">Yoga teachers: Plus includes continuing-education hours.</p>
              <a className="go" href="/wisdom-school">Become a member <span className="arw">→</span></a>
            </div>
            <div className="tier" style={{ borderTopColor: 'var(--pine)' }}>
              <div className="step">Go all the way</div>
              <h3>Sādhana School</h3>
              <div className="price">From {site.prices.sadhanaSemesterFrom} / semester · 2026–2027</div>
              <p>Our flagship year of guided study and practice. Three 8-week semesters and a summer immersion, weekend workshops, and a community of serious practitioners walking the path together.</p>
              <a className="go" href="/sadhana-school">Explore the year <span className="arw">→</span></a>
            </div>
          </div>
          <a className="ce-band" href="/continuing-education">
            <span><b>Yoga teachers:</b> earn your Yoga Alliance continuing-education hours studying the sources, with a certificate for every pathway.</span>
            <span className="ce-band-go">How CE works <span className="arw">→</span></span>
          </a>
          <div className="quiz-cta reading-cta" id="join">
            <div><b>Prefer to start expanding your library?</b><span>Get the free Yoga Philosophy Reading List.</span></div>
            <div className="reading-form"><KitForm formId={KIT.reading} button="Send my reading list" success="Your reading list is on its way. Check your inbox to confirm." /></div>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="sec" id="events">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow">Upcoming — Live &amp; Online</span>
            <h2>Somewhere to practice every week.</h2>
            <p>Weekly meditations, workshops, semesters of study, and annual celebrations of study and practice.</p>
          </div>
          <Events events={events} limit={6} links={site.links} photos={site.photos} />
          <div className="events-foot"><a className="btn btn-ghost" href="/events">See the full calendar</a></div>
        </div>
      </section>

      {/* SADHANA SCHOOL */}
      <section className="sec path" id="sadhana">
        <div className="wrap feature">
          <Collage img="holyman-tigers" ground="vermilion" ring="#F2E9D8" ringPos="tl" className="art" alt="Kalighat painting of a holy man with tigers" />
          <div>
            <span className="eyebrow">The Flagship · 2026–2027</span>
            <h2>Sādhana School</h2>
            <div className="theme">“{site.sadhanaTheme}”</div>
            <ul>
              <li>Three 8-week semesters and a 7-day summer immersion — Pratyabhijñā philosophy, Rasa theory &amp; meditation</li>
              <li>Weekend workshops across the year, included in tuition</li>
              <li>Guided by Jacob Kyle &amp; distinguished guest teachers</li>
              <li>A community of 100+ committed practitioners — live and recorded</li>
            </ul>
            <p className="upnext">
              {sadhanaNext.length
                ? sadhanaNext.map((e, i) => (
                    <span key={e.date}>{i > 0 && <>&nbsp;&nbsp;·&nbsp;&nbsp;</>}<b>{cap(e.title.replace('Sādhana School ', ''))}:</b> {longDate(e.date)}</span>
                  ))
                : 'Dates for the next year will be announced soon.'}
            </p>
            <div className="btns">
              <a className="btn btn-primary" href={site.links.sadhanaYear}>Enroll for the year — {site.prices.sadhanaYear}</a>
              <a className="btn btn-ghost" href={site.links.sadhanaSemester}>Or join a single semester</a>
            </div>
          </div>
        </div>
      </section>

      {/* WISDOM SCHOOL */}
      <section className="sec" id="wisdom">
        <div className="wrap feature rev">
          <Collage img="woman-music" ground="slate" ring="#EBA329" ringPos="tr" className="art" alt="Kalighat painting of a woman playing music" />
          <div>
            <span className="eyebrow">Membership</span>
            <h2>Wisdom School</h2>
            <div className="theme">A year-long practice of paying attention</div>
            <ul>
              <li>A live guided meditation every week — build a real daily practice</li>
              <li>A new lecture every month on the traditions and their texts</li>
              <li>With Plus: {site.libraryHours} hours of learning pathways and certificate programs</li>
              <li>A community of lifetime learners: teachers, therapists &amp; scholars</li>
            </ul>
            <div className="week">
              <h4>Coming up for members</h4>
              {wisdomNext.length
                ? wisdomNext.map(e => <div className="row" key={e.id || e.date}><span>{e.title}</span><span>{longDate(e.date)}</span></div>)
                : <div className="row"><span>New sessions are added every week.</span><span /></div>}
            </div>
            <div className="btns">
              <a className="btn btn-primary" href={site.links.wisdomJoin}>Become a member — {site.prices.wisdomYear}/yr</a>
              <a className="btn btn-ghost" href={site.links.wisdomCatalog}>Browse the course catalog</a>
            </div>
          </div>
        </div>
      </section>

      {/* LIVING ROOM LETTER */}
      <section className="sec">
        <div className="wrap">
          <div className="letter">
            <div>
              <span className="eyebrow light">Every Sunday · Free</span>
              <h2>The Weekly Scaffolding</h2>
              <p>A weekly wisdom studies e-zine with teachings, simple practices, bite-sized translations of Sanskrit texts, and all you need to know about what’s coming up at Embodied Philosophy.</p>
            </div>
            <div>
              <KitForm formId={KIT.letter} button="Subscribe" buttonClass="btn btn-light" hintClass="hint" success="You’re in. Check your inbox to confirm." />
              <div className="hint">Join 100,000 practitioners. One email a week. Unsubscribe anytime.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CHITHEADS */}
      <section className="sec pod" id="chitheads">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow light">The Podcast</span>
            <h2>Chitheads</h2>
            <p>Long-form conversations with scholars, teachers, best-selling authors, and devotional leaders on yoga and meditation practice, esoteric wisdom, world philosophies, and the human spiritual condition.</p>
          </div>
          <div className="pod-grid">
            <div className="player">
              {latest.image && <img className="ep-art" src={latest.image} alt="" width="120" height="120" />}
              <div className="now">◈ Latest episode{latest.num ? ` · Ep. ${latest.num}` : ''}</div>
              <h3>{latest.title}</h3>
              {latest.guest && <div className="guest">{latest.guest}</div>}
              <div className="ctrls">
                <a className="play-btn" href={latest.url} aria-label={`Play ${latest.title}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                </a>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>Listen to the latest episode{latest.duration ? ` · ${latest.duration}` : ''}</div>
              </div>
              <div className="subs">
                <a href={site.links.podcast.spotify}>◈ Spotify</a><a href={site.links.podcast.apple}>◈ Apple Podcasts</a>
                <a href={site.links.podcast.youtube}>◈ YouTube</a><a href={site.links.podcast.rss}>◈ RSS</a>
              </div>
            </div>
            <div className="eplist">
              {older.map(ep => (
                <a className="ep" href={ep.url} key={ep.title}>
                  <div className="num">{ep.num}</div>
                  <div><div className="epttl">{ep.title}</div><div className="epmeta">{[ep.guest, ep.duration].filter(Boolean).join(' · ')}</div></div>
                </a>
              ))}
              <div style={{ marginTop: 22 }}><a className="btn btn-outline-light" href="/podcast">Browse all episodes →</a></div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS (placeholder quotes) */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow">From the community</span>
            <h2>Hear what our students have to say…</h2>
          </div>
          <div className="quotes">
            {quotes.map(q => (
              <div className="q" key={q.quote}><div className="mark">“</div><p>{q.quote}</p><div className="who">{q.name}</div><div className="role">{q.role}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* TARKA */}
      <section className="sec tarka" id="tarka">
        <div className="wrap tarka-inner">
          <div className="stack">
            {[['sp', 'On the Scholar-Practitioner'], ['bhakti', 'On Bhakti'], ['illusion', 'On Illusion'], ['death', 'On Death']].map(([k, t], i) => (
              <img key={k} className={`cover c${i}`} src={`/img/tarka-${k}.jpg`} alt={`Tarka: ${t}`} width="360" height="473" />
            ))}
          </div>
          <div>
            <span className="eyebrow">Our Journal</span>
            <h2 style={{ fontSize: 44, margin: '14px 0 6px' }}>Tarka</h2>
            <p className="serif-lead">A journal of yoga philosophy, contemplative studies, and the world’s wisdom traditions.</p>
            <p style={{ color: 'var(--ink-soft)', fontSize: 16, marginTop: 18, maxWidth: 480 }}>Essays, translations, and reflections from leading scholars and practitioners from around the world, now published and growing at tarkajournal.com. Read previous articles, or grab one of our beautiful print issues for your study library.</p>
            <div style={{ marginTop: 26, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a className="btn btn-primary" href={site.links.tarkaSubstack}>Read Tarka →</a>
              <a className="btn btn-ghost" href="https://www.tarkajournal.com/store">Browse print issues</a>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="sec about" id="about">
        <div className="wrap about-inner">
          <Collage img="mirror" ground="black" ring="#EBA329" ringPos="tl" className="founder" alt="Kalighat painting of a woman with a mirror" />
          <div>
            <span className="eyebrow">Our Purpose</span>
            <blockquote>“In modern society, education has largely lost the original spirit of the humanities, wherein the focus of education is the cultivation of wisdom, insight, wonder, creativity, and imagination. Embodied Philosophy’s mission is to fill that void and contribute to the renaissance of a contemplative humanities.”</blockquote>
            <div className="sig">— <b>Jacob Kyle</b>, Founder &amp; Director</div>
            <div style={{ marginTop: 24 }}><a className="btn btn-ghost" href="/about">Read our story →</a></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap">
          <span className="eyebrow">Begin today — it’s free</span>
          <h2>Where ancient wisdom meets modern life.</h2>
          <p>Get the free Yoga Philosophy Reading List and the Weekly Scaffolding e-zine. Start from where you are.</p>
          <KitForm formId={KIT.join} button="Join free →" success="Welcome. Check your inbox to confirm." />
        </div>
      </section>
    </>
  );
}
