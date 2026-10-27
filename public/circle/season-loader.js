/* Embodied Philosophy · season views and "This week" drawn inside Circle (ss.embodiedphilosophy.com).
   Loaded by ONE line in Circle → Settings → Code snippets → Head code snippets (no inline copy):
     <script src="https://www.embodiedphilosophy.com/circle/season-loader.js"></script>
   Add ?epdebug=1 to a Circle address to see a status badge (bottom right). */
(function () {
  if (window.__epSeasonLoader) return; window.__epSeasonLoader = true;
  var ORIGIN = 'https://www.embodiedphilosophy.com';
  var SEASONS = {
    'fall-heart-of-recognition': 'fall-2026', 'fall-live-sessions-da549d': 'fall-2026',
    'winter-poetry-as-philosophy': 'winter-2027', 'winter-live-sessions': 'winter-2027',
    'spring-many-faces-of-kali': 'spring-2027', 'spring-live-sessions': 'spring-2027',
    'summer-being-with-the-heart': 'summer-2027', 'summer-immersion-sessions': 'summer-2027'
  };
  // The hubs: Circle space slug → our page, its tabs and the tab it opens on. The Circle address's own ?tab= (emails, This week,
  // Today) wins. Confirm the slugs against the real spaces (Circle often adds a short code; those are matched by prefix below).
  var HUBS = {
    'sadhana-school': { path: '/school/sadhana-school', title: 'Sādhana School', def: 'home', home: 'home', tabs: { home: 1, seasons: 1, kula: 1, practice: 1, workshops: 1, pods: 1, mentor: 1 } },
    'mentorship': { path: '/school/sadhana-school', title: 'Sādhana School', def: 'mentor', home: 'home', tabs: { home: 1, seasons: 1, kula: 1, practice: 1, workshops: 1, pods: 1, mentor: 1 } },
    'wisdom-school': { path: '/school/wisdom-school', title: 'Wisdom School', def: 'month', home: 'month', tabs: { month: 1, live: 1, year: 1, book: 1, pathways: 1, library: 1, ce: 1 } },
    // Meditation Mondays: the course's landing page only. Lesson pages (/c/meditation-pass/sections/…/lessons/…) stay Circle's own, so
    // replays play in Circle's player with its completion tracking. "stream" passes through so Replays can open filtered.
    'meditation-pass': { path: '/school/meditation-pass', title: 'Meditation Mondays', def: 'week', home: 'week', tabs: { week: 1, replays: 1, upcoming: 1, teachers: 1 }, keep: ['stream'], landingOnly: true }
  };
  function hubKey(s) { for (var k in HUBS) if (s === k || s.indexOf(k + '-') === 0) return k; return null; }
  function hubPath(k) {
    var h = HUBS[k], m = location.search.match(/[?&]tab=([a-z]+)/), t = m && h.tabs[m[1]] ? m[1] : h.def;
    var q = t === h.home ? '' : '?tab=' + t;
    (h.keep || []).forEach(function (k) { var v = location.search.match(new RegExp('[?&]' + k + '=([a-z0-9-]+)')); if (v && q) q += '&' + k + '=' + v[1]; });
    return h.path + q;
  }
  // A hub that only owns its landing page (/c/meditation-pass, plus the short code Circle may add), never a lesson under it
  function onLanding(k) { return !HUBS[k].landingOnly || new RegExp('^/c/' + k + '(-[a-z0-9]+)?/?$').test(location.pathname); }
  // Pages that are not a season: Circle space slug → our page. "This Week" is a Secret space, so only mentees ever see it;
  // the page checks the mentee tag again on its own.
  // "This week" is drawn natively by public/circle/this-week.js now (like the Schedule page); the frame route is switched off.
  var PAGES = {};
  // Circle often adds a short code to a space's address (this-week-a1b2c3): treat that as the same space
  function pageKey(s) { return PAGES[s] ? s : null; }
  var HOST = '[data-testid="circle-ai-shell-workspace-body"]';
  // When the window is narrow (a phone, or a laptop with a side panel open) Circle swaps to its mobile shell, which has no
  // workspace body. There the page's scrolling panel stands in, and the frame fills the gap between the mobile header and footer.
  function getHost() {
    return document.querySelector(HOST) || (document.querySelector('[data-testid="mobile-shell-header"]') && document.getElementById('panel')) || null;
  }
  var WARM_MS = 10 * 3600 * 1000, warming = null, queued = false;

  var st = document.createElement('style');
  st.textContent = '[data-ep-season]{position:relative !important;overflow:hidden !important;min-height:calc(100vh - 80px) !important}[data-ep-season] > :not(#ep-season-frame){visibility:hidden}';
  document.head.appendChild(st);

  // Add ?epdebug=1 to a Circle address to show a small status badge (bottom right) for troubleshooting
  var DEBUG = /[?&]epdebug=1/.test(location.search), state = { stopped: false, loaded: false, ready: false, html: false, error: '', drew: null, built: 0 };
  function badge() {
    if (!DEBUG || !document.body) return;
    var b = document.getElementById('ep-debug');
    if (!b) { b = document.createElement('div'); b.id = 'ep-debug'; b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#20302A;color:#fff;font:12px/1.5 monospace;padding:10px 12px;border-radius:6px;max-width:340px;white-space:pre-wrap'; document.body.appendChild(b); }
    var f = frameEl(), host = getHost(), t = '';
    var r = f && f.getBoundingClientRect(), top = r && document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(200, r.height / 2));
    t += 'path: ' + location.pathname + '\n';
    t += 'signed in to Circle: ' + (user() ? 'yes' : 'NO') + '\n';
    t += 'content area found: ' + (host ? 'yes' : 'NO') + '\n';
    t += 'frame: ' + (f ? 'yes ' + Math.round(r.width) + 'x' + Math.round(r.height) : 'NO') + '\n';
    t += 'frame built: ' + state.built + ' time(s)' + (state.stopped ? '  STOPPED: Circle kept removing it' : '') + '\n';
    t += 'loader: hub v6 (brake per page)  waited: ' + (state.waited || 0) + '  last removal: ' + (state.why || 'none') + '\n';
    t += 'removed by: ' + (state.other || '-') + '\nremoved from: ' + (state.mut || '-') + '\n';
    t += 'frame address: ' + (f && f.src ? f.src.replace('https://www.embodiedphilosophy.com', '') : '-') + '\n';
    t += 'frame finished loading: ' + (state.loaded ? 'yes' : 'no') + '\n';
    t += 'page html arrived: ' + (state.html ? 'yes' : 'no') + '\n';
    t += 'page started up (hello): ' + (state.ready ? 'yes' : 'no') + '\n';
    t += 'page drew content: ' + (state.drew ? (state.drew.ok ? 'yes' : 'NO') + ' [' + state.drew.text + ']' : 'not yet') + '\n';
    t += 'page error: ' + (state.error || 'none') + '\n';
    t += 'what is on top of it: ' + (top ? (top === f ? 'the frame (good)' : top.tagName + (top.id ? '#' + top.id : '') + ' (covering it?)') : '-');
    b.textContent = t;
  }
  // Troubleshooting: if something other than this loader takes the frame out of the page, remember what did it
  (function () {
    function note(how, node) { try { if (node && (node.id === 'ep-season-frame' || node.id === 'ep-hub-frame')) state.other = how + ' | ' + String(new Error().stack).split('\n').slice(2, 5).map(function (l) { return l.trim().slice(0, 70); }).join(' < '); } catch (e) {} }
    var rm = Element.prototype.remove, rc = Node.prototype.removeChild;
    Element.prototype.remove = function () { note('remove()', this); return rm.apply(this, arguments); };
    Node.prototype.removeChild = function (c) { note('removeChild', c); return rc.apply(this, arguments); };
    try { new MutationObserver(function (list) { list.forEach(function (m) { for (var i = 0; i < m.removedNodes.length; i++) { var n = m.removedNodes[i]; if (n.id === 'ep-season-frame' || n.id === 'ep-hub-frame' || (n.querySelector && n.querySelector('#ep-season-frame,#ep-hub-frame'))) state.mut = 'node removed from <' + String(m.target.tagName || m.target.nodeName).toLowerCase() + (m.target.id ? '#' + m.target.id : '') + '> (' + (n.tagName || '?').toLowerCase() + ')'; } }); }).observe(document, { childList: true, subtree: true }); } catch (e) {}
  })();
  // The hub's frame has its own id: an older copy of this loader elsewhere on the page only knows #ep-season-frame and would remove it
  function frameEl() { return document.getElementById('ep-hub-frame') || document.getElementById('ep-season-frame'); }
  function user() { var u = window.circleUser; return u && u.identityToken ? u : null; }
  function key() { return 'ep_warm_' + (user() ? user().email : ''); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  function post(path, target) {
    var f = document.createElement('form');
    f.method = 'post'; f.target = target; f.action = ORIGIN + '/api/school/enter';
    [['identityToken', user().identityToken], ['next', path]].forEach(function (p) {
      var i = document.createElement('input'); i.type = 'hidden'; i.name = p[0]; i.value = p[1]; f.appendChild(i);
    });
    document.body.appendChild(f); f.submit(); f.remove();
  }

  // Sign the member in quietly as soon as any Circle page loads, so the season view can open straight away
  function warm() {
    if (!user() || !document.body) return Promise.resolve();
    if (Date.now() - Number(store(key()) || 0) < WARM_MS) return Promise.resolve();
    if (warming) return warming;
    warming = new Promise(function (resolve) {
      var fr = document.createElement('iframe');
      fr.name = 'ep-warm-frame'; fr.title = 'sign-in'; fr.tabIndex = -1; fr.setAttribute('aria-hidden', 'true');
      fr.style.cssText = 'display:none';
      document.body.appendChild(fr);
      var done = false;
      function finish(ok) { if (done) return; done = true; if (ok) store(key(), String(Date.now())); fr.remove(); resolve(); }
      fr.onload = function () { try { if (fr.contentWindow.location.href === 'about:blank') return; } catch (e) {} finish(true); };
      setTimeout(function () { finish(false); }, 8000);
      post('/school/sadhana-school?warm=1', 'ep-warm-frame');
    }).then(function () { warming = null; }, function () { warming = null; });
    return warming;
  }

  // Keeps the page's frame laid over Circle's content area. For "This week" the frame lives on the page itself (not inside
  // Circle's content area), so Circle re-drawing that area can never tear it down and restart it.
  function place(frame, host) {
    if (!frame || !host) return;
    var r = host.getBoundingClientRect(), h = Math.max(r.height, window.innerHeight - r.top);
    if (host.id === 'panel') {
      var hd = document.querySelector('[data-testid="mobile-shell-header"]'), ft = document.querySelector('[data-testid="mobile-shell-footer"]');
      var top = hd ? hd.getBoundingClientRect().bottom : 0, bottom = ft && ft.offsetHeight ? ft.getBoundingClientRect().top : window.innerHeight;
      r = { left: 0, top: top, width: window.innerWidth }; h = Math.max(0, bottom - top);
    }
    frame.style.left = r.left + 'px'; frame.style.top = r.top + 'px'; frame.style.width = r.width + 'px'; frame.style.height = h + 'px';
  }
  function embed(host, slug, hubPathOf) {
    if (state.stopped || tooMany()) { state.stopped = true; return; }
    var path = hubPathOf || PAGES[slug] || '/school/sadhana-school/' + slug;
    // The hub and "This week" sit on the page itself, over Circle's content area, so Circle re-drawing that area cannot tear them down
    var overlay = !!PAGES[slug] || !!hubPathOf || host.id === 'panel';
    host.setAttribute('data-ep-season', '1');
    var frame = document.createElement('iframe');
    frame.id = hubPathOf ? 'ep-hub-frame' : 'ep-season-frame'; frame.name = frame.id; frame.title = hubPathOf ? (hubPathOf.indexOf('wisdom-school') > 0 ? 'Wisdom School' : hubPathOf.indexOf('meditation-pass') > 0 ? 'Meditation Mondays' : 'Sādhana School') : overlay ? 'This week' : 'Season view';
    frame.setAttribute('data-slug', slug); frame.setAttribute('data-path', path);
    if (overlay) { frame.setAttribute('data-overlay', '1'); frame.style.cssText = 'position:fixed;z-index:20;border:0;background:#F2E8D6'; }
    else frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;z-index:20;background:#F0E8D8';
    frame.onload = function () { state.loaded = true; };
    state.built++;
    (overlay ? document.body : host).appendChild(frame);
    if (overlay) place(frame, host);
    function show() { if (frame.parentNode) frame.src = ORIGIN + path; }
    warm().then(show, show);
  }

  function tick() {
    queued = false;
    // The safety brake below only counts rebuilds on the SAME page (Circle tearing the frame out while the member stays put).
    // Moving to another page starts it afresh: before, clicking between the programme hubs a few times tripped it for good and
    // Circle's own course page showed through until a reload.
    if (location.pathname !== state.path) { state.path = location.pathname; builds = []; state.stopped = false; }
    var m = location.pathname.match(/^\/c\/([^\/]+)/), hk = m && hubKey(m[1]);
    if (hk && !onLanding(hk)) hk = null;
    var hp = hk && hubPath(hk);
    var slug = m && (hk ? 'hub:' + hk : pageKey(m[1]) || SEASONS[m[1]]); // the hub's identity ignores ?tab=, which Circle may change while it draws the space
    // Sahṛdaya Upāya (/c/mentorship) is drawn natively by sahrdaya.js for mentees. Everyone else keeps the hub's mentor tab.
    // Until sahrdaya.js has checked who is signed in we hold back (up to 12 seconds) so the hub never flashes up for a mentee.
    if (hk === 'mentorship' && /^\/c\/mentorship\/?$/.test(location.pathname)) {
      if (window.__epMentee === 'yes') slug = null;
      else if (window.__epMentee !== 'no' && !state.stopped) { state.mentorWait = state.mentorWait || Date.now(); if (Date.now() - state.mentorWait < 12000) slug = null; }
    } else state.mentorWait = 0;
    var host = getHost(), frame = frameEl();
    if (user()) warm();
    // Leaving the page (or asking for Circle's own view) removes the frame. Circle briefly losing its content area or the
    // signed-in user while it redraws does not: removing the frame then made it rebuild until the loader gave up.
    var leaving = !slug || /[?&]native=1/.test(location.search);
    if (leaving) { if (frame) { state.why = !slug ? 'left the page' : 'native view'; frame.remove(); } var h = document.querySelector('[data-ep-season]'); if (h) h.removeAttribute('data-ep-season'); return; }
    if (!host || !user()) { state.waited = (state.waited || 0) + 1; if (frame && frame.getAttribute('data-overlay')) return; if (frame) { state.why = !host ? 'no content area' : 'not signed in'; frame.remove(); } return; }
    if (frame && frame.getAttribute('data-slug') === slug && frame.getAttribute('data-overlay')) { host.setAttribute('data-ep-season', '1'); place(frame, host); return; }
    if (frame && frame.getAttribute('data-slug') === slug && frame.parentNode === host) return;
    if (frame) { state.why = 'replaced: ' + frame.getAttribute('data-slug') + ' -> ' + slug; frame.remove(); }
    embed(host, slug, hp || null);
  }
  // Never run more than about twice a second, however busy Circle's page is, and give up after repeated rebuilds
  var lastTick = 0, builds = [];
  function soon() { if (queued) return; queued = true; setTimeout(function () { lastTick = Date.now(); tick(); }, Math.max(0, 400 - (Date.now() - lastTick))); }
  function tooMany() { var now = Date.now(); builds = builds.filter(function (t) { return now - t < 15000; }); builds.push(now); return builds.length > 4; }

  // If the quiet sign-in has expired, the frame asks to sign in again once
  window.addEventListener('message', function (e) {
    if (e.origin === ORIGIN && e.data) {
      if (e.data.ep === 'ready' || e.data.ep === 'height') state.ready = true;
      if (e.data.ep === 'html') state.html = true;
      if (e.data.ep === 'error') state.error = String(e.data.msg).slice(0, 120);
      if (e.data.ep === 'drew') state.drew = { ok: !!e.data.ok, text: String(e.data.text || '') };
    }
    if (e.origin !== ORIGIN || !e.data || e.data.ep !== 'need-signin') return;
    var frame = frameEl();
    if (!frame || frame.getAttribute('data-retried') || !user()) return;
    frame.setAttribute('data-retried', '1');
    store(key(), null);
    post(frame.getAttribute('data-path'), frame.id);
  });

  ['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn];
    history[fn] = function () { var r = orig.apply(this, arguments); soon(); return r; };
  });
  window.addEventListener('popstate', soon);
  function start() {
    new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
    setInterval(soon, 1500); setInterval(badge, 1000);
    setInterval(function () { var f = frameEl(); if (f && f.getAttribute('data-overlay')) place(f, getHost()); }, 300);
    soon();
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
