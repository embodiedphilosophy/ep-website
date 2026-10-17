/* Embodied Philosophy · "My Practice", the Meditation Pass homepage (ss.embodiedphilosophy.com/c/my-practice)
   Loaded by public/circle/today.js (no extra Circle snippet needed). Draws the page into the space, the same way as "This week"
   (no frame), for Meditation Pass members and Circle admins only: for anyone else it does nothing. Removes itself the moment
   the member goes to another page. Data: /api/member/my-practice (lib/meditation/load.js); practice log: /api/member/practice.
   Links come from data/meditation-pass.json. See docs/meditation-pass-home.md. */
(function () {
  if (window.__epMyPractice) return; window.__epMyPractice = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/my-practice(-[a-z0-9]{3,10})?\/?$/;
  var SKEY = 'ep_mypractice_session';
  var HOST = '[data-testid="circle-ai-shell-workspace-body"]';
  var state = { session: null, ok: null, data: null, error: '', logOpen: false, minutes: '20', busy: false, msg: '' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function localToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dayOf(iso) { var d = new Date(iso); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function safeUrl(u) { return /^https?:\/\//.test(String(u || '')) ? u : ''; }
  // Circle's own addresses open in the same window (members stay in Circle); anything else opens in a new tab
  function a(u, html, cls) { u = safeUrl(u); if (!u) return '<span class="' + cls + '">' + html + '</span>'; var own = /^https:\/\/ss\.embodiedphilosophy\.com/.test(u); return '<a class="' + cls + '" href="' + esc(u) + '"' + (own ? '' : ' target="_blank" rel="noopener"') + '>' + html + '</a>'; }

  // ---- sign-in: Circle's identity token → our bearer session (same as the Schedule page) ----
  function waitForUser(tries) {
    var u = window.circleUser;
    if (u && u.signedIn !== false && u.identityToken) return Promise.resolve(u);
    if (tries <= 0) return Promise.reject(new Error('not signed in'));
    return new Promise(function (res) { setTimeout(res, 400); }).then(function () { return waitForUser(tries - 1); });
  }
  function signIn() {
    var saved = store(SKEY);
    if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now()) { state.session = s.session; state.ok = !!s.ok; return Promise.resolve(); } } catch (e) {} }
    return waitForUser(25).then(function (u) {
      return fetch(API + '/api/member/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identityToken: u.identityToken }) }).then(function (r) { return r.json(); });
    }).then(function (r) {
      if (!r.session) throw new Error('not signed in');
      state.session = r.session; state.ok = !!(r.admin || (r.tier && r.tier.tier === 'meditation'));
      store(SKEY, JSON.stringify({ session: r.session, ok: state.ok, until: Date.now() + 11 * 3600 * 1000 }));
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
  var DKEY = function () { return 'ep_mypractice_data_' + ((window.circleUser && window.circleUser.email) || ''); };
  function keep(d) { if (d && d.practice) store(DKEY(), JSON.stringify({ day: localToday(), d: d })); }
  function cached() { try { var c = JSON.parse(store(DKEY()) || 'null'); return c && c.day === localToday() ? c.d : null; } catch (e) { return null; } }
  function load() {
    return call('/api/member/my-practice?today=' + localToday()).then(function (d) { state.data = d; state.error = ''; keep(d); render(); })
      .catch(function (e) { if (!state.data) state.error = e.status === 403 ? 'This page is for Meditation Pass members.' : e.message; });
  }

  // "this Monday", "today", "tomorrow", or the date
  function when(iso) {
    var now = new Date(), today = localToday(), day = dayOf(iso);
    var diff = Math.round((Date.parse(day + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 864e5);
    var wd = new Date(iso).toLocaleDateString(undefined, { weekday: 'long' });
    if (diff === 0) return 'today'; if (diff === 1) return 'tomorrow';
    if (diff > 1 && diff < 7) return 'this ' + wd;
    return wd + ' ' + new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
  }
  function liveNow(n) { var s = Date.parse(n.start), e = Date.parse(n.end) || s + 3600e3; return s - 10 * 60000 <= Date.now() && Date.now() <= e + 30 * 60000; }

  function css() {
    if (document.getElementById('emp-css')) return;
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Inter:wght@400;500;600&display=swap'; document.head.appendChild(l); }
    var s = document.createElement('style'); s.id = 'emp-css';
    s.textContent = [
      '.emp{font-family:Inter,system-ui,sans-serif;color:#1E1A14;max-width:1180px;margin:0 auto;padding:28px 28px 64px;line-height:1.5;font-size:15px}',
      '.emp *{box-sizing:border-box}.emp a{text-decoration:none}.emp :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.emp-eye{font-size:12px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:#A5432A;margin:0 0 4px}',
      '.emp-h1{margin:0 0 22px;font:600 52px/1.05 "Cormorant Garamond",Georgia,serif;color:#1E1A14}',
      '.emp-next{display:flex;justify-content:space-between;align-items:center;gap:16px;background:#9A4A33;color:#fff;border-radius:14px;padding:16px 24px;margin-bottom:18px}',
      '.emp-next .l{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;opacity:.9}.emp-next .t{font-weight:600;font-size:18px;line-height:1.3}',
      '.emp-next .go{flex:none;color:#fff;font-weight:600;font-size:14px}',
      '.emp-dark{background:#20302A;color:#F6EFE2;border-radius:14px;padding:26px 30px;margin-bottom:26px}',
      '.emp-dark .l{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#C9A24B}',
      '.emp-dark h2{margin:6px 0 10px;font:600 40px/1.1 "Cormorant Garamond",Georgia,serif;color:#fff}',
      '.emp-dark p{margin:0 0 16px;font-size:16px}',
      '.emp-chips{display:flex;gap:8px;flex-wrap:wrap}.emp-chip{display:inline-flex;align-items:center;min-height:36px;padding:0 14px;border-radius:99px;background:rgba(246,239,226,.12);color:#fff!important;font-weight:600;font-size:13px}',
      '.emp-chip:hover{background:rgba(246,239,226,.2)}',
      '.emp-lab{font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#5A5346;margin:0 0 10px}',
      '.emp-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:26px}',
      '.emp-card{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;text-align:left;background:#FAF5EB;border:1px solid #E2D6BE;border-radius:12px;padding:18px 20px;min-height:100px;color:inherit!important;cursor:pointer;font:inherit}',
      '.emp-card:hover{border-color:#A5432A}',
      '.emp-card .t{font:600 24px/1.2 "Cormorant Garamond",Georgia,serif;color:#1E1A14;margin:0 0 4px}.emp-card .u{font-size:13.5px;color:#5A5346}',
      '.emp-card.open{cursor:default;grid-column:span 1}.emp-card.open:hover{border-color:#E2D6BE}',
      '.emp-form{display:grid;gap:8px;margin-top:10px}.emp-form label{font-weight:600;font-size:13px}',
      '.emp-form input{width:100%;font:16px Inter,system-ui,sans-serif;padding:10px 12px;border:1px solid #D8C9AE;border-radius:8px;background:#fff;min-height:44px}',
      '.emp-acts{display:flex;gap:8px;flex-wrap:wrap}',
      '.emp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border-radius:8px;border:1px solid transparent;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}',
      '.emp-btn.pri{background:#A5432A;color:#fff}.emp-btn.out{background:#FBF8F1;border-color:#D8C9AE;color:#1E1A14}.emp-btn:disabled{opacity:.55;cursor:default}',
      '.emp-err{color:#9b2c16;font-size:14px;margin:8px 0 0}.emp-ok{color:#20302A;font-weight:600;font-size:14px;margin:0}',
      '.emp-ready{display:flex;justify-content:space-between;align-items:center;gap:16px;border:2px dashed #A5432A;border-radius:14px;padding:16px 24px;color:inherit!important}',
      '.emp-ready .l{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#A5432A}.emp-ready .t{font:600 26px/1.25 "Cormorant Garamond",Georgia,serif;color:#1E1A14}',
      '.emp-ready .go{flex:none;color:#A5432A;font-weight:600;font-size:14px}',
      '.emp-sk{height:80px;border-radius:14px;margin-bottom:18px;background:linear-gradient(90deg,#EADDC6 25%,#F3EADA 50%,#EADDC6 75%);background-size:200% 100%;animation:empsh 1.4s ease-in-out infinite}.emp-sk.tall{height:180px}',
      '@keyframes empsh{to{background-position:-200% 0}}@media (prefers-reduced-motion:reduce){.emp-sk{animation:none}}',
      '@media (max-width:900px){.emp-cards{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:600px){.emp{padding:20px 16px 48px}.emp-h1{font-size:40px}.emp-next,.emp-ready{flex-direction:column;align-items:flex-start}.emp-dark{padding:20px}.emp-dark h2{font-size:32px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function logCard(d) {
    var p = d.practice, sub = p.loggedToday ? 'Logged for today ✓' : (p.streak > 0 ? p.streak + '-day streak · keep it going' : 'Keep your streak');
    if (!state.logOpen) return '<button type="button" class="emp-card" data-act="open-log"><div class="t">Log today’s practice</div><div class="u">' + esc(sub) + '</div></button>';
    return '<div class="emp-card open"><div class="t">Log today’s practice</div><div class="emp-form"><label for="emp-min">Minutes you sat today</label><input id="emp-min" type="number" inputmode="numeric" min="1" max="600" value="' + esc(state.minutes) + '" data-in="minutes">' +
      '<div class="emp-acts"><button type="button" class="emp-btn pri" data-act="save"' + (state.busy ? ' disabled' : '') + '>' + (state.busy ? 'Saving…' : 'Save') + '</button><button type="button" class="emp-btn out" data-act="cancel">Cancel</button></div>' + (state.msg ? '<p class="emp-err" role="alert">' + esc(state.msg) + '</p>' : '') + '</div></div>';
  }
  function html() {
    var head = '<p class="emp-eye">Meditation Pass</p><h1 class="emp-h1">My Practice</h1>';
    if (state.error && !state.data) return head + '<p>' + esc(state.error) + '</p>';
    var d = state.data;
    if (!d) return head + '<div class="emp-sk"></div><div class="emp-sk tall"></div>';
    var L = d.links, n = d.next, out = head;
    if (n) {
      var now = liveNow(n);
      out += a(L.live_url, '<span><span class="l">Next in your practice</span><br><span class="t">' + esc(n.title) + ' · ' + esc(now ? 'live now' : when(n.start) + ', live') + '</span></span><span class="go">' + (now ? 'Join →' : 'Open →') + '</span>', 'emp-next');
    }
    out += '<section class="emp-dark"><span class="l">Weekly</span><h2>' + esc(L.live_title || 'Meditation Mondays') + '</h2><p>One live sit each week, with every past session kept as a replay.</p><div class="emp-chips">' +
      a(L.live_url, 'Live this Monday', 'emp-chip') + a(L.replays_url, 'Replays', 'emp-chip') + '</div></section>';
    out += '<p class="emp-lab">Your practice</p><div class="emp-cards">' +
      a(L.replays_url, '<div class="t">Replays</div><div class="u">Every past Monday</div>', 'emp-card') + logCard(d) +
      a(L.pathway_url, '<div class="t">' + esc(L.pathway_title) + '</div><div class="u">' + esc(L.pathway_sub) + '</div>', 'emp-card') + '</div>';
    out += a(L.path_url, '<span><span class="l">When you’re ready</span><br><span class="t">' + esc(L.path_title) + '</span></span><span class="go">See your path →</span>', 'emp-ready');
    if (d.unavailable && d.unavailable.length) out += '<p class="emp-lab" style="margin-top:16px;text-transform:none;letter-spacing:0">Some things couldn’t be loaded just now (' + esc(d.unavailable.join(', ')) + ').</p>';
    return out;
  }

  var root = null;
  function render() { if (root && document.body.contains(root)) root.innerHTML = html(); }
  function onClick(e) {
    var t = e.target.closest('[data-act]');
    if (!t || !root.contains(t)) return;
    var act = t.dataset.act;
    if (act === 'open-log') { state.logOpen = true; state.msg = ''; render(); var i = root.querySelector('#emp-min'); if (i) i.focus(); }
    else if (act === 'cancel') { state.logOpen = false; state.msg = ''; render(); }
    else if (act === 'save') {
      state.busy = true; state.msg = ''; render();
      call('/api/member/practice', { today: localToday(), minutes: Math.max(1, parseInt(state.minutes, 10) || 1) })
        .then(function () { state.logOpen = false; return call('/api/member/my-practice?today=' + localToday()); })
        .then(function (d) { state.data = d; keep(d); })
        .catch(function (er) { state.msg = er.message; })
        .then(function () { state.busy = false; render(); });
    }
  }
  function onInput(e) { var k = e.target && e.target.dataset && e.target.dataset.in; if (k) state[k] = e.target.value; }

  function mount() {
    if (!PAGE.test(location.pathname) || state.ok === false) return;
    if (root && document.body.contains(root)) return;
    var box = document.querySelector(HOST);
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    root = document.createElement('div'); root.__box = box;
    root.className = 'emp'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'My Practice');
    root.addEventListener('click', onClick); root.addEventListener('input', onInput);
    box.insertBefore(root, box.firstChild);
    render();
  }
  // Leaving the page (or turning out not to be a member): take our page out and give Circle's back
  function unmount() {
    if (!root) return;
    state.logOpen = false;
    var box = root.__box; root.remove(); root = null;
    if (box) for (var i = 0; i < box.children.length; i++) box.children[i].style.display = '';
  }

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css();
    state.data = cached(); mount(); render();
    signIn().then(function () { if (!state.ok) { unmount(); return; } mount(); render(); return load(); })
      .catch(function () { state.error = 'Please sign in to Circle to see your practice.'; })
      .then(function () { mount(); render(); });
    setInterval(function () { if (root && document.body.contains(root) && !state.logOpen && !state.busy) render(); }, 60000); // "live now" comes and goes
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
