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
  var PAGE = /^\/c\/today\/?$/; // the "Today" space in Circle (Sahṛdaya Upāya · Mentorship)
  var LINKS = [['Fall Live Sessions', '/c/fall-live-sessions'], ['Fall Recordings & Readings', '/c/fall-recordings-readings'], ['Practice Resources', '/c/practice-resources'], ['Open Sessions', '/c/open-sessions']];
  var MENTEE_LINKS = [['Mentorship Circle', '/c/mentorship-circle'], ['Mentorship Sessions', '/c/mentorship-sessions'], ['Apprentice Workbook', '/c/apprentice-workbook']];
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
        state.events = (j.events || []).filter(function (e) { return /s[aā]dhana/i.test((e.program || '') + ' ' + (e.title || '')) && (e.end_date || e.date) >= today; }).slice(0, 5);
        state.event = state.events[0] || null;
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
      '.ept :focus-visible,.ept-page :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.ept-link{color:#A5432A;font-size:13px;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}',
      '.ept-page{max-width:1040px;margin:0 auto;padding:24px 20px 48px;color:#1E1A14}',
      '.ept-page *{box-sizing:border-box}',
      '.ept-h1{font-size:36px}',
      '.ept-pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:16px;align-items:start}',
      '.ept-card{background:#FBF6EE;border:1px solid #E3D8C6;border-radius:6px;padding:18px 20px;display:flex;flex-direction:column;gap:10px}',
      '.ept-ch{display:flex;justify-content:space-between;align-items:baseline;gap:10px}',
      '.ept-h2{margin:0;font:600 24px/1.1 "Cormorant Garamond",Georgia,serif}',
      '.ept-row{display:flex;gap:16px;align-items:baseline;flex-wrap:wrap}',
      '.ept-xl{font-size:32px}',
      '.ept-heat-l{grid-template-columns:repeat(8,16px)}.ept-heat-l .ept-col{grid-template-rows:repeat(7,16px)}.ept-heat-l .ept-d{width:16px;height:16px}',
      '.ept-ms-chip{font:500 11.5px/1 "IBM Plex Mono",ui-monospace,monospace;padding:5px 8px;border:1px solid #D8C9AE;border-radius:4px;color:#6B6152}',
      '.ept-ms-chip.on{background:#A5432A;border-color:#A5432A;color:#fff}',
      '.ept-ev{display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px;padding:10px 0;border-top:1px solid #E3D8C6;align-items:center}',
      '.ept-mono{font:500 12px/1.4 "IBM Plex Mono",ui-monospace,monospace;color:#6B6152}',
      '.ept-li{display:flex;justify-content:space-between;padding:11px 0;border-top:1px solid #E3D8C6;color:#1E1A14;text-decoration:none}',
      '.ept-li:hover{color:#A5432A}',
      '.ept-page .ept-form{padding:14px;border:1px solid #E3D8C6;border-radius:4px}'
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
      '<h2 class="ept-h">Today, <em>' + esc(state.first || 'sādhaka') + '</em></h2></div><a class="ept-link" href="/c/today">Open Today →</a></div><div class="ept-grid">';
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
    if (state.form && p) out += formHtml(p);
    return out + '</div>';
  }

  function formHtml(p) {
    return '<form class="ept-form" data-form="log"><span class="ept-l">Today’s practice</span>' +
        '<label class="ept-s">Minutes <input class="ept-in" name="minutes" type="number" min="0" max="600" inputmode="numeric" value="' + esc(state.minutes || '') + '"></label>' +
        '<span class="ept-s">Quality of practice</span><div class="ept-chips" role="group" aria-label="Quality of practice">' + p.qualities.map(function (q) { return '<button type="button" class="ept-chip" data-q="' + esc(q) + '" aria-pressed="' + (state.quality === q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
        '<span class="ept-s">Greater body of sādhana</span><div class="ept-chips" role="group" aria-label="Other practices">' + (p.extras || []).map(function (x) { return '<button type="button" class="ept-chip" data-x="' + esc(x) + '" aria-pressed="' + ((state.extras || []).indexOf(x) >= 0) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:8px"><button class="ept-btn" type="submit"' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? 'Saving…' : 'Save') + '</button><button class="ept-q" type="button" data-act="close">Cancel</button></div>' +
        (state.error ? '<span class="ept-err">' + esc(state.error) + '</span>' : '') + '</form>';
  }

  function pageHtml() {
    var p = state.practice, evs = state.events || [];
    var d = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    var out = '<div class="ept-top"><div><div class="ept-eye">' + esc(EYEBROW[state.tier] || 'Today') + ' · ' + esc(d) + '</div>' +
      '<h1 class="ept-h ept-h1">Good ' + greet() + ', <em>' + esc(state.first || 'sādhaka') + '</em>.</h1></div></div>';
    out += '<div class="ept-pg">';
    // Practice
    out += '<section class="ept-card" aria-labelledby="ept-p"><div class="ept-ch"><h2 id="ept-p" class="ept-h2">Practice</h2><span class="ept-l">Sahṛdaya Meditation</span></div>';
    if (p) {
      out += '<div class="ept-row"><span class="ept-big ept-xl">' + p.streak + '<small> day streak</small></span><span class="ept-s">' + p.weekCount + ' of 7 this week</span></div>';
      out += '<div class="ept-heat ept-heat-l" role="img" aria-label="Your last eight weeks of practice">' + p.grid.map(function (col) {
        return '<div class="ept-col">' + col.map(function (c) { return '<span class="ept-d ' + c.state + '" title="' + esc(c.day) + '"></span>'; }).join('') + '</div>';
      }).join('') + '</div>';
      out += '<div class="ept-chips">' + [7, 21, 40, 108].map(function (m) { return '<span class="ept-ms-chip' + (p.streak >= m ? ' on' : '') + '">' + m + ' days</span>'; }).join('') + '</div>';
      if (p.reached && MS_TEXT[p.reached]) out += '<div class="ept-ms" role="status"><strong>' + MS_TEXT[p.reached] + '</strong>' + (p.nextMilestone ? ' Next milestone: ' + p.nextMilestone + ' days.' : '') + '</div>';
      if (state.form) out += formHtml(p);
      else out += p.loggedToday ? '<button class="ept-q" data-act="form">Logged today · edit</button>' : '<button class="ept-btn" data-act="form">Log today’s practice</button>';
    } else out += '<span class="ept-err">' + esc(state.error || 'Loading…') + '</span>';
    out += '</section>';
    // Coming up
    out += '<section class="ept-card" aria-labelledby="ept-c"><div class="ept-ch"><h2 id="ept-c" class="ept-h2">Coming up</h2><a class="ept-link" href="/events">All events</a></div>';
    if (evs.length) out += evs.map(function (e) { return '<div class="ept-ev"><span class="ept-mono">' + esc(niceDate(e.date)) + '<br>' + esc(e.time || '') + '</span><span class="ept-t">' + esc(e.title) + '</span></div>'; }).join('');
    else out += '<span class="ept-s">Nothing scheduled yet.</span>';
    out += '</section>';
    // Mentor (mentees)
    if (state.tier === 'mentee') {
      out += '<section class="ept-card" aria-labelledby="ept-m"><div class="ept-ch"><h2 id="ept-m" class="ept-h2">Your mentor</h2><span class="ept-l">Jacob Kyle</span></div>' +
        '<span class="ept-t">Monthly one-to-one · 45 minutes</span><span class="ept-s">Book in the last week of the month, UK evenings.</span>' +
        '<div class="ept-chips"><a class="ept-btn" target="_blank" rel="noopener" href="' + BOOKING + '">Book a time</a><a class="ept-q" href="/messages">Message Jacob</a></div></section>';
    }
    // Links
    var links = (state.tier === 'mentee' ? MENTEE_LINKS : []).concat(LINKS);
    out += '<section class="ept-card" aria-labelledby="ept-k"><div class="ept-ch"><h2 id="ept-k" class="ept-h2">Your spaces</h2></div>' +
      links.map(function (l) { return '<a class="ept-li" href="' + l[1] + '">' + esc(l[0]) + '<span aria-hidden="true">→</span></a>'; }).join('') + '</section>';
    return out + '</div>';
  }

  function greet() { var h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; }

  var root = null, pageRoot = null;
  function render() {
    if (root && document.body.contains(root)) root.innerHTML = html();
    if (pageRoot && document.body.contains(pageRoot)) pageRoot.innerHTML = pageHtml();
  }

  function onClick(e) {
    var t = e.target.closest('[data-act],[data-q],[data-x]');
    if (!t || !e.currentTarget.contains(t)) return;
    if (t.dataset.x) { var xs = state.extras || []; var i0 = xs.indexOf(t.dataset.x); state.extras = i0 >= 0 ? xs.filter(function (z) { return z !== t.dataset.x; }) : xs.concat([t.dataset.x]); render(); return; }
    if (t.dataset.q) { state.quality = state.quality === t.dataset.q ? '' : t.dataset.q; render(); return; }
    if (t.dataset.act === 'form') { state.form = true; state.error = ''; render(); var i = e.currentTarget.querySelector('input[name=minutes]'); if (i) i.focus(); }
    if (t.dataset.act === 'close') { state.form = false; render(); }
  }
  function onInput(e) { if (e.target.name === 'minutes') state.minutes = e.target.value; }
  function onSubmit(e) {
    if (!e.target.matches('[data-form=log]')) return;
    e.preventDefault();
    state.minutes = e.target.minutes.value; state.saving = true; state.error = ''; render();
    api('/api/member/practice', { method: 'POST', body: { today: localToday(), minutes: state.minutes, quality: state.quality || '', extras: state.extras || [] } })
      .then(function (p) { state.practice = p; state.form = false; })
      .catch(function (err) { state.error = err.status === 401 ? 'Please refresh the page and try again.' : err.message; if (err.status === 401) store('ep_today_session', ''); })
      .then(function () { state.saving = false; render(); });
  }

  function pageContainer() {
    // Circle's content area for a space: the "[container-type:inline-size] bg-secondary" wrapper
    var all = document.querySelectorAll('div');
    for (var i = 0; i < all.length; i++) { var c = String(all[i].className || ''); if (c.indexOf('container-type:inline-size') >= 0 && c.indexOf('bg-secondary') >= 0) return all[i]; }
    return null;
  }
  function mountPage() {
    if (!PAGE.test(location.pathname)) return;
    if (pageRoot && document.body.contains(pageRoot)) return;
    var box = pageContainer();
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    pageRoot = document.createElement('div');
    pageRoot.className = 'ept-page'; pageRoot.setAttribute('role', 'region'); pageRoot.setAttribute('aria-label', 'Today');
    pageRoot.addEventListener('click', onClick);
    pageRoot.addEventListener('submit', onSubmit);
    pageRoot.addEventListener('input', onInput);
    box.insertBefore(pageRoot, box.firstChild);
    render();
  }

  function mount() {
    mountPage();
    if (!FEED.test(location.pathname) || !FEED_OK()) return;
    if (root && document.body.contains(root)) return;
    var a = anchor();
    if (!a) return;
    root = document.createElement('section');
    root.className = 'ept'; root.setAttribute('aria-label', 'Today');
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    root.addEventListener('input', onInput);
    a.parentElement.insertBefore(root, a);
    render();
  }

  // Members in SHOW_FOR see the strip and the Today page. Admins preview the page any time and the strip with
  // ?today=1; ?as=mentee or ?as=ss_year previews that tier's view.
  function isAdmin() { var u = window.circleUser || {}; return !!u.isAdmin; }
  function FEED_OK() { return SHOW_FOR.indexOf(state.tier) >= 0 || (isAdmin() && /[?&]today=1/.test(location.search)); }
  function allowed() { return SHOW_FOR.indexOf(state.tier) >= 0 || isAdmin(); }

  signIn().then(function () {
    var as = (location.search.match(/[?&]as=(mentee|ss_year)\b/) || [])[1];
    if (as && isAdmin()) state.tier = as;
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
