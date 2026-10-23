/* Embodied Philosophy · Schedule for Circle (ss.embodiedphilosophy.com/c/schedule)
   Loaded by public/circle/today.js (no extra Circle snippet needed). Draws the Schedule in place of the
   space's content: every programme's live sessions and immersions (ones the member's membership doesn't open are locked), month by month, in New York time and in
   their own time zone, with "Live now" and a Join button while a session is on; mentees also see the monthly
   one-to-one window with a booking link. "Subscribe in your calendar" gives a private feed for Google, Apple
   or Outlook. Data: /api/member/schedule (lib/member/schedule.js, from the events sheet). */
(function () {
  if (window.__epSchedule) return; window.__epSchedule = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/schedule(-[a-z0-9]{3,10})?\/?$/;
  var HOST = '[data-testid="circle-ai-shell-workspace-body"]';
  var ON = 'eps-on'; // class on <html> while the Schedule is showing: hides Circle's own page (header strip included) at once
  var CKEY = function () { return 'ep_schedule_data_' + ((window.circleUser && window.circleUser.email) || '') + '_' + localToday(); };
  function cached() { try { return JSON.parse(store(CKEY()) || 'null'); } catch (e) { return null; } }
  var EYEBROW = { ss_season: 'Sādhana School · The Path of Recognition', ss_year: 'Sādhana School · The Path of Recognition', mentee: 'Sahṛdaya Upāya · The Path of Recognition', wisdom: 'Wisdom School', wisdom_plus: 'Wisdom School Plus', meditation: 'Meditation Pass' };
  var RHYTHM = {
    ss: 'Wednesdays at 9:00 ET for two and a half hours, eight sessions a season, and a weekend immersion each month.',
    mentee: 'Wednesdays at 9:00 ET for two and a half hours, eight sessions a season, and a weekend immersion each month. A 45-minute one-to-one with Jacob in the last week of each month, on a UK evening.',
    wisdom: 'Meditation Mondays at 12:00 ET each week, with the monthly lecture and the quarterly weekend seminar.',
    meditation: 'Meditation Mondays: a live sit with EP faculty every Monday at 12:00 ET.'
  };
  var state = { session: null, data: null, error: '', tab: 'all', sub: false, copied: false };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function localToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function myZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } }
  function fmt(iso, opts, zone) { try { return new Date(iso).toLocaleString(undefined, Object.assign({ timeZone: zone || undefined }, opts)); } catch (e) { return ''; } }
  function dayFmt(s, opts) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, Object.assign({ timeZone: 'UTC' }, opts)); } catch (e) { return s; } }
  function api(path) {
    return fetch(API + path, { headers: { Authorization: 'Bearer ' + state.session } })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Something went wrong'); e.status = r.status; throw e; } return j; }); });
  }
  function waitForUser(tries) {
    var u = window.circleUser;
    if (u && u.signedIn !== false && u.identityToken) return Promise.resolve(u);
    if (tries <= 0) return Promise.reject(new Error('not signed in'));
    return new Promise(function (res) { setTimeout(res, 400); }).then(function () { return waitForUser(tries - 1); });
  }
  // Shares the Today strip's session (same browser tab storage), or signs in with Circle's identity token
  function signIn() {
    var saved = store('ep_today_session');
    if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now()) { state.session = s.session; return Promise.resolve(); } } catch (e) {} }
    return waitForUser(25).then(function (u) {
      return fetch(API + '/api/member/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identityToken: u.identityToken }) }).then(function (r) { return r.json(); });
    }).then(function (r) {
      if (!r.session) throw new Error('not signed in');
      state.session = r.session;
      store('ep_today_session', JSON.stringify({ session: r.session, tier: r.tier && r.tier.tier, seasons: (r.tier && r.tier.seasons) || [], offer: r.offer || null, admin: !!r.admin, first: r.firstName || '', until: Date.now() + 10 * 60 * 60 * 1000 }));
    });
  }
  function load() {
    return api('/api/member/schedule?today=' + localToday()).then(function (d) { state.data = d; state.error = ''; store(CKEY(), JSON.stringify(d)); })
      .catch(function (e) { state.error = e.status === 401 ? 'Please refresh the page to see your schedule.' : e.message; if (e.status === 401) store('ep_today_session', ''); });
  }

  function css() {
    if (document.getElementById('eps-css')) return;
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&display=swap'; document.head.appendChild(l); }
    var s = document.createElement('style'); s.id = 'eps-css';
    s.textContent = [
      // While on the Schedule, Circle's own page (its "Events Schedule / New post" strip and posts) never shows, not even while loading
      'html.' + ON + ' ' + HOST + ' > :not(.eps){display:none!important}',
      '.eps-sk{height:92px;border-radius:12px;background:linear-gradient(90deg,#EADDC6 25%,#F3EADA 50%,#EADDC6 75%);background-size:200% 100%;animation:epssh 1.4s ease-in-out infinite}',
      '@keyframes epssh{to{background-position:-200% 0}}@media (prefers-reduced-motion:reduce){.eps-sk{animation:none}}',
      '.eps{font-family:inherit;color:#1E1A14;max-width:1120px;margin:0 auto;padding:28px 20px 64px;display:flex;flex-direction:column;gap:20px;line-height:1.5}',
      '.eps *{box-sizing:border-box}',
      '.eps a{color:#A5432A;text-underline-offset:3px}',
      '.eps :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.eps-top{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;justify-content:space-between}',
      '.eps-eye{font-size:12px;letter-spacing:.04em;color:#5A5346}',
      '.eps-h1{margin:4px 0 0;font:600 44px/1.05 "Cormorant Garamond",Georgia,serif}',
      '.eps-h2{margin:14px 0 4px;font:600 26px/1.1 "Cormorant Garamond",Georgia,serif}',
      '.eps-tabs{display:flex;flex-wrap:wrap;gap:20px;border-bottom:1px solid #D8C9AE}',
      '.eps-tab{font:inherit;font-size:14px;background:transparent;border:0;border-bottom:2px solid transparent;min-height:44px;padding:0 2px;color:#5A5346;cursor:pointer}',
      '.eps-tab[aria-pressed=true]{color:#1E1A14;border-bottom-color:#A5432A;font-weight:600}',
      '.eps-tab small{font-variant-numeric:tabular-nums;color:#5A5346;margin-left:4px}',
      '.eps-cols{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}',
      '.eps-main{flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:20px}',
      '.eps-side{flex:1 1 260px;display:flex;flex-direction:column;gap:16px}',
      '.eps-month{background:#F2E8D6;border:1px solid #D8C9AE;border-radius:6px;padding:6px 22px 10px}',
      '.eps-row{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 0;border-top:1px solid #D8C9AE}',
      '.eps-when{display:flex;flex-direction:column;font-variant-numeric:tabular-nums}',
      '.eps-when .d{font-size:12px;color:#5A5346}',
      '.eps-when .t{font-size:15px;font-weight:600}',
      '.eps-when .y{font-size:12px;color:#5A5346}',
      '.eps-what{display:flex;flex-direction:column;gap:3px;min-width:0}',
      '.eps-tags{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.eps-tag{font-size:11px;letter-spacing:.04em;padding:2px 6px;border:1px solid #D8C9AE;border-radius:3px;color:#5A5346}',
      '.eps-live{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#A5432A}',
      '.eps-dot{width:8px;height:8px;border-radius:50%;background:#A5432A;animation:eps-p 1.6s ease-out infinite}',
      '@keyframes eps-p{0%{box-shadow:0 0 0 0 rgba(165,67,42,.45)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}',
      '@media (prefers-reduced-motion:reduce){.eps-dot{animation:none}}',
      '.eps-title{font-weight:600;font-size:15px}',
      '.eps-prog{color:#1E1A14;border-color:#BFAE8E}',
      '.eps-lock{border-style:dashed;border-color:#A5432A;color:#A5432A}',
      '.eps-lk .eps-title,.eps-lk .eps-when{opacity:.7}',
      '.eps-sub{font-size:13px;color:#5A5346}',
      '.eps-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:4px;font:inherit;font-size:14px;font-weight:600;border:0;background:#A5432A;color:#FAF5EB!important;cursor:pointer;text-decoration:none;white-space:nowrap}',
      '.eps-btn:hover{background:#83341F}',
      '.eps-ghost{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 14px;border-radius:4px;font:inherit;font-size:13px;background:transparent;border:1px solid #D8C9AE;color:#1E1A14!important;cursor:pointer;text-decoration:none;white-space:nowrap}',
      '.eps-ghost:hover{border-color:#1E1A14}',
      '.eps-card{background:#F2E8D6;border:1px solid #D8C9AE;border-radius:6px;padding:20px;display:flex;flex-direction:column;gap:8px}',
      '.eps-l{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5A5346}',
      '.eps-city{font:600 22px/1.2 "Cormorant Garamond",Georgia,serif}',
      '.eps-note{margin:0;font-size:13px;color:#5A5346}',
      '.eps-feed{background:#FAF5EB;border:1px solid #D8C9AE;border-radius:6px;padding:18px 20px;display:flex;flex-direction:column;gap:12px}',
      '.eps-feed input{font:inherit;font-size:13px;min-height:44px;padding:0 10px;border:1px solid #D8C9AE;border-radius:4px;background:#fff;width:100%;color:#1E1A14}',
      '.eps-acts{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.eps-empty{background:#F2E8D6;border:1px solid #D8C9AE;border-radius:6px;padding:22px;color:#5A5346}',
      '@media (max-width:620px){.eps-h1{font-size:36px}.eps-row{grid-template-columns:80px minmax(0,1fr)}.eps-row > div:last-child{grid-column:2}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // Every programme's sessions show for everyone; ones the member's membership doesn't open are locked (no Join link)
  var GROUPS = [['all', 'All'], ['mine', 'Mine'], ['ss', 'Sādhana School'], ['wisdom', 'Wisdom School'], ['mondays', 'Meditation Mondays'], ['mentor', 'Sahṛdaya Upāya'], ['other', 'Other events']];
  function groupOf(it) { var k = it.key || ''; return (k === 'ss' || k === 'wisdom' || k === 'mondays' || k === 'mentor') ? k : 'other'; }
  function inGroup(it, g) { return g === 'all' || (g === 'mine' ? !it.locked : groupOf(it) === g); }
  function liveNow(it, now) { return it.start && Date.parse(it.start) - 10 * 60000 <= now && now < Date.parse(it.end); }

  function rowHtml(it, zone, now) {
    var when;
    if (it.start) {
      var et = fmt(it.start, { hour: 'numeric', minute: '2-digit' }, 'America/New_York');
      var mine = fmt(it.start, { hour: 'numeric', minute: '2-digit' }, zone);
      var sameZone = fmt(it.start, { hour: 'numeric', minute: '2-digit', day: 'numeric' }, 'America/New_York') === fmt(it.start, { hour: 'numeric', minute: '2-digit', day: 'numeric' }, zone);
      when = '<span class="d">' + esc(fmt(it.start, { weekday: 'short', day: 'numeric' }, sameZone ? 'America/New_York' : zone)) + '</span><span class="t">' + esc(sameZone ? et : mine) + '</span>' +
        '<span class="y">' + esc(sameZone ? 'New York time' : et + ' in New York') + '</span>';
    } else {
      when = '<span class="d">' + esc(dayFmt(it.date, { weekday: 'short' })) + '</span><span class="t">' + esc(dayFmt(it.date, { day: 'numeric', month: 'short' })) + (it.end_date ? '–' + esc(dayFmt(it.end_date, { day: 'numeric' })) : '') + '</span><span class="y">' + esc(it.kind === 'one' ? 'UK evenings' : it.time || 'Time to come') + '</span>';
    }
    var live = liveNow(it, now);
    var act = '';
    if (it.locked) act = '<a class="eps-ghost" href="' + esc(it.url || '/c/schedule') + '"' + (/^https?:/.test(it.url || '') ? ' target="_blank" rel="noopener"' : '') + '>Sign up to access</a>';
    else if (live && it.live) act = '<a class="eps-btn" href="' + esc(it.live) + '">Join</a>';
    else if (it.book) act = '<a class="eps-ghost" href="' + esc(it.book) + '" target="_blank" rel="noopener">Choose a slot</a>';
    else if (it.url && /^https?:/.test(it.url)) act = '<a class="eps-ghost" href="' + esc(it.url) + '" target="_blank" rel="noopener">Details</a>';
    return '<div class="eps-row' + (it.locked ? ' eps-lk' : '') + '"><div class="eps-when">' + when + '</div><div class="eps-what"><div class="eps-tags">' +
      (live && !it.locked ? '<span class="eps-live"><span class="eps-dot" aria-hidden="true"></span>Live now</span>' : '') +
      (it.programme ? '<span class="eps-tag eps-prog">' + esc(it.programme) + '</span>' : '') +
      (it.kind === 'meditation' && it.programme ? '' : '<span class="eps-tag">' + esc(it.label) + '</span>') + (it.locked ? '<span class="eps-tag eps-lock">Locked</span>' : '') + '</div><span class="eps-title">' + esc(it.title) + '</span>' + (it.sub ? '<span class="eps-sub">' + esc(it.sub) + '</span>' : '') +
      '</div><div>' + act + '</div></div>';
  }

  // Clocks change on different dates in New York and elsewhere, which moves sessions on the member's clock: say when
  function clockNote(items, zone) {
    var timed = items.filter(function (i) { return i.start && i.kind === 'session' && !i.locked; });
    if (timed.length < 2 || zone === 'America/New_York') return '';
    var at = function (i) { return fmt(i.start, { hour: 'numeric', minute: '2-digit' }, zone); };
    var prev = at(timed[0]), moves = [];
    for (var i = 1; i < timed.length && moves.length < 3; i++) {
      var t = at(timed[i]);
      if (t !== prev) moves.push('from ' + fmt(timed[i].start, { weekday: 'short', day: 'numeric', month: 'long' }, zone) + ', ' + t);
      prev = t;
    }
    if (!moves.length) return '';
    return 'The clocks change on different dates here and in New York, so Wednesday sessions move on your clock: ' + at(timed[0]) + ' now, then ' + moves.join('; ') + '.';
  }

  function html() {
    if (state.error && !state.data) return '<div class="eps-top"><div><h1 class="eps-h1">Schedule</h1><p class="eps-note">' + esc(state.error) + '</p></div></div>';
    var d = state.data;
    if (!d) return '<div class="eps-top"><div><h1 class="eps-h1">Schedule</h1></div></div><div class="eps-sk"></div><div class="eps-sk"></div><div class="eps-sk"></div>';
    var zone = myZone(), now = Date.now(), items = d.items || [];
    var counts = {}; items.forEach(function (i) { counts[i.kind] = (counts[i.kind] || 0) + 1; });
    var gcount = {}; GROUPS.forEach(function (g) { gcount[g[0]] = items.filter(function (i) { return inGroup(i, g[0]); }).length; });
    var tabs = GROUPS.filter(function (g) { return g[0] === 'all' || gcount[g[0]]; });
    if (tabs.length <= 2) tabs = [];
    if (state.tab !== 'all' && !gcount[state.tab]) state.tab = 'all';
    var shown = items.filter(function (i) { return inGroup(i, state.tab); });
    var out = '<div class="eps-top"><div><span class="eps-eye">' + esc(EYEBROW[d.tier] || 'Embodied Philosophy') + '</span><h1 class="eps-h1">Schedule</h1></div>' +
      '<button type="button" class="eps-ghost" data-act="sub" aria-expanded="' + state.sub + '">Subscribe in your calendar</button></div>';
    if (state.sub) {
      var webcal = d.feed.replace(/^https:/, 'webcal:');
      out += '<div class="eps-feed" role="region" aria-label="Calendar subscription"><span class="eps-l">Your calendar link</span>' +
        '<p class="eps-note">Add this once and your sessions, immersions' + (counts.one ? ' and one-to-one windows' : '') + ' appear in your own calendar and stay up to date. The link is personal to you, so please don’t share it.</p>' +
        '<input type="text" readonly value="' + esc(d.feed) + '" aria-label="Calendar link" data-feed>' +
        '<div class="eps-acts"><button type="button" class="eps-btn" data-act="copy">' + (state.copied ? 'Copied' : 'Copy link') + '</button>' +
        '<a class="eps-ghost" target="_blank" rel="noopener" href="https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(webcal) + '">Add to Google Calendar</a>' +
        '<a class="eps-ghost" href="' + esc(webcal) + '">Apple or Outlook</a></div></div>';
    }
    if (tabs.length) out += '<div class="eps-tabs" role="group" aria-label="Show">' + tabs.map(function (g) {
      return '<button type="button" class="eps-tab" data-tab="' + g[0] + '" aria-pressed="' + (state.tab === g[0]) + '">' + g[1] + '<small>' + gcount[g[0]] + '</small></button>';
    }).join('') + '</div>';
    out += '<div class="eps-cols"><div class="eps-main">';
    if (!shown.length) out += '<div class="eps-empty">Nothing scheduled yet. New sessions appear here as soon as they’re on the calendar.</div>';
    var months = [], byMonth = {};
    shown.forEach(function (i) {
      var key = i.start ? fmt(i.start, { year: 'numeric', month: '2-digit' }, zone) : dayFmt(i.date, { year: 'numeric', month: '2-digit' });
      var name = i.start ? fmt(i.start, { month: 'long', year: 'numeric' }, zone) : dayFmt(i.date, { month: 'long', year: 'numeric' });
      if (!byMonth[key]) { byMonth[key] = { name: name, items: [] }; months.push(byMonth[key]); }
      byMonth[key].items.push(i);
    });
    months.forEach(function (m) { out += '<section class="eps-month"><h2 class="eps-h2">' + esc(m.name) + '</h2>' + m.items.map(function (i) { return rowHtml(i, zone, now); }).join('') + '</section>'; });
    out += '</div><aside class="eps-side">';
    var city = zone.split('/').pop().replace(/_/g, ' ');
    var note = clockNote(items, zone);
    out += '<div class="eps-card"><span class="eps-l">Your time zone</span><span class="eps-city">' + esc(city) + '</span><p class="eps-note">Times are set in New York time and shown in yours.' + (note ? ' ' + esc(note) : '') + '</p></div>';
    var r = d.tier === 'mentee' ? RHYTHM.mentee : /^ss_/.test(d.tier) ? RHYTHM.ss : /^wisdom/.test(d.tier) ? RHYTHM.wisdom : d.tier === 'meditation' ? RHYTHM.meditation : '';
    if (r) out += '<div class="eps-card"><span class="eps-l">The rhythm</span><p class="eps-note">' + esc(r) + '</p></div>';
    return out + '</aside></div>';
  }

  var root = null;
  function render() { if (root && document.body.contains(root)) root.innerHTML = html(); }
  function onClick(e) {
    var t = e.target.closest('[data-act],[data-tab]');
    if (!t || !root.contains(t)) return;
    if (t.dataset.tab) { state.tab = t.dataset.tab; render(); return; }
    if (t.dataset.act === 'sub') { state.sub = !state.sub; state.copied = false; render(); }
    if (t.dataset.act === 'copy') {
      var inp = root.querySelector('[data-feed]'), done = function () { state.copied = true; render(); };
      if (navigator.clipboard) navigator.clipboard.writeText(inp.value).then(done, function () { inp.select(); });
      else { inp.select(); try { document.execCommand('copy'); done(); } catch (er) {} }
    }
  }

  // Draw straight into Circle's workspace (like the Library), so the space's header strip is replaced too
  // Returns true only when it has just put the page in (so callers draw once, not on every change Circle makes)
  function mount() {
    if (!PAGE.test(location.pathname)) return false;
    document.documentElement.classList.add(ON);
    if (root && document.body.contains(root)) return false;
    var box = document.querySelector(HOST);
    if (!box) return;
    root = document.createElement('div');
    root.className = 'eps'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Schedule');
    root.addEventListener('click', onClick);
    box.insertBefore(root, box.firstChild);
    render();
    return true;
  }
  // Leaving the page: take ours out and give Circle's back
  function unmount() {
    document.documentElement.classList.remove(ON);
    if (root) { root.remove(); root = null; }
  }

  var started = false;
  function start() {
    if (!PAGE.test(location.pathname)) return;
    css(); document.documentElement.classList.add(ON);
    if (!state.data) state.data = cached(); // last visit's schedule shows at once, then refreshes
    mount(); // draws only when it newly puts the page in; never redraw here, or every redraw would trigger another
    if (started) return;
    started = true;
    signIn().then(load).catch(function () { if (!state.data) state.error = 'Please sign in to Circle to see your schedule.'; }).then(function () { mount(); render(); });
    setInterval(function () { if (root && document.body.contains(root) && !state.sub) render(); }, 60000); // "Live now" comes and goes
  }
  function check() { if (PAGE.test(location.pathname)) start(); else unmount(); }
  check();
  // Circle is a single-page app: react the moment the address changes, and again when its page has drawn
  ['pushState', 'replaceState'].forEach(function (k) { var f = history[k]; history[k] = function () { var r = f.apply(this, arguments); check(); return r; }; });
  window.addEventListener('popstate', check);
  var t = null;
  new MutationObserver(function (list) {
    // our own redraws are not a reason to look again
    if (root && list.every(function (m) { return root.contains(m.target); })) return;
    if (t) return; t = setTimeout(function () { t = null; check(); }, 60);
  }).observe(document.body, { childList: true, subtree: true });
})();
