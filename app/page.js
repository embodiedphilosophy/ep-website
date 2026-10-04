import Events from '@/components/Events';
import KitForm from '@/components/KitForm';
import { getEvents } from '@/lib/events';
import { getEpisodes } from '@/lib/podcast';
import { longDate } from '@/lib/dates';
import { site } from '@/lib/site';

export const revalidate = 300; // re-check the events sheet every 5 minutes

const KIT = {
  reading: process.env.NEXT_PUBLIC_KIT_FORM_READING_LIST,
  letter: process.env.NEXT_PUBLIC_KIT_FORM_LETTER,
  join: process.env.NEXT_PUBLIC_KIT_FORM_JOIN,
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function Medallion() {
  return (
    <svg className="medallion" viewBox="0 0 340 340" fill="none" aria-hidden="true">
      <circle cx="170" cy="170" r="150" stroke="#D8C9AE" strokeWidth="1.2" />
      <circle cx="170" cy="170" r="120" stroke="#D8C9AE" strokeWidth="1.2" />
      <g stroke="#B98A3E" strokeWidth="1.1" opacity=".9">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(r => (
          <path key={r} d="M170 50 C150 100 150 130 170 170 C190 130 190 100 170 50Z" transform={`rotate(${r} 170 170)`} />
        ))}
      </g>
      <circle cx="170" cy="170" r="150" stroke="#A5432A" strokeWidth="1" opacity=".35" />
      <circle cx="170" cy="170" r="16" fill="#A5432A" />
      <circle cx="170" cy="170" r="7" fill="#FAF5EB" />
    </svg>
  );
}

