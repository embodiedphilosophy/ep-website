/* Embodied Philosophy · Today strip for Circle (ss.embodiedphilosophy.com)
   Loaded by one line in Circle → Settings → Code snippets → JavaScript:
     (function(){var s=document.createElement('script');s.src='https://www.embodiedphilosophy.com/circle/today.js';s.defer=true;document.head.appendChild(s);})();
   Shows a Today strip at the top of the Circle feed for the tiers in SHOW_FOR: daily practice log,
   this week's next live session, and (mentees) the monthly one-to-one. Admins can preview it with ?today=1. */
(function () {
  if (window.__epToday) return; window.__epToday = true;

  var API = 'https://www.embodiedphilosophy.com';
  var SHOW_FOR = ['ss_year', 'mentee']; // first release: Sādhana School annual + Sahṛdaya Upāya
  var BOOKING = 'https://calendly.com/embodied-philosophy/sah-daya-upaya-monthly-1-1-mentorship';
  var FEED = /^\/(feed|home)?\/?$/;
  var state = { session: null, tier: null, first: '', practice: null, event: null, form: false, saving: false, error: '' };

  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function localToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function niceDate(s) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return s; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    if (state.session) headers.Authorization = 'Bearer ' + state.session;
    return fetch(API + path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Something went wrong'); e.status = r.status; throw e; } return j; }); });
  }

  function waitForUser(tries) {
    var u = window.circleUser;
    if (u && u.signedIn !== false && u.identityToken) return Promise.resolve(u);
    if (tries <= 0) return Promise.reject(new Error('not signed in'));
    return new Promise(function (res) { setTimeout(res, 400); }).then(function () { return waitForUser(tries - 1); });
  }

  function signIn() {
    var saved = store('ep_today_session');
    if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now()) { state.session = s.session; state.tier = s.tier; state.first = s.first; return Promise.resolve(); } } catch (e) {} }
    return waitForUser(25).then(function (u) {
      return api('/api/member/session', { method: 'POST', body: { identityToken: u.identityToken } });
    }).then(function (r) {
      state.session = r.session; state.tier = r.tier && r.tier.tier; state.first = r.firstName || '';
      store('ep_today_session', JSON.stringify({ session: r.session, tier: state.tier, first: state.first, until: Date.now() + 10 * 60 * 60 * 1000 }));
    });
  }

  function loadData() {
    return Promise.all([
      api('/api/member/practice?today=' + localToday()).then(function (p) { state.practice = p; }).catch(function (e) { state.error = e.message; }),
      fetch(API + '/api/events').then(function (r) { return r.json(); }).then(function (j) {
        var today = localToday();
        state.event = (j.events || []).filter(function (e) { return /s[aā]dhana/i.test((e.program || '') + ' ' + (e.title || '')) && (e.end_date || e.date) >= today; })[0] || null;
      }).catch(function () {})
    ]);
  }

  function css() {
    if (document.getElementById('ept-css')) return;
    var s = document.createElement('style'); s.id = 'ept-css';
    s.textContent = [
      '.ept{background:#FBF6EE;border:1px solid #E3D8C6;border-radius:6px;box-shadow:inset 0 3px 0 #A5432A;padding:18px 20px;margin:0 0 14px;font-family:inherit;color:#1E1A14}',
      '.ept *{box-sizing:border-box}',
      '.ept-top{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:12px}',
      '.ept-eye{font:500 10.5px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em;color:#A5432A;text-transform:uppercase}',
      '.ept-h{margin:2px 0 0;font:600 26px/1.1 "Cormorant Garamond",Georgia,serif}',
      '.ept-h em{color:#A5432A}',
      '.ept-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1px;background:#FFFDF8;border:1px solid #E3D8C6;border-radius:4px;overflow:hidden}',
      '.ept-cell{background:#FFFDF8;padding:14px;display:flex;flex-direction:column;gap:8px;box-shadow:0 0 0 1px #E3D8C6}',
      '.ept-l{font:500 10.5px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em;color:#6B6152;text-transform:uppercase}',
      '.ept-big{font:500 24px/1 "IBM Plex Mono",ui-monospace,monospace;color:#A5432A}',
      '.ept-big small{font-size:11px;color:#6B6152}',
      '.ept-t{font-weight:600;line-height:1.3}',
      '.ept-s{font-size:12px;color:#6B6152}',
      '.ept-btn{background:#A5432A;color:#fff;border:0;border-radius:4px;min-height:38px;padding:0 14px;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}',
      '.ept-btn:hover{background:#83341F;color:#fff}',
      '.ept-btn:disabled{opacity:.5;cursor:default}',
      '.ept-q{background:transparent;border:1px solid #D8C9AE;border-radius:4px;min-height:38px;padding:0 12px;font-size:13px;color:#1E1A14;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}',
      '.ept-q:hover{border-color:#1E1A14}',
      '.ept-chips{display:flex;flex-wrap:wrap;gap:6px}',
      '.ept-chip{background:transparent;border:1px solid #D8C9AE;border-radius:999px;min-height:32px;padding:0 11px;font-size:12.5px;cursor:pointer;color:#1E1A14}',
      '.ept-chip[aria-pressed="true"]{background:#1E1A14;color:#FBF6EE;border-color:#1E1A14}',
      '.ept-form{grid-column:1/-1;background:#FFFDF8;padding:14px;display:flex;flex-direction:column;gap:10px}',
      '.ept-in{width:90px;min-height:38px;border:1px solid #D8C9AE;border-radius:4px;padding:0 10px;background:#fff}',
      '.ept-heat{display:grid;grid-template-columns:repeat(8,12px);gap:3px}',
      '.ept-col{display:grid;grid-template-rows:repeat(7,12px);gap:3px}',
      '.ept-d{width:12px;height:12px;border-radius:2px;background:#E8D9C2}',
      '.ept-d.done{background:#A5432A}.ept-d.today{background:transparent;box-shadow:inset 0 0 0 1.5px #A5432A}.ept-d.future{background:transparent;box-shadow:inset 0 0 0 1px #E3D8C6}',
      '.ept-ms{grid-column:1/-1;background:#A5432A;color:#fff;padding:12px 14px;font-size:13px}',
      '.ept-err{font-size:12px;color:#83341F}',
      '.ept :focus-visible{outline:2px solid #A5432A;outline-offset:2px}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function anchor() {
    // Circle's "Start a post" box at the top of the feed; the strip goes just above it.
    // Circle's feed column has a "space-y-*" class (pinned welcome post, composer, posts); the strip goes at its top.
    var nodes = document.querySelectorAll('p, span, div, button');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length === 0 && /^\s*Start a post\s*$/.test(n.textContent || '')) {
        var card = n, fallback = null;
        for (var k = 0; k < 12 && card && card.parentElement; k++) {
          if (/(^|\s)space-y-/.test(String(card.parentElement.className || ''))) return card.parentElement.firstElementChild;
          if (!fallback && card.parentElement.children.length > 1 && card.offsetWidth > 300) fallback = card;
          card = card.parentElement;
        }
        if (fallback) return fallback;
      }
    }
    return null;
  }

  var MS_TEXT = { 7: 'Seven days in a row.', 21: 'Twenty-one days unbroken.', 40: 'Forty days unbroken.', 108: 'One hundred and eight days of sādhana.' };
  var EYEBROW = { mentee: 'Sahṛdaya Upāya · Today', ss_year: 'Sādhana School · Today' };

  function html() {
    var p = state.practice, ev = state.event;
    var out = '<div class="ept-top"><div><div class="ept-eye">' + esc(EYEBROW[state.tier] || 'Today') + '</div>' +
      '<h2 class="ept-h">Today, <em>' + esc(state.first || 'sādhaka') + '</em></h2></div></div><div class="ept-grid">';
    // Practice
    out += '<div class="ept-cell"><span class="ept-l">Daily practice</span>';
    if (p) {
      out += '<span class="ept-big">' + p.streak + '<small> day' + (p.streak === 1 ? '' : 's') + '</small></span>';
      out += '<div class="ept-heat" role="img" aria-label="Your last eight weeks of practice">' + p.grid.map(function (col) {
        return '<div class="ept-col">' + col.map(function (c) { return '<span class="ept-d ' + c.state + '"></span>'; }).join('') + '</div>';
      }).join('') + '</div>';
      out += '<span class="ept-s">' + p.weekCount + ' of 7 this week' + (p.nextMilestone ? ' · next milestone ' + p.nextMilestone : '') + '</span>';
      out += p.loggedToday ? '<button class="ept-q" data-act="form">Logged today · edit</button>' : '<button class="ept-btn" data-act="form">Log today’s practice</button>';
    } else out += '<span class="ept-err">' + esc(state.error || 'Loading…') + '</span>';
    out += '</div>';
    // Next session
    out += '<div class="ept-cell"><span class="ept-l">Next live session</span>';
    if (ev) out += '<span class="ept-t">' + esc(ev.title) + '</span><span class="ept-s">' + esc(niceDate(ev.date)) + (ev.time ? ' · ' + esc(ev.time) : '') + '</span>';
    else out += '<span class="ept-s">Nothing scheduled this week.</span>';
    out += '<a class="ept-q" href="/events">See what’s coming up</a></div>';
    // One-to-one (mentees)
    if (state.tier === 'mentee') {
      out += '<div class="ept-cell"><span class="ept-l">Your monthly 1:1</span><span class="ept-t">Book in the last week of the month</span>' +
        '<span class="ept-s">45 minutes with Jacob · UK evenings</span><a class="ept-btn" target="_blank" rel="noopener" href="' + BOOKING + '">Book a time</a></div>';
    }
    if (p && p.reached && MS_TEXT[p.reached]) out += '<div class="ept-ms" role="status"><strong>' + MS_TEXT[p.reached] + '</strong>' + (p.nextMilestone ? ' Next milestone: ' + p.nextMilestone + ' days.' : '') + '</div>';
    if (state.form && p) {
      out += '<form class="ept-form" data-form="log"><span class="ept-l">Today’s practice</span>' +
        '<label class="ept-s">Minutes <input class="ept-in" name="minutes" type="number" min="0" max="600" inputmode="numeric" value="' + esc(state.minutes || '') + '"></label>' +
        '<div class="ept-chips" role="group" aria-label="Quality of practice">' + p.qualities.map(function (q) { return '<button type="button" class="ept-chip" data-q="' + esc(q) + '" aria-pressed="' + (state.quality === q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:8px"><button class="ept-btn" type="submit"' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? 'Saving…' : 'Save') + '</button><button class="ept-q" type="button" data-act="close">Cancel</button></div>' +
        (state.error ? '<span class="ept-err">' + esc(state.error) + '</span>' : '') + '</form>';
    }
    return out + '</div>';
  }

  var root = null;
  function render() {
    if (!root) return;
    root.innerHTML = html();
  }

  function onClick(e) {
    var t = e.target.closest('[data-act],[data-q]');
    if (!t || !root.contains(t)) return;
    if (t.dataset.q) { state.quality = state.quality === t.dataset.q ? '' : t.dataset.q; render(); return; }
    if (t.dataset.act === 'form') { state.form = true; state.error = ''; render(); var i = root.querySelector('input[name=minutes]'); if (i) i.focus(); }
    if (t.dataset.act === 'close') { state.form = false; render(); }
  }
  function onSubmit(e) {
    if (!e.target.matches('[data-form=log]')) return;
    e.preventDefault();
    state.minutes = e.target.minutes.value; state.saving = true; state.error = ''; render();
    api('/api/member/practice', { method: 'POST', body: { today: localToday(), minutes: state.minutes, quality: state.quality || '' } })
      .then(function (p) { state.practice = p; state.form = false; })
      .catch(function (err) { state.error = err.status === 401 ? 'Please refresh the page and try again.' : err.message; if (err.status === 401) store('ep_today_session', ''); })
      .then(function () { state.saving = false; render(); });
  }

  function mount() {
    if (!FEED.test(location.pathname)) return;
    if (root && document.body.contains(root)) return;
    var a = anchor();
    if (!a) return;
    root = document.createElement('section');
    root.className = 'ept'; root.setAttribute('aria-label', 'Today');
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    a.parentElement.insertBefore(root, a);
    render();
  }

  function allowed() {
    if (SHOW_FOR.indexOf(state.tier) >= 0) return true;
    var u = window.circleUser || {};
    return !!(u.isAdmin && /[?&]today=1/.test(location.search));
  }

  signIn().then(function () {
    if (!allowed()) return;
    css();
    return loadData().then(function () {
      mount();
      // Circle is a single-page app: re-check when the page changes
      var t = null;
      new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; mount(); }, 300); }).observe(document.body, { childList: true, subtree: true });
    });
  }).catch(function () { /* signed out or not available: show nothing */ });
})();
