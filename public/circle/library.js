/* Embodied Philosophy · Library by topic for Circle (ss.embodiedphilosophy.com/c/library)
   Loaded by public/circle/today.js (no extra Circle snippet needed). Draws the Library into the space, the same way as "This week"
   (no frame). Each member sees the rows their membership opens (the server decides), and can star items; stars are theirs alone.
   Removes itself when the member goes to another page. Data: /api/member/library (lib/library/load.js), /api/member/library/star.
   The courses come from Circle itself (the spaces of type course the member can open), filed by topic from the "Library Topics" tab (topic, second topic, format badge, note); plus Ops → Course Library and Settings → Library items. See docs/library-departments.md. */
(function () {
  if (window.__epLibrary) return; window.__epLibrary = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/library(-[a-z0-9]{3,10})?\/?$/;
  var SKEY = 'ep_library_session', DKEY = 'ep_library_dept';
  var HOST = '[data-testid="circle-ai-shell-workspace-body"]';
  var LEVELS = ['Foundations', 'Deepening', 'Advanced'];
  var SHOWN = 5; // topic chips before "+ N more topics"
  // /c/library?dept=Yoga%20philosophy opens that topic (the Wisdom School hub links here); names match without regard to case
  function urlDept() { var m = /[?&]dept=([^&]+)/.exec(location.search); try { return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : ''; } catch (e) { return ''; } }
  var state = { session: null, data: null, error: '', dept: urlDept() || store(DKEY) || '', all: false, msg: '', joined: null };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function safeUrl(u) { return /^https?:\/\//.test(String(u || '')) ? u : ''; }
  // Circle's own addresses open in the same window (members stay in Circle); anything else opens in a new tab
  function link(u, html, cls) { u = safeUrl(u); if (!u) return '<span class="' + cls + '">' + html + '</span>'; var own = /^https:\/\/ss\.embodiedphilosophy\.com/.test(u); return '<a class="' + cls + '" href="' + esc(u) + '"' + (own ? '' : ' target="_blank" rel="noopener"') + '>' + html + '</a>'; }

  // ---- sign-in: Circle's identity token → our bearer session (same as the Schedule page) ----
  function waitForUser(tries) {
    var u = window.circleUser;
    if (u && u.signedIn !== false && u.identityToken) return Promise.resolve(u);
    if (tries <= 0) return Promise.reject(new Error('not signed in'));
    return new Promise(function (res) { setTimeout(res, 400); }).then(function () { return waitForUser(tries - 1); });
  }
  function signIn() {
    var saved = store(SKEY);
    if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now()) { state.session = s.session; return Promise.resolve(); } } catch (e) {} }
    return waitForUser(25).then(function (u) {
      return fetch(API + '/api/member/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identityToken: u.identityToken }) }).then(function (r) { return r.json(); });
    }).then(function (r) {
      if (!r.session) throw new Error('not signed in');
      state.session = r.session;
      store(SKEY, JSON.stringify({ session: r.session, until: Date.now() + 11 * 3600 * 1000 }));
    });
  }
  function call(path, body, again) {
    return fetch(API + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ Authorization: 'Bearer ' + state.session }, body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 401 && !again) { store(SKEY, null); return signIn().then(function () { return call(path, body, true); }); }
          if (!r.ok) { var e = new Error(j.error || 'Something went wrong. Please try again.'); e.status = r.status; throw e; }
          return j;
        });
      });
  }
  var CKEY = function () { return 'ep_library_data_' + ((window.circleUser && window.circleUser.email) || ''); };
  function keep() { if (state.data) store(CKEY(), JSON.stringify({ d: state.data, j: state.joined })); }
  function cached() { try { var c = JSON.parse(store(CKEY()) || 'null'); if (c && c.d) { state.joined = c.j || null; return c.d; } return null; } catch (e) { return null; } }
  function load() {
    return Promise.all([call('/api/member/library'), access()]).then(function (r) { state.data = r[0]; state.error = ''; keep(); render(); })
      .catch(function (e) { if (!state.data) state.error = e.message; });
  }
  // Which Circle spaces this member has joined, straight from Circle (same browser session), so a space they can't open
  // shows locked and its card goes to the checkout instead of Circle's "This is a private space" page.
  function access() {
    var out = {};
    function page(n) {
      return fetch('/internal_api/spaces?per_page=100&page=' + n, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j || !j.records) return;
          j.records.forEach(function (sp) { if (sp && sp.slug) out[sp.slug] = sp.is_space_member !== false; });
          if (j.has_next_page && n < 5) return page(n + 1);
        });
    }
    return page(1).then(function () { state.joined = out; }, function () { state.joined = null; });
  }
  // A card is locked when it points at a Circle space this member hasn't joined (admins see everything open)
  function lockedItem(i) {
    if (!state.joined || (state.data && state.data.admin)) return false;
    var m = /^https:\/\/[^\/]+\/c\/([^\/?#]+)/.exec(i.url || '');
    return !!(m && state.joined[m[1]] === false);
  }

  function css() {
    if (document.getElementById('elb-css')) return;
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Inter:wght@400;500;600&display=swap'; document.head.appendChild(l); }
    var s = document.createElement('style'); s.id = 'elb-css';
    s.textContent = [
      '.elb{font-family:Inter,system-ui,sans-serif;color:#1E1A14;max-width:1180px;margin:0 auto;padding:28px 28px 64px;line-height:1.5;font-size:15px}',
      '.elb *{box-sizing:border-box}.elb a{text-decoration:none;color:inherit}.elb :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.elb-eye{font-size:12px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:#A5432A;margin:0 0 4px}',
      '.elb-h1{margin:0 0 20px;font:600 52px/1.05 "Cormorant Garamond",Georgia,serif;color:#1E1A14}',
      '.elb-chips{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:26px}',
      '.elb-chip{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 18px;border-radius:99px;border:1px solid #D8C9AE;background:#FBF8F1;color:#1E1A14;font:500 14px Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap}',
      '.elb-chip small{font-size:13px;color:#5A5346;font-weight:500}.elb-chip:hover{border-color:#20302A}',
      '.elb-chip[aria-pressed=true]{background:#20302A;border-color:#20302A;color:#fff}.elb-chip[aria-pressed=true] small{color:#D8C9AE}',
      '.elb-more{background:none;border:0;min-height:44px;padding:0 6px;color:#5A5346;font:500 14px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px}',
      '.elb-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px;align-items:start}',
      '.elb-col h2{margin:0 0 14px;padding-bottom:8px;border-bottom:2px solid #20302A;font:600 12px Inter,system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase}',
      '.elb-stack{display:grid;gap:14px}',
      '.elb-card{position:relative;background:#FAF5EB;border:1px solid #E2D6BE;border-radius:12px;padding:18px 20px;min-height:128px;display:flex;flex-direction:column;gap:12px}',
      '.elb-card:hover{border-color:#A5432A}',
      '.elb-lab{padding-right:54px;min-height:24px}',
      '.elb-fmt{display:inline-block;padding:3px 10px;border-radius:99px;background:#F1E4CC;color:#7A3220;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}',
      '.elb-note{font-size:12px;color:#5A5346;letter-spacing:.02em}',
      '.elb-card.is-locked{background:#F4EDDF}.elb-card.is-locked .elb-t{color:#5A5346}',
      '.elb-lock{display:inline-flex;align-items:center;gap:6px;margin-left:8px;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5A5346}',
      '.elb-lock svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.8}',
      '.elb-get{font-size:13px;font-weight:600;color:#A5432A;text-decoration:underline;text-underline-offset:3px}',
      '.elb-t{margin:0;padding-right:48px;font:600 23px/1.2 "Cormorant Garamond",Georgia,serif;color:#1E1A14}',
      '.elb-t a::after{content:"";position:absolute;inset:0;border-radius:12px}',
      '.elb-by{font-size:13px;color:#5A5346;margin-top:auto}',
      '.elb-star{position:absolute;top:14px;right:14px;z-index:2;width:44px;height:44px;border-radius:50%;border:1px solid #D8C9AE;background:#fff;display:grid;place-items:center;cursor:pointer;padding:0}',
      '.elb-star svg{width:19px;height:19px;fill:none;stroke:#20302A;stroke-width:1.6}',
      '.elb-star[aria-pressed=true]{background:#20302A;border-color:#20302A}.elb-star[aria-pressed=true] svg{fill:#C9A24B;stroke:#C9A24B}',
      '.elb-none{color:#5A5346;font-size:14px;margin:0}',
      '.elb-err{color:#9b2c16;font-size:14px;margin:0 0 12px}',
      '.elb-sk{height:128px;border-radius:12px;background:linear-gradient(90deg,#EADDC6 25%,#F3EADA 50%,#EADDC6 75%);background-size:200% 100%;animation:elbsh 1.4s ease-in-out infinite}',
      '@keyframes elbsh{to{background-position:-200% 0}}@media (prefers-reduced-motion:reduce){.elb-sk{animation:none}}',
      '@media (max-width:900px){.elb-cols{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:600px){.elb{padding:20px 16px 48px}.elb-h1{font-size:40px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.7l6.1-.9z" stroke-linejoin="round"/></svg>';
  var STARRED = '*starred*';
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function html() {
    function dbg(d) { return /epdebug=1/.test(location.search) ? '<p class="elb-none">Debug: ' + esc(JSON.stringify({ source: d.source, unavailable: d.unavailable })) + '</p>' : ''; }
    var head = '<p class="elb-eye">Library · By topic</p>';
    if (state.error && !state.data) return head + '<h1 class="elb-h1">Library</h1><p class="elb-none">' + esc(state.error) + '</p>';
    var d = state.data;
    if (!d) return head + '<h1 class="elb-h1">Library</h1><div class="elb-cols"><div class="elb-sk"></div><div class="elb-sk"></div><div class="elb-sk"></div></div>';
    var stars = {}; d.stars.forEach(function (id) { stars[id] = 1; });
    var starred = d.items.filter(function (i) { return stars[i.id]; });
    var depts = d.departments.slice();
    if (!d.items.length) return head + '<h1 class="elb-h1">Library</h1><p class="elb-none">The library is being filled in. Check back soon.</p>' + dbg(d);
    var want = String(state.dept).toLowerCase(), hit = depts.filter(function (x) { return x.name.toLowerCase() === want; })[0];
    if (hit) state.dept = hit.name;
    var cur = state.dept === STARRED && starred.length ? STARRED : (depts.some(function (x) { return x.name === state.dept; }) ? state.dept : depts[0].name);
    var items = cur === STARRED ? starred : d.items.filter(function (i) { return (i.topics || [i.department]).indexOf(cur) >= 0; });

    // the selected department is always shown, even when it would fall under "+ N more"
    var show = state.all ? depts : depts.slice(0, SHOWN);
    if (!state.all && cur !== STARRED && !show.some(function (x) { return x.name === cur; })) show = show.slice(0, SHOWN - 1).concat(depts.filter(function (x) { return x.name === cur; }));
    var chips = (starred.length ? '<button type="button" class="elb-chip" data-act="dept" data-name="' + STARRED + '" aria-pressed="' + (cur === STARRED) + '">★ Starred <small>' + starred.length + '</small></button>' : '') +
      show.map(function (x) { return '<button type="button" class="elb-chip" data-act="dept" data-name="' + esc(x.name) + '" aria-pressed="' + (x.name === cur) + '">' + esc(x.name) + ' <small>' + x.count + '</small></button>'; }).join('') +
      (depts.length > SHOWN ? '<button type="button" class="elb-more" data-act="more">' + (state.all ? 'Show fewer' : '+ ' + (depts.length - show.length) + ' more topic' + (depts.length - show.length === 1 ? '' : 's')) + '</button>' : '');

    var cols = LEVELS.map(function (lv) {
      var here = items.filter(function (i) { return i.level === lv; });
      return '<div class="elb-col"><h2>' + lv + '</h2><div class="elb-stack">' + (here.length ? here.map(function (i) {
        var on = !!stars[i.id], locked = lockedItem(i), href = locked ? (i.checkout || i.url) : i.url;
        return '<article class="elb-card' + (locked ? ' is-locked' : '') + '"><div class="elb-lab">' + (i.label ? '<span class="elb-fmt">' + esc(i.label) + '</span>' : '') + (locked ? '<span class="elb-lock">' + LOCK + 'Locked</span>' : '') + '</div>' +
          '<button type="button" class="elb-star" data-act="star" data-id="' + esc(i.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove star from ' : 'Star ') + esc(i.title) + '">' + STAR + '</button>' +
          '<h3 class="elb-t">' + link(href, esc(i.title), '') + '</h3>' + (i.note ? '<div class="elb-note">' + esc(i.note) + '</div>' : '') + (i.teachers ? '<div class="elb-by">' + esc(i.teachers) + '</div>' : '') + (locked && i.checkout ? '<span class="elb-get">Get access</span>' : '') + '</article>';
      }).join('') : '<p class="elb-none">Nothing here yet.</p>') + '</div></div>';
    }).join('');
    return head + '<h1 class="elb-h1">' + (cur === STARRED ? 'Starred' : esc(cur)) + '</h1>' + (state.msg ? '<p class="elb-err" role="alert">' + esc(state.msg) + '</p>' : '') +
      '<div class="elb-chips">' + chips + '</div><div class="elb-cols">' + cols + '</div>';
  }

  var root = null;
  function render() { if (root && document.body.contains(root)) root.innerHTML = html(); }
  function onClick(e) {
    var t = e.target.closest('[data-act]');
    if (!t || !root.contains(t)) return;
    var a = t.dataset.act;
    if (a === 'dept') { state.dept = t.dataset.name; store(DKEY, state.dept); render(); }
    else if (a === 'more') { state.all = !state.all; render(); }
    else if (a === 'star') {
      var id = t.dataset.id, d = state.data, was = d.stars.indexOf(id) >= 0;
      // the star changes at once; if saving fails it goes back and says so
      d.stars = was ? d.stars.filter(function (x) { return x !== id; }) : d.stars.concat(id); state.msg = ''; keep(); render();
      call('/api/member/library/star', { id: id, on: !was }).catch(function (er) {
        d.stars = was ? d.stars.concat(id) : d.stars.filter(function (x) { return x !== id; }); state.msg = er.message; keep(); render();
      });
    }
  }

  function mount() {
    if (!PAGE.test(location.pathname)) return;
    if (root && document.body.contains(root)) return;
    var box = document.querySelector(HOST);
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    root = document.createElement('div'); root.__box = box;
    root.className = 'elb'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Library');
    root.addEventListener('click', onClick);
    box.insertBefore(root, box.firstChild);
    render();
  }
  // Leaving the page: take our page out and give Circle's back
  function unmount() {
    if (!root) return;
    var box = root.__box; root.remove(); root = null;
    if (box) for (var i = 0; i < box.children.length; i++) box.children[i].style.display = '';
  }

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css();
    state.data = cached(); mount(); render();
    signIn().then(function () { mount(); return load(); })
      .catch(function () { state.error = 'Please sign in to Circle to see the library.'; })
      .then(function () { mount(); render(); });
  }
  start();
  var t = null;
  new MutationObserver(function () {
    if (t) return;
    t = setTimeout(function () {
      t = null;
      if (!PAGE.test(location.pathname)) { unmount(); return; }
      start(); if (started) mount();
    }, 250);
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', function () { if (!PAGE.test(location.pathname)) unmount(); });
})();
