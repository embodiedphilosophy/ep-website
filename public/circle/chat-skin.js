/* Embodied Philosophy · chat restyle for Circle (ss.embodiedphilosophy.com)
   Loaded by public/circle/today.js. For Sādhana School students (season or annual), mentees and Circle admins only: everyone
   else keeps Circle's own look. The styles only match Circle's chat markup (message list, composer), so they change nothing
   on other pages. Built against the real markup copied from /c/kula-chats; see docs/mentee-this-week.md. */
(function () {
  if (window.__epChatSkin) return; window.__epChatSkin = true;
  var API = 'https://www.embodiedphilosophy.com', KEY = 'ep_skin_session';
  var ALLOW = ['ss_season', 'ss_year', 'mentee'];

  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function waitForUser(tries) {
    var u = window.circleUser;
    if (u && u.signedIn !== false && u.identityToken) return Promise.resolve(u);
    if (tries <= 0) return Promise.reject(new Error('not signed in'));
    return new Promise(function (res) { setTimeout(res, 400); }).then(function () { return waitForUser(tries - 1); });
  }
  function allowed() {
    var u0 = window.circleUser, key = KEY + '_' + ((u0 && u0.email) || '');
    var saved = store(key);
    if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now()) return Promise.resolve(!!s.ok); } catch (e) {} }
    return waitForUser(25).then(function (u) {
      key = KEY + '_' + u.email;
      return fetch(API + '/api/member/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identityToken: u.identityToken }) }).then(function (r) { return r.json(); }).then(function (r) {
        var ok = !!(r.session && (r.admin || (r.tier && ALLOW.indexOf(r.tier.tier) >= 0)));
        store(key, JSON.stringify({ ok: ok, until: Date.now() + 11 * 3600 * 1000 })); return ok;
      });
    });
  }

  // Colours: Terra #A5432A, Pine #20302A, Ivory #FAF5EB, Sand #EADDC6, Line #D8C9AE
  var CSS = [
    // the chat area sits on Circle's page colour, with the message list and composer on it
    '[data-testid=chat-room-wrapper],[data-testid=chat-room-wrapper] .bg-primary,[data-testid=chat-room-wrapper] .bg-secondary{background-color:#F2E8D6!important}',
    // day divider ("Today")
    '#message-scroll-view .border-b{border-color:#D8C9AE!important}',
    '#message-scroll-view .text-label-xs.text-tertiary{font-weight:600!important;letter-spacing:.14em!important;text-transform:uppercase!important;color:#5A5346!important}',
    // each message: soft rounded card on hover
    '[data-testid=message-item]{border-radius:12px!important;transition:background-color .12s}',
    '[data-testid=message-item]:hover{background-color:rgba(250,245,235,.85)!important}',
    // the composer: ivory, rounded, thin line
    '[data-testid=tiptap-editor]{background:#FAF5EB!important;border:1px solid #D8C9AE!important;border-radius:14px!important;box-shadow:none!important;margin-bottom:12px}',
    '[data-testid=tiptap-editor] .tiptap{font-size:15px!important}',
    // Send: a terra button with the word, like the design
    '#tiptap-send{background:#A5432A!important;color:#fff!important;border-radius:10px!important;padding:0 20px!important;width:auto!important;min-width:76px!important;height:40px!important;min-height:40px;border:0!important;gap:0!important}',
    '#tiptap-send:hover{background:#83341F!important}',
    '#tiptap-send svg{display:none!important}',
    '#tiptap-send::after{content:"Send";font:600 14px Inter,system-ui,sans-serif;color:#fff}'
  ].join('\n');

  function apply() {
    if (document.getElementById('ep-chat-skin')) return;
    var s = document.createElement('style'); s.id = 'ep-chat-skin'; s.textContent = CSS; document.head.appendChild(s);
  }
  allowed().then(function (ok) { if (ok) apply(); }).catch(function () {});
})();
