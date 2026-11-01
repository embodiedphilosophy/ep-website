/* Embodied Philosophy · Sahṛdaya Upāya page for mentees (ss.embodiedphilosophy.com/c/mentorship)
   Loaded by public/circle/today.js. Draws the page in place of the space's content (no frame), like This week.
   Mentees and Circle admins only: anyone else keeps the Sādhana School hub, which season-loader.js shows.
   Sets window.__epMentee to 'yes' or 'no' once it knows, so season-loader.js knows whether to leave the space to us.
   Data: /api/member/this-week (lib/mentee/load.js → home.js). See docs/sahrdaya-upaya-page.md. */
(function () {
  if (window.__epSahrdaya) return; window.__epSahrdaya = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/mentorship\/?$/;
  var SKEY = 'ep_su_session';
  var state = { session: null, first: '', ok: null, data: null, error: '', busy: '', msg: '', going: {}, tab: 'formation', room: 'chat', modal: null, form: {}, progress: '', say: '', picks: {}, books: false, ask: '' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function localToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function myZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } }
  function dayFmt(s, opts) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, Object.assign({ timeZone: 'UTC' }, opts)); } catch (e) { return s; } }
  function safeUrl(u) { return /^(https?:|mailto:)/.test(String(u || '')) ? u : ''; }
  function link(u, text, cls, ext) { u = safeUrl(u); return u ? '<a class="' + cls + '" href="' + esc(u) + '"' + (ext === false ? '' : ' target="_top"') + (/^mailto:/.test(u) ? '' : '') + '>' + text + '</a>' : ''; }
  function ext(u, text, cls) { u = safeUrl(u); return u ? '<a class="' + cls + '" href="' + esc(u) + '" target="_blank" rel="noopener">' + text + '</a>' : ''; }
  // "14–15 Nov", "30 Nov – 1 Dec"
  function span(a, b) {
    var m = function (s) { return dayFmt(s, { month: 'short' }); }, d = function (s) { return dayFmt(s, { day: 'numeric' }); };
    return m(a) === m(b) ? d(a) + '–' + d(b) + ' ' + m(a) : d(a) + ' ' + m(a) + ' – ' + d(b) + ' ' + m(b);
  }
  var KINDS = {
    observation: ['Observation', 'Watching a senior teacher lead, with notes. Up to 10 hours.', 'Who and what you observed'],
    'practice-teaching': ['Practice-teaching', 'Teaching or co-holding a session. Up to 10 hours.', 'Who and what you taught'],
    peer: ['Peer articulation', 'Partnered or small-group practice between immersions. Up to 8 hours.', 'Who you practised with, and on what'],
    retreat: ['Retreat practicum', 'The summer retreat, in person or online. Up to 11 hours.', 'Which retreat sessions']
  };
  function fmtTime(iso, opts) { try { return new Date(iso).toLocaleString(undefined, Object.assign({ timeZone: myZone() }, opts)); } catch (e) { return ''; } }
  // "Mon 23"
  function wd(s) { return dayFmt(s, { weekday: 'short' }) + ' ' + dayFmt(s, { day: 'numeric' }); }
  // Amazon for the student's country: .co.uk in the UK (by time zone or browser language), otherwise .com (same rule as lib/mentee/books.js)
  function amazonUrl(b) {
    var host = /^Europe\/(London|Belfast|Jersey|Guernsey|Isle_of_Man)$/.test(myZone()) || /^en-GB$/i.test((navigator.language || '')) ? 'www.amazon.co.uk' : 'www.amazon.com';
    return b.asin ? 'https://' + host + '/dp/' + b.asin : 'https://' + host + '/s?k=' + encodeURIComponent(b.search) + '&i=stripbooks';
  }
  function amazonLabel() { return /amazon\.co\.uk/.test(amazonUrl({ search: 'x' })) ? 'Amazon.co.uk' : 'Amazon.com'; }
  function setMentee(v) { window.__epMentee = v; }

  // ---- sign-in: Circle's identity token → our bearer session (same as This week) ----
  function waitForUser(tries) {
    var u = window.circleUser;
    if (u && u.signedIn !== false && u.identityToken) return Promise.resolve(u);
    if (tries <= 0) return Promise.reject(new Error('not signed in'));
    return new Promise(function (res) { setTimeout(res, 400); }).then(function () { return waitForUser(tries - 1); });
  }
  function signIn() {
    var saved = store(SKEY);
    if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now()) { state.session = s.session; state.first = s.first || ''; state.ok = !!s.ok; return Promise.resolve(); } } catch (e) {} }
    return waitForUser(25).then(function (u) {
      return fetch(API + '/api/member/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identityToken: u.identityToken }) }).then(function (r) { return r.json(); });
    }).then(function (r) {
      if (!r.session) throw new Error('not signed in');
      state.session = r.session; state.first = r.firstName || ''; state.ok = !!(r.admin || (r.tier && r.tier.tier === 'mentee'));
      store(SKEY, JSON.stringify({ session: r.session, first: state.first, ok: state.ok, until: Date.now() + 11 * 3600 * 1000 }));
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
  var DKEY = function () { return 'ep_su_data_v2_' + ((window.circleUser && window.circleUser.email) || ''); }; // v2: round 2 added fields to the page data; an older saved copy must not be drawn
  function keep(d) { if (d && d.home && !d.pending) store(DKEY(), JSON.stringify({ day: localToday(), d: d })); }
  function cached() { try { var c = JSON.parse(store(DKEY()) || 'null'); return c && c.day === localToday() && c.d && c.d.home && c.d.home.articulation && c.d.home.hours ? c.d : null; } catch (e) { return null; } }
  var tzq = function () { return 'today=' + localToday() + '&tz=' + encodeURIComponent(myZone()); };
  // Fast answer first (hours, ticks, assignments, partner), then the full one (Practicum event, Mentorship Circle posts)
  function load() {
    var fail = function (e) { state.error = e.status === 403 ? 'This page is for Sahṛdaya Upāya mentees.' : e.message; };
    return call('/api/member/this-week?fast=1&' + tzq()).then(function (d) { if (!state.data || state.data.pending || !cached()) state.data = d; state.error = ''; render(); }).catch(fail)
      .then(function () {
        return call('/api/member/this-week?' + tzq()).then(function (d) { state.data = d; state.error = ''; keep(d); render(); })
          .catch(function (e) { if (!state.data) fail(e); else if (state.data.pending) { state.data.pending = false; state.data.unavailable = (state.data.unavailable || []).concat(['sessions']); } });
      });
  }
  function act(key, fn) {
    state.busy = key; state.msg = ''; render();
    return fn().then(function (d) { if (d && d.home) { state.data = d; keep(d); } }).catch(function (e) { state.msg = e.message; })
      .then(function () { state.busy = ''; render(); });
  }

  function css() {
    if (document.getElementById('esu-css')) return;
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap'; document.head.appendChild(l); }
    var s = document.createElement('style'); s.id = 'esu-css';
    s.textContent = [
      '.esu{font-family:"IBM Plex Sans",system-ui,sans-serif;color:#1E1A14;max-width:980px;margin:0 auto;padding:44px 40px 72px;line-height:1.5;font-size:15px;background:#F1E9DC}',
      '.esu *{box-sizing:border-box}.esu a{color:#A5432A}.esu a.esu-btn{color:inherit}.esu :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.esu-eye{font:500 11px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#A5432A}',
      '.esu-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px 28px;flex-wrap:wrap;margin:6px 0 20px}',
      '.esu-h1{margin:0;font:600 48px/1.05 "Cormorant Garamond",Georgia,serif}.esu-h1 em{color:#A5432A;font-style:italic}',
      '.esu-sub{font-size:13.5px;color:#5A5346;margin-top:6px}',
      '.esu-tot{min-width:210px}.esu-tot b{font:600 28px/1 "Cormorant Garamond",Georgia,serif;font-variant-numeric:lining-nums;font-feature-settings:"lnum" 1}.esu-tot span{font-size:13px;color:#5A5346}',
      '.esu-ever{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin:0 0 18px}.esu-ever .esu-card{display:flex;flex-direction:column;gap:6px}.esu-ever .esu-h2{font-size:21px}.esu-ever .esu-btm{margin-top:auto;padding-top:10px}',
      '.esu-ever .esu-poll{grid-column:1/-1}',
      '.esu-win{background:#F1E9DC;border-radius:8px;padding:10px 14px;margin-bottom:6px}.esu-win b{display:block;font-size:15px}.esu-cues{display:grid;gap:10px;max-height:340px;overflow-y:auto}.esu-cue{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;padding:10px 12px;background:#F6EFE2;border-radius:8px;font-size:14.5px}.esu-cue .esu-eye{margin:0 0 2px}.esu-cuew{grid-column:1/-1;color:#5A5346}.esu-who{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:4px 0}.esu-who label{display:inline-flex;gap:6px;align-items:center;border:1px solid #E3D8C6;border-radius:99px;padding:6px 12px;background:#fff;font-size:14px}.esu-dots{display:flex;gap:6px;align-items:center;margin:2px 0}.esu-dot{width:18px;height:18px;border-radius:50%;border:2px solid #A5432A;display:inline-block}.esu-dot.on{background:#A5432A}',
      '.esu-q{padding:8px 0;border-top:1px solid #E3D8C6;font-size:14px;line-height:1.35}.esu-q a{color:#1E1A14;text-decoration:none;font-weight:500}.esu-q small{display:block;font-size:12px;color:#5A5346;margin-top:2px}.esu-q small b{color:#2E5A4B;font-weight:600}',
      '.esu-bar{height:6px;background:#E3D8C6;border-radius:99px;overflow:hidden;margin-top:6px}.esu-bar i{display:block;height:100%;background:#A5432A;min-width:0}',
      '.esu-bar.sm{height:4px;margin-top:5px}',
      '.esu-note{background:#EADDC6;border:1px solid #E3D8C6;border-radius:8px;padding:10px 14px;margin:0 0 14px;font-size:14px}.esu-err{color:#9b2c16;font-size:14px;margin:0 0 12px}',
      '.esu-tabs{display:none}',
      '.esu-cols{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start}',
      '.esu-c1{flex:999 1 500px;min-width:0}.esu-c2{flex:1 1 300px;min-width:0}.esu-c1,.esu-c2{display:flex;flex-direction:column;gap:18px}',
      '.esu-card{background:#FBF6EE;border:1px solid #E3D8C6;border-radius:8px;padding:18px 20px;min-width:0}',
      '.esu-pine{background:#20302A;color:#F6EFE2;border-radius:8px;padding:22px 24px;min-width:0}.esu-pine .esu-eye{color:#D2A65A}',
      '.esu-hd{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px}',
      '.esu-h2{margin:0;font:600 24px/1.15 "Cormorant Garamond",Georgia,serif}.esu-h3{margin:4px 0 12px;font:600 34px/1.1 "Cormorant Garamond",Georgia,serif;color:#fff}',
      '.esu-mono{font:500 12px "IBM Plex Mono",ui-monospace,monospace;color:#5A5346}',
      '.esu-muted{color:#5A5346;font-size:14px;margin:0}.esu-ok{color:#2E5A4B;font-weight:600}',
      '.esu-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 16px}',
      '.esu-step{border:1px solid rgba(246,239,226,.25);border-radius:8px;padding:10px 12px;font-size:13px}.esu-step.open{border-color:#D2A65A}.esu-step b{display:block;font:500 11px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.12em;color:#D2A65A;margin-bottom:2px}',
      '.esu-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border-radius:99px;border:1px solid transparent;font:600 14px "IBM Plex Sans",system-ui,sans-serif;cursor:pointer;text-decoration:none!important;white-space:nowrap}',
      '.esu-btn.gold{background:#D2A65A;color:#20302A!important}.esu-btn.pri{background:#A5432A;color:#fff!important}.esu-btn.out{background:#FBF6EE;border-color:#E3D8C6;color:#1E1A14!important}.esu-btn.lite{border-color:rgba(246,239,226,.35);color:#F6EFE2!important;background:transparent}.esu-btn.dark{background:#20302A;color:#fff!important}',
      '.esu-btn:disabled,.esu-btn[aria-disabled=true]{opacity:.55;cursor:default}',
      '.esu-acts{display:flex;gap:10px;flex-wrap:wrap;align-items:center}',
      '.esu-rt{display:flex;gap:4px;border-bottom:1px solid #E3D8C6;margin:0 -20px 12px;padding:0 20px;overflow-x:auto}',
      '.esu-rt button{background:none;border:0;border-bottom:2px solid transparent;padding:8px 10px;font:500 14px "IBM Plex Sans",system-ui,sans-serif;color:#5A5346;cursor:pointer;white-space:nowrap}.esu-rt button[aria-selected=true]{color:#1E1A14;border-color:#A5432A;font-weight:600}',
      '.esu-pin{display:flex;gap:8px 16px;flex-wrap:wrap;font-size:13px;margin:0 0 12px}.esu-pin a{color:#A5432A;font-weight:600;text-decoration:none}',
      '.esu-empty{background:#F1E9DC;border-radius:8px;padding:20px;text-align:center;color:#5A5346;margin-bottom:12px}',
      '.esu-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 28px}',
      '.esu-comp{display:flex;justify-content:space-between;gap:10px;font-size:13.5px}.esu-comp .esu-mono{white-space:nowrap}',
      '.esu-rows{list-style:none;margin:0;padding:0}.esu-rows li{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:11px 0;border-top:1px solid #E3D8C6}.esu-rows li:first-child{border-top:0}',
      '.esu-rows .l{min-width:0}.esu-rows .t{font-weight:500;line-height:1.3}.esu-rows .t a{color:inherit;text-decoration:none}.esu-rows .u{font-size:12.5px;color:#5A5346;margin-top:2px}',
      '.esu-rows li.done .t{color:#5A5346}',
      '.esu-tk{flex:none;min-height:36px;padding:0 14px;border-radius:99px;background:#FBF6EE;border:1px solid #E3D8C6;font:600 13px "IBM Plex Sans",system-ui,sans-serif;color:#1E1A14;cursor:pointer}.esu-tk:disabled{opacity:.55}',
      '.esu-tk.on{background:#20302A;color:#fff;border-color:#20302A}',
      '.esu-sk{height:150px;border-radius:8px;background:linear-gradient(90deg,#EADDC6 25%,#F3EADA 50%,#EADDC6 75%);background-size:200% 100%;animation:esush 1.4s ease-in-out infinite}@keyframes esush{to{background-position:-200% 0}}@media (prefers-reduced-motion:reduce){.esu-sk{animation:none}}',
      '.esu-chat{display:flex;flex-direction:column;gap:14px;margin:0 -20px 14px;padding:16px 20px;max-height:340px;overflow-y:auto;background:#FBF6EE;color:#1E1A14;border-top:1px solid #E3D8C6;border-bottom:1px solid #E3D8C6}.esu-chat *{color:#1E1A14}.esu-chat .esu-mono{color:#5A5346}.esu-chat .esu-tag{color:#fff}.esu-msgh{display:flex;gap:8px;align-items:baseline;font-size:13.5px}.esu-msgh .esu-mono{margin-left:auto}.esu-msgb{font-size:14.5px;white-space:pre-wrap;word-break:break-word;margin-top:2px}.esu-tag{font:500 10px IBM Plex Mono,ui-monospace,monospace;letter-spacing:.1em;background:#A5432A;color:#fff;border-radius:99px;padding:1px 8px}',
      '.esu-say{display:flex;gap:10px;align-items:flex-end;margin:0 0 8px}.esu-say textarea{flex:1}',
      '.esu-slot.on{background:#20302A;border-color:#20302A;color:#fff!important}.esu-slot{cursor:pointer;font-family:inherit;min-height:40px}',
      '.esu-book{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 0;border-top:1px solid #E3D8C6}.esu-book:first-of-type{border-top:0}.esu-bt{font-weight:600;font-size:16px;line-height:1.3}.esu-ba{font-size:13.5px;color:#5A5346}.esu-bm{padding:14px 0;border-top:1px solid #E3D8C6}.esu-bm.now{background:#F6EFE2;margin:0 -12px;padding:14px 12px;border-radius:8px;border-top:0}',
      '.esu-slots{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}.esu-slot{border:1px solid #E3D8C6;border-radius:99px;padding:7px 14px;font-size:13.5px;font-weight:500;color:#1E1A14!important;text-decoration:none;background:#fff}.esu-slot:hover{border-color:#A5432A}',
      '.esu-lnk{background:none;border:0;padding:0;color:#5A5346;font:inherit;text-decoration:underline;cursor:pointer}',
      '.esu-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(32,48,42,.55);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto}',
      '.esu-dlg{background:#FBF6EE;border-radius:8px;padding:22px 24px;width:100%;max-width:560px;margin:auto}',
      '@media (max-width:760px){',
      '.esu-cue{grid-template-columns:minmax(0,1fr)}',
      '.esu{padding:24px 16px 56px}.esu-h1{font-size:36px}.esu-tabs{display:flex;gap:6px;margin:0 0 14px;background:#E3D8C6;border-radius:99px;padding:4px}',
      '.esu-tabs button{flex:1;min-height:40px;border:0;border-radius:99px;background:transparent;font:600 14px "IBM Plex Sans",system-ui,sans-serif;color:#5A5346;cursor:pointer}.esu-tabs button[aria-selected=true]{background:#20302A;color:#fff}',
      '.esu-cols{display:flex;flex-direction:column;flex-wrap:nowrap;align-items:stretch;gap:14px}.esu-c1,.esu-c2{display:contents}',
      '.esu-cols>*,.esu-c1>*,.esu-c2>*{order:0}',
      '[data-g=ever]{order:0}[data-g=immersion]{order:1}[data-g=assign]{order:2}[data-g=one]{order:3}[data-g=books]{order:4}[data-g=partner]{order:5}[data-g=hours]{order:6}[data-g=feedback]{order:7}[data-g=room]{order:8}',
      '.esu[data-tab=formation] [data-g=room]{display:none}.esu[data-tab=room] [data-g]:not([data-g=room]){display:none}',
      '.esu-steps{grid-template-columns:minmax(0,1fr)}.esu-grid2{grid-template-columns:minmax(0,1fr)}.esu-h3{font-size:30px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function hd(title, right) { return '<div class="esu-hd"><h2 class="esu-h2">' + esc(title) + '</h2>' + (right || '') + '</div>'; }

  // Book of the month: this month's required (and suggested) book, with where to buy it, and a popup with the whole reading list
  function bookLine(b) {
    return '<div class="esu-book"><div><div class="esu-bt">' + esc(b.title) + '</div><div class="esu-ba">' + esc(b.author) + (b.audio ? ' · also on ' + esc(b.audio) : '') + '</div>' + (b.note ? '<div class="esu-ba" style="font-style:italic">' + esc(b.note) + '</div>' : '') + '</div>' +
      ext(amazonUrl(b), 'Buy on ' + amazonLabel(), 'esu-btn out') + '</div>';
  }
  function bookCard(w) {
    var bk = w.home.books;
    if (!bk || (!bk.current && !bk.next)) return '';
    var c = bk.current, n = bk.next;
    var head = c ? 'Book of the month' : 'Reading list', sub = c ? 'Month ' + c.month + (bk.total ? ' of ' + bk.total : '') : 'Starts ' + esc(dayFmt(n.starts, { day: 'numeric', month: 'long' }));
    var m = c || n;
    return '<section class="esu-card" data-g="books"><div class="esu-hd"><span class="esu-eye">' + head + '</span><button type="button" class="esu-lnk" style="white-space:nowrap" data-act="all-books">See all the books</button></div>' +
      '<div class="esu-ba" style="margin:-4px 0 2px">' + sub + '</div><h2 class="esu-h2" style="margin:0 0 10px;font-style:italic">' + esc(m.theme) + '</h2>' +
      (m.required.length ? '<div class="esu-eye" style="color:#5A5346;margin:8px 0 4px">Required · for your monthly reflection</div>' + m.required.map(bookLine).join('') : '') +
      (m.suggested.length ? '<div class="esu-eye" style="color:#5A5346;margin:12px 0 4px">Suggested · for peer articulation (not assessed)</div>' + m.suggested.map(bookLine).join('') : '') +
      (c && n ? '<p class="esu-muted" style="margin-top:12px;font-size:13px">Next, from ' + esc(dayFmt(n.starts, { day: 'numeric', month: 'long' })) + ': ' + esc(n.theme) + '</p>' : '') + '</section>';
  }
  function booksModal(w) {
    var bk = w.home.books;
    if (!state.books || !bk || !bk.all.length) return '';
    var rows = bk.all.map(function (m) {
      var list = function (arr, label) { return arr.length ? '<div class="esu-ba" style="margin-top:6px"><b>' + label + '</b></div>' + arr.map(bookLine).join('') : ''; };
      return '<div class="esu-bm' + (m.now ? ' now' : '') + '"><div class="esu-eye" style="color:' + (m.now ? '#A5432A' : '#5A5346') + '">Month ' + m.month + ' · ' + esc(dayFmt(m.starts, { month: 'long', year: 'numeric' })) + (m.now ? ' · this month' : '') + '</div>' +
        '<h3 class="esu-h2" style="font-size:20px;margin:2px 0 4px;font-style:italic">' + esc(m.theme) + '</h3>' + list(m.required, 'Required') + list(m.suggested, 'Suggested') + '</div>';
    }).join('');
    return '<div class="esu-ov" data-act="close-books" data-bg="1"><div class="esu-dlg" role="dialog" aria-modal="true" aria-label="The reading list" style="max-width:680px"><div class="esu-hd"><h2 class="esu-h2">The reading list</h2><button type="button" class="esu-btn out" data-act="close-books">Close</button></div>' +
      '<p class="esu-muted" style="margin:0 0 6px;font-size:13px">One required book a month feeds your written reflection; the suggested book is for the peer articulation sessions and is not assessed. Buy links go to ' + amazonLabel() + '.</p>' + rows + '</div></div>';
  }

  // A "which time works?" survey (the mentorship orientation), or the confirmed time once Jacob has chosen
  function pollCards(w) {
    return (w.home.polls || []).map(function (p) {
      if (p.final) {
        return '<section class="esu-card esu-poll" data-g="ever" style="border-color:#D2A65A"><div class="esu-eye">' + esc(p.title) + '</div><h2 class="esu-h2" style="margin:4px 0 6px">' +
          esc(fmtTime(p.final.start, { weekday: 'long', day: 'numeric', month: 'long' })) + ' · ' + esc(fmtTime(p.final.start, { hour: 'numeric', minute: '2-digit' })) + '</h2>' +
          '<p class="esu-muted" style="margin-bottom:12px">Confirmed, in your time (' + esc(myZone().split('/').pop().replace(/_/g, ' ')) + ').' + (p.note ? ' ' + esc(p.note) : '') + '</p>' +
          (p.final.link ? '<div class="esu-acts">' + ext(p.final.link, 'Open the meeting link', 'esu-btn pri') + '</div>' : '') + '</section>';
      }
      var chosen = state.picks[p.id] || p.options.filter(function (o) { return o.mine; }).map(function (o) { return o.start; });
      var days = [], by = {};
      p.options.forEach(function (o) { var d = fmtTime(o.start, { weekday: 'long', day: 'numeric', month: 'long' }); if (!by[d]) { by[d] = []; days.push(d); } by[d].push(o); });
      var saved = p.options.filter(function (o) { return o.mine; }).map(function (o) { return o.start; }), dirty = chosen.slice().sort().join() !== saved.slice().sort().join();
      return '<section class="esu-card esu-poll" data-g="ever" style="border-color:#D2A65A"><div class="esu-eye">Quick question for you</div><h2 class="esu-h2" style="margin:4px 0 4px">' + esc(p.title) + '</h2>' +
        '<p class="esu-muted" style="margin-bottom:10px">Which of these times could you join? Choose every one that works. Times are in your time (' + esc(myZone().split('/').pop().replace(/_/g, ' ')) + ').' + (p.note ? ' ' + esc(p.note) : '') + '</p>' +
        days.map(function (d) {
          return '<div class="esu-eye" style="color:#5A5346;margin:10px 0 6px">' + esc(d) + '</div><div class="esu-slots" role="group" aria-label="' + esc(d) + '">' + by[d].map(function (o) {
            var on = chosen.indexOf(o.start) >= 0;
            return '<button type="button" class="esu-slot' + (on ? ' on' : '') + '" role="checkbox" aria-checked="' + on + '" data-act="pick" data-poll="' + esc(p.id) + '" data-slot="' + esc(o.start) + '">' + (on ? '✓ ' : '') + esc(fmtTime(o.start, { hour: 'numeric', minute: '2-digit' })) + '</button>';
          }).join('') + '</div>';
        }).join('') +
        '<div class="esu-acts" style="margin-top:12px"><button type="button" class="esu-btn pri" data-act="save-poll" data-poll="' + esc(p.id) + '"' + (state.busy === 'poll' || (saved.length && !dirty) ? ' disabled' : '') + '>' + (state.busy === 'poll' ? 'Saving…' : saved.length && !dirty ? 'Saved ✓' : 'Save my times') + '</button>' + (!chosen.length && !saved.length ? '<span class="esu-muted" style="font-size:13px">Choose every time that works first</span>' : '') + '</div>' +
        (saved.length && !dirty ? '<p class="esu-muted" style="margin-top:8px;font-size:13px">Thank you. Jacob will confirm the time here. You can change your answer until then.</p>' : '') +
        (state.msg && state.msgFor === 'poll' ? '<p class="esu-err" role="alert" style="margin-top:8px">' + esc(state.msg) + '</p>' : '') + '</section>';
    }).join('');
  }

  // The evergreen row: Articulation, Questions for the Group, this month's reflection, and a survey while one is open
  function articulationCard(w) {
    var a = w.home.articulation, r = a.rotation;
    var eye = 'Articulation' + (r ? ' · Rotation ' + r.n + ' · ' + r.weeksLeft + (r.weeksLeft === 1 ? ' week' : ' weeks') + ' left' : '');
    var dots = ''; for (var i = 0; i < a.target; i++) dots += '<span class="esu-dot' + (i < a.sessions ? ' on' : '') + '"></span>';
    return '<section class="esu-card" data-g="ever"><div class="esu-eye">' + esc(eye) + '</div><h2 class="esu-h2">Had a session with your partner?</h2>' +
      '<div class="esu-dots" aria-hidden="true">' + dots + '<span class="esu-muted" style="margin-left:6px;font-size:13.5px">' + Math.min(a.sessions, a.target) + ' of ' + a.target + ' this rotation · ' + a.hours + ' of ' + a.hoursTarget + ' hrs for the year</span></div>' +
      '<p class="esu-muted" style="font-size:13.5px">One card logs it for both of you, and your rewritten cue goes into the cue bank.</p>' +
      '<div class="esu-btm"><button type="button" class="esu-btn pri" data-act="open-articulation">Log an articulation session</button></div></section>';
  }
  function questionsCard(w) {
    var q = w.home.questions;
    if (!q.on) return '';
    var list = state.questions || q.latest;
    var rows = list.length ? list.map(function (p) {
      return '<div class="esu-q">' + (safeUrl(p.url) ? ext(p.url, esc(p.title), '') : esc(p.title)) + '<small>' + esc(p.by || 'A mentee') + ' · ' + p.answers + (p.answers === 1 ? ' answer' : ' answers') + (p.staff ? ' · <b>Jacob answered</b>' : '') + '</small></div>';
    }).join('') : '<p class="esu-muted" style="font-size:13.5px">No questions yet. Be the first to ask.</p>';
    return '<section class="esu-card" data-g="ever"><div class="esu-hd" style="margin:0"><span class="esu-eye">Questions for the group</span>' + (safeUrl(q.url) && q.total ? ext(q.url, 'All ' + q.total, 'esu-lnk') : '') + '</div>' +
      '<h2 class="esu-h2">Ask the cohort, or Jacob</h2>' + rows +
      '<div class="esu-say esu-btm"><label for="esu-ask" style="position:absolute;left:-9999px">Ask the group</label><input id="esu-ask" type="text" maxlength="240" data-in="ask" value="' + esc(state.ask) + '" placeholder="Ask the group…" style="' + FIELD + '">' +
      '<button type="button" class="esu-btn pri" data-act="ask"' + (state.busy === 'ask' ? ' disabled' : '') + '>' + (state.busy === 'ask' ? 'Asking…' : 'Ask') + '</button></div>' +
      (state.msg && state.msgFor === 'ask' ? '<p class="esu-err" role="alert">' + esc(state.msg) + '</p>' : '') + '</section>';
  }
  function reflectionCard(w) {
    var r = w.home.reflection, month = dayFmt(r.month + '-01', { month: 'long' });
    return '<section class="esu-card" data-g="ever"><div class="esu-eye">Your ' + esc(month) + ' reflection</div><h2 class="esu-h2">Write your ' + esc(month) + ' reflection</h2>' +
      '<p class="esu-muted" style="font-size:13.5px">Write it, share it with the cohort, and revise it from what they say.</p>' +
      (safeUrl(r.url) ? '<div class="esu-btm esu-acts">' + link(r.url, 'Open Reflections', 'esu-btn pri') + '</div>' : '<p class="esu-muted esu-btm" style="font-size:13px">Reflections opens here soon.</p>') + '</section>';
  }
  function evergreen(w) { return '<div class="esu-ever">' + articulationCard(w) + questionsCard(w) + reflectionCard(w) + pollCards(w) + '</div>'; }

  function immersionCard(w) {
    var im = w.home.immersion;
    if (!im) return '<section class="esu-pine" data-g="immersion"><div class="esu-eye">Next immersion</div><p style="margin:8px 0 0">The eight immersions of this year are complete. Thank you for your presence.</p></section>';
    var p = im.prepare, pr = im.practicum;
    var prepOpen = p.open && safeUrl(p.url);
    var steps = '<div class="esu-step' + (prepOpen && !p.done ? ' open' : '') + '"><b>PREPARE · ' + (p.done ? 'DONE ✓' : p.open ? 'OPEN' : 'SOON') + '</b>' + (p.done ? 'You have completed the lesson' : p.open ? 'A Workbook lesson, before Saturday' : 'Opens about two weeks before, on ' + esc(dayFmt(p.opens, { day: 'numeric', month: 'short' }))) + '</div>' +
      '<div class="esu-step"><b>SAT · OPEN SESSION</b>With the whole school</div>' +
      '<div class="esu-step"><b>SUN · PRACTICUM' + (im.practicumLesson && im.practicumLesson.done ? ' · LESSON DONE ✓' : '') + '</b>Mentees only, teaching under supervision</div>';
    var rsvp = pr ? (pr.rsvped || state.going[pr.id] ? '<span class="esu-btn lite" style="cursor:default">You’re on the list ✓</span>'
      : '<button type="button" class="esu-btn lite" data-act="rsvp" data-id="' + esc(pr.id) + '"' + (state.busy === 'rsvp' ? ' disabled' : '') + '>RSVP for Sunday’s Practicum</button>') : '';
    var when = im.happening ? 'This weekend' : im.daysTo === 1 ? 'Tomorrow' : 'In ' + im.daysTo + ' days';
    return '<section class="esu-pine" data-g="immersion"><div class="esu-hd"><span class="esu-eye">Next immersion · ' + im.n + ' of ' + im.of + '</span><span class="esu-mono" style="color:#CFC6B4">' + esc(span(im.sat, im.sun)) + '</span></div>' +
      '<h2 class="esu-h3">' + esc(im.title) + '</h2><p style="margin:-6px 0 14px;font-size:13.5px;color:#CFC6B4">' + esc(when) + (p.open ? '' : ' · The Prepare lesson opens about two weeks before') + '</p>' +
      '<div class="esu-steps">' + steps + '</div><div class="esu-acts">' +
      (prepOpen ? ext(p.url, p.done ? 'Review the Prepare lesson' : 'Open the Prepare lesson', p.done ? 'esu-btn lite' : 'esu-btn gold') : '') + rsvp + ext(im.allUrl, 'All eight immersions', 'esu-btn lite') + '</div></section>';
  }

  // After an immersion: the Integrate lesson, until it is completed
  function integrateCard(w) {
    var g = w.home.integrate;
    if (!g) return '';
    return '<section class="esu-card" data-g="immersion" style="border-color:#D2A65A"><div class="esu-eye">Integrate · Immersion ' + g.n + '</div><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:4px"><div><h2 class="esu-h2">' + esc(g.title) + '</h2><p class="esu-muted" style="margin-top:2px">Take a few quiet minutes to integrate the weekend.</p></div>' + ext(g.url, 'Open the Integrate lesson', 'esu-btn pri') + '</div></section>';
  }

  // The mentorship room is one place: the whole cohort's chat (no separate tabs for the Mentorship Circle or a direct line)
  function roomCard(w) {
    var r = w.home.room, p = w.home.partner;
    var pinned = r.pinned.length ? '<div class="esu-pin">' + r.pinned.map(function (x) { return ext(x.url, esc(x.label), ''); }).join('<span aria-hidden="true">·</span>') + '</div>' : '';
    var tabs = [['chat', 'Cohort chat'], ['pair', 'Pair chat'], ['cues', 'Cue bank'], ['circle', 'Mentorship Circle'], ['jacob', 'Jacob · direct']];
    var bar = '<div class="esu-rt" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" aria-selected="' + (state.room === t[0]) + '" data-act="room" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var body;
    if (state.room === 'pair') {
      body = r.pairChatUrl
        ? '<p class="esu-muted" style="margin-bottom:12px">Your own chat with ' + esc(p && p.name ? p.name : 'your partner') + ' for this rotation. Use it to find a time and to share what you are working on.</p><div class="esu-acts">' + ext(r.pairChatUrl, 'Open your pair chat', 'esu-btn pri') + '</div>'
        : '<div class="esu-empty">' + (p ? 'Your pair chat will appear here once Jacob has opened it for this rotation.' : 'You’ll see your pair chat here once you have a partner.') + '</div>';
    } else if (state.room === 'cues') {
      body = '<p class="esu-muted" style="margin-bottom:10px">Every instruction line the cohort has rewritten in an articulation session, newest first. Add yours from the articulation card.</p>' +
        (r.cues && r.cues.length ? '<div class="esu-cues">' + r.cues.map(function (c) {
          return '<div class="esu-cue"><div><div class="esu-eye" style="color:#5A5346">Before</div>' + esc(c.before) + '</div><div><div class="esu-eye">After</div>' + esc(c.after) + '</div><div class="esu-mono esu-cuew">' + esc(c.who) + ' · ' + esc(dayFmt(c.day, { day: 'numeric', month: 'short' })) + '</div></div>';
        }).join('') + '</div>' : '<div class="esu-empty">' + (w.pending ? 'Loading…' : 'No lines yet. The first one you rewrite goes here.') + '</div>');
    } else if (state.room === 'circle') {
      body = (r.circle && r.circle.length ? '<ul class="esu-rows">' + r.circle.map(function (c) {
        return '<li><div class="l"><div class="t">' + (safeUrl(c.url) ? ext(c.url, esc(c.title), '') : esc(c.title)) + '</div><div class="u">' + esc([c.by, dayFmt(String(c.at).slice(0, 10), { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')) + '</div></div></li>';
      }).join('') + '</ul>' : '<div class="esu-empty">' + (w.pending ? 'Loading…' : 'Nothing in the Mentorship Circle yet.') + '</div>') +
        '<div class="esu-acts" style="margin-top:10px">' + ext(r.circleUrl, 'Open the Mentorship Circle', 'esu-btn out') + '</div>';
    } else if (state.room === 'jacob') {
      body = '<p class="esu-muted" style="margin-bottom:12px">A private message to Jacob in Circle, for anything you’d rather not put in the group.</p><div class="esu-acts">' + ext(r.messageUrl, 'Message Jacob', 'esu-btn pri') + '</div>';
    } else {
      body = (r.chat && r.chat.length ? '<div class="esu-chat" role="log" aria-label="Latest messages in the cohort chat">' + r.chat.slice(-8).map(function (m) {
          return '<div class="esu-msg"><div class="esu-msgh"><b>' + esc(m.who) + '</b>' + (m.mentor ? '<span class="esu-tag">MENTOR</span>' : '') + '<span class="esu-mono">' + esc(fmtTime(m.at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })) + '</span></div><div class="esu-msgb">' + esc(m.text) + '</div></div>';
        }).join('') + '</div>' : '<div class="esu-empty">' + (w.pending ? 'Loading…' : 'Say hello to your cohort.') + '</div>') +
        '<div class="esu-say"><label for="esu-say" style="position:absolute;left:-9999px">Write to your cohort</label><textarea id="esu-say" rows="2" maxlength="1500" data-in="say" placeholder="Write to your cohort…" style="' + FIELD + '">' + esc(state.say) + '</textarea>' +
        '<button type="button" class="esu-btn pri" data-act="send-chat"' + (state.busy === 'chat' ? ' disabled' : '') + '>' + (state.busy === 'chat' ? 'Sending…' : 'Send') + '</button></div>' +
        (state.msg && state.room === 'chat' ? '<p class="esu-err" role="alert" style="margin-top:8px">' + esc(state.msg) + '</p>' : '') +
        '<div class="esu-acts" style="margin-top:10px">' + link(r.chatUrl, 'Open the full chat', 'esu-btn out') + '</div>';
    }
    return '<section class="esu-card" data-g="room">' + hd('The mentorship room') + bar + pinned + body + '</section>';
  }

  function hoursCard(w) {
    var f = w.formation;
    if (!f) return '<section class="esu-card" data-g="hours">' + hd('Formation hours') + '<p class="esu-muted">Your hours record isn’t available just now.</p></section>';
    var comps = '<div class="esu-grid2">' + f.components.map(function (c) {
      return '<div><div class="esu-comp"><span>' + esc(c.name) + '</span><span class="esu-mono">' + c.credited + ' / ' + c.target + '</span></div><div class="esu-bar sm"><i style="width:' + Math.min(100, Math.round(c.credited / c.target * 100)) + '%"></i></div></div>';
    }).join('') + '</div>';
    var recent = w.home.recent, names = {}; f.components.forEach(function (c) { names[c.id] = c.name; });
    var rec = recent.length ? '<div class="esu-eye" style="color:#5A5346;margin:16px 0 4px">Recent entries</div><ul class="esu-rows">' + recent.map(function (e) {
      return '<li><div class="l"><div class="t">' + esc(names[e.component] || e.component) + ' · ' + e.hours + ' h</div><div class="u">' + esc(dayFmt(e.day, { day: 'numeric', month: 'short' })) + (e.note ? ' · ' + esc(e.note) : '') + '</div></div><span class="' + (e.state === 'pending' ? '' : 'esu-ok') + '" style="font-size:13px;' + (e.state === 'pending' ? 'color:#A5432A;font-weight:600' : '') + '">' + (e.state === 'pending' ? 'Pending Jacob · <button type="button" class="esu-lnk" data-act="remove-hours" data-id="' + esc(e.id) + '">Remove</button>' : 'Credited' + (/^articulation:/.test(e.detail || '') ? ' · <button type="button" class="esu-lnk" data-act="take-back" data-id="' + esc(String(e.detail).split(':')[1]) + '">Take back</button>' : '')) + '</span></li>';
    }).join('') + '</ul>' : '<p class="esu-muted" style="margin-top:14px">Your record starts with your first observation or Practicum.</p>';
    return '<section class="esu-card" data-g="hours">' + hd('Formation hours', '<span class="esu-mono">' + f.total + ' of ' + f.target + '</span>') + '<div class="esu-bar" style="margin:0 0 14px" role="progressbar" aria-valuemin="0" aria-valuemax="' + f.target + '" aria-valuenow="' + f.total + '" aria-label="Formation hours"><i style="width:' + Math.min(100, Math.round(f.total / f.target * 100)) + '%"></i></div>' +
      comps + rec +
      '<div class="esu-acts" style="margin-top:14px"><button type="button" class="esu-btn out" data-act="open-hours">Log hours</button></div>' +
      '<p class="esu-muted" style="margin-top:8px;font-size:13px">Immersions, Practicums and one-to-ones are added for you. Log observation, practice-teaching and retreat practicum here. Peer articulation has its own card.</p></section>';
  }

  function feedbackCard(w) {
    var fb = w.mentorship.feedback;
    return '<section class="esu-card" data-g="feedback">' + hd('Feedback on your teaching') + (fb.length ? '<ul class="esu-rows">' + fb.map(function (f) {
      return '<li><div class="l"><div class="t" style="font-weight:400">' + esc(f.notes) + '</div></div>' + (f.date ? '<span class="esu-mono">' + esc(dayFmt(f.date, { day: 'numeric', month: 'short' })) + '</span>' : '') + '</li>';
    }).join('') + '</ul>' : '<p class="esu-muted">After Sunday’s Practicum, Jacob’s notes on your teaching gather here, with the competencies he observed and the hours credited.</p>') + '</section>';
  }

  function assignCard(w) {
    var d = w.due, items = d.items, a = w.home.assignmentsFor, h = w.home;
    var sub = a ? 'For Immersion ' + a.n + ' · ' + esc(a.title) + '. ' : '';
    var rows = items.length ? '<ul class="esu-rows">' + items.map(function (it) {
      var due = /^\d{4}-\d\d-\d\d$/.test(it.due) ? dayFmt(it.due, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
      var t = safeUrl(it.url) ? ext(it.url, esc(it.title), '') : esc(it.title), sub = it.submission, status, action;
      if (it.type === 'handin') {
        var inn = sub && sub.status !== 'draft';
        status = !sub ? (due ? 'Due ' + due : (it.where || '')) : sub.status === 'draft' ? 'Draft saved' : sub.status === 'returned' ? 'Returned by Jacob · ' + dayFmt(sub.at.slice(0, 10), { day: 'numeric', month: 'short' }) : 'Handed in · ' + dayFmt(sub.at.slice(0, 10), { day: 'numeric', month: 'short' }) + ' · with Jacob';
        action = '<button type="button" class="esu-tk' + (inn && sub.status === 'submitted' ? ' on' : '') + '" data-act="open-handin" data-id="' + esc(it.id) + '">' + (!sub ? 'Hand in' : sub.status === 'draft' ? 'Continue' : sub.status === 'returned' ? 'Hand in again' : 'View') + '</button>';
      } else {
        status = it.done ? 'Read' : (due ? 'Due ' + due : (it.where || ''));
        action = '<button type="button" class="esu-tk' + (it.done ? ' on' : '') + '" role="checkbox" aria-checked="' + it.done + '" data-act="tick" data-id="' + esc(it.id) + '" data-done="' + (it.done ? '0' : '1') + '"' + (state.busy === 'tick' + it.id ? ' disabled' : '') + '>' + (it.done ? 'Read ✓' : 'Mark read') + '</button>';
      }
      return '<li class="' + (it.done ? 'done' : '') + '"><div class="l"><div class="t">' + t + '</div>' + (status ? '<div class="u">' + esc(status) + '</div>' : '') + '</div>' + action + '</li>';
    }).join('') + '</ul>' : '<p class="esu-muted">Nothing due this week. Start with <em>Start Here</em> in the Workbook' + (h.startLessons && h.startLessons.length ? ':</p><ul class="esu-rows" style="margin-top:6px">' + h.startLessons.map(function (l) { return '<li class="' + (l.done ? 'done' : '') + '"><div class="l"><div class="t">' + (safeUrl(l.url) ? ext(l.url, esc(l.name), '') : esc(l.name)) + '</div></div>' + (l.done ? '<span class="esu-ok" style="font-size:13px">Done ✓</span>' : '') + '</li>'; }).join('') + '</ul>' : ': How This Workbook Works, Your Year at a Glance, The Practice &amp; Study Imperative, and Your Monthly 1-on-1 with Jacob.</p>');
    return '<section class="esu-card" data-g="assign">' + hd('Assignments', d.total ? '<span class="esu-mono">' + d.done + ' / ' + d.total + ' IN</span>' : '') +
      '<p class="esu-muted" style="margin:-4px 0 8px;font-size:13px">' + sub + 'Everything you hand in goes to Jacob and into your formation record.</p>' + rows +
      (safeUrl(h.workbookUrl) ? '<p style="margin:12px 0 0;font-size:13px">' + ext(h.workbookUrl, 'Programme expectations and full briefs, in the Workbook.', '') + '</p>' : '') + '</section>';
  }

  function oneCard(w) {
    var o = w.home.oneToOne, win = o.window, city = myZone().split('/').pop().replace(/_/g, ' ');
    var inWindow = win && w.today >= win.from, bk = o.booked;
    var out = hd('One-to-one with Jacob', '<span class="esu-mono">45 MIN</span>');
    if (bk) {
      out += '<p class="esu-muted" style="margin-bottom:12px"><b style="color:#1E1A14">Booked:</b> ' + esc(fmtTime(bk.start, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })) + ' your time. The Zoom link is on the event and in your email.</p>' +
        '<div class="esu-acts">' + ext(o.bookingUrl, 'Change time', 'esu-btn out') + ext(o.messageUrl, 'Message Jacob', 'esu-btn out') + '</div>';
      return '<section class="esu-card" data-g="one">' + out + '</section>';
    }
    out += win ? '<p class="esu-muted" style="margin-bottom:12px"><b style="color:#1E1A14">' + esc(dayFmt(win.from, { month: 'long' })) + ' window:</b> ' + esc(wd(win.from) + ' – ' + wd(win.to) + ' ' + dayFmt(win.to, { month: 'short' })) + ', UK evenings.<br>Times are shown in your time (' + esc(city) + ').</p>'
      : '<p class="esu-muted" style="margin-bottom:12px">The next window will be announced here.</p>';
    if (o.slots && o.slots.length) out += '<div class="esu-slots">' + o.slots.map(function (sl) {
      return ext(sl.url, esc(fmtTime(sl.start, { weekday: 'short', day: 'numeric', month: 'short' })) + ' · ' + esc(fmtTime(sl.start, { hour: 'numeric', minute: '2-digit' })), 'esu-slot');
    }).join('') + '</div>';
    else if (win && inWindow) out += '<p class="esu-muted" style="margin-bottom:12px">No open times are showing right now.</p>';
    out += '<div class="esu-acts">' + ext(o.bookingUrl, o.slots && o.slots.length ? 'More times' : inWindow ? 'Book your one-to-one' : 'See times', o.slots && o.slots.length ? 'esu-btn out' : 'esu-btn pri') + ext(o.messageUrl, 'Message Jacob', 'esu-btn out') + '</div>';
    return '<section class="esu-card" data-g="one">' + out + '</section>';
  }

  function partnerCard(w) {
    var p = w.home.partner, a = w.home.articulation;
    if (!p) return '';
    var list = p.partners && p.partners.length ? p.partners : [{ name: p.name, email: p.email, where: '' }], many = list.length > 1, rot = a.rotation;
    var eye = 'Articulation' + (rot ? ' · Rotation ' + rot.n + ' of ' + rot.of + (rot.label ? ' · ' + rot.label : '') : ' · ' + p.month);
    var win = p.window ? '<div class="esu-win"><div class="esu-eye" style="color:#5A5346">A window that suits ' + (many ? 'all of you' : 'you both') + '</div><b>' + esc(p.window.days) + ', ' + esc(p.window.spans[0].text) + ' ' + esc(p.window.spans[0].label) + '</b>' +
      '<div class="esu-muted">' + p.window.spans.slice(1).map(function (x) { return esc(x.text) + ' in ' + esc(x.label); }).join(' · ') + '</div></div>'
      : (list.every(function (x) { return x.where; }) ? '<p class="esu-muted" style="margin-bottom:10px;font-size:13px">No two hours between 8 am and 9 pm suit everyone. Choose a time together in your chat.</p>' : '');
    var dots = ''; for (var i = 0; i < a.target; i++) dots += '<span class="esu-dot' + (i < a.sessions ? ' on' : '') + '"></span>';
    var next = rot && rot.next ? '<p class="esu-muted" style="font-size:13px;margin-top:10px">Rotation ' + rot.next.n + ' starts ' + esc(dayFmt(rot.next.from, { day: 'numeric', month: 'long' })) + ' with a new partner.</p>' : '';
    return '<section class="esu-card" data-g="partner"><div class="esu-eye" style="color:#5A5346">' + esc(eye.toUpperCase()) + '</div><h2 class="esu-h2" style="margin:6px 0 2px">' + esc(p.name) + '</h2>' +
      list.map(function (x) { return x.where ? '<p class="esu-muted" style="margin:0 0 2px">' + (many ? esc(String(x.name).split(' ')[0]) + ': ' : '') + esc(x.where) + '</p>' : ''; }).join('') +
      '<div style="margin-top:10px">' + win + '</div><div class="esu-dots" style="margin:8px 0"><span aria-hidden="true" style="display:inline-flex;gap:6px">' + dots + '</span><span class="esu-muted" style="margin-left:6px;font-size:13.5px">' + Math.min(a.sessions, a.target) + ' of ' + a.target + ' sessions · about an hour each</span></div>' +
      '<div class="esu-acts" style="margin-top:6px">' + (p.chatUrl ? ext(p.chatUrl, 'Open your pair chat', 'esu-btn out') : '') + list.map(function (x) { return ext('mailto:' + x.email, 'Message ' + esc(String(x.name).split(' ')[0]), 'esu-btn out'); }).join('') + '</div>' + next + '</section>';
  }

  var FIELD = 'display:block;width:100%;font:16px IBM Plex Sans,system-ui,sans-serif;padding:10px 12px;border:1px solid #E3D8C6;border-radius:8px;background:#fff;color:#1E1A14;min-height:44px';
  function field(label, inner, id) { return '<label for="' + id + '" style="display:block;font-weight:600;font-size:13px;margin:12px 0 4px">' + label + '</label>' + inner; }
  function modal(w) {
    var m = state.modal, f = state.form;
    if (!m) return '';
    var body = '', b = state.busy === 'modal';
    if (m.type === 'hours') {
      var k = KINDS[f.kind] || KINDS.observation;
      body = '<h2 class="esu-h2">Log hours</h2>' +
        field('What kind of hours', '<select id="esu-kind" data-in="kind" style="' + FIELD + '">' + Object.keys(KINDS).filter(function (x) { return x !== 'peer'; }).map(function (x) { return '<option value="' + x + '"' + (x === f.kind ? ' selected' : '') + '>' + KINDS[x][0] + '</option>'; }).join('') + '</select>', 'esu-kind') +
        '<p class="esu-muted" style="font-size:13px;margin-top:4px">' + esc(k[1]) + '</p>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div>' + field('Date', '<input id="esu-day" type="date" data-in="day" value="' + esc(f.day) + '" max="' + esc(localToday()) + '" style="' + FIELD + '">', 'esu-day') + '</div><div>' +
        field('Hours', '<input id="esu-hrs" type="number" inputmode="decimal" step="0.25" min="0.25" max="12" data-in="hours" value="' + esc(f.hours) + '" style="' + FIELD + '">', 'esu-hrs') + '</div></div>' +
        field(esc(k[2]), '<input id="esu-detail" type="text" maxlength="200" data-in="detail" value="' + esc(f.detail) + '" style="' + FIELD + '">', 'esu-detail') +
        field('Notes (optional)', '<textarea id="esu-notes" rows="3" maxlength="200" data-in="notes" style="' + FIELD + '">' + esc(f.notes) + '</textarea>', 'esu-notes') +
        '<p class="esu-muted" style="font-size:13px;margin:10px 0 14px">Jacob confirms each entry. It shows as pending until he does, then counts toward your 100 hours.</p>' +
        '<div class="esu-acts"><button type="button" class="esu-btn pri" data-act="save-hours"' + (b ? ' disabled' : '') + '>' + (b ? 'Saving…' : 'Log these hours') + '</button><button type="button" class="esu-btn out" data-act="close-modal">Cancel</button></div>';
    } else if (m.type === 'articulation') {
      var p = w.home.partner, partners = (p && p.partners) || [], cohort = w.home.cohort || [], art = w.home.articulation, who = f.with || {};
      var nameOf = function (e) { var x = partners.concat(cohort).filter(function (q) { return q.email === e; })[0]; return x ? String(x.name).split(' ')[0] : 'your partner'; };
      var present = partners.map(function (q) { return q.email; }).filter(function (e) { return who[e] !== false; }).concat(f.third ? [f.third] : []);
      body = '<div class="esu-eye">Articulation' + (art.rotation ? ' · Rotation ' + art.rotation.n : '') + '</div><h2 class="esu-h2" style="margin:2px 0 4px">Log an articulation session</h2>' +
        '<p class="esu-muted" style="font-size:13px">One card logs the session for everyone who was there, so your partner doesn’t need to.</p>' +
        '<div class="esu-eye" style="color:#5A5346;margin:14px 0 4px">Who was there</div><div class="esu-who"><span class="esu-tk on" style="cursor:default">You</span>' +
        partners.map(function (q) { return '<label><input type="checkbox" data-in="with:' + esc(q.email) + '"' + (who[q.email] !== false ? ' checked' : '') + '> ' + esc(String(q.name).split(' ')[0]) + '</label>'; }).join('') +
        (cohort.length && partners.length < 2 ? (f.addThird ? '<select id="esu-third" data-in="third" aria-label="A third person" style="' + FIELD + ';width:auto"><option value="">Choose a third person…</option>' + cohort.map(function (q) { return '<option value="' + esc(q.email) + '"' + (f.third === q.email ? ' selected' : '') + '>' + esc(q.name) + '</option>'; }).join('') + '</select>' : '<button type="button" class="esu-lnk" data-act="add-third">+ Add a third (trio)</button>') : '') + '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div>' + field('Date', '<input id="esu-day" type="date" data-in="day" value="' + esc(f.day) + '" max="' + esc(localToday()) + '" style="' + FIELD + '">', 'esu-day') + '</div><div>' +
        field('Length (hours)', '<input id="esu-hrs" type="number" inputmode="decimal" step="0.25" min="0.25" max="6" data-in="hours" value="' + esc(f.hours) + '" style="' + FIELD + '">', 'esu-hrs') + '</div></div>' +
        field('What you articulated <span style="font-weight:400;color:#5A5346">(a term or passage, e.g. <i>paryavasāna</i>)</span>', '<input id="esu-mine" type="text" maxlength="300" data-in="mine" value="' + esc(f.mine) + '" style="' + FIELD + '">', 'esu-mine') +
        present.map(function (e) { return field('What ' + esc(nameOf(e)) + ' articulated <span style="font-weight:400;color:#5A5346">(optional)</span>', '<input id="esu-t-' + esc(e) + '" type="text" maxlength="300" data-in="term:' + esc(e) + '" value="' + esc((f.terms || {})[e] || '') + '" style="' + FIELD + '">', 'esu-t-' + esc(e)); }).join('') +
        '<div class="esu-eye" style="color:#5A5346;margin:16px 0 0">One instruction line, rewritten <span style="text-transform:none;letter-spacing:0">(optional)</span></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div>' + field('Before', '<textarea id="esu-before" rows="2" maxlength="300" data-in="before" style="' + FIELD + '">' + esc(f.before) + '</textarea>', 'esu-before') + '</div><div>' + field('After', '<textarea id="esu-after" rows="2" maxlength="300" data-in="after" style="' + FIELD + '">' + esc(f.after) + '</textarea>', 'esu-after') + '</div></div>' +
        field('What your partner reflected back <span style="font-weight:400;color:#5A5346">(one sentence, optional)</span>', '<input id="esu-refl" type="text" maxlength="300" data-in="reflected" value="' + esc(f.reflected) + '" style="' + FIELD + '">', 'esu-refl') +
        '<p class="esu-muted" style="font-size:13px;margin:12px 0 14px">Logs the hours for everyone named, so your partner doesn’t log it again. Your before-and-after line goes into the cohort’s cue bank.</p>' +
        '<div class="esu-acts"><button type="button" class="esu-btn pri" data-act="save-articulation"' + (b ? ' disabled' : '') + '>' + (b ? 'Saving…' : 'Log this session') + '</button><button type="button" class="esu-btn out" data-act="close-modal">Cancel</button></div>';
    } else {
      var a = w.due.items.filter(function (x) { return x.id === m.id; })[0];
      if (!a) return '';
      var locked = a.submission && a.submission.status === 'submitted';
      body = '<div class="esu-eye">Hand in · ' + esc(a.where || 'Assignment') + '</div><h2 class="esu-h2" style="margin:4px 0 10px">' + esc(a.title) + '</h2>' +
        (a.submission && a.submission.status === 'returned' ? '<div style="background:#EADDC6;border-radius:8px;padding:12px 14px;margin-bottom:10px;font-size:14px"><b>Jacob returned this' + (a.submission.note ? ':' : '.') + '</b>' + (a.submission.note ? '<div style="white-space:pre-wrap;margin-top:4px">' + esc(a.submission.note) + '</div>' : '') + '</div>' : '') +
        (a.brief ? '<div style="background:#F1E9DC;border-radius:8px;padding:12px 14px;font-size:14px;white-space:pre-wrap">' + esc(a.brief) + '</div>' : '') +
        (safeUrl(w.home.workbookUrl) ? '<p style="margin:8px 0 0;font-size:13px">' + ext(w.home.workbookUrl, 'Full brief in the Workbook', '') + '</p>' : '') +
        field('Your response', '<textarea id="esu-text" rows="7" maxlength="20000" data-in="text" style="' + FIELD + '">' + esc(f.text) + '</textarea>', 'esu-text') +
        (w.home.filesOn ? field('Attach a file, audio or video <span style="font-weight:400;color:#5A5346">(PDF, Word or a recording, up to 500 MB)</span>', '<input id="esu-file" type="file" data-in="file" accept=".pdf,.doc,.docx,.txt,audio/*,video/*,image/jpeg,image/png" style="font:14px \'IBM Plex Sans\',system-ui,sans-serif;max-width:100%">', 'esu-file') +
          (f.fileName ? '<p class="esu-muted" style="font-size:13px;margin-top:4px">Attached: ' + esc(f.fileName) + '</p>' : '') : '') +
        (a.hoursComponent && a.hours && !(a.submission && a.submission.status !== 'draft') ? '<label style="display:flex;gap:8px;align-items:center;margin:12px 0 0;font-size:14px"><input type="checkbox" data-in="logHours"' + (f.logHours ? ' checked' : '') + ' style="width:20px;height:20px"> Also log ' + a.hours + ' h of ' + esc((KINDS[a.hoursComponent] || [a.hoursComponent])[0].toLowerCase()) + '</label>' : '') +
        '<p class="esu-muted" style="font-size:13px;margin:12px 0 14px">Goes to Jacob and into your formation record. Your Inner Travelogue is never part of this.</p>' +
        (state.progress ? '<p class="esu-muted" role="status" style="margin:0 0 10px">' + esc(state.progress) + '</p>' : '') +
        '<div class="esu-acts"><button type="button" class="esu-btn pri" data-act="submit-handin"' + (b ? ' disabled' : '') + '>' + (b ? 'Working…' : locked ? 'Hand it in again' : 'Hand it in') + '</button>' +
        (locked ? '' : '<button type="button" class="esu-btn out" data-act="draft-handin"' + (b ? ' disabled' : '') + '>Save draft</button>') + '<button type="button" class="esu-btn out" data-act="close-modal">Close</button></div>';
    }
    return '<div class="esu-ov" data-act="close-modal" data-bg="1"><div class="esu-dlg" role="dialog" aria-modal="true">' + (state.msg ? '<p class="esu-err" role="alert">' + esc(state.msg) + '</p>' : '') + body + '</div></div>';
  }

  function html() {
    if (state.error && !state.data) return '<h1 class="esu-h1">Sahṛdaya Upāya</h1><p class="esu-muted" style="margin-top:8px">' + esc(state.error) + '</p>';
    var w = state.data, name = (w && w.greeting.firstName) || state.first;
    var head = function (sub, right) { return '<div class="esu-eye">Sahṛdaya Upāya · Teacher formation in SLBT</div><div class="esu-head"><div><h1 class="esu-h1">Your formation' + (name ? ', <em>' + esc(name) + '</em>' : '') + '.</h1>' + (sub ? '<div class="esu-sub">' + sub + '</div>' : '') + '</div>' + (right || '') + '</div>'; };
    if (!w) return head('Opening your page…') + '<div class="esu-cols"><div class="esu-c1"><div class="esu-sk"></div><div class="esu-sk"></div></div><div class="esu-c2"><div class="esu-sk"></div></div></div>';
    var g = w.greeting, im = w.home.immersion, f = w.formation;
    var sub = esc(dayFmt(w.today, { weekday: 'long', day: 'numeric', month: 'long' })) + (im ? ' · ' + (im.happening ? 'Immersion ' + im.n + ' is this weekend' : im.daysTo + ' days to Immersion ' + im.n) : '') + ' · week ' + g.week + ' of ' + esc(g.seasonTitle);
    var hs = w.home.hours, tot = f ? '<div class="esu-tot"><b>' + hs.confirmed + '</b> <span>confirmed · ' + hs.pending + ' pending · of ' + f.target + ' hrs</span><div class="esu-bar"><i style="width:' + Math.min(100, Math.round(f.total / f.target * 100)) + '%"></i></div></div>' : '';
    return head(sub, tot) +
      (w.unavailable.length ? '<p class="esu-note" role="status">Some things couldn’t be loaded just now (' + esc(w.unavailable.join(', ')) + '). The rest is up to date.</p>' : '') +
      (state.msg && !state.modal ? '<p class="esu-err" role="alert">' + esc(state.msg) + '</p>' : '') +
      '<div class="esu-tabs" role="tablist"><button type="button" role="tab" aria-selected="' + (state.tab === 'formation') + '" data-act="tab" data-tab="formation">Formation</button><button type="button" role="tab" aria-selected="' + (state.tab === 'room') + '" data-act="tab" data-tab="room">Room</button></div>' +
      evergreen(w) + '<div class="esu-cols"><div class="esu-c1">' + immersionCard(w) + integrateCard(w) + roomCard(w) + hoursCard(w) + feedbackCard(w) + '</div><div class="esu-c2">' + assignCard(w) + oneCard(w) + bookCard(w) + partnerCard(w) + '</div></div>' + modal(w) + booksModal(w);
  }

  var root = null;
  function render() { if (root && document.body.contains(root)) { root.setAttribute('data-tab', state.tab); root.innerHTML = html(); var ch = root.querySelector('.esu-chat'); if (ch) ch.scrollTop = ch.scrollHeight; } }
  function onInput(e) {
    var k = e.target && e.target.dataset && e.target.dataset.in;
    if (!k) return;
    if (k === 'say') { state.say = e.target.value; return; }
    if (k === 'ask') { state.ask = e.target.value; return; }
    if (k === 'file') { var fl = e.target.files && e.target.files[0]; state.form.file = fl || null; state.form.fileName = fl ? fl.name : ''; render(); return; }
    if (k.indexOf('with:') === 0) { (state.form.with = state.form.with || {})[k.slice(5)] = e.target.checked; render(); return; }
    if (k.indexOf('term:') === 0) { (state.form.terms = state.form.terms || {})[k.slice(5)] = e.target.value; return; }
    state.form[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (k === 'kind' || k === 'third') render();
  }
  // File uploads go straight from the browser to a private store: load the small upload helper on first use
  function loadBlob() {
    if (window.EPBlob) return Promise.resolve(window.EPBlob);
    return new Promise(function (res, no) { var s = document.createElement('script'); s.src = API + '/circle/blob-client.js'; s.onload = function () { window.EPBlob ? res(window.EPBlob) : no(new Error('upload')); }; s.onerror = function () { no(new Error('We couldn’t start the upload. Please try again.')); }; document.head.appendChild(s); });
  }
  function sendHandIn(status) {
    var f = state.form, id = state.modal.id, w = state.data;
    var a = w.due.items.filter(function (x) { return x.id === id; })[0];
    state.busy = 'modal'; state.msg = ''; state.progress = ''; render();
    var up = Promise.resolve(null);
    if (f.file) {
      up = loadBlob().then(function (B) {
        var path = 'submissions/' + w.home.uid + '/' + f.file.name.replace(/[^\w.\- ]+/g, '_');
        return B.upload(path, f.file, { access: 'private', handleUploadUrl: API + '/api/member/this-week/upload', headers: { Authorization: 'Bearer ' + state.session }, multipart: f.file.size > 20 * 1024 * 1024,
          onUploadProgress: function (p) { state.progress = 'Uploading ' + Math.round(p.percentage) + '%'; var el = root && root.querySelector('[role=status]'); if (el) el.textContent = state.progress; } });
      }).then(function (r) { return { path: r.pathname, name: f.file.name }; });
    }
    return up.then(function (file) {
      return call('/api/member/this-week/submit', { id: id, text: f.text || '', status: status, logHours: !!f.logHours, filePath: file ? file.path : f.existingPath || '', fileName: file ? file.name : f.existingName || '', today: localToday(), tz: myZone() });
    }).then(function (d) { state.data = d; keep(d); state.modal = null; state.form = {}; })
      .catch(function (e) { state.msg = e.message || 'Something went wrong. Please try again.'; })
      .then(function () { state.busy = ''; state.progress = ''; render(); });
  }
  function onClick(e) {
    var t = e.target.closest('[data-act]');
    if (!t || !root.contains(t)) return;
    var a = t.dataset.act;
    if (a === 'close-modal') { if (t.dataset.bg && e.target !== t) return; state.modal = null; state.msg = ''; render(); return; }
    if (a === 'open-hours') { state.modal = { type: 'hours' }; state.msg = ''; state.form = { kind: 'observation', day: localToday(), hours: '', detail: '', notes: '' }; render(); var k = root.querySelector('#esu-kind'); if (k) k.focus(); return; }
    if (a === 'open-handin') { var it = state.data.due.items.filter(function (x) { return x.id === t.dataset.id; })[0]; var sb = it && it.submission; state.modal = { type: 'handin', id: t.dataset.id }; state.msg = ''; state.form = { text: sb ? sb.text : '', logHours: !!(it && it.hoursComponent), existingName: sb && sb.hasFile ? sb.fileName : '', fileName: sb && sb.hasFile ? sb.fileName : '', existingPath: '' }; render(); return; }
    if (a === 'send-chat') {
      var txt = state.say;
      act('chat', function () { return call('/api/member/this-week/chat', { text: txt }).then(function (r) { state.say = ''; state.data.home.room.chat = r.chat; return null; }); });
      return;
    }
    if (a === 'open-articulation') { state.modal = { type: 'articulation' }; state.msg = ''; state.form = { day: localToday(), hours: '1', mine: '', terms: {}, with: {}, third: '', addThird: false, before: '', after: '', reflected: '' }; render(); return; }
    if (a === 'add-third') { state.form.addThird = true; render(); var th = root.querySelector('#esu-third'); if (th) th.focus(); return; }
    if (a === 'take-back') { var aid = t.dataset.id; if (!window.confirm('Take this session back? The hours go for everyone who was there.')) return; act('articulation', function () { return call('/api/member/this-week/articulation', { remove: aid, today: localToday(), tz: myZone() }); }); return; }
    if (a === 'save-articulation') {
      var g = state.form, pp = (state.data.home.partner && state.data.home.partner.partners) || [];
      var ppl = pp.map(function (q) { return q.email; }).filter(function (e) { return g.with[e] !== false; }).concat(g.third ? [g.third] : []);
      act('modal', function () { return call('/api/member/this-week/articulation', { day: g.day, hours: g.hours, present: ppl, mine: g.mine, terms: g.terms, before: g.before, after: g.after, reflected: g.reflected, today: localToday(), tz: myZone() }).then(function (d) { state.modal = null; return d; }); }).then(function () { if (state.modal) render(); });
      return;
    }
    if (a === 'ask') {
      var qt = state.ask; state.msgFor = 'ask';
      act('ask', function () { return call('/api/member/this-week/question', { text: qt }).then(function (r) { state.ask = ''; state.questions = r.questions; return null; }); });
      return;
    }
    if (a === 'all-books') { state.books = true; render(); return; }
    if (a === 'close-books') { if (t.dataset.bg && e.target !== t) return; state.books = false; render(); return; }
    if (a === 'pick') {
      var pl = (state.data.home.polls || []).filter(function (x) { return x.id === t.dataset.poll; })[0];
      var cur = (state.picks[t.dataset.poll] || pl.options.filter(function (o) { return o.mine; }).map(function (o) { return o.start; })).slice(), at = cur.indexOf(t.dataset.slot);
      if (at >= 0) cur.splice(at, 1); else cur.push(t.dataset.slot);
      state.picks[t.dataset.poll] = cur; render(); return;
    }
    if (a === 'save-poll') {
      var pid = t.dataset.poll, picked = state.picks[pid] || [];
      state.msgFor = 'poll';
      var pl0 = (state.data.home.polls || []).filter(function (x) { return x.id === pid; })[0]; if (!picked.length && !(pl0 && pl0.options.some(function (o) { return o.mine; }))) { state.msg = 'Choose every time that works first.'; render(); return; }
      act('poll', function () { return call('/api/member/this-week/poll', { poll: pid, slots: picked, today: localToday(), tz: myZone() }).then(function (d) { delete state.picks[pid]; return d; }); });
      return;
    }
    if (a === 'remove-hours') { var rid = t.dataset.id; act('hours', function () { return call('/api/member/this-week/hours', { remove: rid, today: localToday(), tz: myZone() }); }); return; }
    if (a === 'save-hours') {
      var f = state.form;
      act('modal', function () { return call('/api/member/this-week/hours', { component: f.kind, hours: f.hours, day: f.day, detail: f.detail, note: f.notes, today: localToday(), tz: myZone() }).then(function (d) { state.modal = null; return d; }); }).then(function () { if (state.modal) render(); });
      return;
    }
    if (a === 'submit-handin') { sendHandIn('submitted'); return; }
    if (a === 'draft-handin') { sendHandIn('draft'); return; }
    if (a === 'tab') { state.tab = t.dataset.tab; render(); window.scrollTo && root.scrollIntoView && root.scrollIntoView({ block: 'start' }); }
    else if (a === 'room') { state.room = t.dataset.tab; render(); }
    else if (a === 'tick') {
      act('tick' + t.dataset.id, function () { return call('/api/member/this-week/assignment', { id: t.dataset.id, done: t.dataset.done === '1', today: localToday(), tz: myZone() }); });
    } else if (a === 'rsvp') {
      var id = t.dataset.id;
      act('rsvp', function () { return call('/api/member/this-week/rsvp', { eventId: id }).then(function () { state.going[id] = true; }); });
    }
  }

  // The page area Circle draws a space into (same lookup as the Schedule and This week pages)
  function pageContainer() {
    var all = document.querySelectorAll('div');
    for (var i = 0; i < all.length; i++) { var c = String(all[i].className || ''); if (c.indexOf('container-type:inline-size') >= 0 && c.indexOf('bg-secondary') >= 0) return all[i]; }
    return null;
  }
  var HOST = '[data-testid="circle-ai-shell-workspace-body"]';
  function mount() {
    if (!PAGE.test(location.pathname) || state.ok !== true) return;
    if (root && document.body.contains(root)) return;
    var box = document.querySelector(HOST) || pageContainer();
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    root = document.createElement('div'); root.__box = box;
    root.className = 'esu'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Sahṛdaya Upāya');
    root.addEventListener('click', onClick); root.addEventListener('input', onInput); root.addEventListener('change', onInput);
    box.insertBefore(root, box.firstChild);
    render();
  }
  function unmount() {
    if (!root) return;
    var box = root.__box; root.remove(); root = null;
    if (box) for (var i = 0; i < box.children.length; i++) box.children[i].style.display = '';
  }

  // Escape closes a popup (the key listener is on the document: the page re-draws itself, so focus can sit outside it)
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root && document.body.contains(root) && (state.books || state.modal)) { state.books = false; state.modal = null; render(); } });

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css();
    state.data = cached();
    // A mentee seen before this session: take the space at once so the hub doesn't flash up first
    if (store(SKEY)) { try { var s = JSON.parse(store(SKEY)); if (s.until > Date.now()) setMentee(s.ok ? 'yes' : 'no'); } catch (e) {} }
    signIn().then(function () {
      setMentee(state.ok ? 'yes' : 'no');
      if (!state.ok) { unmount(); return; }
      mount(); render(); return load();
    }).catch(function () { setMentee('no'); state.error = 'Please sign in to Circle to see your page.'; })
      .then(function () { mount(); render(); });
  }
  start();
  // Circle is a single-page app: draw when someone navigates here, give Circle's own page back when they leave
  var timer = null;
  new MutationObserver(function () {
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      if (!PAGE.test(location.pathname)) { unmount(); return; }
      if (!started) start(); else mount();
    }, 250);
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', function () { if (!PAGE.test(location.pathname)) unmount(); });
})();