export default async function Home() {
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
            <span className="lead-tag">◈ An online school for the contemplative life</span>
            <h1>Ancient wisdom,<br />seriously studied.<br /><em>Deeply practiced.</em></h1>
            <p className="sub">Yoga philosophy, meditation, and the world’s contemplative traditions — for thinking practitioners who want more than a workout.</p>
            <div className="capture" id="join">
              <KitForm formId={KIT.reading} button="Send my reading list" success="Your reading list is on its way. Check your inbox to confirm." />
              <div className="hint">◇&nbsp; Get the free <b>Yoga Philosophy Reading List</b> — join 85,000 seekers. Unsubscribe anytime.</div>
            </div>
            <div className="next-live">
              <span className="dot" />
              {nextPublic
                ? <>Next live: <a href="/events">{nextPublic.title.split(':')[0]}</a>, {longDate(nextPublic.date)}</>
                : <a href="/events">See upcoming events</a>}
            </div>
          </div>
          <div className="hero-aside"><Medallion /></div>
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
            <h2>Begin anywhere. Go as deep as you like.</h2>
            <p>Three ways to study with us — from free monthly gatherings to a full year of transformative practice.</p>
          </div>
          <div className="path-grid">
            <div className="tier">
              <div className="step">Start here — Free</div>
              <h3>Living Room Lectures</h3>
              <div className="price">Free · Live &amp; online</div>
              <p>A monthly live series where we explore the meeting point of the contemplative traditions and contemporary life. No commitment — just come, think, and practice with us.</p>
              <a className="go" href="/events">See what’s coming <span className="arw">→</span></a>
            </div>
            <div className="tier" style={{ borderTopColor: 'var(--ochre)' }}>
              <div className="step">Build fluency</div>
              <h3>Wisdom School</h3>
              <div className="price">{site.prices.wisdomYear} / year · Rolling enrollment</div>
              <p>The Attention Project — weekly meditations, monthly lectures, and 1,000+ hours of on-demand courses. Become fluent in the foundational concepts of the traditions.</p>
              <a className="go" href="#wisdom">Become a member <span className="arw">→</span></a>
            </div>
            <div className="tier" style={{ borderTopColor: 'var(--pine)' }}>
              <div className="step">Go all the way</div>
              <h3>Sādhana School</h3>
              <div className="price">From {site.prices.sadhanaSemesterFrom} / semester · 2026–2027</div>
              <p>Our flagship year of guided study and practice. Four immersive semesters, monthly workshops, and a community of serious practitioners walking the path together.</p>
              <a className="go" href="#sadhana">Explore the year <span className="arw">→</span></a>
            </div>
          </div>
          <div className="quiz-cta">
            <div><b>Not sure where to begin?</b><span>Answer a few questions about your practice and get a personal study path.</span></div>
            <a className="btn btn-ghost" href={site.links.quiz}>Take the practice quiz</a>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="sec" id="events">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow">Upcoming — Live &amp; Online</span>
            <h2>Something to practice, every month</h2>
            <p>Free lectures, seasonal immersions, and live sessions inside the schools. New dates appear here as soon as they’re scheduled.</p>
          </div>
          <Events events={events} limit={6} />
          <div className="events-foot"><a className="btn btn-ghost" href="/events">See the full calendar</a></div>
        </div>
      </section>

      {/* SADHANA SCHOOL */}
      <section className="sec path" id="sadhana">
        <div className="wrap feature">
          <div className="art" style={{ background: 'radial-gradient(70% 90% at 30% 20%, rgba(185,138,62,.35), transparent 60%), linear-gradient(160deg,#2C4239,#20302A)' }}>
            <svg viewBox="0 0 400 420" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} fill="none" opacity=".5" aria-hidden="true">
              <g stroke="#EADDC6" strokeWidth="1">
                <circle cx="200" cy="210" r="150" /><circle cx="200" cy="210" r="110" /><circle cx="200" cy="210" r="70" />
                <path d="M200 60 V360 M50 210 H350 M95 105 L305 315 M305 105 L95 315" />
              </g>
              <circle cx="200" cy="210" r="14" fill="#A5432A" />
            </svg>
          </div>
          <div>
            <span className="eyebrow">The Flagship · 2026–2027</span>
            <h2>Sādhana School</h2>
            <div className="theme">“{site.sadhanaTheme}”</div>
            <ul>
              <li>Four 8-week semesters — Pratyabhijñā philosophy, Rasa theory &amp; meditation</li>
              <li>Eight weekend workshops across the year, included in tuition</li>
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
          <div className="art" style={{ background: 'radial-gradient(70% 90% at 70% 30%, rgba(165,67,42,.30), transparent 60%), linear-gradient(160deg,#EADDC6,#E0CDA9)' }}>
            <svg viewBox="0 0 400 420" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} fill="none" aria-hidden="true">
              <g stroke="#A5432A" strokeWidth="1.1" opacity=".55">
                <circle cx="200" cy="210" r="140" />
                {[0, 60, 120, 180, 240, 300].map(r => (
                  <path key={r} d="M200 70 C175 140 175 180 200 210 C225 180 225 140 200 70Z" transform={`rotate(${r} 200 210)`} />
                ))}
              </g>
              <circle cx="200" cy="210" r="12" fill="#20302A" />
            </svg>
          </div>
          <div>
            <span className="eyebrow">Membership · The Attention Project</span>
            <h2>Wisdom School</h2>
            <div className="theme">A year-long practice of paying attention</div>
            <ul>
              <li>A live guided meditation every week — build a real daily practice</li>
              <li>A new lecture every month on the traditions and their texts</li>
              <li>1,000+ hours of on-demand courses, yours the moment you join</li>
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
              <h2>The Living Room Letter</h2>
              <p>A weekly note with a teaching to sit with, a practice to try, and everything happening in the school this week. It’s the easiest way to stay close to the work.</p>
            </div>
            <div>
              <KitForm formId={KIT.letter} button="Subscribe" buttonClass="btn btn-light" hintClass="hint" success="You’re in. Check your inbox to confirm." />
              <div className="hint">Join 85,000 practitioners. One email a week. Unsubscribe anytime.</div>
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
            <p>Long-form conversations at the edge of the contemplative life — with the teachers, scholars, and practitioners shaping how we understand these traditions.</p>
          </div>
          <div className="pod-grid">
            <div className="player">
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
              <div style={{ marginTop: 22 }}><a className="btn btn-outline-light" href={site.links.podcast.spreaker}>Browse all episodes →</a></div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS (placeholder quotes) */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow">From the community</span>
            <h2>Study that actually changes you</h2>
          </div>
          <div className="quotes">
            <div className="q"><div className="mark">“</div><p>I’ve taken workshops for fifteen years. This is the first place that treated me like a thinker and a practitioner at once.</p><div className="who">Maya R.</div><div className="role">Yoga teacher, Portland</div></div>
            <div className="q"><div className="mark">“</div><p>The weekly meditations gave me a daily practice that finally stuck. The lectures gave it meaning.</p><div className="who">David L.</div><div className="role">Wisdom School member</div></div>
            <div className="q"><div className="mark">“</div><p>Sādhana School was the most rigorous, most nourishing year of study I’ve ever done. Worth every hour.</p><div className="who">Priya S.</div><div className="role">Therapist &amp; scholar-practitioner</div></div>
          </div>
        </div>
      </section>

      {/* TARKA */}
      <section className="sec tarka" id="tarka">
        <div className="wrap tarka-inner">
          <div className="stack">
            <div className="issue" style={{ background: 'linear-gradient(160deg,#20302A,#2C4239)' }}>Death</div>
            <div className="issue" style={{ background: 'linear-gradient(160deg,#A5432A,#83341F)', marginTop: 22 }}>Bhakti</div>
            <div className="issue" style={{ background: 'linear-gradient(160deg,#B98A3E,#8a6526)' }}>Illusion</div>
          </div>
          <div>
            <span className="eyebrow">Our Journal</span>
            <h2 style={{ fontSize: 44, margin: '14px 0 6px' }}>Tarka</h2>
            <p className="serif-lead">A journal of yoga philosophy, contemplative studies, and the world’s wisdom traditions.</p>
            <p style={{ color: 'var(--ink-soft)', fontSize: 16, marginTop: 18, maxWidth: 480 }}>Essays, translations, and reflections from leading scholars and practitioners — now published and growing on Substack. Read freely, or go deeper with the collected print issues.</p>
            <div style={{ marginTop: 26, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a className="btn btn-primary" href={site.links.tarkaSubstack}>Read Tarka on Substack →</a>
              <a className="btn btn-ghost" href={site.links.tarkaPrint}>Browse print issues</a>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="sec about" id="about">
        <div className="wrap about-inner">
          <div className="founder" style={{ background: 'radial-gradient(80% 80% at 50% 25%, rgba(185,138,62,.30), transparent 65%), linear-gradient(160deg,#2C4239,#20302A)' }}>
            <svg viewBox="0 0 300 360" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} fill="none" opacity=".45" aria-hidden="true">
              <g stroke="#EADDC6" strokeWidth="1"><circle cx="150" cy="150" r="80" /><circle cx="150" cy="150" r="120" /></g>
              <circle cx="150" cy="150" r="10" fill="#A5432A" />
            </svg>
          </div>
          <div>
            <span className="eyebrow">Our Purpose</span>
            <blockquote>“We started Embodied Philosophy to take the wisdom traditions seriously — as living philosophy, not decoration. A place where the life of the mind and the life of practice belong together.”</blockquote>
            <div className="sig">— <b>Jacob Kyle</b>, Founder &amp; Director</div>
            <div style={{ marginTop: 24 }}><a className="btn btn-ghost" href="#">Read our story →</a></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap">
          <span className="eyebrow">Begin today — it’s free</span>
          <h2>Where ancient wisdom meets the modern life.</h2>
          <p>Get the free Yoga Philosophy Reading List and the weekly Living Room Letter. Start where you are.</p>
          <KitForm formId={KIT.join} button="Join free →" success="Welcome. Check your inbox to confirm." />
        </div>
      </section>
    </>
  );
}
