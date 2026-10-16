(function () {
  var ORIGIN = 'https://www.embodiedphilosophy.com';
  var SEASONS = {
    'fall-heart-of-recognition': 'fall-2026', 'fall-live-sessions-da549d': 'fall-2026',
    'winter-poetry-as-philosophy': 'winter-2027', 'winter-live-sessions': 'winter-2027',
    'spring-many-faces-of-kali': 'spring-2027', 'spring-live-sessions': 'spring-2027',
    'summer-being-with-the-heart': 'summer-2027', 'summer-immersion-sessions': 'summer-2027'
  };
  // Pages that are not a season: Circle space slug → our page. "This Week" is a Secret space, so only mentees ever see it;
  // the page checks the mentee tag again on its own.
  var PAGES = { 'this-week': '/school/sahrdaya-upaya/this-week' };
  // Circle often adds a short code to a space's address (this-week-a1b2c3): treat that as the same space
  function pageKey(s) { return PAGES[s] ? s : /^this-week-[a-z0-9]{3,10}$/.test(s) ? 'this-week' : null; }
  var HOST = '[data-testid="circle-ai-shell-workspace-body"]';
  var WARM_MS = 10 * 3600 * 1000, warming = null, queued = false;

  var st = document.createElement('style');
  st.textContent = '[data-ep-season]{position:relative !important;overflow:hidden !important;min-height:calc(100vh - 80px) !important}[data-ep-season] > :not(#ep-season-frame){visibility:hidden}';
  document.head.appendChild(st);

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

  function embed(host, slug) {
    var path = PAGES[slug] || '/school/sadhana-school/' + slug;
    host.setAttribute('data-ep-season', '1');
    var frame = document.createElement('iframe');
    frame.id = 'ep-season-frame'; frame.name = 'ep-season-frame'; frame.title = PAGES[slug] ? 'This week' : 'Season view';
    frame.setAttribute('data-slug', slug); frame.setAttribute('data-path', path);
    frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;z-index:20;background:#F0E8D8';
    host.appendChild(frame);
    function show() { if (frame.parentNode) frame.src = ORIGIN + path; }
    warm().then(show, show);
  }

  function tick() {
    queued = false;
    var m = location.pathname.match(/^\/c\/([^\/]+)/), slug = m && (pageKey(m[1]) || SEASONS[m[1]]);
    var host = document.querySelector(HOST), frame = document.getElementById('ep-season-frame');
    if (user()) warm();
    var off = !slug || /[?&]native=1/.test(location.search) || !host || !user();
    if (off) { if (frame) frame.remove(); var h = document.querySelector('[data-ep-season]'); if (h) h.removeAttribute('data-ep-season'); return; }
    if (frame && frame.getAttribute('data-slug') === slug && frame.parentNode === host) return;
    if (frame) frame.remove();
    embed(host, slug);
  }
  function soon() { if (!queued) { queued = true; requestAnimationFrame(tick); } }

  // If the quiet sign-in has expired, the frame asks to sign in again once
  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN || !e.data || e.data.ep !== 'need-signin') return;
    var frame = document.getElementById('ep-season-frame');
    if (!frame || frame.getAttribute('data-retried') || !user()) return;
    frame.setAttribute('data-retried', '1');
    store(key(), null);
    post(frame.getAttribute('data-path'), 'ep-season-frame');
  });

  ['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn];
    history[fn] = function () { var r = orig.apply(this, arguments); soon(); return r; };
  });
  window.addEventListener('popstate', soon);
  function start() {
    new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
    setInterval(tick, 1500);
    tick();
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
