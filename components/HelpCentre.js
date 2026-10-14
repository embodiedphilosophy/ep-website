'use client';
import { useMemo, useState } from 'react';

// Opens Ether (the chat bubble from ep-support-agent's widget.js)
function openChat() {
  const btn = document.getElementById('ep-chat')?.shadowRoot?.querySelector('.btn');
  if (btn) btn.click();
  else window.location.href = '/contact';
}

export default function HelpCentre({ topics }) {
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return topics
      .filter(t => !topic || t.name === topic || needle)
      .map(t => ({ ...t, entries: needle ? t.entries.filter(e => (e.q + ' ' + e.a).toLowerCase().includes(needle)) : t.entries }))
      .filter(t => t.entries.length);
  }, [topics, q, topic]);

  const count = shown.reduce((n, t) => n + t.entries.length, 0);

  return (
    <div className="help">
      <label className="help-search">
        <span>Search the help centre</span>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Try “replay”, “sign in” or “refund”" />
      </label>

      {topics.length > 0 && (
        <div className="help-topics" role="group" aria-label="Topics">
          {topics.map(t => (
            <button type="button" key={t.name} aria-pressed={topic === t.name}
              className={topic === t.name ? 'on' : ''}
              onClick={() => { setTopic(topic === t.name ? null : t.name); setQ(''); }}>
              <strong>{t.name}</strong>
              <span>{t.blurb}</span>
              <em>{t.entries.length} {t.entries.length === 1 ? 'answer' : 'answers'}</em>
            </button>
          ))}
        </div>
      )}

      {q.trim() && <p className="help-count">{count} {count === 1 ? 'answer' : 'answers'} for “{q.trim()}”</p>}

      {shown.map(t => (
        <div className="help-group" key={t.name}>
          <h2>{t.name}</h2>
          {t.entries.map(e => (
            <details key={e.id} id={e.id}>
              <summary>{e.q}</summary>
              <p>{e.a}</p>
            </details>
          ))}
        </div>
      ))}

      {(topics.length === 0 || (q.trim() && count === 0)) && (
        <p className="help-empty">{topics.length === 0 ? 'Our help answers are being updated.' : 'Nothing matches that yet.'} Ask Ether in the chat and, if it can’t help, it will pass your question to our team.</p>
      )}

      <div className="help-contact">
        <div>
          <span className="eyebrow light">Still stuck?</span>
          <h2>Ask Ether, our <em>support assistant</em></h2>
          <p>Ether answers from this help centre, any time of day. If it can’t help, it passes your question to Ichha, who replies by email within two business days. We’re a small team of four, and we read everything.</p>
          <p className="help-fine">We will never ask for or email your password, only a reset link. All event times are Eastern Time (ET); prices are in US dollars.</p>
        </div>
        <button type="button" className="btn btn-light" onClick={openChat}>Open the chat</button>
      </div>
    </div>
  );
}
