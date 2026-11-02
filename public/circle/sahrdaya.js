/* Embodied Philosophy · Sahṛdaya Upāya page for mentees (ss.embodiedphilosophy.com/c/mentorship)
   Loaded by public/circle/today.js. Draws the page in place of the space's content (no frame), like This week.
   Mentees and Circle admins only: anyone else keeps the Sādhana School hub, which season-loader.js shows.
   Sets window.__epMentee to 'yes' or 'no' once it knows, so season-loader.js knows whether to leave the space to us.
   Data: /api/member/this-week (lib/mentee/load.js → home.js). See docs/sahrdaya-upaya-page.md. */
(function () {
  if (window.__epSahrdaya) return; window.__epSahrdaya = true;

  var API = 'https://www.embodiedphilosophy.com';
  // The Workbook's address is the one in data/mentee.json `workbook_url` (also sent as home.workbookUrl); it is written once here for the script to know before any data arrives
  var WORKBOOK = 'https://ss.embodiedphilosophy.com/c/apprentice-workbook', WBPATH = WORKBOOK.replace(/^https?:\/\/[^\/]+/, '').replace(/\/$/, '');
  var LESSON = /\/sections\/\d+\/lessons\/\d+/;
  var isWorkbook = function () { return location.pathname.replace(/\/$/, '') === WBPATH; };
  var isLesson = function () { return location.pathname.indexOf(WBPATH + '/') === 0 && LESSON.test(location.pathname); };
  var PAGE = { test: function (p) { p = String(p).replace(/\/$/, ''); return /^\/c\/(mentorship|reflections)$/.test(p) || p === WBPATH || (p.indexOf(WBPATH + '/') === 0 && LESSON.test(p)); } };
  var isRefl = function () { return /^\/c\/reflections\/?$/.test(location.pathname); };
  var isMentor = function () { return /^\/c\/mentorship\/?$/.test(location.pathname) && /[?&]view=mentor/.test(location.search) && state.admin === true; };
  var SKEY = 'ep_su_session';
  var state = { admin: null, mt: { data: null, err: '', filter: 'all', open: '', busy: '', msg: '' }, session: null, first: '', ok: null, data: null, error: '', busy: '', msg: '', going: {}, room: 'chat', rec: {}, view: '', sFilter: 'all', modal: null, form: {}, progress: '', say: '', picks: {}, books: false, ask: '', rf: { list: null, meta: null, detail: null, id: '', filter: 'cohort', mode: 'read', form: { title: '', body: '' }, vn: 0, ckind: 'landed', ctext: '', replyTo: '', reply: '', ticked: {}, post: false, busy: '', err: '' } };

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
    peer: ['Peer articulation', 'Time with your articulation buddy between immersions. Up to 8 hours.', 'Who you practiced with, and on what'],
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
  function setMentee(v) { window.__epMentee = v; if (v === 'no') uncloak(); }
  // today.js hides Circle's own page here until we know (no flash of the space's feed); once our page is in, or it isn't ours, show again
  function uncloak() { var el = document.getElementById('ep-su-cloak'); if (el) el.remove(); }

  // ---- sign-in: Circle's identity token → our bearer session (same as This week) ----
  function waitForUser(tries) {
    var u = window.circleUser;
    if (u && u.signedIn !== false && u.identityToken) return Promise.resolve(u);
    if (tries <= 0) return Promise.reject(new Error('not signed in'));
    return new Promise(function (res) { setTimeout(res, 400); }).then(function () { return waitForUser(tries - 1); });
  }
  // The saved session belongs to one Circle member: when the signed-in member changes (e.g. an admin using Circle's "View as"), sign in again
  function signIn() {
    return waitForUser(25).then(function (u) {
      var who = String(u.email || '').toLowerCase(), saved = store(SKEY);
      if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now() && s.who === who) { state.session = s.session; state.first = s.first || ''; state.ok = !!s.ok; state.admin = !!s.admin; return; } } catch (e) {} }
      return fetch(API + '/api/member/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identityToken: u.identityToken }) }).then(function (r) { return r.json(); }).then(function (r) {
        if (!r.session) throw new Error('not signed in');
        state.session = r.session; state.first = r.firstName || ''; state.ok = !!(r.admin || (r.tier && r.tier.tier === 'mentee')); state.admin = !!r.admin;
        store(SKEY, JSON.stringify({ who: who, session: r.session, first: state.first, ok: state.ok, admin: state.admin, until: Date.now() + 11 * 3600 * 1000 }));
      });
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
  function loadPods() { return call('/api/member/pods').then(function (d) { state.pods = d; render(); }).catch(function () { state.pods = null; }); }
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
      '.esu{font-family:"IBM Plex Sans",system-ui,sans-serif;color:#1E1A14;max-width:1120px;margin:0 auto;padding:28px 24px 64px;line-height:1.5;font-size:15px;background:#F1E9DC;color-scheme:light}',
      '.esu *{box-sizing:border-box}.esu a{color:#A5432A}.esu a.esu-btn{color:inherit}.esu :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.esu-eye{font:500 11px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#A5432A}',
      '.esu-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px 28px;flex-wrap:wrap;margin:6px 0 20px}',
      '.esu-h1{margin:0;font:600 48px/1.05 "Cormorant Garamond",Georgia,serif}.esu-h1 em{color:#A5432A;font-style:italic}',
      '.esu-sub{font-size:13.5px;color:#5A5346;margin-top:6px}',
      '.esu-steps4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #E3D8C6;border-radius:8px;background:#FBF6EE;margin:0 0 18px;overflow:hidden}.esu-st4{padding:12px 14px;font-size:13.5px;color:#5A5346;border-left:1px solid #E3D8C6}.esu-st4:first-child{border-left:0}.esu-st4 b{display:block;font:500 11px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.12em;color:#A5432A;margin-bottom:2px}.esu-st4.on{background:#F6EEDA;color:#1E1A14}',
      '.esu-rcols{display:grid;grid-template-columns:320px minmax(0,1fr);gap:18px;align-items:start}.esu-rfl{display:grid;gap:10px}.esu-chips{display:flex;gap:8px;flex-wrap:wrap}',
      '.esu-mq{display:grid;gap:0;border:1px solid #E3D8C6;border-radius:8px;background:#FBF6EE;overflow:hidden}.esu-mqi{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 16px;padding:14px 16px;border-top:1px solid #E3D8C6}.esu-mqi:first-child{border-top:0}.esu-mqi b{font-weight:600}.esu-age{font:500 12px "IBM Plex Mono",monospace;color:#5A5346;white-space:nowrap}.esu-age.old{color:#A5432A;font-weight:500}.esu-mqd{grid-column:1/-1;white-space:pre-wrap;color:#3a342b;font-size:14px}.esu-mt{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin:8px 0 22px}.esu-tile{border:1px solid #E3D8C6;border-radius:8px;background:#FBF6EE;padding:14px 16px}.esu-tile.behind{border-color:#A5432A}.esu-dots{display:flex;gap:6px;margin:8px 0 4px}.esu-dots i{width:12px;height:12px;border-radius:50%;border:1.5px solid #5B6343}.esu-dots i.f{background:#5B6343}',
      '.esu-proj{display:inline-flex;gap:6px;align-items:center;font-size:12px;font-weight:600;color:#5A5346}.esu-proj i{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none}.esu-in{width:100%;background:#fff;border:1px solid #E3D8C6;border-radius:8px;padding:10px 12px;font-size:14px;min-height:44px;font-family:inherit}',
      '.esu-sl{list-style:none;margin:0;padding:0}.esu-st{display:grid;grid-template-columns:108px minmax(0,1fr) auto;gap:6px 16px;align-items:start;padding:14px 0;border-top:1px solid #E3D8C6}.esu-st.late{background:#FBEFEA;border-left:3px solid #A5432A;padding-left:12px;margin:0 -12px 0 -12px;padding-right:12px;border-radius:0 8px 8px 0}.esu-sw{display:flex;flex-direction:column;gap:2px}.esu-sd{color:#5A5346;font-weight:600;text-transform:uppercase;letter-spacing:.06em}.esu-sn{font-size:12.5px;color:#5A5346}.esu-sm{display:flex;flex-direction:column;gap:3px;min-width:0}.esu-stt{font-weight:600;font-size:15px}.esu-sb{display:flex;justify-content:flex-end}',
      '.esu-zero{background:#F1E9DC;border-radius:8px;padding:18px;color:#5A5346;text-align:center}',
      '.esu-dl{margin:0;display:grid;grid-template-columns:96px minmax(0,1fr)}.esu-dt{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;padding:10px 0;border-top:1px solid #E3D8C6}.esu-dd{margin:0;padding:9px 0;border-top:1px solid #E3D8C6;font-size:14px;display:flex;flex-direction:column;gap:1px}.esu-rowb{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:1px;width:100%}.esu-rowb:focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.esu-lg{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:#5A5346;margin:0 0 12px}.esu-lg span{display:inline-flex;gap:6px;align-items:center}.esu-ldot{width:12px;height:12px;border-radius:50%;display:inline-block;flex:none;box-sizing:border-box}',
      '.esu-ln{display:grid;border-top:1px solid #E3D8C6}.esu-lh{text-align:center;padding:8px 0 6px;font:500 11px "IBM Plex Mono",monospace;letter-spacing:.08em;color:#5A5346;border-radius:6px 6px 0 0}.esu-lh.cur{color:#A5432A;background:#F6EEDA}.esu-lr{padding:10px 8px 10px 0;border-top:1px solid #E3D8C6;display:flex;flex-direction:column;gap:2px;align-items:flex-start}.esu-lc{padding:4px 2px 10px;display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-content:flex-start;min-height:30px}.esu-lc.cur{background:#F6EEDA}.esu-lpb{border-top:1px solid #E3D8C6;padding:8px 4px 4px;font-size:10.5px;color:#5A5346;text-align:center;line-height:1.25;display:flex;align-items:flex-end;justify-content:center}',
      '.esu-gt{display:grid;gap:0;border-top:1px solid #E3D8C6}.esu-gt-r{display:grid;grid-template-columns:118px minmax(0,1fr);align-items:stretch;border-bottom:1px solid #E3D8C6}.esu-gt-r.hd{border-bottom:0}.esu-gt-l{padding:14px 8px 0 0;display:flex;align-items:flex-start}',
      '.esu-gt-t{position:relative;display:block;min-height:64px}.esu-gt-t.hd{min-height:0;display:grid;grid-template-columns:repeat(9,minmax(0,1fr));text-align:center}.esu-gt-t.hd b{font:500 11px \"IBM Plex Mono\",monospace;letter-spacing:.08em;color:#5A5346;padding:8px 0 6px;border-radius:6px 6px 0 0}.esu-gt-t.hd b.cur{color:#A5432A;background:#F6EEDA}.esu-gt-tag{position:absolute;top:-1px;transform:translateX(-50%);font:600 9.5px \"IBM Plex Sans\",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#A5432A;border-radius:99px;padding:1px 6px;font-style:normal;display:none}',
      '.esu-gt-s{position:absolute;inset:0;display:grid;grid-template-columns:repeat(9,minmax(0,1fr));pointer-events:none}.esu-gt-s i{border-left:1px solid #EDE3D3}.esu-gt-s i.cur{background:#F6EEDA}.esu-gt-bars{position:absolute;left:0;right:0;top:12px;height:40px}.esu-gt-b{position:absolute;top:0;height:40px;border-radius:6px;display:flex;align-items:center;justify-content:center;padding:2px 4px;font:600 11px/1.15 \"IBM Plex Sans\",sans-serif;text-align:center;white-space:normal;overflow:hidden;box-sizing:border-box;background:var(--bg);color:var(--fg)}.esu-gt-b.ahead{opacity:.72}.esu-gt-b.now{box-shadow:inset 0 0 0 1.5px var(--fg);font-weight:700}.esu-gt-b.done{opacity:.5}.esu-gt-b.late{box-shadow:inset 0 0 0 1.5px #A5432A;color:#A5432A}',
      '.esu-gt-dots{position:absolute;left:0;right:0;top:58px;height:40px}.esu-gt-d1{position:absolute;display:inline-flex;width:12px;height:12px}.esu-gt-now{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#A5432A;opacity:.55;pointer-events:none}',
      '.esu-ln-p{display:none}.esu-lp3{display:grid;grid-template-columns:46px minmax(0,1fr) minmax(0,1fr);border-top:1px solid #E3D8C6}.esu-lpm{padding:10px 0;font-size:11px;letter-spacing:.06em;color:#5A5346}.esu-lpm.cur{color:#A5432A}.esu-lpc{padding:8px 6px;display:flex;flex-direction:column;gap:4px}.esu-lpc.cur{background:#F6EEDA}.esu-lpl{display:flex;gap:6px;align-items:flex-start;font-size:12.5px;line-height:1.3}.esu-lpl .esu-ldot{margin-top:2px}.esu-lp3>.esu-proj{padding:8px 6px}',
      '.esu-clamp{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}',
      '.esu-chip{min-height:40px;padding:0 16px;border-radius:99px;border:1px solid #E3D8C6;background:#FBF6EE;color:#1E1A14;font:500 14px "IBM Plex Sans",system-ui,sans-serif;cursor:pointer}.esu-chip.on{background:#1E1A14;border-color:#1E1A14;color:#FBF6EE}',
      '.esu-ri{display:grid;gap:4px;text-align:left;padding:14px 16px;border:1px solid #E3D8C6;border-radius:8px;background:#FBF6EE;cursor:pointer;font:inherit;color:#1E1A14}.esu-ri.on{border-color:#A5432A}.esu-ri b{font:600 19px/1.2 "Cormorant Garamond",Georgia,serif}.esu-rim{display:flex;justify-content:space-between;gap:8px}.esu-rist{font-size:12.5px;color:#7A5A2E;font-weight:600;display:inline-flex;gap:6px;align-items:center}.esu-dotn{width:8px;height:8px;border-radius:50%;background:#A5432A;display:inline-block}',
      '.esu-rpane{background:#FBF6EE;border:1px solid #E3D8C6;border-radius:8px;padding:22px 26px;min-width:0}.esu-rt1{margin:2px 0 0;font:600 34px/1.1 "Cormorant Garamond",Georgia,serif}.esu-rbody{margin:16px 0}.esu-rbody p{font:400 19.5px/1.55 "Cormorant Garamond",Georgia,serif;margin:0 0 12px;padding:2px 0;max-width:660px}.esu-rbody p.ch{background:#F6EEDA;margin-left:-8px;margin-right:-8px;padding:4px 8px;border-radius:4px}',
      '.esu-obar{background:#F1E9DC;border-radius:8px;padding:14px 16px;margin:6px 0 18px}.esu-fb{border-top:1px solid #E3D8C6;padding-top:16px}.esu-cmt{display:flex;gap:12px;margin:14px 0}.esu-cmt.nested{margin:10px 0 0 6px}.esu-av{display:inline-flex;flex:none;width:34px;height:34px;border-radius:50%;align-items:center;justify-content:center;color:#fff;font:600 12px "IBM Plex Sans",system-ui,sans-serif}.esu-cmh{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;font-size:14px}.esu-cmb{font-size:15px;white-space:pre-wrap;word-break:break-word;margin:2px 0}.esu-cma{display:flex;gap:14px;align-items:center}',
      '.esu-kind{font:500 10px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em;border-radius:3px;padding:1px 6px}.esu-offer{margin-top:18px;padding-top:14px;border-top:1px dashed #E3D8C6}',
      '.esu-ed2{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:18px;align-items:start}.esu-aside{display:grid;gap:8px}.esu-fbc{display:flex;gap:10px;background:#EADDC6;border-radius:8px;padding:10px 12px;font-size:13.5px;cursor:pointer}.esu-fbc input{width:20px;height:20px;flex:none;margin-top:2px}',
      '.esu-prev{border:1px solid #E3D8C6;border-radius:8px;padding:14px 16px;background:#fff}.esu-rhead{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.esu-mchip{background:#20302A;color:#F6EFE2;border-radius:4px;padding:2px 8px;font:500 10px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em}',
      '.esu-bar2{display:flex;overflow:hidden}.esu-bar2 i{display:block;height:100%}.esu-bar2 i.c,.esu-leg i.c{background:#A5432A}.esu-bar2 i.p,.esu-leg i.p{background:#D2A65A}.esu-leg{display:inline-flex;gap:14px;font-size:12.5px;color:#5A5346}.esu-leg span{display:inline-flex;gap:6px;align-items:center}.esu-leg i{width:10px;height:10px;border-radius:2px;display:inline-block}.esu-how{font-size:12.5px;color:#5A5346;margin-top:3px}',
      '.esu-mc{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-top:6px}.esu-mcd{width:22px;height:22px;border-radius:50%;border:1px solid #C9B79A;display:inline-flex;align-items:center;justify-content:center;font:500 10px "IBM Plex Mono",ui-monospace,monospace;color:#5A5346}.esu-mcd.on{background:#A5432A;border-color:#A5432A;color:#fff}.esu-mcd.now{box-shadow:0 0 0 2px #FBF6EE,0 0 0 3px #A5432A}',
      '.esu-rnote{background:#F4E4DC;border-radius:8px;padding:8px 12px;margin-top:6px;font-size:13.5px}.esu-co{padding:6px 0;border-top:1px solid #E3D8C6}.esu-co:first-of-type{border-top:0}',
      '.esu-ccs{display:flex;gap:8px;flex-wrap:wrap}.esu-cc{min-height:40px;padding:0 14px;border-radius:99px;border:1px solid #E3D8C6;background:#fff;color:#1E1A14;font:500 13.5px "IBM Plex Sans",system-ui,sans-serif;cursor:pointer}.esu-cc.on{background:#20302A;border-color:#20302A;color:#fff}',
      '.esu-sum{margin-top:14px;padding-top:10px;border-top:1px solid #E3D8C6}.esu-win{background:#F1E9DC;border-radius:8px;padding:10px 14px;margin-bottom:6px}.esu-win b{display:block;font-size:15px}.esu-cues{display:grid;gap:10px;max-height:340px;overflow-y:auto}.esu-cue{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;padding:10px 12px;background:#F6EFE2;border-radius:8px;font-size:14.5px}.esu-cue .esu-eye{margin:0 0 2px}.esu-cuew{grid-column:1/-1;color:#5A5346}.esu-who{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:4px 0}.esu-who label{display:inline-flex;gap:6px;align-items:center;border:1px solid #E3D8C6;border-radius:99px;padding:6px 12px;background:#fff;font-size:14px}.esu-dots{display:flex;gap:6px;align-items:center;margin:2px 0}.esu-dot{width:18px;height:18px;border-radius:50%;border:2px solid #A5432A;display:inline-block}.esu-dot.on{background:#A5432A}',
      '.esu-q{padding:8px 0;border-top:1px solid #E3D8C6;font-size:14px;line-height:1.35}.esu-q a{color:#1E1A14;text-decoration:none;font-weight:500}.esu-q small{display:block;font-size:12px;color:#5A5346;margin-top:2px}.esu-q small b{color:#2E5A4B;font-weight:600}',
      '.esu-bar{height:6px;background:#E3D8C6;border-radius:99px;overflow:hidden;margin-top:6px}.esu-bar i{display:block;height:100%;background:#A5432A;min-width:0}',
      '.esu-bar.sm{height:4px;margin-top:5px}',
      '.esu-note{background:#EADDC6;border:1px solid #E3D8C6;border-radius:8px;padding:10px 14px;margin:0 0 14px;font-size:14px}.esu-err{color:#9b2c16;font-size:14px;margin:0 0 12px}',
      '.esu-stack{display:flex;flex-direction:column;gap:18px}.esu-duo{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:18px;align-items:start}',
      '.esu-alink{font-weight:500;color:#A5432A;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}.esu-tlink{background:none;border:0;padding:0;font:500 13.5px "IBM Plex Sans",system-ui,sans-serif;color:#A5432A;text-decoration:underline;text-underline-offset:3px;cursor:pointer;text-align:left}.esu-tlink:disabled{opacity:.55;cursor:default}a.esu-tlink{font:500 13.5px "IBM Plex Sans",system-ui,sans-serif}',
      '.esu-btn.sm{min-height:36px;padding:0 14px;font-size:13.5px}.esu-onlist{font-size:13px;color:#C9D1CB}.esu-skrow{height:56px;margin:10px 0}',
      '.esu-month .esu-mrow{display:grid;grid-template-columns:22px 110px minmax(0,1fr) auto;gap:4px 16px;align-items:center;padding:16px 0;border-top:1px solid #E3D8C6}',
      '.esu-month .esu-mrow:first-child{border-top:0}.esu-mlist{list-style:none;margin:8px 0 0;padding:0}',
      '.esu-ring{width:22px;height:22px;border-radius:50%;border:1.5px solid #B9AC94;display:inline-flex;align-items:center;justify-content:center;flex:none}',
      '.esu-ring.done{background:#2E5A4B;border-color:#2E5A4B}',
      '.esu-when{font:500 12px "IBM Plex Mono",monospace;color:#5A5346;text-transform:uppercase;letter-spacing:.06em;line-height:1.35}',
      '.esu-when b{display:block;color:#1E1A14;font-weight:500}',
      '.esu-mrow.hero{background:#22352D;color:#F4EDE1;border-radius:10px;padding:20px;margin:4px 0 6px;border-top:0}',
      '.esu-mrow.hero + .esu-mrow{border-top:0}',
      '.esu-mrow.hero .esu-when{color:#D9B36A}.esu-mrow.hero .esu-when b{color:#FBF6EE}.esu-mrow.hero .esu-ring{border-color:#D9B36A}',
      '.esu-mrow .ey{font:500 11px "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#D9B36A}.esu-hero-t{margin:4px 0 0;font:600 27px/1.1 "Cormorant Garamond",Georgia,serif;color:#FBF6EE}.esu-hero-d{margin:4px 0 0;max-width:62ch;font-size:14px;color:#C9D1CB}',
      '.esu-mrow.hero .bt{display:flex;flex-direction:column;gap:6px;align-items:flex-end}.esu-mrow .bt:empty{display:none}',
      // Hero actions: one primary button, the other actions as quiet rows split by hairlines, then a small footer line
      '.esu-mrow.hero .bt{flex-direction:row;flex-wrap:wrap;align-items:stretch;align-content:flex-start;gap:0;width:240px}.esu-mrow.hero .bt>*{flex:0 0 100%}',
      '.esu-mrow.hero .bt .esu-btn.gold,.esu-mrow.hero .bt .esu-btn.out{min-height:40px;border-radius:6px;margin-bottom:6px}',
      '.esu-mrow.hero .bt .esu-btn.lite{min-height:36px;border:0;border-top:1px solid rgba(246,239,226,.16);border-radius:0;background:transparent;justify-content:space-between;padding:0 2px;font-weight:500;font-size:13.5px}',
      '.esu-mrow.hero .bt .esu-btn.lite:not(:has(~ .esu-btn.lite)){border-bottom:1px solid rgba(246,239,226,.16)}',
      '.esu-mrow.hero .bt .esu-btn.lite::after{content:"\\2192";margin-left:12px;opacity:.55;transition:transform .15s,opacity .15s}.esu-mrow.hero .bt .esu-btn.lite:hover{color:#D9B36A!important}.esu-mrow.hero .bt .esu-btn.lite:hover::after{opacity:1;transform:translateX(3px)}',
      '.esu-mrow.hero .bt .esu-onlist,.esu-mrow.hero .bt .esu-tlink{flex:0 0 auto;margin-top:10px;font-size:12.5px}.esu-mrow.hero .bt .esu-tlink{margin-left:auto}',
      '.esu-rw-t{display:block;margin:0;font-weight:600;font-size:15.5px}.esu-rw-d{margin:2px 0 0;color:#5A5346;font-size:14px}',
      '.esu-tiles3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.esu-reclist{display:grid;gap:12px;margin-top:10px}.esu-rec{border:1px solid #E3D8C6;border-radius:8px;background:#fff;overflow:hidden;display:flex;flex-direction:column;min-width:0}',
      '.esu-rec .th{position:relative;height:92px;background:#2B4238;display:flex;align-items:center;justify-content:center}.esu-rec .th.wait{background:#EADDC6}.esu-rec .th .du{position:absolute;right:8px;bottom:6px;font:500 11px "IBM Plex Mono",monospace;color:#F4EDE1}.esu-rec .th .oi{font:500 11px "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#5A5346}',
      '.esu-th-btn{border:0;padding:0;margin:0;width:100%;cursor:pointer;font:inherit;text-decoration:none;transition:background .15s}.esu-th-btn:hover{background:#355045}.esu-th-btn:hover svg{transform:scale(1.08)}.esu-th-btn svg{transition:transform .15s}.esu-th-btn:focus-visible{outline:2px solid #D9B36A;outline-offset:-4px}',
      '.esu-vov{align-items:center}.esu-vdlg{background:#1E1A14;border-radius:8px;width:100%;max-width:960px;margin:auto;overflow:hidden}.esu-vhd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 10px 16px;color:#F4EDE1;font:500 15px "IBM Plex Sans",system-ui,sans-serif}.esu-vfr{position:relative;padding-top:56.25%;background:#000}.esu-vfr iframe{position:absolute;inset:0;width:100%;height:100%;border:0}',
      '.esu-rec .bd{padding:12px 14px;display:flex;flex-direction:column;gap:3px;min-width:0}.esu-tlink.on-dark{color:#D9B36A;font-size:inherit;display:inline;font-weight:500}',
      '.esu-seg{display:flex;gap:4px;background:#E3D8C6;border-radius:99px;padding:4px;margin:0 0 18px;max-width:560px;overflow-x:auto}.esu-seg a{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:0 14px;border-radius:99px;font:600 14px "IBM Plex Sans",system-ui,sans-serif;color:#5A5346;text-decoration:none;white-space:nowrap}.esu-seg a[aria-current=page]{background:#20302A;color:#fff}.esu-badge{background:#A5432A;color:#fff;border-radius:99px;padding:0 7px;font:500 11px/18px "IBM Plex Mono",monospace}',
      '.esu-smon{font:600 21px "Cormorant Garamond",Georgia,serif;margin:22px 0 6px}.esu-smon .none{font:500 11px "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#5A5346;margin-left:6px}.esu-slist{list-style:none;margin:0;padding:0;border-top:1px solid #E3D8C6}',
      '.esu-srow{display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:4px 14px;align-items:center;padding:14px 0;border-bottom:1px solid #E3D8C6}.esu-db{width:56px;height:56px;border-radius:8px;background:#F1E9DC;display:flex;flex-direction:column;align-items:center;justify-content:center;font:500 10px "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#5A5346}.esu-db b{font:600 24px/1 "Cormorant Garamond",Georgia,serif;color:#1E1A14;letter-spacing:0}',
      '.esu-stag{font:500 10px "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;border-radius:99px;padding:2px 8px;margin-right:6px;display:inline-block}.esu-stag.pod{background:#E4EEE8;color:#2E5A4B}.esu-stag.pod.mine{background:#2E5A4B;color:#fff}.esu-stag.one{background:#F6EBD8;color:#7A5A2E}.esu-in-ok{font:500 12px "IBM Plex Mono",monospace;color:#2E5A4B}',
      '.esu-sblock{list-style:none;background:#22352D;color:#F4EDE1;border-radius:10px;padding:16px 18px;margin:12px 0;border-bottom:0}.esu-sbh{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline}.esu-sbh .ey{font:500 11px "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#D9B36A}.esu-sess{display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:4px 14px;align-items:center;padding:12px 0;border-top:1px solid rgba(244,237,225,.18)}.esu-sess .esu-db{background:rgba(244,237,225,.1);color:#C9D1CB}.esu-sess .esu-db b{color:#FBF6EE}',
      '.esu-sfoot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;padding-top:12px;border-top:1px solid #E3D8C6}',
      '.esu-wg{font:500 11px "IBM Plex Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:#5A5346;margin:20px 0 4px}.esu-wlist{list-style:none;margin:0;padding:0}',
      '.esu-wl{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:4px 14px;align-items:center;padding:14px 0;border-bottom:1px solid #E3D8C6}.esu-wl .esu-rw-d{margin:0}',
      '.esu-wi{display:grid;grid-template-columns:44px minmax(0,220px) minmax(0,1fr);gap:8px 16px;align-items:center;padding:14px 0;border-bottom:1px solid #E3D8C6}.esu-wi.far{opacity:.72}',
      '.esu-wi .n{width:44px;height:44px;border-radius:50%;background:#F1E9DC;display:flex;align-items:center;justify-content:center;font:600 22px "Cormorant Garamond",Georgia,serif}.esu-wi .tt{display:flex;flex-direction:column;min-width:0}.esu-wi .nm{font:600 20px/1.15 "Cormorant Garamond",Georgia,serif}.esu-wi .dd{font-size:13px;color:#5A5346}.esu-wi .ey{font:500 10.5px "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#D9B36A}',
      '.esu-wi .pl{display:flex;gap:8px;flex-wrap:wrap}.esu-wi.cur{background:#22352D;color:#F4EDE1;border-radius:10px;padding:18px 20px;margin:6px 0;border-bottom:0}.esu-wi.cur .n{background:#D9B36A;color:#22352D}.esu-wi.cur .nm{color:#FBF6EE}.esu-wi.cur .dd{color:#C9D1CB}',
      '.esu-pill{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 13px;border-radius:99px;font:500 13px "IBM Plex Sans",system-ui,sans-serif;text-decoration:none;white-space:nowrap}',
      '.esu-pill.done{background:#E4EEE8;color:#2E5A4B!important}.esu-pill.open{background:#D9B36A;color:#22352D!important;font-weight:600}.esu-pill.due{border:1px solid #B9AC94;color:#1E1A14!important}.esu-pill.lock{border:1px dashed #B9AC94;color:#5A5346}',
      '.esu-wi.cur .esu-pill.done{background:rgba(228,238,232,.18);color:#E4EEE8!important}.esu-wi.cur .esu-pill.due{border-color:rgba(244,237,225,.5);color:#F4EDE1!important}.esu-wi.cur .esu-pill.lock{border-color:rgba(244,237,225,.4);color:#C9D1CB}',
      '.esu-strip{display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;background:#FBF6EE;border-bottom:1px solid #E3D8C6;padding:10px 24px;font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:14px;color:#1E1A14}.esu-strip *{box-sizing:border-box}',
      '.esu-strip .back{color:#A5432A;font-weight:600;text-decoration:none;white-space:nowrap}.esu-strip .cr{font:500 11px "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#5A5346;flex:1;min-width:0}',
      '.esu-strip .esu-seg{margin:0;max-width:none;flex:none}.esu-seg.sm a{min-height:34px;font-size:13px;padding:0 12px}.esu-strip .esu-badge{color:#fff}',
      '.esu-bring{background:#F1E9DC;border-radius:8px;padding:12px 14px;margin-top:10px;font-size:14px}.esu-bring ul{margin:6px 0 0;padding-left:18px;display:grid;gap:4px}',
      '.esu-tiles{display:grid;gap:12px;margin-top:12px}.esu-ptile{border:1px solid #E3D8C6;border-radius:8px;padding:14px 16px;background:#fff;display:flex;flex-direction:column;gap:4px}.esu-ptile .k{font:500 10.5px "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#5A5346}.esu-ptile .lk{display:flex;gap:6px 16px;flex-wrap:wrap;margin-top:4px}',
      '.esu-mprog{background:#F6EEDA;border-radius:8px;padding:12px 16px;margin-top:14px;display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap}',
      '.esu-closed{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.esu-six{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 28px}',
      '.esu-card{background:#FBF6EE;border:1px solid #E3D8C6;border-radius:8px;padding:18px 20px;min-width:0}',
      '.esu-pine{background:#20302A;color:#F6EFE2;border-radius:8px;padding:22px 24px;min-width:0}.esu-pine .esu-eye{color:#D2A65A}',
      '.esu-hd{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px}',
      '.esu-h2{margin:0;font:600 24px/1.15 "Cormorant Garamond",Georgia,serif}',
      '.esu-mono{font:500 12px "IBM Plex Mono",ui-monospace,monospace;color:#5A5346}',
      '.esu-muted{color:#5A5346;font-size:14px;margin:0}.esu-ok{color:#2E5A4B;font-weight:600}',
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
      '.esu input,.esu textarea,.esu select,#esu-say{color:#1E1A14;background:#fff;caret-color:#1E1A14}.esu input::placeholder,.esu textarea::placeholder{color:#6E6658;opacity:1}.esu-chat .esu-msgb,.esu-chat .esu-msgh b{color:#1E1A14}',
      '.esu-slot.on{background:#20302A;border-color:#20302A;color:#fff!important}.esu-slot{cursor:pointer;font-family:inherit;min-height:40px}',
      '.esu-book{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 0;border-top:1px solid #E3D8C6}.esu-book:first-of-type{border-top:0}.esu-bt{font-weight:600;font-size:16px;line-height:1.3}.esu-ba{font-size:13.5px;color:#5A5346}.esu-bm{padding:14px 0;border-top:1px solid #E3D8C6}.esu-bm.now{background:#F6EFE2;margin:0 -12px;padding:14px 12px;border-radius:8px;border-top:0}',
      '.esu-slots{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}.esu-slot{border:1px solid #E3D8C6;border-radius:99px;padding:7px 14px;font-size:13.5px;font-weight:500;color:#1E1A14!important;text-decoration:none;background:#fff}.esu-slot:hover{border-color:#A5432A}',
      '.esu-lnk{background:none;border:0;padding:0;color:#5A5346;font:inherit;text-decoration:underline;cursor:pointer}',
      '.esu-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(32,48,42,.55);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto}',
      '.esu-dlg{background:#FBF6EE;border-radius:8px;padding:22px 24px;width:100%;max-width:560px;margin:auto}',
      '@media (max-width:760px){',
      '.esu-st{grid-template-columns:minmax(0,1fr) auto}.esu-sw{grid-column:1/-1;flex-direction:row;gap:8px;align-items:baseline}.esu-cue{grid-template-columns:minmax(0,1fr)}.esu-steps4{grid-template-columns:repeat(2,minmax(0,1fr))}.esu-rcols,.esu-ed2{grid-template-columns:minmax(0,1fr)}.esu-rpane{padding:16px}.esu-rt1{font-size:28px}',
      '.esu{padding:24px 16px 56px}.esu-h1{font-size:36px}',
      '.esu-ln-d{display:none}.esu-ln-p{display:block}.esu-lg.esu-ln-p{display:flex}',
      '.esu-grid2,.esu-six{grid-template-columns:minmax(0,1fr)}.esu-hero-t{font-size:24px}.esu-mrow.hero .bt{width:100%}',
      '.esu-wi{grid-template-columns:44px minmax(0,1fr)}.esu-wi .pl{grid-column:1 / -1}.esu-strip{padding:10px 16px}.esu-strip .cr{display:none}.esu-strip .esu-seg{width:100%;max-width:100%}',
      '.esu-srow,.esu-sess{grid-template-columns:56px minmax(0,1fr)}.esu-srow > .bt,.esu-sess > .bt{grid-column:2}',
      '.esu-tiles3{grid-template-columns:minmax(0,1fr)}.esu-tiles3 .esu-rec,.esu-reclist .esu-rec{flex-direction:row}.esu-rec .th{height:auto;min-height:92px;width:112px;flex:none}',
      '.esu-month .esu-mrow{grid-template-columns:22px minmax(0,1fr)}.esu-month .esu-mrow > .tx,.esu-month .esu-mrow > .bt{grid-column:1 / -1}',
      '}',
      '@media (max-width:860px){.esu-duo{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function hd(title, right) { return '<div class="esu-hd"><h2 class="esu-h2">' + esc(title) + '</h2>' + (right || '') + '</div>'; }

  // Book of the month: this month's required (and suggested) book, with where to buy it, and a popup with the whole reading list
  function bookLine(b) {
    return '<div class="esu-book"><div><div class="esu-bt">' + esc(b.title) + '</div><div class="esu-ba">' + esc(b.author) + (b.audio ? ' · also on ' + esc(b.audio) : '') + '</div>' + (b.note ? '<div class="esu-ba" style="font-style:italic">' + esc(b.note) + '</div>' : '') + '</div>' +
      ext(amazonUrl(b), 'Buy on ' + amazonLabel(), 'esu-btn out') + '</div>';
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

  // ---- The mentee page, in five places: this month, the room, practice with others, the two projects, the record ----
  // (docs/sahrdaya-upaya-page.md). Each thing appears once; a state shows only when it is true.
  var TICK = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.4 6.4l2.5 2.5 4.7-5.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  var firstName = function (n) { return String(n || '').trim().split(/\s+/)[0]; };
  // "Ruth", "Ruth and Daniel", "Ruth, Daniel and Asha"
  function nameList(list) { var a = (list || []).map(function (x) { return firstName(x.name); }).filter(Boolean); return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || ''; }
  function localDay(iso) { try { return new Date(iso).toLocaleDateString('en-CA', { timeZone: myZone() }); } catch (e) { return String(iso).slice(0, 10); } }
  var places = function (n) { return n <= 0 ? 'full' : (NUM[n] || n) + (n === 1 ? ' place left' : ' places left'); };
  // lower-case the first letter of a step title to carry it inside a sentence (leave "Session 1…" and the like alone)
  var low1 = function (s) { return /^[A-Z][a-z]/.test(s) && !/^(Session|Immersion|Sanskrit|Q1)/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; };
  var plainJoin = function (a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || ''; };

  function rwText(title, line, extra) { return '<p class="esu-rw-t">' + title + '</p>' + (line ? '<p class="esu-rw-d">' + line + '</p>' : '') + (extra || ''); }
  var btnA = function (act, label, extra) { return '<button type="button" class="esu-btn out sm" data-act="' + act + '"' + (extra || '') + '>' + label + '</button>'; };

  // One row of "This month": a ring (decoration only), when, the words, one button
  function mrow(o) {
    return '<li class="esu-mrow' + (o.hero ? ' hero' : '') + '"><span class="esu-ring' + (o.done ? ' done' : '') + '" aria-hidden="true">' + (o.done ? TICK : '') + '</span>' +
      '<span class="esu-when"><b>' + esc(o.w1) + '</b>' + esc(o.w2 || '') + '</span><div class="tx">' + o.tx + '</div><div class="bt">' + (o.bt || '') + '</div></li>';
  }

  // The notes to bring to a one-to-one (nothing to tick). The mid-year and readiness months add one line.
  function bringBox(y) {
    var items = ['Ideas for your final project', 'One thing you’re struggling with in your practice', 'One thing you want to develop as a teacher or professional'];
    if (y && y.bring === 'mid') items.push('Your hours so far, and the six competencies, to look at together with Jacob');
    if (y && y.bring === 'readiness') items.push('Your plan for July: the talk date and the three sessions');
    return '<div class="esu-bring"><b>Bring to your one-to-one</b> <span class="esu-mono">· nothing to tick</span><ul>' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
  }
  // The summary box (amber), opened inside the one-to-one row
  function sumEditor(y) {
    var yo = y.oneToOne || {}, sum = yo.summary, until = yo.editableUntil ? dmyT(yo.editableUntil) : '', tpl = (yo.template || []).join(' ');
    return '<div style="background:#FBEFD9;border:1px solid #E8C98A;border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;margin-top:10px"><label for="esu-sum" style="display:flex;flex-direction:column;gap:6px;font-size:14px"><span><b>' + (sum ? 'Edit your summary' : 'Add your summary') + '</b>' + (sum ? '' : ' · needed before you meet') + '</span><span style="font-size:13px;color:#5A5346">What would you like to work on, discuss, or are you struggling with?' + (until ? ' Send it by ' + esc(until) + ' so Jacob can prepare.' : '') + '</span></label>' +
      '<textarea id="esu-sum" class="esu-in" rows="4" maxlength="2000" data-in="yr-text" placeholder="' + esc(tpl) + '" style="min-height:110px">' + esc(yrState.text) + '</textarea>' +
      (yrState.msg && yrState.msgFor === 'sum' ? '<p class="esu-err" role="alert">' + esc(yrState.msg) + '</p>' : '') + '<div class="esu-acts"><button type="button" class="esu-btn pri" data-act="yr-save-sum"' + (yrState.busy === 'sum' ? ' disabled' : '') + '>' + (yrState.busy === 'sum' ? 'Sending…' : 'Send to Jacob') + '</button><button type="button" class="esu-btn out" data-act="yr-edit-cancel">Cancel</button></div></div>';
  }

  // ---- the rows ----
  // A row's words as changed in Ops → Mentee year (home.monthRows: { key: { title, line, hide } }); blank means as written here
  function ov(w, key) { var m = (w.home && w.home.monthRows) || {}; return m[key] || {}; }
  // This month's book. When next month's book starts partway through this month (Mentee Books `starts`, e.g. after an immersion
  // weekend), both show: this one "Now", the next "From <date>". A book's `note` (Mentee Books) is shown under it.
  function readRow(w) {
    var B = w.home.books || {}, bk = B.current, nx = B.next, ym = w.today.slice(0, 7), out = [];
    var line = function (b, extra) { return (b.author ? esc(b.author) + '. ' : '') + (b.note ? esc(b.note) + ' ' : '') + extra; };
    var soon = nx && nx.required.length && nx.starts.slice(0, 7) === ym;
    if (bk && bk.required.length) {
      var b = bk.required[0], cy = B.carry, midStart = bk.starts.slice(0, 7) === ym && bk.starts.slice(8) !== '01';
      out.push({ k: '0-a', w1: soon ? 'Now' : midStart ? 'From ' + dm(bk.starts) : 'All month', tx: rwText('Read ' + esc(b.title), line(b, 'About 30 minutes most days.' + (cy && cy.required.length ? ' Last month’s book is there if you’d like it.' : ''))), bt: btnA('all-books', 'The book') });
    }
    if (soon) { var n = nx.required[0]; out.push({ k: '0-a2', w1: 'From ' + dm(nx.starts), tx: rwText('Read ' + esc(n.title), line(n, '')), bt: btnA('all-books', 'The book') }); }
    return out;
  }
  function buddyRow(w) {
    var h = w.home, p = h.partner, a = h.articulation, mo = (a && a.month) || { sessions: 0, last: '' };
    var o = ov(w, 'buddy'); if (o.hide) return null;
    if (!p) return { k: '0-b', w1: 'Any time', tx: rwText(esc(o.title) || 'Your buddy is on the way', esc(o.line) || 'Jacob pairs everyone at the start of each rotation.') };
    var list = p.partners && p.partners.length ? p.partners : [{ name: p.name, email: p.email }], many = list.length > 1, nm = esc(nameList(list));
    if (mo.sessions > 0) return { k: '1-' + (mo.last || w.today), done: true, w1: 'Done', w2: mo.last ? dm(mo.last) : '', tx: rwText('Buddy session with ' + nm, 'Logged for ' + (many ? 'all of you' : 'both of you') + '.'), bt: btnA('open-articulation', 'Log another') };
    var win = p.window && p.window.spans && p.window.spans[0] ? '<br>A time that suits ' + (many ? 'all of you' : 'you both') + ': ' + esc(p.window.days) + ', ' + esc(p.window.spans[0].text) + ' ' + esc(p.window.spans[0].label) + '.' : '';
    var url = p.chatUrl || 'mailto:' + list.map(function (x) { return x.email; }).filter(Boolean).join(',');
    return { k: '0-b', w1: 'Any time', tx: rwText((o.title ? esc(o.title) + ': ' : 'Meet your ' + (many ? 'buddies' : 'buddy') + ', ') + nm, (esc(o.line) || 'An hour together: each of you explains one idea until the other could explain it too.') + win), bt: ext(url, 'Say hello', 'esu-btn out sm') };
  }
  function heroRow(o) {
    return '<li class="esu-mrow hero"><span class="esu-ring" aria-hidden="true"></span><span class="esu-when"><b>' + esc(o.w1) + '</b>' + esc(o.w2 || '') + '</span><div class="tx"><div class="ey">' + esc(o.ey) + '</div><p class="esu-hero-t">' + esc(o.title) + '</p><p class="esu-hero-d">' + o.line + '</p></div><div class="bt">' + (o.bt || '') + '</div></li>';
  }
  function immersionRows(w) {
    var h = w.home, im = h.immersion, ym = w.today.slice(0, 7), out = [];
    var io = im ? ov(w, 'immersion-' + im.n) : {};
    if (im && !io.hide && (im.sat.slice(0, 7) === ym || im.happening)) {
      var p = im.prepare, pr = im.practicum, prepOpen = p.open && safeUrl(p.url);
      var when = im.happening ? 'this weekend' : im.daysTo === 1 ? 'tomorrow' : 'in ' + im.daysTo + ' days';
      var line = (io.line ? esc(io.line) : (im.n === 1 ? 'Your first weekend together: the Open Session' : 'The Open Session') + ' with the whole school on Saturday, and the Practicum on Sunday. Before then, one short Prepare lesson.') + (p.open ? '' : ' The Prepare lesson opens ' + esc(dml(p.opens)) + '.');
      var rsvp = pr ? (pr.rsvped || state.going[pr.id] ? '<span class="esu-onlist">You’re on the list ✓</span>' : '<button type="button" class="esu-btn lite sm" data-act="rsvp" data-id="' + esc(pr.id) + '"' + (state.busy === 'rsvp' ? ' disabled' : '') + '>RSVP for Sunday’s Practicum</button>') : '';
      var live = (im.satLink ? ext(im.satLink, 'Join Saturday’s Open Session', 'esu-btn lite') : '') + (im.sunLink ? ext(im.sunLink, 'Join Sunday’s Practicum', 'esu-btn lite') : '');
      var bt = (prepOpen ? ext(p.url, p.done ? 'Review the Prepare lesson' : 'Open the Prepare lesson', p.done ? 'esu-btn out' : 'esu-btn gold') : '') + live + rsvp + '<a class="esu-tlink on-dark" href="' + MP + '?view=schedule" data-act="view" data-view="schedule">Full schedule</a>';
      out.push({ k: '1-' + im.sat, hero: true, html: heroRow({ w1: span(im.sat, im.sun), w2: 'Sat & Sun', ey: 'Next immersion · ' + im.n + ' of ' + im.of + ' · ' + when, title: im.title, line: line, bt: bt }) });
    }
    var g = h.integrate;
    if (g) out.push({ k: '1-' + (g.sat || w.today), hero: true, html: heroRow({ w1: g.sat ? span(g.sat, g.sun) : '', w2: 'Sat & Sun', ey: 'Integrate · Immersion ' + g.n, title: g.title, line: 'Take a few quiet minutes to integrate the weekend.' + (h.recordings && h.recordings.items.length ? ' <button type="button" class="esu-tlink on-dark" data-act="goto-rec">Missed a part? The recordings are just below.</button>' : ''), bt: ext(g.url, 'Open the Integrate lesson', 'esu-btn gold') }) });
    var d = h.integrated;
    if (d) out.push({ k: '1-' + d.sat, done: true, w1: 'Done', w2: dm(d.sun), tx: rwText('Immersion ' + d.n + ' · ' + esc(d.title), 'You’ve completed the weekend and its Integrate lesson.') });
    return out;
  }
  function oneRow(w) {
    var h = w.home, o = h.oneToOne, y = YR(w) || { oneToOne: {} }, yo = y.oneToOne || {}, bk = o.booked, win = o.window, sum = yo.summary, oo = ov(w, 'one-to-one'), title = esc(oo.title) || 'One-to-one with Jacob';
    if (oo.hide) return null;
    var np = w.today.slice(0, 7).split('-').map(Number), nxt = np[1] === 12 ? (np[0] + 1) + '-01' : np[0] + '-' + String(np[1] + 1).padStart(2, '0'), nextName = dayFmt(nxt + '-15', { month: 'long' });
    if (bk && Date.parse(bk.start) + 36e5 < Date.now()) return { k: '1-' + localDay(bk.start), done: true, w1: 'Done', w2: dm(localDay(bk.start)), tx: rwText(title, 'Thank you. Your next one is in ' + esc(nextName) + '.') };
    if (!bk && o.held) return { k: '1-' + o.held, done: true, w1: 'Done', w2: dm(o.held), tx: rwText(title, 'Thank you. Your next one is in ' + esc(nextName) + '.') };
    var w1 = win ? span(win.from, win.to) : 'Next window';
    if (bk) {
      var day = fmtTime(bk.start, { weekday: 'short' }) + ' ' + fmtTime(bk.start, { day: 'numeric' }), until = yo.editableUntil ? dmyT(yo.editableUntil) : '';
      var line, bt, extra = '';
      if (yrState.editing && yo.canEdit) { line = sum ? 'Edit your summary below.' : 'Add a few lines for Jacob before you meet.'; extra = sumEditor(y); }
      else if (sum) {
        line = 'Your summary is in.' + (yo.canEdit ? ' You can edit it until ' + esc(until) + '.' : ' It’s close to your session, so the summary is fixed. Message Jacob if something changed.');
        bt = yo.canEdit ? btnA('yr-edit', 'Edit summary') : ext(o.messageUrl, 'Message Jacob', 'esu-btn out sm'); extra = bringBox(y);
      } else if (yo.canEdit) { line = 'Add a few lines for Jacob before you meet.'; bt = btnA('yr-edit', 'Add summary'); extra = bringBox(y); }
      else { line = 'It’s close to your session, so the summary is fixed. Message Jacob if something changed.'; bt = ext(o.messageUrl, 'Message Jacob', 'esu-btn out sm'); }
      return { k: '1-' + (win ? win.from : localDay(bk.start)), w1: w1, w2: 'Booked ' + day, tx: rwText(title, line, extra), bt: bt };
    }
    if (!win) return { k: '1-' + w.today.slice(0, 7) + '-99', w1: w1, tx: rwText(title, 'The next window will be announced here.') };
    var chips = o.slots && o.slots.length ? '<div class="esu-slots" style="margin:10px 0 0">' + o.slots.slice(0, 3).map(function (sl) { return ext(sl.url, esc(dmyT(sl.start)) + ' · ' + esc(hmT(sl.start)), 'esu-slot'); }).join('') + '</div>' : '';
    return { k: '1-' + win.from, w1: w1, w2: 'Booking open', tx: rwText(title, esc(oo.line) || '45 minutes. When you book, add a few lines on what you’d like to talk about.', bringBox(y) + chips), bt: ext(o.bookingUrl, 'See times', 'esu-btn out sm') };
  }
  function reflectionRow(w) {
    var h = w.home, r = h.reflection, y = YR(w), m = y && y.month, ym = w.today.slice(0, 7), mine = r.mine;
    var due = (m && m.reflectionDue) || lastMonday(ym), fm = h.formation || { n: 0 };
    var ro = ov(w, 'reflection'); if (ro.hide) return null;
    var title = ro.title ? esc(ro.title) : fm.n === 1 ? 'Write your first reflection' : 'Write your ' + dayFmt(ym + '-01', { month: 'long' }) + ' reflection';
    var fresh = r.unread ? '<p class="esu-rw-d">New in the cohort: ' + r.unread + (r.unread === 1 ? ' reflection' : ' reflections') + ' you haven’t read.</p>' : '';
    var open = function (label, cls) { return link(r.url, label, cls || 'esu-btn out sm'); };
    if (mine && mine.status === 'posted') return { k: '1-' + due, done: true, w1: 'Done', w2: mine.postedDay ? dm(mine.postedDay) : '', tx: rwText(title, 'Posted to Sādhana School.', fresh) };
    var line = !mine ? (esc(ro.line) || 'Choose one or a few things from the assigned books that shifted your understanding, and deepen that shift with your reflection. Share it with the cohort when you’re ready.') : mine.status === 'shared' ? 'Shared with the cohort. Post it to Sādhana School when you’re ready.' : 'A draft is saved.';
    var bt = !safeUrl(r.url) ? '' : !mine ? open('Start writing') : mine.status === 'shared' ? link(r.url + (r.url.indexOf('?') < 0 ? '?' : '&') + 'post=' + encodeURIComponent(mine.id), 'Post to SS', 'esu-btn out sm') : open('Keep writing');
    return { k: '1-' + due, w1: 'By ' + dm(due), w2: dayFmt(due, { weekday: 'short' }), tx: rwText(title, line, fresh), bt: bt };
  }
  // Hand-ins due this month, only when there are any (the "Nothing due" line and the Workbook list are gone)
  function handinRows(w) {
    var ym = w.today.slice(0, 7);
    return (w.due.items || []).filter(function (it) { return it.type === 'handin' && /^\d{4}-\d\d-\d\d$/.test(it.due || '') && it.due.slice(0, 7) === ym; }).map(function (it) {
      var sub = it.submission, inn = sub && sub.status === 'submitted';
      return { id: 'handin-' + slugK(it.title), k: '1-' + it.due, done: !!inn, w1: inn ? 'Done' : 'By ' + dm(it.due), w2: inn ? '' : dayFmt(it.due, { weekday: 'short' }), tx: rwText('Hand in: ' + esc(it.title), inn ? 'Handed in' : sub && sub.status === 'returned' ? 'Jacob returned it' + (sub.note ? ': ' + esc(sub.note) : '.') : sub && sub.status === 'draft' ? 'A draft is saved.' : esc(it.where || '')),
        bt: '<button type="button" class="esu-btn out sm" data-act="open-handin" data-id="' + esc(it.id) + '">' + (!sub ? 'Hand in' : sub.status === 'draft' ? 'Continue' : sub.status === 'returned' ? 'Edit and resend' : 'View') + '</button>' };
    });
  }

  // Tasks staff add in Ops → Mentee year (Mentee Schedule, kind task), due this month: a tick button, and "Open" when the task has a link
  function taskRows(w) {
    var y = YR(w);
    return (y && y.tasks || []).map(function (t) {
      var d = t.status === 'done', go = safeUrl(t.link) ? ext(t.link, 'Open', 'esu-btn out sm') : '';
      var tick = '<button type="button" class="esu-btn out sm" data-act="yr-tick" data-id="' + esc(t.id) + '" aria-pressed="' + (d ? 'true' : 'false') + '">' + (d ? 'Done ✓' : 'Mark done') + '</button>';
      return { id: t.id, k: '1-' + t.date, done: d, w1: d ? 'Done' : 'By ' + dm(t.date), w2: d ? '' : dayFmt(t.date, { weekday: 'short' }), tx: rwText(esc(t.title), t.detail ? esc(t.detail) : ''), bt: '<span style="display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end">' + go + tick + '</span>' };
    });
  }

  // The same row keys as lib/mentee/monthlist.js (slug)
  function slugK(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
  function monthSection(w) {
    var h = w.home, y = YR(w), fm = h.formation || { n: 0 }, ym = w.today.slice(0, 7);
    if (y && !y.started && w.today < y.startsOn) return '<section class="esu-card esu-month"><h2 class="esu-h2">This month</h2><p class="esu-muted" style="margin-top:6px">Your first month starts on ' + esc(dml(y.startsOn)) + '.</p></section>';
    if (y && !y.started) return '<section class="esu-card esu-month"><h2 class="esu-h2">This month</h2><p class="esu-muted" style="margin-top:6px">The year is complete. Thank you for your presence.</p></section>';
    var rows = [], add = function (r) { if (r) rows.push(r); };
    // Each row carries the key Ops uses for it (lib/mentee/monthlist.js), so the order set in Ops → Mentee year applies here
    var tag = function (r, id) { if (r) r.id = id; return r; }, B = h.books || {}, im = h.immersion;
    readRow(w).forEach(function (r, i) { var b = i === 0 && B.current && B.current.required.length && r.k === '0-a' ? B.current.required[0] : B.next && B.next.required[0]; add(tag(r, b ? 'book-' + slugK(b.title) : '')); });
    add(tag(buddyRow(w), 'buddy')); immersionRows(w).forEach(function (r) { add(tag(r, r.hero && im && r.k === '1-' + im.sat ? 'immersion-' + im.n : '')); });
    add(tag(oneRow(w), 'one-to-one')); add(tag(reflectionRow(w), 'reflection'));
    handinRows(w).forEach(function (r) { add(tag(r, r.id || '')); }); taskRows(w).forEach(add);
    var ord = h.monthOrder || [], at = {}; ord.forEach(function (k, i) { at[k] = i; });
    rows.forEach(function (r, i) { r.i = i; });
    rows.sort(function (a, b) { return a.k < b.k ? -1 : a.k > b.k ? 1 : 0; });
    if (ord.length) { rows.forEach(function (r, i) { r.i = i; }); rows.sort(function (a, b) { var x = a.id in at ? at[a.id] : 1e6 + a.i, y = b.id in at ? at[b.id] : 1e6 + b.i; return x - y; }); }
    var done = rows.filter(function (r) { return r.done; }).length, n = rows.length, th = y && y.month && y.month.theme;
    var eye = dayFmt(ym + '-01', { month: 'long' }) + (fm.n >= 1 ? ' · month ' + fm.n + ' of your formation' : '');
    return '<section class="esu-card esu-month" aria-labelledby="esu-m-h"><div class="esu-hd" style="margin-bottom:2px"><div><p class="esu-eye">' + esc(eye) + '</p><h2 class="esu-h2" id="esu-m-h" style="margin-top:4px;font-size:27px">' + (done ? 'This month' : 'This month, ' + (NUM[n] || n) + (n === 1 ? ' thing' : ' things')) + '</h2></div>' + (done ? '<span class="esu-mono">' + done + ' of ' + n + ' done</span>' : '') + '</div>' +
      (th ? '<p class="esu-rw-d" style="font-style:italic;margin-top:2px">' + esc(th) + '</p>' : '') +
      '<ul class="esu-mlist">' + rows.map(function (r) { return r.html || mrow(r); }).join('') + '</ul></section>';
  }

  // ---- Recordings: the newest three, filled in automatically after every weekend (lib/mentee/recordings.js) ----
  var PLAY = '<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="17" fill="#F4EDE1"/><path d="M14 10.5l9.5 6.5-9.5 6.5z" fill="#2B4238"/></svg>';
  var dur = function (sec) { if (!sec) return ''; var m = Math.round(sec / 60), h = Math.floor(m / 60); return h ? h + ':' + String(m % 60).padStart(2, '0') + ' h' : m + ' min'; };
  // A ready recording plays in a pop-up on this page (the Vimeo player); the thumbnail and "Watch Now" both start it.
  // Without a Vimeo address the two fall back to a link to the recording post.
  function recTile(x) {
    var ready = x.state === 'ready', v = ready ? safeUrl(x.video) : '', u = ready ? safeUrl(x.url) : '';
    var thIn = ready ? PLAY + (x.duration ? '<span class="du">' + esc(dur(x.duration)) + '</span>' : '') : '<span class="oi">On its way</span>';
    var lbl = esc('Play ' + x.title);
    var th = v ? '<button type="button" class="th esu-th-btn" data-act="play" data-v="' + esc(v) + '" data-t="' + esc(x.title) + '" aria-label="' + lbl + '">' + thIn + '</button>'
      : u ? '<a class="th esu-th-btn" href="' + esc(u) + '" target="_top" aria-label="' + lbl + '">' + thIn + '</a>'
      : '<div class="th' + (ready ? '' : ' wait') + '">' + thIn + '</div>';
    var cta = v ? '<button type="button" class="esu-tlink" data-act="play" data-v="' + esc(v) + '" data-t="' + esc(x.title) + '" style="align-self:flex-start">Watch Now</button>' : u ? link(u, 'Watch Now', 'esu-tlink') : '';
    return '<div class="esu-rec">' + th + '<div class="bd"><span class="esu-mono" style="text-transform:uppercase;letter-spacing:.06em">' + esc(dmy(x.day)) + '</span><span class="esu-rw-t">' + esc(x.title) + '</span>' + (x.sub ? '<span class="esu-rw-d" style="margin:0">' + esc(x.sub) + '</span>' : '') +
      (ready ? cta : '<span class="esu-rw-d" style="margin:0">Usually here within a day.</span>') + '</div></div>';
  }
  // The player pop-up lives outside the page's own markup, so the page re-drawing (the chat refreshing) never restarts the video.
  var player = null;
  function closePlayer() { if (!player) return; var back = player.back; player.el.remove(); document.removeEventListener('keydown', player.key, true); player = null; if (back && document.body.contains(back)) back.focus(); }
  function openPlayer(src, title, back) {
    closePlayer();
    var u = src + (src.indexOf('?') < 0 ? '?' : '&') + 'autoplay=1';
    var el = document.createElement('div');
    el.className = 'esu-ov esu-vov';
    el.innerHTML = '<div class="esu-vdlg" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="esu-vhd"><span>' + esc(title) + '</span><button type="button" class="esu-btn lite" data-close="1">Close</button></div>' +
      '<div class="esu-vfr"><iframe src="' + esc(u) + '" title="' + esc(title) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div></div>';
    el.addEventListener('click', function (e) { if (e.target === el || e.target.closest('[data-close]')) closePlayer(); });
    var key = function (e) { if (e.key === 'Escape') { e.stopPropagation(); closePlayer(); } };
    document.addEventListener('keydown', key, true);
    document.body.appendChild(el);
    player = { el: el, key: key, back: back };
    el.querySelector('[data-close]').focus();
  }
  function recordingsCard(w) {
    var r = w.home.recordings;
    if (!r) return w.pending ? '<section class="esu-card" id="recordings"><h2 class="esu-h2">Recordings</h2><div class="esu-tiles3"><div class="esu-sk" style="height:120px"></div><div class="esu-sk" style="height:120px"></div><div class="esu-sk" style="height:120px"></div></div></section>' : '';
    if (!r.items.length) return '';
    return '<section class="esu-card" id="recordings" aria-labelledby="esu-rec-h"><div class="esu-hd" style="margin-bottom:2px"><h2 class="esu-h2" id="esu-rec-h">Recordings</h2><button type="button" class="esu-tlink" data-act="rec-all">All recordings (' + r.count + ')</button></div>' +
      '<p class="esu-rw-d" style="margin:0 0 12px">' + (r.after ? 'Every Open Session and Practicum, added here within a day of the weekend.' : 'After each immersion, the Open Session and the Practicum appear here within a day.') + '</p>' +
      '<div class="esu-tiles3">' + r.items.slice(0, 3).map(recTile).join('') + '</div></section>';
  }

  // ---- The mentorship room: the cohort's chat, and a private line to Jacob ----
  function roomCard(w) {
    var r = w.home.room, tab = state.room === 'jacob' ? 'jacob' : 'chat';
    var pinned = r.pinned.length ? '<div class="esu-pin">' + r.pinned.map(function (x) { return ext(x.url, esc(x.label), ''); }).join('<span aria-hidden="true">·</span>') + '</div>' : '';
    var bar = '<div class="esu-rt" role="tablist">' + [['chat', 'Cohort chat'], ['jacob', 'Message Jacob']].map(function (t) { return '<button type="button" role="tab" aria-selected="' + (tab === t[0]) + '" data-act="room" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var body;
    if (tab === 'jacob') {
      body = '<p class="esu-muted" style="margin-bottom:12px">A private message to Jacob in Circle, for anything you’d rather not put in the group.</p><div class="esu-acts">' + ext(r.messageUrl, 'Message Jacob', 'esu-btn pri') + '</div>';
    } else {
      body = (r.chat && r.chat.length ? '<div class="esu-chat" role="log" aria-label="Latest messages in the cohort chat">' + r.chat.slice(-8).map(function (m) {
          return '<div class="esu-msg"><div class="esu-msgh"><b>' + esc(m.who) + '</b>' + (m.mentor ? '<span class="esu-tag">MENTOR</span>' : '') + '<span class="esu-mono">' + esc(fmtTime(m.at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })) + '</span></div><div class="esu-msgb">' + esc(m.text) + '</div></div>';
        }).join('') + '</div>' : '<div class="esu-empty">' + (w.pending ? 'Loading…' : 'Say hello to your cohort.') + '</div>') +
        '<div class="esu-say"><label for="esu-say" style="position:absolute;left:-9999px">Write to your cohort</label><textarea id="esu-say" rows="2" maxlength="1500" data-in="say" placeholder="Write to your cohort…" style="' + FIELD + '">' + esc(state.say) + '</textarea>' +
        '<button type="button" class="esu-btn pri" data-act="send-chat"' + (state.busy === 'chat' ? ' disabled' : '') + '>' + (state.busy === 'chat' ? 'Sending…' : 'Send') + '</button></div>' +
        (state.msg && state.room === 'chat' && !state.modal ? '<p class="esu-err" role="alert" style="margin-top:8px">' + esc(state.msg) + '</p>' : '') +
        '<div class="esu-acts" style="margin-top:10px">' + link(r.chatUrl, 'Open the full chat', 'esu-btn out') + '</div>';
    }
    return '<section class="esu-card" data-g="room">' + hd('The mentorship room') + bar + pinned + body + '</section>';
  }

  // ---- Practice with others: three tiles; the lists and forms open in the usual pop-up ----
  var tile = function (k, title, line, links) { return '<div class="esu-ptile"><span class="k">' + k + '</span><span class="esu-rw-t" style="font-size:15px">' + title + '</span><span class="esu-rw-d" style="margin:0">' + line + '</span><span class="lk">' + links + '</span></div>'; };
  var tlink = function (act, label, extra) { return '<button type="button" class="esu-tlink" data-act="' + act + '"' + (extra || '') + '>' + label + '</button>'; };
  function practiceCard(w) {
    var h = w.home, p = h.partner, a = h.articulation, mo = (a && a.month) || { sessions: 0 }, im = h.immersion, tiles = '';
    // 1. Articulation practice: this month's buddy
    if (p) {
      var list = p.partners && p.partners.length ? p.partners : [{ name: p.name, email: p.email }], many = list.length > 1;
      var url = p.chatUrl || 'mailto:' + list.map(function (x) { return x.email; }).filter(Boolean).join(',');
      tiles += tile('Articulation practice', 'This month’s ' + (many ? 'buddies' : 'buddy') + ': ' + esc(nameList(list)), 'Explain one idea to each other until it lands.', mo.sessions > 0 ? tlink('open-articulation', 'Log a session') : ext(url, 'Say hello', 'esu-tlink'));
    } else tiles += tile('Articulation practice', 'Your buddy is on the way', 'Jacob pairs everyone at the start of each rotation.', '');
    // 2. Practicum pods: from Immersion 1
    var beforeI1 = !!im && im.n === 1 && !im.happening, d = state.pp, line = 'One teaches, the others give feedback.', links;
    if (beforeI1) { line += ' From Immersion 1.'; links = tlink('open-pp', 'Schedule a Practicum Pod'); }
    else {
      var now = Date.now(), next = d && (d.pods || []).filter(function (x) { return Date.parse(x.startsAt) > now; }).sort(function (x, y) { return Date.parse(x.startsAt) - Date.parse(y.startsAt); })[0];
      if (next) line += ' Next: ' + esc(ppWhen(next.startsAt)) + ', ' + places(next.spots) + '.';
      links = (next && next.canJoin ? tlink('pp-join', 'Join', ' data-id="' + esc(next.id) + '"' + (state.busy === 'pp' ? ' disabled' : '')) : '') + tlink('open-pp', 'Organize a pod') + (d && (d.pods || []).length ? tlink('pp-list', 'See all pods') : '');
    }
    tiles += tile('Teach a group class', 'Practicum pods', line, links);
    // 3. Study pods with Sādhana School students (hidden when they are off)
    var sp = state.pods;
    if (sp && sp.on) tiles += tile('Optional deepening', 'Study pods', 'Small groups with Sādhana School students.', link(sp.url, 'Browse current Pods', 'esu-tlink'));
    return '<section class="esu-card" aria-labelledby="esu-p-h"><h2 class="esu-h2" id="esu-p-h">Practice with others</h2><p class="esu-rw-d" style="margin-top:4px">Three ways to practice between immersions. Start with your buddy.</p><div class="esu-tiles">' + tiles + '</div></section>';
  }
  // The practicum pods in full (opened from "See all pods"), and a short explainer (opened from "What a pod is")
  function ppRows(d) {
    return (d.pods || []).map(function (x) {
      var st = x.count + (x.count === 1 ? ' person' : ' people') + ' · ' + (x.spots > 0 ? x.spots + ' places left' : 'full') + ' · ' + x.minutes + ' min';
      var act = '';
      if (x.mine && x.roomUrl) act += ext(x.roomUrl, 'Join the live room', 'esu-btn pri') + ' ';
      if (x.mine && x.chatUrl) act += ext(x.chatUrl, 'Pod chat', 'esu-btn out') + ' ';
      if (x.canJoin) act += '<button type="button" class="esu-btn out" data-act="pp-join" data-id="' + esc(x.id) + '"' + (state.busy === 'pp' ? ' disabled' : '') + '>Join</button> ';
      if (x.mine) act += '<button type="button" class="esu-lnk" data-act="pp-hours">Log practice-teaching hours</button> ';
      if (x.canLeave) act += '<button type="button" class="esu-lnk" data-act="pp-leave" data-id="' + esc(x.id) + '">Leave</button> ';
      if (x.canCancel) act += '<button type="button" class="esu-lnk" data-act="pp-cancel" data-id="' + esc(x.id) + '">Cancel this pod</button>';
      var room = x.canSetRoom ? '<details style="margin-top:8px"' + (x.roomUrl ? '' : ' open') + '><summary class="esu-muted" style="font-size:13px;cursor:pointer">' + (x.roomUrl ? 'Change the live room link' : 'Make a live room for your pod') + '</summary>' + ppRoomHelp() +
        '<div class="esu-say" style="margin-top:6px"><input id="esu-pp-room-' + esc(x.id) + '" type="text" data-in="pp-room:' + esc(x.id) + '" placeholder="Paste the live room link (https://…)" value="' + esc((state.ppRoom && state.ppRoom[x.id] != null) ? state.ppRoom[x.id] : x.roomUrl) + '" style="' + FIELD + '"><button type="button" class="esu-btn out" data-act="pp-room" data-id="' + esc(x.id) + '">Save</button></div></details>' : '';
      return '<li style="padding:12px 0;border-top:1px solid #E3D8C6"><div style="font-weight:600">' + esc(x.topic) + (x.mine ? ' <span class="esu-muted" style="font-weight:400">· you’re in</span>' : '') + '</div>' +
        '<div class="esu-muted" style="font-size:13px"><b style="color:#1E1A14">' + esc(ppWhen(x.startsAt)) + '</b> · organized by ' + esc(x.organiser) + '</div><div class="esu-muted" style="font-size:13px">' + esc(st) + '</div>' +
        (x.description ? '<div style="font-size:14px;margin-top:4px;white-space:pre-wrap">' + esc(x.description) + '</div>' : '') + (x.mine && x.names.length ? '<div class="esu-muted" style="font-size:13px;margin-top:4px">In this pod: ' + esc(x.names.join(', ')) + '</div>' : '') +
        (act ? '<div class="esu-acts" style="margin-top:8px">' + act + '</div>' : '') + room + '</li>';
    }).join('');
  }

  var COMPS = [['genealogy', 'Genealogy & diagnosis'], ['attunement', 'Subtle attunement'], ['speech', 'Ethical speech'], ['transmission', 'Experience-based transmission'], ['curriculum', 'Curriculum design'], ['lineage', 'Lineage & creativity']];
  var HOW = { immersions: 'Added for you from the Zoom attendance report', 'one-to-ones': 'Added for you when a booking is held', observation: 'You log it, with competencies · Jacob confirms', 'practice-teaching': 'You log it · a partner co-signs · Jacob confirms', peer: 'One of the pair logs a session · both are credited', reflections: 'Counted for you when you post to Sādhana School: 9 posts make the 6 hours', retreat: 'Summer retreat · added for you', assessment: 'Hand-in, assessed against the rubric · revisable once', report: 'Hand-in', competency: 'Open-book quiz' };
  function compNames(ids) { return (ids || []).map(function (id) { var c = COMPS.filter(function (x) { return x[0] === id; })[0]; return c ? c[1] : ''; }).filter(Boolean).join(', '); }
  function n2(v) { return Math.round(v * 100) / 100; }

  // Entries waiting for the mentee's own answer: a partner asks them to confirm a class they watched
  function cosignCard(w) {
    var list = w.home.cosign || [];
    if (!list.length) return '';
    return '<section class="esu-card" data-g="cosign" style="border-color:#D2A65A"><div class="esu-eye">To confirm</div>' + list.map(function (c) {
      return '<div class="esu-co"><p style="margin:6px 0"><b>' + esc(c.who) + '</b> says you watched their class on ' + esc(dayFmt(c.day, { day: 'numeric', month: 'long' })) + ' for ' + c.hours + (c.hours === 1 ? ' hr' : ' hrs') + '. Confirm?</p><div class="esu-acts"><button type="button" class="esu-btn pri" data-act="cosign" data-id="' + esc(c.id) + '" data-ok="1"' + (state.busy === 'hours' ? ' disabled' : '') + '>Confirm</button><button type="button" class="esu-btn out" data-act="cosign" data-id="' + esc(c.id) + '" data-ok="0"' + (state.busy === 'hours' ? ' disabled' : '') + '>That’s not right</button></div></div>';
    }).join('') + '</section>';
  }

  // ---- The mentee year: next project steps, this month, the two lanes, the quarterly review, and the one-to-one summary (docs/sahrdaya-upaya-page.md) ----
  var PROJ = { both: ['Both projects', '#4B4F8C'], talk: ['60-minute talk', '#B8801C'], offering: ['Three-session offering', '#2F6B4F'] };
  var yrState = { all: false, keep: {}, editing: false, text: '', msg: '', busy: '' };
  function dmy(d) { return wd(d) + ' ' + dayFmt(d, { month: 'short' }); }
  function dm(d) { return dayFmt(d, { day: 'numeric' }) + ' ' + dayFmt(d, { month: 'short' }); }
  function dml(d) { return dayFmt(d, { day: 'numeric' }) + ' ' + dayFmt(d, { month: 'long' }); }
  function dmyT(iso) { return fmtTime(iso, { weekday: 'short' }) + ' ' + fmtTime(iso, { day: 'numeric' }) + ' ' + fmtTime(iso, { month: 'short' }); }
  function hmT(iso) { return fmtTime(iso, { hour: 'numeric', minute: '2-digit' }); }
  var YR = function (w) { return w && w.home && w.home.year; };
  function projChip(p) { var x = PROJ[p] || PROJ.both; return '<span class="esu-proj"><i style="background:' + x[1] + '"></i>' + x[0] + '</span>'; }
  function whenText(s) { var n = s.daysTo; return n < 0 ? Math.abs(n) + (n === -1 ? ' day overdue' : ' days overdue') : n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days'; }
  function stepRow(s, y, flat) {
    var late = s.overdue && s.status !== 'done', done = s.status === 'done';
    var btn = y.ticksOk === false ? '' : '<button type="button" class="esu-tk" aria-pressed="' + done + '" data-act="yr-tick" data-id="' + esc(s.id) + '"' + (yrState.busy === s.id ? ' disabled' : '') + '>' + (done ? 'Done ✓' : 'Mark done') + '</button>';
    return '<li class="esu-st' + (late ? ' late' : '') + '"><span class="esu-sw"><span class="esu-mono esu-sd"' + (late ? ' style="color:#A5432A"' : '') + '>' + esc(dmy(s.date)) + '</span><span class="esu-sn"' + (late ? ' style="color:#A5432A"' : '') + '>' + (done ? 'done' : whenText(s)) + '</span></span>' +
      '<span class="esu-sm">' + projChip(s.project) + '<span class="esu-stt">' + esc(s.title) + '</span>' + (flat ? '' : (s.detail ? '<span class="esu-muted" style="font-size:13.5px">' + esc(s.detail) + '</span>' : '') + (s.evidence ? '<span class="esu-muted" style="font-size:12.5px"><span class="esu-mono" style="font-size:10.5px;letter-spacing:.12em;text-transform:uppercase">Evidence</span> · ' + esc(s.evidence) + '</span>' : '')) + '</span>' + (btn ? '<span class="esu-sb">' + btn + '</span>' : '') + '</li>';
  }
  function allStepsModal(w) {
    var y = YR(w); if (!y || !yrState.all) return '';
    var by = {}; y.allSteps.forEach(function (s) { (by[s.month] = by[s.month] || []).push(s); });
    var months = (y.months || []).filter(function (m) { return by[m.id]; });
    var body = months.map(function (m) {
      return '<div style="margin-top:14px"><div class="esu-eye" style="color:#5A5346">' + esc(m.title) + '</div>' + (m.theme ? '<div class="esu-h2" style="font-size:19px;font-style:italic;margin:2px 0 0">' + esc(m.theme) + '</div>' : '') + '<ul class="esu-sl">' + by[m.id].map(function (s) { return stepRow(s, y, true); }).join('') + '</ul></div>';
    }).join('');
    return '<div class="esu-ov" data-act="yr-close" data-bg="1"><div class="esu-dlg" role="dialog" aria-modal="true" aria-label="The year ahead" style="max-width:680px"><div class="esu-hd"><h2 class="esu-h2">The year ahead</h2><button type="button" class="esu-btn out" data-act="yr-close">Close</button></div>' +
      '<p class="esu-muted" style="font-size:13px">Ticking a step is optional. It tells Jacob you’ve done it; the evidence is for your next one-to-one.' + (y.doneCount ? ' ' + y.doneCount + ' of ' + y.total + ' steps done.' : '') + '</p>' + (y.ticksOk === false ? '<p class="esu-err" style="margin-top:6px">Your ticks couldn’t be loaded just now. The steps are still right.</p>' : '') + (yrState.msg && yrState.msgFor === 'tick' ? '<p class="esu-err" role="alert" style="margin-top:6px">' + esc(yrState.msg) + '</p>' : '') + body +
      '<p id="reminders" class="esu-muted" style="font-size:13px;margin-top:14px">Reminders by email: <b>' + (y.reminders ? 'on' : 'off') + '</b> · <button type="button" class="esu-lnk" data-act="yr-remind">' + (y.reminders ? 'Turn off' : 'Turn on') + '</button></p></div></div>';
  }
  function lastMonday(ym) { var p = ym.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1], 0)); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }
  // Practicum pods: mentees organize a time to practice teaching each other (no approval); others join. Different from articulation buddies (the pair or trio for the rotation).
  function ppWhen(iso) { return dmyT(iso) + ', ' + hmT(iso); }
  function ppRoomHelp() {
    return '<ol class="esu-muted" style="font-size:13px;margin:6px 0 0;padding-left:20px;display:grid;gap:3px"><li>In Circle, open the live rooms (look for “Live” or “Live rooms” in the sidebar, or the + button).</li><li>Start a new live room and name it after your pod.</li><li>Open the room’s share options and copy its link.</li><li>Paste the link below and press Save. Everyone in your pod then sees a “Join the live room” button.</li></ol>';
  }
  function loadPp() { return call('/api/member/practicum').then(function (d) { state.pp = d; render(); }).catch(function () { state.pp = null; }); }
  var LS = { done: 'background:#2E5A4B;border:2px solid #2E5A4B', due: 'background:#fff;border:2px solid #D2A65A', overdue: 'background:#A5432A;border:2px solid #A5432A', coming: 'background:#fff;border:1.5px solid #B5A88F' };
  var LL = { done: 'Done', due: 'Due this month', overdue: 'Overdue', coming: 'Coming up' };
  function ld(s) { return '<i class="esu-ldot" style="' + LS[s] + '"></i>'; }
  function lanesCard(w) {
    var y = YR(w); if (!y) return '';
    var head = '<div class="esu-hd"><h2 class="esu-h2" id="esu-j-h">Your two projects</h2><span style="display:inline-flex;gap:14px;align-items:baseline">' + (y.lanes && y.lanes.doneCount > 0 ? '<span class="esu-mono">' + y.lanes.doneCount + ' of ' + y.lanes.total + ' steps done</span>' : '') + '<button type="button" class="esu-tlink" data-act="yr-all">All the steps</button></span></div><p class="esu-rw-d" style="margin:-6px 0 12px">Built in small steps from now to July, so nothing waits for the summer.</p>';
    if (!y.lanes) return '';
    var L = y.lanes, st = function (id) { var m = y.allSteps.filter(function (s) { return s.id === id; })[0]; return m ? (m.status === 'done' ? 'done' : m.overdue ? 'overdue' : m.month === w.today.slice(0, 7) ? 'due' : 'coming') : 'coming'; };
    // The legend names only the states that are on the timeline right now (no "Overdue" unless a step is, no "Done" until one is)
    var seen = {}; [L.talk, L.offering].forEach(function (ln) { ln.steps.forEach(function (s) { seen[st(s.id)] = true; }); });
    var legend = '<div class="esu-lg esu-ln-p">' + ['done', 'due', 'overdue', 'coming'].filter(function (k) { return seen[k]; }).map(function (k) { return '<span>' + ld(k) + LL[k] + '</span>'; }).join('') + '</div>';
    // A timeline: each project is a row of phase bars across the months, with its steps as dots at their real dates and a line for today
    var cols = L.months.length, TONE = { talk: ['#F6EBD8', '#8A5A12'], offering: ['#E1F0E7', '#2F6B4F'] };
    var at = function (date) { var i = -1; L.months.forEach(function (m, k) { if (m.ym === date.slice(0, 7)) i = k; }); if (i < 0) return null; var y = +date.slice(0, 4), mo = +date.slice(5, 7), dim = new Date(Date.UTC(y, mo, 0)).getUTCDate(); return (i + (+date.slice(8) - 0.5) / dim) / cols * 100; };
    var todayAt = at(w.today);
    var stripes = '<span class="esu-gt-s">' + L.months.map(function (m) { return '<i' + (m.current ? ' class="cur"' : '') + '></i>'; }).join('') + '</span>';
    var todayLine = todayAt === null ? '' : '<span class="esu-gt-now" style="left:' + todayAt + '%"></span>';
    var grid = '<div class="esu-gt esu-ln-d" role="table" aria-label="Final projects by month"><div class="esu-gt-r hd"><span class="esu-gt-l"></span><span class="esu-gt-t hd">' +
      L.months.map(function (m) { return '<b class="' + (m.current ? 'cur' : '') + '">' + esc(m.label.toUpperCase()) + '</b>'; }).join('') + (todayAt === null ? '' : '<em class="esu-gt-tag" style="left:' + todayAt + '%">today</em>') + '</span></div>';
    [L.talk, L.offering].forEach(function (ln) {
      // Each phase bar carries its own state (done, now, overdue, ahead); the steps themselves live in "All the steps"
      var tone = TONE[ln.key], cur = -1; L.months.forEach(function (m, k) { if (m.current) cur = k; });
      var bars = ln.phases.map(function (p) {
        var ss = ln.steps.filter(function (x) { return x.col >= p.from && x.col < p.to; }), ks = ss.map(function (x) { return st(x.id); });
        var done = ss.length && ks.every(function (k) { return k === 'done'; }), late = ks.indexOf('overdue') >= 0, now = cur >= p.from && cur < p.to;
        var cls = 'esu-gt-b' + (done ? ' done' : late ? ' late' : now ? ' now' : cur >= p.to ? '' : ' ahead');
        var tip = p.label + (ss.length ? ' · ' + ss.map(function (x) { return x.title; }).join(' · ') : '');
        return '<span class="' + cls + '" style="left:calc(' + (p.from / cols * 100) + '% + 1px);width:calc(' + ((p.to - p.from) / cols * 100) + '% - 2px);--bg:' + tone[0] + ';--fg:' + tone[1] + '" title="' + esc(tip) + '">' + (done ? '✓ ' : '') + esc(p.label) + '</span>';
      }).join('');
      grid += '<div class="esu-gt-r"><span class="esu-gt-l">' + projChip(ln.key) + '</span><span class="esu-gt-t">' + stripes + '<span class="esu-gt-bars">' + bars + '</span>' + todayLine + '</span></div>';
    });
    grid += '</div>';
    var phone = '<div class="esu-ln-p"><div class="esu-lp3"><span></span>' + projChip('talk').replace('60-minute talk', 'Talk') + projChip('offering').replace('Three-session offering', 'Offering') + '</div>' + L.months.map(function (m, c) {
      var cell = function (ln) { return '<span class="esu-lpc' + (m.current ? ' cur' : '') + '">' + ln.steps.filter(function (s) { return s.col === c; }).map(function (s) { return '<span class="esu-lpl">' + ld(st(s.id)) + esc(s.title.length > 42 ? s.title.slice(0, 40) + '…' : s.title) + '</span>'; }).join('') + '</span>'; };
      return '<div class="esu-lp3"><span class="esu-mono esu-lpm' + (m.current ? ' cur' : '') + '">' + esc(m.label.toUpperCase()) + '</span>' + cell(L.talk) + cell(L.offering) + '</div>';
    }).join('') + '</div>';
    return '<section class="esu-card" data-g="lanes" aria-labelledby="esu-j-h">' + head + legend + grid + phone + projectsPanel(w) + '</section>';
  }
  // Ticks save at once on the page and are rolled back with a message if the save fails
  function yrTick(id) {
    var y = YR(state.data); if (!y) return;
    var s = y.allSteps.filter(function (x) { return x.id === id; })[0] || (y.tasks || []).filter(function (x) { return x.id === id; })[0]; if (!s) return;
    var isTask = (y.tasks || []).indexOf(s) >= 0;
    var was = s.status === 'done', now = !was;
    var set = function (v) { s.status = v ? 'done' : 'open'; if (isTask) return; var n = y.steps.filter(function (x) { return x.id === id; })[0]; if (n) n.status = s.status; if (v) yrState.keep[id] = true; else delete yrState.keep[id]; y.doneCount += v ? 1 : -1; if (y.lanes) y.lanes.doneCount += v ? 1 : -1; };
    set(now); yrState.msg = ''; yrState.busy = ''; render();
    call('/api/member/year/tick', { id: id, done: now, today: localToday() }).catch(function (e) { set(was); yrState.msg = e.message || 'That didn’t save. Please try again.'; yrState.msgFor = 'tick'; render(); });
  }
  function yrClick(a, t, e) {
    var y = YR(state.data);
    if (a === 'yr-tick') { yrTick(t.dataset.id); return; }
    if (a === 'yr-all') { yrState.all = true; render(); return; }
    if (a === 'yr-close') { if (t.dataset.bg && e.target !== t) return; yrState.all = false; render(); return; }
    if (a === 'yr-remind') { var on = !y.reminders; y.reminders = on; render(); call('/api/member/year/prefs', { reminders: on }).catch(function () { y.reminders = !on; render(); }); return; }
    if (a === 'yr-edit') { yrState.editing = true; yrState.text = y.oneToOne.summary ? y.oneToOne.summary.text : ''; yrState.msg = ''; render(); var ta = root.querySelector('#esu-sum'); if (ta) ta.focus(); return; }
    if (a === 'yr-edit-cancel') { yrState.editing = false; yrState.msg = ''; render(); return; }
    if (a === 'yr-save-sum') {
      var tx = yrState.text; yrState.busy = 'sum'; yrState.msg = ''; yrState.msgFor = 'sum'; render();
      call('/api/member/year/summary', { text: tx }).then(function (r) { y.oneToOne.summary = r.summary; if (state.data.home.oneToOne.booked) state.data.home.oneToOne.booked.summary = [{ q: 'What you sent', a: r.summary.text }]; yrState.editing = false; yrState.text = ''; })
        .catch(function (e) { yrState.msg = e.message; }).then(function () { yrState.busy = ''; render(); });
    }
  }

  var FIELD = 'display:block;width:100%;font:16px IBM Plex Sans,system-ui,sans-serif;padding:10px 12px;border:1px solid #E3D8C6;border-radius:8px;background:#fff;color:#1E1A14;min-height:44px';
  function field(label, inner, id) { return '<label for="' + id + '" style="display:block;font-weight:600;font-size:13px;margin:12px 0 4px">' + label + '</label>' + inner; }
  function modal(w) {
    var m = state.modal, f = state.form;
    if (!m) return '';
    var body = '', b = state.busy === 'modal';
    if (m.type === 'hours') {
      var k = KINDS[f.kind] || KINDS.observation;
      body = '<h2 class="esu-h2">' + (m.resend ? 'Edit and resend' : 'Log hours') + '</h2>' + (m.resend && f.returnNote ? '<div class="esu-rnote" style="margin-top:8px">' + esc(f.returnNote) + '</div>' : '') +
        field('What kind of hours', '<select id="esu-kind" data-in="kind" style="' + FIELD + '">' + Object.keys(KINDS).filter(function (x) { return x !== 'peer'; }).map(function (x) { return '<option value="' + x + '"' + (x === f.kind ? ' selected' : '') + '>' + KINDS[x][0] + '</option>'; }).join('') + '</select>', 'esu-kind') +
        '<p class="esu-muted" style="font-size:13px;margin-top:4px">' + esc(k[1]) + '</p>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div>' + field('Date', '<input id="esu-day" type="date" data-in="day" value="' + esc(f.day) + '" max="' + esc(localToday()) + '" style="' + FIELD + '">', 'esu-day') + '</div><div>' +
        field('Hours', '<input id="esu-hrs" type="number" inputmode="decimal" step="0.25" min="0.25" max="12" data-in="hours" value="' + esc(f.hours) + '" style="' + FIELD + '">', 'esu-hrs') + '</div></div>' +
        field(esc(k[2]), '<input id="esu-detail" type="text" maxlength="200" data-in="detail" value="' + esc(f.detail) + '" style="' + FIELD + '">', 'esu-detail') +
        (f.kind === 'observation' || f.kind === 'practice-teaching' ? '<div class="esu-eye" style="color:#5A5346;margin:14px 0 6px">Which competencies did you see?' + (f.kind === 'observation' ? ' <span style="text-transform:none;letter-spacing:0">(choose at least one)</span>' : '') + '</div><div class="esu-ccs" role="group" aria-label="Competencies">' + COMPS.map(function (c) { var on = (f.competencies || []).indexOf(c[0]) >= 0; return '<button type="button" class="esu-cc' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="toggle-comp" data-c="' + c[0] + '">' + esc(c[1]) + '</button>'; }).join('') + '</div>' : '') +
        (f.kind === 'practice-teaching' ? field('Who watched?', '<select id="esu-watch" data-in="watcher" style="' + FIELD + '"><option value="">Choose…</option>' + ((w.home.partner && w.home.partner.partners) || []).map(function (q) { return '<option value="' + esc(q.email) + '"' + (f.watcher === q.email ? ' selected' : '') + '>' + esc(String(q.name).split(' ')[0]) + ' (your partner)</option>'; }).join('') + '<option value="nobody"' + (f.watcher === 'nobody' ? ' selected' : '') + '>Nobody</option></select><p class="esu-muted" style="font-size:13px;margin-top:4px">A partner who watched is asked to confirm it before it goes to Jacob.</p>', 'esu-watch') : '') +
        field('Notes (optional)', '<textarea id="esu-notes" rows="3" maxlength="200" data-in="notes" style="' + FIELD + '">' + esc(f.notes) + '</textarea>', 'esu-notes') +
        '<p class="esu-muted" style="font-size:13px;margin:10px 0 14px">Jacob confirms each entry. It shows as pending until he does, then counts toward your 100 hours.</p>' +
        '<div class="esu-acts"><button type="button" class="esu-btn pri" data-act="save-hours"' + (b ? ' disabled' : '') + '>' + (b ? 'Saving…' : m.resend ? 'Send again' : 'Log these hours') + '</button><button type="button" class="esu-btn out" data-act="close-modal">Cancel</button></div>';
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
    } else if (m.type === 'pp') {
      body = '<h2 class="esu-h2">Organize a practicum pod</h2><p class="esu-muted" style="font-size:13.5px;margin:6px 0 0">Choose a time to practice teaching with other mentees. Anyone in the cohort can join; there is room for ' + (state.pp ? state.pp.max : 6) + ' including you.</p>' +
        field('What will you practice?', '<input id="esu-pp-topic" type="text" maxlength="80" data-in="ppTopic" value="' + esc(f.ppTopic) + '" placeholder="e.g. Teaching the five-minute practice" style="' + FIELD + '">', 'esu-pp-topic') +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div>' + field('When (your time)', '<input id="esu-pp-when" type="datetime-local" data-in="ppWhen" value="' + esc(f.ppWhen) + '" style="' + FIELD + '">', 'esu-pp-when') + '</div><div>' +
        field('How long', '<select id="esu-pp-min" data-in="ppMin" style="' + FIELD + '">' + ((state.pp && state.pp.minutes) || [30, 45, 60, 90, 120]).map(function (n) { return '<option value="' + n + '"' + (String(f.ppMin) === String(n) ? ' selected' : '') + '>' + n + ' minutes</option>'; }).join('') + '</select>', 'esu-pp-min') + '</div></div>' +
        field('Anything to know? <span style="font-weight:400;color:#5A5346">(optional)</span>', '<textarea id="esu-pp-desc" rows="3" maxlength="600" data-in="ppDesc" placeholder="e.g. Bring a five-minute teaching you want feedback on." style="' + FIELD + '">' + esc(f.ppDesc) + '</textarea>', 'esu-pp-desc') +
        '<details style="margin-top:12px"><summary class="esu-muted" style="font-size:13.5px;cursor:pointer">Make a live room now <span style="font-weight:400">(optional, you can do it later)</span></summary>' + ppRoomHelp() +
        '<input id="esu-pp-roomnew" type="text" data-in="ppRoom" value="' + esc(f.ppRoom) + '" placeholder="Paste the live room link (https://…)" style="' + FIELD + ';margin-top:6px"></details>' +
        (state.msg ? '<p class="esu-err" role="alert" style="margin-top:10px">' + esc(state.msg) + '</p>' : '') +
        '<div class="esu-acts" style="margin-top:14px"><button type="button" class="esu-btn pri" data-act="save-pp"' + (b ? ' disabled' : '') + '>' + (b ? 'Saving…' : 'Organize this pod') + '</button><button type="button" class="esu-btn out" data-act="close-modal">Cancel</button></div>';
    } else if (m.type === 'pp-list') {
      var pl = state.pp || { pods: [] };
      body = '<h2 class="esu-h2">Practicum pods</h2><p class="esu-muted" style="font-size:13.5px;margin:6px 0 0">One person teaches, the others give feedback. Anyone in the cohort can organize one; no approval is needed.</p>' +
        (ppRows(pl) ? '<ul style="list-style:none;margin:8px 0 0;padding:0">' + ppRows(pl) + '</ul>' : '<p class="esu-muted" style="margin:12px 0 0">Nothing is planned yet. Be the first to organize one.</p>') +
        '<div class="esu-acts" style="margin-top:14px"><button type="button" class="esu-btn pri" data-act="open-pp">Organize a pod</button><button type="button" class="esu-btn out" data-act="close-modal">Close</button></div>';
    } else if (m.type === 'rec-all') {
      var ri = (w.home.recordings && w.home.recordings.items) || [];
      body = '<div class="esu-hd"><h2 class="esu-h2">All recordings</h2><button type="button" class="esu-btn out" data-act="close-modal">Close</button></div><div class="esu-reclist">' + ri.map(recTile).join('') + '</div>';
    } else if (m.type === 'pp-about') {
      body = '<h2 class="esu-h2">What a practicum pod is</h2><p style="margin:10px 0 0">A small group of mentees who meet to practice teaching. One person teaches a short piece, the others give feedback, and you take turns.</p>' +
        '<p style="margin:10px 0 0">Anyone in the cohort can organize a pod, with no approval needed, and pods begin after Immersion 1. Your articulation buddy is someone to explain ideas with; a pod is where you teach a group.</p>' +
        '<div class="esu-acts" style="margin-top:14px"><button type="button" class="esu-btn out" data-act="close-modal">Close</button></div>';
    } else if (m.type === 'feedback') {
      body = feedbackModal(w);
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


  // Under the timeline: what this month asks for, in one line. Nothing here asks for a tick.
  function projectsPanel(w) {
    var y = YR(w), ym = w.today.slice(0, 7), fm = w.home.formation || { n: 0 };
    var mine = y.allSteps.filter(function (s) { return s.month === ym; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var open = mine.filter(function (s) { return s.status !== 'done'; }), by = (open[0] || mine[mine.length - 1] || {}).date;
    var eye = 'This month · ' + (by ? 'by ' + dm(by) : dayFmt(ym + '-01', { month: 'long' }));
    var line = fm.n === 1 ? 'A little time each week on the talk and the offering keeps them from piling up for summer. This month: start gathering ideas for both.'
      : mine.length ? 'This month: ' + esc(plainJoin(mine.map(function (s) { return low1(s.title); }))) + '.' : 'A little time each week on the talk and the offering keeps them from piling up for summer.';
    return '<div class="esu-mprog"><div><p class="esu-eye" style="color:#7A5A2E">' + esc(eye) + '</p><p class="esu-rw-t" style="margin-top:2px">Make progress on your final projects</p><p class="esu-rw-d">' + line + '</p></div>' + btnA('yr-all', 'See the steps') + '</div>';
  }

  // ---- Your record: one line until the first hour is logged, then a short summary that opens to the whole breakdown ----
  function recordCard(w) {
    var f = w.formation, hs = w.home.hours, fb = (w.mentorship && w.mentorship.feedback) || [];
    if (!f) return '';
    var total = hs.confirmed + hs.pending, rec = state.rec || {};
    var fbl = fb.length ? '<p style="margin:12px 0 0;font-size:14px"><button type="button" class="esu-tlink" data-act="fb-open">Jacob’s notes on your teaching (' + fb.length + ')</button></p>' : '';
    if (!total) {
      var targets = '<div class="esu-grid2" style="margin-top:12px">' + f.components.map(function (c) { return '<div><div class="esu-comp"><span>' + esc(c.name) + '</span><span class="esu-mono">' + c.target + ' hrs</span></div><div class="esu-how">' + esc(HOW[c.id] || '') + '</div></div>'; }).join('') + '</div>';
      return '<section class="esu-card" aria-labelledby="esu-r-h"><div class="esu-closed"><div><h2 class="esu-h2" id="esu-r-h">Your record</h2><p class="esu-rw-d" style="margin-top:2px">Your record begins at Immersion 1. Immersions, Practicums and one-to-ones are added for you.</p></div>' +
        '<button type="button" class="esu-tlink" data-act="rec-add" aria-expanded="' + !!rec.add + '">How the ' + f.target + ' hours add up</button></div>' + (rec.add ? targets : '') + fbl + '</section>';
    }
    var conf = Math.min(100, Math.round(hs.confirmed / f.target * 100)), pend = Math.min(100 - conf, Math.round(hs.pending / f.target * 100));
    var six = '<div class="esu-six">' + f.components.slice(0, 6).map(function (c) { return '<div class="esu-comp"><span>' + esc(c.name) + '</span><span class="esu-mono">' + (c.pending ? c.credited + ' + ' + n2(c.pending) : c.credited) + ' / ' + c.target + '</span></div>'; }).join('') + '</div>';
    return '<section class="esu-card" aria-labelledby="esu-r-h"><div class="esu-hd" style="margin-bottom:6px"><h2 class="esu-h2" id="esu-r-h">Your record</h2><span class="esu-mono">' + hs.confirmed + ' of ' + f.target + ' hrs' + (hs.pending ? ' · ' + hs.pending + ' pending' : '') + '</span></div>' +
      '<div class="esu-bar esu-bar2" role="img" aria-label="' + hs.confirmed + ' hours confirmed, ' + hs.pending + ' pending, of ' + f.target + '"><i class="c" style="width:' + conf + '%"></i><i class="p" style="width:' + pend + '%"></i></div>' + '<div style="margin-top:14px">' + six + '</div>' +
      '<div class="esu-acts" style="margin-top:14px"><button type="button" class="esu-btn pri" data-act="open-hours">Log hours</button><button type="button" class="esu-btn out" data-act="rec-full" aria-expanded="' + !!rec.full + '">Full breakdown</button></div>' + fbl +
      (rec.full ? hoursDetail(w) : '') + '</section>';
  }
  // The full breakdown: every component, the recent entries (take back, edit and resend)
  function hoursDetail(w) {
    var f = w.formation, rm = w.home.reflectionMonths, rurl = w.home.reflection && w.home.reflection.url;
    var comps = '<div class="esu-grid2">' + f.components.map(function (c) {
      var conf = Math.min(100, Math.round(c.credited / c.target * 100)), pend = Math.min(100 - conf, Math.round((c.pending || 0) / c.target * 100));
      var circles = c.id === 'reflections' && rm && rm.months.length ? '<div class="esu-mc" aria-label="Months with a reflection counted">' + rm.months.map(function (m) { return '<span class="esu-mcd' + (m.filled ? ' on' : '') + (m.now ? ' now' : '') + '" title="' + esc(m.ym) + '">' + esc(m.label) + '</span>'; }).join('') + '<span class="esu-muted" style="font-size:12.5px">' + rm.counted + ' of ' + rm.target + ' posted</span>' + (safeUrl(rurl) ? ' <a href="' + esc(rurl) + '" target="_top" style="font-size:12.5px">Reflections</a>' : '') + '</div>' : '';
      return '<div><div class="esu-comp"><span>' + esc(c.name) + '</span><span class="esu-mono">' + (c.pending ? c.credited + ' + ' + n2(c.pending) : c.credited) + ' / ' + c.target + '</span></div><div class="esu-bar sm esu-bar2" role="img" aria-label="' + esc(c.name) + ': ' + c.credited + ' confirmed, ' + n2(c.pending || 0) + ' pending, of ' + c.target + '"><i class="c" style="width:' + conf + '%"></i><i class="p" style="width:' + pend + '%"></i></div><div class="esu-how">' + esc(HOW[c.id] || '') + '</div>' + circles + '</div>';
    }).join('') + '</div>';
    var recent = w.home.recent, names = {}; f.components.forEach(function (c) { names[c.id] = c.name; });
    var rec = recent.length ? '<div class="esu-eye" style="color:#5A5346;margin:16px 0 4px">Recent entries</div><ul class="esu-rows">' + recent.map(function (e) {
      var st = e.state, tail = st === 'credited' ? '<span class="esu-ok" style="font-size:13px">' + (e.auto ? 'Counted' : 'Credited') + '</span>'
        : st === 'returned' ? '<span style="font-size:13px;color:#A5432A;font-weight:600">Returned</span>'
        : '<span style="font-size:13px;color:#7A5A2E;font-weight:600">' + (st === 'awaiting' ? 'Waiting for co-sign' : 'Pending Jacob') + ' · <button type="button" class="esu-lnk" data-act="remove-hours" data-id="' + esc(e.id) + '">Take back</button></span>';
      var cn = compNames(e.competencies);
      return '<li><div class="l"><div class="t">' + esc(names[e.component] || e.component) + ' · ' + e.hours + ' h</div><div class="u">' + esc(dayFmt(e.day, { day: 'numeric', month: 'short' })) + (e.detail ? ' · ' + esc(e.detail) : e.note ? ' · ' + esc(e.note) : '') + (cn ? ' · ' + esc(cn) : '') + '</div>' +
        (st === 'returned' ? '<div class="esu-rnote">' + (e.returnNote ? esc(e.returnNote) : 'Please check this entry and send it again.') + '</div><button type="button" class="esu-tk" style="margin-top:6px" data-act="resend-hours" data-id="' + esc(e.id) + '">Edit and resend</button>' : '') + '</div>' + tail + '</li>';
    }).join('') + '</ul>' : '';
    return '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #E3D8C6"><p class="esu-leg" style="margin:0 0 10px"><span><i class="c"></i>Confirmed</span><span><i class="p"></i>Pending Jacob</span></p>' + comps + rec +
      '<div class="esu-acts" style="margin-top:14px"><button type="button" class="esu-btn out" data-act="open-articulation">Log an articulation session</button></div>' +
      '<p class="esu-muted" style="margin-top:8px;font-size:13px">Immersions, Practicums and one-to-ones are added for you. Log observation, practice-teaching and retreat practicum here.</p></div>';
  }
  function feedbackModal(w) {
    var fb = (w.mentorship && w.mentorship.feedback) || [];
    return '<h2 class="esu-h2">Jacob’s notes on your teaching</h2><ul class="esu-rows" style="margin-top:8px">' + fb.map(function (f) {
      return '<li><div class="l"><div class="t" style="font-weight:400">' + esc(f.notes) + '</div></div>' + (f.date ? '<span class="esu-mono">' + esc(dayFmt(f.date, { day: 'numeric', month: 'short' })) + '</span>' : '') + '</li>';
    }).join('') + '</ul><div class="esu-acts" style="margin-top:14px"><button type="button" class="esu-btn out" data-act="close-modal">Close</button></div>';
  }

  // ---- The page switch: This month | Schedule | Reflections (real links; the first two switch in place, Reflections is its own page) ----
  var MP = '/c/mentorship';
  function currentView() { if (isRefl()) return 'reflections'; if (isWorkbook()) return 'workbook'; if (state.view) return state.view; return /[?&]view=schedule/.test(location.search) ? 'schedule' : 'month'; }
  function pageSwitch(cur, compact) {
    var w = state.data, rurl = (w && w.home && safeUrl(w.home.reflection.url)) || '/c/reflections', un = w && w.home ? w.home.reflection.unread : 0;
    var item = function (key, label, href, extra) { return '<a href="' + esc(href) + '" target="_top"' + (cur === key ? ' aria-current="page"' : '') + ((cur === 'month' || cur === 'schedule') && (key === 'month' || key === 'schedule') ? ' data-act="view" data-view="' + key + '"' : '') + '>' + label + (extra || '') + '</a>'; };
    var wb = (w && w.home && safeUrl(w.home.workbookUrl)) || WORKBOOK;
    return '<nav class="esu-seg' + (compact ? ' sm' : '') + '" aria-label="Pages">' + item('month', 'This month', MP) + item('schedule', 'Schedule', MP + '?view=schedule') +
      item('reflections', 'Reflections', rurl, un > 0 ? '<span class="esu-badge" aria-label="' + un + ' unread">' + un + '</span>' : '') + item('workbook', 'Workbook', wb) + '</nav>';
  }
  function loadSched() { if (state.sched || state.schedBusy) return Promise.resolve(); state.schedBusy = true; return call('/api/member/mentee-schedule?' + tzq()).then(function (d) { state.sched = d; state.schedErr = ''; }).catch(function (e) { state.schedErr = e.message; }).then(function () { state.schedBusy = false; render(); }); }

  // ---- The Schedule view: every immersion, practicum pod and one-to-one window, in the mentee's time ----
  var rangeT = function (a, b) { return hmT(a) + (b ? '–' + hmT(b) : ''); };
  var monthLong = function (ym) { return dayFmt(ym + '-01', { month: 'long' }); };
  function dateBlock(day) { return '<span class="esu-db"><b>' + esc(dayFmt(day, { day: 'numeric' })) + '</b>' + esc(dayFmt(day, { weekday: 'short' })) + '</span>'; }
  function srow(day, tag, tagCls, title, line, act) {
    return '<li class="esu-srow">' + dateBlock(day) + '<div class="tx"><span class="esu-stag ' + tagCls + '">' + tag + '</span> <span class="esu-rw-t" style="display:inline">' + title + '</span><p class="esu-rw-d">' + line + '</p></div><div class="bt">' + (act || '') + '</div></li>';
  }
  function immBlock(i, isNext, w) {
    var p = i.prepare, os = i.openSession, pr = i.practicum, now = Date.now(), im = w && w.home.immersion, d = isNext && im && im.n === i.n ? im.daysTo : null;
    var eye = 'Immersion ' + i.n + ' of ' + (state.sched.immersions.length) + (isNext && d !== null ? ' · ' + (d === 0 ? 'this weekend' : d === 1 ? 'tomorrow' : 'in ' + d + ' days') : '');
    var prep = p.open && safeUrl(p.url) ? ext(p.url, p.done ? 'Prepare lesson done ✓' : 'Prepare lesson is open', 'esu-tlink on-dark') : p.open ? '<span class="esu-onlist">Prepare lesson is open</span>' : '<span class="esu-onlist">Prepare lesson opens ' + esc(dmy(p.opens)) + '</span>';
    var sess = function (day, name, who, s, actHtml) {
      return '<div class="esu-sess">' + dateBlock(day) + '<div><span class="esu-rw-t" style="color:#FBF6EE">' + name + '</span><p class="esu-rw-d" style="color:#C9D1CB">' + (s && s.start ? esc(rangeT(s.start, s.end)) + ' · ' : '') + who + '</p></div><div class="bt">' + (actHtml || '') + '</div></div>';
    };
    var satAct = os && os.today && os.url ? ext(os.url, 'Join', 'esu-btn gold sm') : '<span class="esu-onlist">Join link here on the day</span>';
    var sunAct = pr && pr.id ? (pr.rsvped || state.going[pr.id] ? '<span class="esu-onlist">You’re on the list ✓</span>' : '<button type="button" class="esu-btn gold sm" data-act="rsvp" data-id="' + esc(pr.id) + '"' + (state.busy === 'rsvp' ? ' disabled' : '') + '>RSVP</button>') : '';
    return '<li class="esu-sblock"><div class="esu-sbh"><span class="ey">' + esc(eye) + '</span>' + prep + '</div><p class="esu-hero-t" style="margin:2px 0 8px">' + esc(i.title) + '</p>' +
      sess(i.sat, 'Open Session', 'with the whole school', os, satAct) + sess(i.sun, 'Practicum', 'mentees only, teaching under supervision', pr, sunAct) + '</li>';
  }
  function podRow(x, d) {
    var end = new Date(Date.parse(x.startsAt) + (Number(x.minutes) || 60) * 60000).toISOString(), live = Date.now() > Date.parse(x.startsAt) - 15 * 60000 && Date.now() < Date.parse(end);
    var act = x.mine ? (x.roomUrl && live ? ext(x.roomUrl, 'Join the live room', 'esu-btn pri sm') : '<span class="esu-in-ok">You’re in ✓</span>') : x.canJoin ? '<button type="button" class="esu-btn out sm" data-act="pp-join" data-id="' + esc(x.id) + '"' + (state.busy === 'pp' ? ' disabled' : '') + '>Join</button>' : '';
    return srow(localDay(x.startsAt), 'Practicum pod', x.mine ? 'pod mine' : 'pod', esc(x.topic), esc(rangeT(x.startsAt, end)) + ' · organized by ' + esc(firstName(x.organiser)) + ' · ' + x.count + ' of ' + d.max + ' places taken', act);
  }
  function oneRowS(wn, o) {
    var bk = o.booked, inWin = bk && localDay(bk.start) >= wn.from && localDay(bk.start) <= wn.to;
    var act = inWin ? '<span class="esu-in-ok">Booked ' + esc(fmtTime(bk.start, { weekday: 'short' }) + ' ' + fmtTime(bk.start, { day: 'numeric' }) + ', ' + hmT(bk.start)) + '</span>' : wn.open && safeUrl(o.bookingUrl) ? ext(o.bookingUrl, 'See times', 'esu-btn out sm') : '';
    return srow(wn.from, 'One-to-ones', 'one', 'One-to-one window · until ' + esc(dmy(wn.to)), '45 minutes with Jacob, UK evenings.' + (wn.open && !inWin ? ' Booking is open.' : ''), act);
  }
  function scheduleCard(w) {
    var S = state.sched, h = w ? w.home : null, f = state.sFilter || 'all', today = (w && w.today) || localToday();
    if (!S) return '<section class="esu-card"><h2 class="esu-h2">Schedule</h2>' + (state.schedErr ? '<p class="esu-err" role="alert">' + esc(state.schedErr) + '</p>' : '<div class="esu-sk" style="height:200px;margin-top:10px"></div><div class="esu-sk" style="height:200px;margin-top:10px"></div>') + '</section>';
    var o = h ? h.oneToOne : { booked: null, bookingUrl: '' }, pp = state.pp, pods = pp && pp.pods ? pp.pods.filter(function (x) { return Date.parse(x.startsAt) > Date.now() - 3 * 3600e3; }) : [];
    var next = S.immersions.filter(function (i) { return i.sun >= today; })[0], items = [];
    S.immersions.filter(function (i) { return !i.past; }).forEach(function (i) { items.push({ day: i.sat, kind: 'imm', html: immBlock(i, next && next.n === i.n, w) }); });
    if (S.retreat) items.push({ day: S.retreat.date, kind: 'imm', html: srow(S.retreat.date, 'Retreat', 'one', esc(S.retreat.title), esc(dm(S.retreat.date) + (S.retreat.end !== S.retreat.date ? ' – ' + dm(S.retreat.end) : '')), '') });
    pods.forEach(function (x) { items.push({ day: localDay(x.startsAt), kind: 'pod', html: podRow(x, pp) }); });
    if (f === 'all') S.windows.forEach(function (wn) { items.push({ day: wn.from, kind: 'one', html: oneRowS(wn, o) }); });
    items = items.filter(function (it) { return f === 'all' || it.kind === (f === 'imm' ? 'imm' : 'pod'); }).sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : a.kind === 'imm' ? -1 : 1; });
    var months = []; items.forEach(function (it) { var m = it.day.slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
    var shown = state.sAll ? months : months.slice(0, 3), hidden = months.slice(3);
    var seq = []; if (months.length) { var cur = shown[0]; var last = shown[shown.length - 1]; while (cur <= last) { seq.push(cur); var p = cur.split('-').map(Number); cur = p[1] === 12 ? (p[0] + 1) + '-01' : p[0] + '-' + String(p[1] + 1).padStart(2, '0'); } }
    var body = seq.map(function (m) {
      var its = items.filter(function (it) { return it.day.slice(0, 7) === m; });
      return '<h3 class="esu-smon">' + esc(monthLong(m) + ' ' + m.slice(0, 4)) + (its.length ? '' : (f === 'all' ? ' <span class="none">nothing scheduled yet</span>' : '')) + '</h3>' + (its.length ? '<ul class="esu-slist">' + its.map(function (it) { return it.html; }).join('') + '</ul>' : '');
    }).join('') || '<p class="esu-muted" style="margin:14px 0">Nothing is scheduled yet.</p>';
    var hiddenImm = hidden.length ? items.filter(function (it) { return hidden.indexOf(it.day.slice(0, 7)) >= 0 && it.kind === 'imm'; }) : [];
    var nImm = hiddenImm.filter(function (it) { return /esu-sblock/.test(it.html); }).length, hasRet = hiddenImm.some(function (it) { return !/esu-sblock/.test(it.html); });
    var more = hidden.length ? '<button type="button" class="esu-tlink" data-act="s-all">Show ' + esc(monthLong(hidden[0])) + (hidden.length > 1 ? ' to ' + esc(monthLong(hidden[hidden.length - 1])) : '') + (nImm || hasRet ? ' (' + (nImm ? nImm + ' more immersion' + (nImm === 1 ? '' : 's') : '') + (nImm && hasRet ? ', ' : '') + (hasRet ? 'the retreat' : '') + ')' : '') + '</button>' : state.sAll && months.length > 3 ? '<button type="button" class="esu-tlink" data-act="s-all">Show fewer</button>' : '<span></span>';
    var rec = h && h.recordings && h.recordings.items.length ? h.recordings.items : [];
    var chips = [['all', 'All'], ['imm', 'Immersions'], ['pod', 'Practicum pods']].map(function (c) { return '<button type="button" class="esu-chip' + (f === c[0] ? ' on' : '') + '" aria-pressed="' + (f === c[0]) + '" data-act="s-filter" data-f="' + c[0] + '">' + c[1] + '</button>'; }).join('');
    var city = myZone().split('/').pop().replace(/_/g, ' ');
    return '<section class="esu-card" aria-labelledby="esu-s-h"><div class="esu-hd" style="align-items:flex-start;flex-wrap:wrap"><div><h2 class="esu-h2" id="esu-s-h">Schedule</h2><p class="esu-rw-d">Every immersion, practicum pod and one-to-one window, in your time (' + esc(city) + ')</p></div><span style="display:inline-flex;gap:14px;align-items:center;flex-wrap:wrap">' + (safeUrl(S.feed) ? ext(S.feed, 'Add to your calendar', 'esu-alink') : '') + '<button type="button" class="esu-btn pri sm" data-act="open-pp">Organize a pod</button></span></div>' +
      '<div class="esu-chips" role="group" aria-label="Filter the schedule" style="margin:12px 0 4px">' + chips + '</div>' + (S.unavailable && S.unavailable.length ? '<p class="esu-note" style="margin:10px 0 0">Some times couldn’t be loaded just now (' + esc(S.unavailable.join(', ')) + ').</p>' : '') + body +
      '<div class="esu-sfoot">' + more + (rec.length ? '<button type="button" class="esu-tlink" data-act="s-earlier" aria-expanded="' + !!state.sEarlier + '">Earlier, with recordings</button>' : '') + '</div>' +
      (state.sEarlier && rec.length ? '<div class="esu-reclist">' + rec.map(recTile).join('') + '</div>' : '') + '</section>' +
      '<p class="esu-rw-d" style="margin:0">Everything else at Embodied Philosophy is on the ' + '<a class="esu-alink" href="/c/schedule" target="_top">main schedule</a>' + '.</p>';
  }


  // ---- The Apprentice Workbook, in the same skin (/c/apprentice-workbook), and a slim strip on its lesson pages ----
  function loadWb() {
    state.wbBusy = true;
    return call('/api/member/workbook?' + tzq()).then(function (d) { state.wb = d.view; state.wbErr = ''; }).catch(function (e) { state.wb = state.wb || null; state.wbErr = e.message || 'The Workbook couldn’t be loaded just now.'; }).then(function () { state.wbBusy = false; render(); drawStrip(); });
  }
  var KINDLBL = { prepare: 'Prepare', practicum: 'Practicum', integrate: 'Integrate' };
  var LOCKI = '<svg width="10" height="11" viewBox="0 0 11 12" aria-hidden="true"><rect x="1.5" y="5" width="8" height="6" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3.3 5V3.6a2.2 2.2 0 0 1 4.4 0V5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
  function lessonPill(im, k) {
    var l = im.lessons[k]; if (!l) return '';
    var lbl = KINDLBL[k];
    if (l.state === 'locked') {
      var suffix = k === 'prepare' ? ' · opens ' + dm(l.opensOn) : im.current ? (k === 'practicum' ? ' · ' + dmy(im.sun) : ' · after the weekend') : '';
      return '<span class="esu-pill lock" aria-disabled="true">' + LOCKI + esc(lbl + suffix) + '</span>';
    }
    return '<a class="esu-pill ' + l.state + '" href="' + esc(l.url) + '" target="_top">' + (l.state === 'done' ? '<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.4 6.4l2.5 2.5 4.7-5.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') + esc(lbl) + '</a>';
  }
  function lessonRow(l) {
    return '<li class="esu-wl"><span class="esu-ring' + (l.done ? ' done' : '') + '" aria-hidden="true">' + (l.done ? TICK : '') + '</span><div><span class="esu-rw-t">' + esc(l.name) + '</span>' + (l.note ? '<p class="esu-rw-d">' + esc(l.note) + '</p>' : '') + '</div>' + (l.url && !l.locked ? '<a class="esu-tlink" href="' + esc(l.url) + '" target="_top">' + (l.done ? 'Read again' : 'Read') + '</a>' : '') + '</li>';
  }
  function immRow(im, today) {
    var d = Math.round((Date.parse(im.sat + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 864e5), ig = im.lessons.integrate;
    var eye = !im.current ? '' : ig && (ig.state === 'open' || ig.state === 'due') && im.sun < today ? 'Integrate now' : today >= im.sat ? 'This weekend' : d === 1 ? 'Next · tomorrow' : 'Next · in ' + d + ' days';
    return '<li class="esu-wi' + (im.current ? ' cur' : '') + (im.n >= 4 && !im.current ? ' far' : '') + '"><span class="n">' + im.n + '</span><div class="tt">' + (eye ? '<span class="ey">' + esc(eye) + '</span>' : '') + '<span class="nm">' + esc(im.title) + '</span><span class="dd">' + esc(dmy(im.sat) + ' – ' + dmy(im.sun)) + '</span></div><div class="pl">' + ['prepare', 'practicum', 'integrate'].map(function (k) { return lessonPill(im, k); }).join('') + '</div></li>';
  }
  function workbookCard(w) {
    var v = state.wb, today = (w && w.today) || localToday();
    var card = function (inner) { return '<section class="esu-card" aria-labelledby="esu-wb-h">' + inner + '</section>'; };
    if (!v) {
      if (state.wbErr) return card('<h2 class="esu-h2" id="esu-wb-h">Apprentice Workbook</h2><p class="esu-err" role="alert" style="margin-top:8px">' + esc(state.wbErr) + '</p><p><a class="esu-alink" href="' + esc(WORKBOOK) + '?native=1" target="_top">Open it in Circle</a></p>');
      return card('<h2 class="esu-h2" id="esu-wb-h">Apprentice Workbook</h2><div class="esu-sk esu-skrow"></div><div class="esu-sk esu-skrow"></div><div class="esu-sk esu-skrow"></div>');
    }
    var right = v.done > 0 ? '<span class="esu-mono">' + v.done + ' of ' + v.total + ' lessons done</span>' : v.total ? '<span class="esu-mono">' + v.total + ' lessons</span>' : '';
    var bar = v.done > 0 && v.total ? '<div class="esu-bar" role="img" aria-label="' + v.done + ' of ' + v.total + ' lessons done"><i style="width:' + Math.round(v.done / v.total * 100) + '%;background:#2E5A4B"></i></div>' : '';
    var grp = function (t) { return '<p class="esu-wg">' + t + '</p>'; };
    return card('<div class="esu-hd" style="margin-bottom:2px;flex-wrap:wrap"><h2 class="esu-h2" id="esu-wb-h">Apprentice Workbook</h2>' + right + '</div>' +
      '<p class="esu-rw-d" style="margin:0 0 8px">The lessons for each immersion open as the year goes: Prepare two weeks before, Practicum on the weekend, Integrate after.</p>' + bar +
      (v.start.length ? grp('Start here') + '<ul class="esu-wlist">' + v.start.map(lessonRow).join('') + '</ul>' : '') +
      (v.immersions.length ? grp('The eight immersions') + '<ul class="esu-wlist">' + v.immersions.map(function (im) { return immRow(im, today); }).join('') + '</ul>' : '') +
      (v.requirements.length ? grp('Completing the year') + '<ul class="esu-wlist">' + v.requirements.map(lessonRow).join('') + '</ul>' : '') +
      (state.wbErr ? '<p class="esu-err" role="alert">' + esc(state.wbErr) + '</p>' : ''));
  }
  function workbookHtml(w) {
    return pageHead(w) + pageSwitch('workbook') + '<div class="esu-stack">' + workbookCard(w) + '</div>' +
      (state.admin ? '<p class="esu-rw-d" style="margin:14px 0 0">Jacob: <a class="esu-alink" href="' + esc(WORKBOOK) + '?native=1" target="_top">edit the lessons in Circle</a> <span class="esu-mono" style="margin-left:6px">· shown to admins only</span></p>' : '');
  }
  // The strip at the top of a lesson page: back to all lessons, where you are, and the switch
  function crumb() {
    var v = state.wb, m = /\/sections\/(\d+)\/lessons\/(\d+)/.exec(location.pathname), out = 'Workbook';
    if (!v || !m) return out;
    var hit = function (l) { return l && l.url && l.url.indexOf('/sections/' + m[1] + '/lessons/' + m[2]) >= 0; };
    if (v.start.some(hit)) return out + ' · Start here';
    if (v.requirements.some(hit)) return out + ' · Completing the year';
    for (var i = 0; i < v.immersions.length; i++) for (var k in v.immersions[i].lessons) if (hit(v.immersions[i].lessons[k])) return out + ' · Immersion ' + v.immersions[i].n + ' · ' + KINDLBL[k];
    return out;
  }
  function stripHtml() { return '<a class="back" href="' + esc(WORKBOOK) + '" target="_top">← All lessons</a><span class="cr">' + esc(crumb()) + '</span>' + pageSwitch('workbook', true); }
  function drawStrip() {
    var el = document.getElementById('esu-strip');
    if (!isLesson() || state.ok !== true) { if (el) el.remove(); return; }
    var box = document.querySelector(HOST) || pageContainer(); if (!box) return;
    if (!el) { el = document.createElement('div'); el.id = 'esu-strip'; el.className = 'esu-strip'; box.insertBefore(el, box.firstChild); }
    else if (el.parentNode !== box) box.insertBefore(el, box.firstChild);
    var h = stripHtml(); if (el.__h !== h) { el.innerHTML = h; el.__h = h; seatSwitch(el.querySelector('.esu-seg')); }
  }

  // The header: a welcome in the first month, then "Your formation"; where you are in one line; one link to the manual and the year
  function pageHead(w) {
    var name = (w && w.greeting.firstName) || state.first, fm = (w && w.home.formation) || { n: 0 }, im = w && w.home.immersion, parts = [];
    if (fm.n >= 1) parts.push('Month ' + fm.n + ' of your formation');
    if (im) parts.push(im.happening ? 'Immersion ' + im.n + ' is this weekend' : im.daysTo === 1 ? 'Immersion ' + im.n + ' is tomorrow' : 'Immersion ' + im.n + ' is in ' + im.daysTo + ' days');
    var lead = !w || fm.n <= 1 ? 'Welcome' : 'Your formation';
    return '<div class="esu-eye">Sahṛdaya Upāya · Teacher formation</div><div class="esu-head"><div><h1 class="esu-h1">' + lead + (name ? ', <em>' + esc(name) + '</em>' : '') + '.</h1>' + (parts.length ? '<div class="esu-sub">' + esc(parts.join(' · ')) + '</div>' : !w ? '<div class="esu-sub">Opening your page…</div>' : '') + '</div>' +
      ext(API + '/school/mentee-year', 'The manual and your year', 'esu-alink') + '</div>';
  }
  function html() {
    if (isRefl()) return reflHtml();
    if (isMentor()) return mentorHtml();
    if (isWorkbook() && !(state.error && !state.data)) return workbookHtml(state.data);
    if (state.error && !state.data) return '<h1 class="esu-h1">Sahṛdaya Upāya</h1><p class="esu-muted" style="margin-top:8px">' + esc(state.error) + '</p>';
    var w = state.data;
    if (!w) return pageHead(null) + pageSwitch(currentView()) + (currentView() === 'schedule' ? '<div class="esu-stack">' + scheduleCard(null) + '</div>' : '') + (currentView() === 'schedule' ? '' : '<div class="esu-stack"><div class="esu-card">' + '<div class="esu-sk esu-skrow"></div>'.repeat(5) + '</div><div class="esu-card"><div class="esu-sk" style="height:120px"></div></div><div class="esu-sk" style="height:220px"></div><div class="esu-sk" style="height:180px"></div></div>');
    var y = YR(w);
    if (currentView() === 'schedule') return pageHead(w) + pageSwitch('schedule') + '<div class="esu-stack">' + (state.msg && !state.modal ? '<p class="esu-err" role="alert" style="margin:0">' + esc(state.msg) + '</p>' : '') + scheduleCard(w) + '</div>' + modal(w);
    return pageHead(w) + pageSwitch('month') +
      '<div class="esu-stack">' +
      (w.unavailable.length ? '<p class="esu-note" role="status" style="margin:0">Some things couldn’t be loaded just now (' + esc(w.unavailable.join(', ')) + '). The rest is up to date.</p>' : '') +
      (state.msg && !state.modal ? '<p class="esu-err" role="alert" style="margin:0">' + esc(state.msg) + '</p>' : '') +
      pollCards(w) + cosignCard(w) + monthSection(w) + recordingsCard(w) +
      '<div class="esu-duo">' + roomCard(w) + practiceCard(w) + '</div>' +
      (y && y.started ? lanesCard(w) : '') + recordCard(w) + '</div>' + modal(w) + booksModal(w) + allStepsModal(w);
  }

  // ---- Jacob's view (Circle admins, /c/mentorship?view=mentor): the review queue, pair health, worth a word ----
  var MT_KIND = { hours: 'Hours', handin: 'Hand-ins', reflection: 'Reflections' };
  function mentorHtml() {
    var m = state.mt, d = m.data;
    var head = '<div class="esu-eye">Sahṛdaya Upāya · Mentor view</div><div class="esu-head"><div><h1 class="esu-h1">Your <em>review</em> queue.</h1><div class="esu-sub">' + (d ? esc(dayFmt(d.today, { weekday: 'long', day: 'numeric', month: 'long' })) + (d.rotation ? ' · rotation ' + d.rotation.n + ' ends ' + esc(dayFmt(d.rotation.to, { day: 'numeric', month: 'short' })) : '') : 'Opening…') + '</div></div><a class="esu-btn out" href="/c/mentorship">Back to my page</a></div>';
    if (m.err && !d) return head + '<p class="esu-err" role="alert">' + esc(m.err) + '</p>';
    if (!d) return head + '<div class="esu-sk"></div><div class="esu-sk"></div>';
    var c = d.counts, tabs = [['all', 'All', c.all], ['hours', 'Hours', c.hours], ['handin', 'Hand-ins', c.handin], ['reflection', 'Reflections', c.reflection]];
    var chips = '<div class="esu-chips" role="group" aria-label="Filter the queue">' + tabs.map(function (t) { return '<button type="button" class="esu-chip' + (m.filter === t[0] ? ' on' : '') + '" aria-pressed="' + (m.filter === t[0]) + '" data-act="mt-filter" data-f="' + t[0] + '">' + t[1] + ' · ' + t[2] + '</button>'; }).join('') + '</div>';
    var list = d.queue.filter(function (x) { return m.filter === 'all' || x.kind === m.filter; });
    var b = m.busy;
    var rows = list.map(function (x) {
      var btns = x.kind === 'hours' ? '<button type="button" class="esu-btn pri" data-act="mt-do" data-do="confirm" data-id="' + esc(x.id) + '"' + (b ? ' disabled' : '') + '>Confirm</button> <button type="button" class="esu-btn out" data-act="mt-do" data-do="return-hours" data-id="' + esc(x.id) + '"' + (b ? ' disabled' : '') + '>Return</button> <button type="button" class="esu-lnk" data-act="mt-do" data-do="decline" data-id="' + esc(x.id) + '">Decline</button>'
        : x.kind === 'handin' ? '<button type="button" class="esu-btn out" data-act="mt-open" data-ref="' + esc(x.ref) + '">' + (m.open === x.ref ? 'Hide' : 'Read') + '</button> <button type="button" class="esu-btn pri" data-act="mt-do" data-do="return" data-id="' + esc(x.id) + '"' + (b ? ' disabled' : '') + '>Return with notes</button>'
        : '<a class="esu-btn out" href="/c/reflections">Read</a> <button type="button" class="esu-btn pri" data-act="mt-replied" data-id="' + esc(x.id) + '"' + (b ? ' disabled' : '') + '>Mark replied</button>';
      var detail = x.kind === 'handin' && m.open === x.ref ? '<div class="esu-mqd">' + esc(x.fullText || x.detail) + (x.fileLink ? '\n' : '') + '</div>' + (x.fileLink ? '<div class="esu-mqd"><a href="' + esc(API + x.fileLink) + '" target="_blank" rel="noopener">Open the attached file</a></div>' : '') : '';
      return '<li class="esu-mqi"><div><span class="esu-eye" style="color:#5A5346">' + esc(MT_KIND[x.kind === 'handin' ? 'handin' : x.kind]) + '</span><div><b>' + esc(x.mentee) + '</b> · ' + esc(x.item) + '</div>' + (x.kind !== 'handin' || m.open !== x.ref ? '<div class="esu-muted" style="font-size:13.5px">' + esc(x.detail) + '</div>' : '') + '</div><div style="text-align:right"><div class="esu-age' + (x.stale ? ' old' : '') + '">' + (x.age === 0 ? 'today' : x.age + (x.age === 1 ? ' day' : ' days')) + (x.stale ? ' · waiting' : '') + '</div></div>' + detail + '<div class="esu-acts" style="grid-column:1/-1">' + btns + '</div></li>';
    }).join('');
    var queue = '<section class="esu-card"><div class="esu-hd"><span class="esu-eye">Waiting for you</span></div>' + chips + (rows ? '<ul class="esu-mq" style="list-style:none;margin:12px 0 0;padding:0">' + rows + '</ul>' : '<p class="esu-muted" style="margin:14px 0 0">Nothing is waiting. New hours, hand-ins and shared reflections appear here, oldest first.</p>') + '</section>';
    var tiles = d.tiles.length ? '<div class="esu-mt">' + d.tiles.map(function (t) {
      return '<div class="esu-tile' + (t.state === 'behind' ? ' behind' : '') + '"><b>' + t.people.map(function (p) { return esc(p.name); }).join(' + ') + '</b><div class="esu-muted" style="font-size:13px">' + t.people.map(function (p) { return p.city ? esc(p.city) : ''; }).filter(Boolean).join(' · ') + '</div><div class="esu-dots" aria-hidden="true">' + Array.apply(null, Array(t.target)).map(function (_, i) { return '<i class="' + (i < t.count ? 'f' : '') + '"></i>'; }).join('') + '</div><div style="font-size:13.5px;color:' + (t.state === 'behind' ? '#A5432A' : '#5A5346') + '">' + esc(t.line) + '</div></div>';
    }).join('') + '</div>' : '<p class="esu-muted">No pairs are set for this rotation yet.</p>';
    var pairs = '<section class="esu-card" style="margin-top:18px"><div class="esu-hd"><span class="esu-eye">Pair health' + (d.rotation ? ' · rotation ' + d.rotation.n : '') + '</span>' + (d.nudges ? '<span class="esu-muted" style="font-size:12.5px">Gentle reminders are on</span>' : '<span class="esu-muted" style="font-size:12.5px">Gentle reminders are off</span>') + '</div>' + tiles + '</section>';
    var words = '<section class="esu-card" style="margin-top:18px"><div class="esu-hd"><span class="esu-eye">Worth a word</span></div>' + (d.words.length ? '<ul style="list-style:none;margin:10px 0 0;padding:0">' + d.words.map(function (x) { return '<li style="padding:8px 0;border-top:1px solid #E3D8C6"><b>' + esc(x.name) + '</b> <span class="esu-muted">· ' + esc(x.why) + '</span></li>'; }).join('') + '</ul>' : '<p class="esu-muted" style="margin:10px 0 0">No one needs a word right now.</p>') + '</section>';
    return head + (m.msg ? '<p class="esu-err" role="alert">' + esc(m.msg) + '</p>' : '') + queue + pairs + words;
  }
  function loadMentor() {
    var mt = state.mt;
    return call('/api/member/mentor?today=' + localToday()).then(function (d) { mt.data = d; mt.err = ''; }).catch(function (e) { mt.err = e.status === 403 ? 'This view is for mentors.' : e.message; });
  }
  function mentorClick(a, t) {
    var mt = state.mt;
    if (a === 'mt-filter') { mt.filter = t.dataset.f; render(); return; }
    if (a === 'mt-open') { mt.open = mt.open === t.dataset.ref ? '' : t.dataset.ref; render(); return; }
    var run = function (fn) { mt.busy = 'x'; mt.msg = ''; render(); return fn().then(function () { return loadMentor(); }).catch(function (e) { mt.msg = e.message; }).then(function () { mt.busy = ''; render(); }); };
    if (a === 'mt-replied') { run(function () { return call('/api/member/mentor', { action: 'replied', id: t.dataset.id, today: localToday() }); }); return; }
    if (a === 'mt-do') {
      var what = t.dataset['do'], id = t.dataset.id, note = '';
      if (what === 'decline' && !window.confirm('Decline this entry? It is removed and the mentee is not credited.')) return;
      if (what === 'return-hours' || what === 'return') { note = window.prompt(what === 'return' ? 'A note for the mentee (optional):' : 'What should they check? They will see this and can send it again.', ''); if (note === null) return; }
      run(function () { return call('/api/member/submissions', { action: what, id: id, note: note }); });
    }
  }

  var root = null;
  function render() { if (root && document.body.contains(root)) { root.innerHTML = html(); var ch = root.querySelector('.esu-chat'); if (ch) ch.scrollTop = ch.scrollHeight; seatSwitch(root.querySelector('.esu-seg')); } }
  // On a narrow screen the switch scrolls inside its own track: keep the selected item in view
  function seatSwitch(seg) { if (!seg || seg.scrollWidth <= seg.clientWidth) return; var c = seg.querySelector('[aria-current=page]'); if (c) seg.scrollLeft = Math.max(0, c.offsetLeft - 12); }
  function onInput(e) {
    var k = e.target && e.target.dataset && e.target.dataset.in;
    if (!k) return;
    if (k.indexOf('rf-') === 0) { var q = state.rf; if (k === 'rf-title') q.form.title = e.target.value; else if (k === 'rf-body') q.form.body = e.target.value; else if (k === 'rf-ctext') q.ctext = e.target.value; else if (k === 'rf-reply') q.reply = e.target.value; else if (k.indexOf('rf-tick:') === 0) q.ticked[k.slice(8)] = e.target.checked; return; }
    if (k === 'say') { state.say = e.target.value; return; }
    if (k === 'ask') { state.ask = e.target.value; return; }
    if (k === 'yr-text') { yrState.text = e.target.value; return; }
    if (k.indexOf('pp-room:') === 0) { (state.ppRoom = state.ppRoom || {})[k.slice(8)] = e.target.value; return; }
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
    if (a.indexOf('mt-') === 0) { mentorClick(a, t); return; }
    if (a.indexOf('yr-') === 0) { yrClick(a, t, e); return; }
    if (a.indexOf('rf-') === 0) { if (a === 'rf-post-close' && t.dataset.bg && e.target !== t) return; rfClick(a, t); return; }
    if (a === 'close-modal') { if (t.dataset.bg && e.target !== t) return; state.modal = null; state.msg = ''; render(); return; }
    if (a === 'open-pp') { var dflt = new Date(Date.now() + 2 * 864e5); dflt.setHours(18, 0, 0, 0); var pad = function (n) { return String(n).padStart(2, '0'); }; state.modal = { type: 'pp' }; state.msg = ''; state.form = { ppTopic: '', ppDesc: '', ppRoom: '', ppMin: '60', ppWhen: dflt.getFullYear() + '-' + pad(dflt.getMonth() + 1) + '-' + pad(dflt.getDate()) + 'T18:00' }; render(); var tt = root.querySelector('#esu-pp-topic'); if (tt) tt.focus(); return; }
    if (a === 'save-pp') {
      var g2 = state.form, when = g2.ppWhen ? new Date(g2.ppWhen) : null;
      state.busy = 'modal'; state.msg = ''; render();
      call('/api/member/practicum', { action: 'create', topic: g2.ppTopic, description: g2.ppDesc, startsAt: when && !isNaN(when) ? when.toISOString() : '', minutes: g2.ppMin, roomUrl: g2.ppRoom }).then(function (d) { state.pp = d; state.modal = null; state.form = {}; }).catch(function (e) { state.msg = e.message; }).then(function () { state.busy = ''; render(); });
      return;
    }
    if (a === 'pp-join' || a === 'pp-leave' || a === 'pp-cancel') {
      if (a === 'pp-cancel' && !window.confirm('Cancel this pod? Everyone who joined will no longer see it.')) return;
      if (a === 'pp-leave' && !window.confirm('Leave this pod?')) return;
      state.busy = 'pp'; state.msg = ''; state.msgFor = 'pp'; render();
      call('/api/member/practicum', { action: a.slice(3), id: t.dataset.id }).then(function (d) { state.pp = d; }).catch(function (e) { state.msg = e.message; }).then(function () { state.busy = ''; render(); });
      return;
    }
    if (a === 'pp-room') {
      var rv = (state.ppRoom && state.ppRoom[t.dataset.id] != null) ? state.ppRoom[t.dataset.id] : ((state.pp.pods.filter(function (x) { return x.id === t.dataset.id; })[0] || {}).roomUrl || '');
      state.busy = 'pp'; state.msg = ''; state.msgFor = 'pp'; render();
      call('/api/member/practicum', { action: 'links', id: t.dataset.id, roomUrl: rv, chatUrl: ((state.pp.pods.filter(function (x) { return x.id === t.dataset.id; })[0] || {}).chatUrl || '') }).then(function (d) { state.pp = d; state.ppRoom = {}; }).catch(function (e) { state.msg = e.message; }).then(function () { state.busy = ''; render(); });
      return;
    }
    if (a === 'pp-hours') { state.modal = { type: 'hours' }; state.msg = ''; state.form = { kind: 'practice-teaching', day: localToday(), hours: '', detail: '', notes: '', competencies: [], watcher: '' }; render(); return; }
    if (a === 'open-hours') { state.modal = { type: 'hours' }; state.msg = ''; state.form = { kind: 'observation', day: localToday(), hours: '', detail: '', notes: '', competencies: [], watcher: '' }; render(); var k = root.querySelector('#esu-kind'); if (k) k.focus(); return; }
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
    if (a === 'toggle-comp') { var cs = state.form.competencies || [], ci = cs.indexOf(t.dataset.c); if (ci >= 0) cs.splice(ci, 1); else cs.push(t.dataset.c); state.form.competencies = cs; render(); return; }
    if (a === 'cosign') { var cid = t.dataset.id, cok = t.dataset.ok === '1'; act('hours', function () { return call('/api/member/this-week/hours', { cosign: cid, ok: cok, today: localToday(), tz: myZone() }); }); return; }
    if (a === 'resend-hours') { var re = (state.data.home.recent || []).filter(function (x) { return x.id === t.dataset.id; })[0]; if (!re) return; state.modal = { type: 'hours', resend: re.id }; state.msg = ''; state.form = { kind: re.component, day: re.day, hours: String(re.hours), detail: re.detail || '', notes: re.note && !re.detail ? re.note : '', competencies: (re.competencies || []).slice(), watcher: '', returnNote: re.returnNote || '' }; render(); return; }
    if (a === 'remove-hours') { var rid = t.dataset.id; act('hours', function () { return call('/api/member/this-week/hours', { remove: rid, today: localToday(), tz: myZone() }); }); return; }
    if (a === 'save-hours') {
      var f = state.form;
      var body = { component: f.kind, hours: f.hours, day: f.day, detail: f.detail, note: f.notes, competencies: f.competencies || [], today: localToday(), tz: myZone() };
      if (f.kind === 'practice-teaching') body.watcher = f.watcher || '';
      if (state.modal && state.modal.resend) body.resend = state.modal.resend;
      act('modal', function () { return call('/api/member/this-week/hours', body).then(function (d) { state.modal = null; return d; }); }).then(function () { if (state.modal) render(); });
      return;
    }
    if (a === 'submit-handin') { sendHandIn('submitted'); return; }
    if (a === 'draft-handin') { sendHandIn('draft'); return; }
    if (a === 'view') {
      e.preventDefault(); var vw = t.dataset.view; state.view = vw; state.modal = null; state.msg = '';
      try { history.pushState(null, '', MP + (vw === 'schedule' ? '?view=schedule' : '')); } catch (x) {}
      render(); if (vw === 'schedule') loadSched(); if (root && root.scrollIntoView) root.scrollIntoView({ block: 'start' });
    }
    else if (a === 's-filter') { state.sFilter = t.dataset.f; render(); }
    else if (a === 's-all') { state.sAll = !state.sAll; render(); }
    else if (a === 's-earlier') { state.sEarlier = !state.sEarlier; render(); }
    else if (a === 'room') { state.room = t.dataset.tab; render(); }
    else if (a === 'rec-add' || a === 'rec-full') { var kk = a === 'rec-add' ? 'add' : 'full'; state.rec[kk] = !state.rec[kk]; render(); }
    else if (a === 'rec-all') { state.modal = { type: 'rec-all' }; state.msg = ''; render(); }
    else if (a === 'play') { var vs = t.dataset.v, vt = t.dataset.t || 'Recording'; if (state.modal && state.modal.type === 'rec-all') { state.modal = null; render(); } openPlayer(vs, vt, root.querySelector('#recordings [data-act="play"]')); }
    else if (a === 'goto-rec') { var rc = root.querySelector('#recordings'); if (rc && rc.scrollIntoView) rc.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
    else if (a === 'fb-open') { state.modal = { type: 'feedback' }; state.msg = ''; render(); }
    else if (a === 'pp-list' || a === 'pp-about') { state.modal = { type: a }; state.msg = ''; render(); }
    else if (a === 'tick') {
      act('tick' + t.dataset.id, function () { return call('/api/member/this-week/assignment', { id: t.dataset.id, done: t.dataset.done === '1', today: localToday(), tz: myZone() }); });
    } else if (a === 'rsvp') {
      var id = t.dataset.id;
      act('rsvp', function () { return call('/api/member/this-week/rsvp', { eventId: id }).then(function () { state.going[id] = true; }); });
    }
  }


  // ---- Reflections (/c/reflections): write, share with the cohort, revise from their feedback, post to Sādhana School ----
  var RK = { landed: ['What landed', 'Quote a line that stayed with you, and say why.', '#2E5A4B', '#E3EEE7'], question: ['A question', 'Ask what you’d want to know more about.', '#3E4C7A', '#E4E8F3'], suggestion: ['A suggestion', 'One thing the next version could try.', '#A5432A', '#F4E4DC'] };
  function rfFlash() { return state.rf.err ? '<p class="esu-err" role="alert">' + esc(state.rf.err) + '</p>' : ''; }
  function rfApply(d) { var r = state.rf; r.list = d.list || r.list; r.meta = d.meta || r.meta; if ('detail' in d) { r.detail = d.detail; if (d.detail) { r.id = d.detail.id; r.vn = d.detail.versions.length ? d.detail.versions[d.detail.versions.length - 1].n : 0; } else { r.id = ''; } } }
  function loadRefl(id) {
    return call('/api/member/reflections?' + tzq() + (id ? '&id=' + encodeURIComponent(id) : '')).then(function (d) { state.rf.err = ''; rfApply(d); }).catch(function (e) { state.rf.err = e.message; }).then(render);
  }
  function rfAct(action, extra) {
    var r = state.rf; r.busy = action; r.err = ''; render();
    return call('/api/member/reflections', Object.assign({ action: action, id: r.id, today: localToday(), tz: myZone() }, extra || {})).then(function (d) { rfApply(d); return d; })
      .catch(function (e) { r.err = e.message; }).then(function (d) { r.busy = ''; render(); return d; });
  }
  function rfMonth(m) { return dayFmt(m + '-01', { month: 'long' }); }
  function statusLabel(x) { return x.status === 'posted' ? 'Posted to SS' : x.status === 'draft' ? 'Draft' : x.sharedVersions > 1 ? 'Revised · v' + x.version : 'Shared · v' + x.version; }
  function rfSteps() {
    var d = state.rf.detail, step = d && d.mine ? d.step : 0, S = (state.rf.meta && state.rf.meta.steps) || [];
    return '<div class="esu-steps4">' + S.map(function (x, i) { return '<div class="esu-st4' + (step === i + 1 ? ' on' : '') + '"><b>' + (i + 1) + ' · ' + esc(x[0].toUpperCase()) + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>';
  }
  function rfList() {
    var r = state.rf, L = r.list || [], m = r.meta ? r.meta.month : '';
    var shown = L.filter(function (x) { return r.filter === 'mine' ? x.mine : r.filter === 'posted' ? x.status === 'posted' : x.month === m; });
    var chips = [['cohort', (m ? rfMonth(m) : 'This month') + ' · cohort'], ['mine', 'Mine'], ['posted', 'Posted to SS']].map(function (c) { return '<button type="button" class="esu-chip' + (r.filter === c[0] ? ' on' : '') + '" aria-pressed="' + (r.filter === c[0]) + '" data-act="rf-filter" data-f="' + c[0] + '">' + c[1] + '</button>'; }).join('');
    return '<div class="esu-rfl"><div class="esu-chips">' + chips + '</div>' + (shown.length ? shown.map(function (x) {
      return '<button type="button" class="esu-ri' + (x.id === r.id ? ' on' : '') + '" data-act="rf-open" data-id="' + esc(x.id) + '"><span class="esu-rim"><span class="esu-eye" style="color:#5A5346">' + esc(rfMonth(x.month)) + '</span><span class="esu-rist">' + (x.unread ? '<i class="esu-dotn" aria-label="New"></i>' : '') + esc(statusLabel(x)) + '</span></span><b>' + esc(x.title || 'Untitled') + '</b><span class="esu-muted" style="font-size:13px">' + esc(x.mine ? 'You' : x.author) + ' · ' + (x.comments ? x.comments + (x.comments === 1 ? ' comment' : ' comments') : 'no comments yet') + '</span></button>' +
        (x.mine || state.admin ? '<button type="button" class="esu-lnk" style="justify-self:end;font-size:13px;margin:-2px 4px 4px" data-act="rf-del-item" data-id="' + esc(x.id) + '" data-st="' + esc(x.status) + '" aria-label="Delete ' + esc(x.title || 'this reflection') + '">Delete</button>' : '');
    }).join('') : '<p class="esu-muted" style="margin:10px 0">' + (r.list ? (r.filter === 'mine' ? 'You haven’t written one yet.' : r.filter === 'posted' ? 'Nothing posted to Sādhana School yet.' : 'No reflections from the cohort this month yet.') : 'Loading…') + '</p>') + '</div>';
  }
  function rfComment(c, d, all) {
    var k = RK[c.kind], mine = d.mine, replies = all.filter(function (x) { return x.parent === c.id; });
    var out = '<div class="esu-cmt"><span class="esu-av" style="background:#' + (c.byAuthor ? 'A5432A' : '3E4C7A') + '">' + esc(String(c.who).split(' ').map(function (x) { return x[0]; }).join('').slice(0, 2).toUpperCase()) + '</span><div><div class="esu-cmh"><b>' + esc(c.who) + '</b> <span class="esu-muted">' + esc(fmtTime(c.at, { weekday: 'short', day: 'numeric', month: 'short' })) + '</span>' + (k ? ' <span class="esu-kind" style="color:' + k[2] + ';background:' + k[3] + '">' + esc(k[0].toUpperCase()) + '</span>' : '') + '</div><div class="esu-cmb">' + esc(c.body) + '</div>' +
      '<div class="esu-cma"><button type="button" class="esu-lnk" data-act="rf-replyto" data-id="' + esc(c.id) + '">Reply</button>' + (c.addressedIn ? '<span class="esu-ok" style="font-size:13px">Addressed in version ' + c.addressedIn + '</span>' : '') + '</div>' +
      replies.map(function (x) { return '<div class="esu-cmt nested"><span class="esu-av" style="background:#' + (x.byAuthor ? 'A5432A' : '3E4C7A') + '">' + esc(String(x.who).split(' ').map(function (y) { return y[0]; }).join('').slice(0, 2).toUpperCase()) + '</span><div><div class="esu-cmh"><b>' + esc(x.who) + '</b> <span class="esu-muted">' + esc(fmtTime(x.at, { weekday: 'short', day: 'numeric', month: 'short' })) + '</span></div><div class="esu-cmb">' + esc(x.body) + '</div></div></div>'; }).join('') +
      (state.rf.replyTo === c.id ? '<div class="esu-say" style="margin-top:8px"><input id="esu-rr" type="text" maxlength="3000" data-in="rf-reply" placeholder="Respond to ' + esc(String(c.who).split(' ')[0]) + '…" value="' + esc(state.rf.reply) + '" style="' + FIELD + '"><button type="button" class="esu-btn pri" data-act="rf-reply-send"' + (state.rf.busy ? ' disabled' : '') + '>Reply</button></div>' : '') + '</div></div>';
    return out;
  }
  function rfReader() {
    var r = state.rf, d = r.detail;
    if (!d) return '<div class="esu-rpane"><div class="esu-empty">' + (r.list ? 'Choose a reflection to read, or write your own.' : 'Loading…') + '</div></div>';
    var v = d.versions.filter(function (x) { return x.n === r.vn; })[0] || d.versions[d.versions.length - 1];
    var chips = d.versions.map(function (x) { return '<button type="button" class="esu-chip' + (x.n === v.n ? ' on' : '') + '" aria-pressed="' + (x.n === v.n) + '" data-act="rf-ver" data-n="' + x.n + '">Version ' + x.n + (x.shared ? '' : ' · draft') + '</button>'; }).join('');
    var hl = v.n > 1 ? '<span class="esu-muted" style="font-size:13px">Highlighted: changed since version ' + (v.n - 1) + '</span>' : '';
    var meta = (d.mine ? 'You' : d.author) + (d.sharedAt ? ' · shared with the cohort ' + fmtTime(d.sharedAt, { weekday: 'short', day: 'numeric', month: 'short' }) : '') + (d.versions.filter(function (x) { return x.shared; }).length > 1 ? ' · revised ' + fmtTime(d.versions.filter(function (x) { return x.shared; }).pop().sharedAt, { weekday: 'short', day: 'numeric', month: 'short' }) : '') + (d.mine ? ' · counts toward your monthly reflections once posted' : '');
    var bar = '';
    if (d.mine) {
      var hasDraft = d.workingN && d.workingN === (d.versions[d.versions.length - 1] || {}).n && !d.versions[d.versions.length - 1].shared;
      bar = '<div class="esu-obar"><div class="esu-acts">' + (hasDraft ? '<button type="button" class="esu-btn pri" data-act="rf-edit">Continue your draft</button>' : d.status !== 'draft' ? '<button type="button" class="esu-btn out" data-act="rf-revise">Revise</button>' : '') +
        (d.status === 'shared' ? '<button type="button" class="esu-btn pri" data-act="rf-post-open">Post to Sādhana School</button>' : '') +
        (d.status === 'posted' ? '<span class="esu-ok">Posted to Sādhana School · ' + esc(fmtTime(d.postedAt, { day: 'numeric', month: 'short' })) + ' ✓</span>' + (safeUrl(d.postedUrl) ? ext(d.postedUrl, 'View the post', 'esu-btn out') : '') + '<button type="button" class="esu-lnk" data-act="rf-takedown">Take it down</button>' : '') +
        (d.status === 'draft' ? '<button type="button" class="esu-btn out" data-act="rf-discard">Delete this draft</button>' : '<button type="button" class="esu-lnk" data-act="rf-delete">Delete</button>') + '</div>' +
        '<p class="esu-muted" style="font-size:13px;margin-top:8px">' + (d.status === 'shared' ? 'Posts version ' + d.versions.filter(function (x) { return x.shared; }).length + ' to the Reflections in Sādhana School. The cohort’s comments stay here.' : d.status === 'posted' ? 'The cohort’s feedback and your earlier versions stay here. You can take the post down from Sādhana School at any time.' : 'Only you can see this draft until you share it with the cohort.') + '</p></div>';
    }
    else if (state.admin) bar = '<div class="esu-obar"><div class="esu-acts"><button type="button" class="esu-lnk" data-act="rf-delete">Delete this reflection</button></div><p class="esu-muted" style="font-size:13px;margin-top:8px">Only you see this, as an admin.</p></div>';
    var top = d.comments.filter(function (c) { return !c.parent; });
    var fb = d.status === 'draft' ? '' : '<div class="esu-fb"><div class="esu-hd"><h3 class="esu-h2" style="font-size:22px">Feedback from the cohort</h3><span class="esu-muted" style="font-size:13px">' + top.length + (top.length === 1 ? ' comment' : ' comments') + ' · only Sahṛdaya Upāya mentees and Jacob see this</span></div>' +
      (top.length ? top.map(function (c) { return rfComment(c, d, d.comments); }).join('') : '<p class="esu-muted">' + (d.mine ? 'No feedback yet.' : 'Be the first to offer feedback.') + '</p>');
    if (d.status !== 'draft' && !d.mine) {
      var k = RK[r.ckind];
      fb += '<div class="esu-offer"><div class="esu-eye" style="color:#5A5346">Offer feedback</div><div class="esu-chips">' + Object.keys(RK).map(function (x) { return '<button type="button" class="esu-chip' + (r.ckind === x ? ' on' : '') + '" aria-pressed="' + (r.ckind === x) + '" data-act="rf-kind" data-k="' + x + '">' + RK[x][0] + '</button>'; }).join('') + '</div><p class="esu-muted" style="font-size:13.5px;margin:6px 0">' + esc(k[1]) + '</p>' +
        '<textarea id="esu-cm" rows="3" maxlength="3000" data-in="rf-ctext" aria-label="Your feedback" style="' + FIELD + '">' + esc(r.ctext) + '</textarea><div class="esu-acts" style="margin-top:8px"><button type="button" class="esu-btn pri" data-act="rf-comment"' + (r.busy ? ' disabled' : '') + '>Send feedback</button></div><p class="esu-muted" style="font-size:12.5px;margin-top:6px">Be specific and kind. Speak to the writing, not the person.</p></div>';
    }
    fb += '</div>';
    return '<div class="esu-rpane"><div class="esu-eye">' + esc(rfMonth(d.month)) + (d.topic ? ' · ' + esc(d.topic) : '') + '</div><h2 class="esu-rt1">' + esc(v.title) + '</h2><p class="esu-muted" style="font-size:13px;margin:2px 0 10px">' + esc(meta) + '</p>' +
      '<div class="esu-chips" style="align-items:center">' + chips + hl + '</div><div class="esu-rbody">' + v.paragraphs.map(function (p) { return '<p class="' + (p.changed ? 'ch' : '') + '">' + esc(p.text) + '</p>'; }).join('') + '</div>' + bar + rfFlash() + fb + '</div>';
  }
  function rfEditor() {
    var r = state.rf, d = r.detail, f = r.form, n = d && d.workingN ? d.workingN : 1, revising = n > 1;
    var aside = revising ? '<aside class="esu-aside"><div class="esu-eye" style="color:#5A5346">Feedback to work from</div>' + d.comments.filter(function (c) { return !c.parent; }).map(function (c) {
      var k = RK[c.kind], on = r.ticked[c.id] != null ? r.ticked[c.id] : c.addressedIn === n;
      return '<label class="esu-fbc"><input type="checkbox" data-in="rf-tick:' + esc(c.id) + '"' + (on ? ' checked' : '') + '><span><b>' + esc(c.who) + '</b> · ' + (k ? '<span style="color:' + k[2] + '">' + esc(k[0].toUpperCase()) + '</span>' : '') + '<br>' + esc(c.body) + '</span></label>';
    }).join('') + '<p class="esu-muted" style="font-size:12.5px">Tick what you’ve addressed. The commenter sees “addressed in version ' + n + '”.</p></aside>' : '';
    return '<div class="esu-rpane"><div class="esu-hd"><h2 class="esu-rt1" style="font-size:26px">' + (revising ? 'Revising · version ' + n : d ? 'Your draft' : 'Write ' + (r.meta ? rfMonth(r.meta.month) : 'this month') + '’s reflection') + '</h2><span class="esu-muted" style="font-size:13px">' + (revising ? 'Version ' + (n - 1) + ' stays as it was; the cohort sees what changed' : 'Only you can see it until you share it') + '</span></div>' +
      '<div class="' + (revising ? 'esu-ed2' : '') + '"><div>' + field('Title', '<input id="esu-rtitle" type="text" maxlength="120" data-in="rf-title" value="' + esc(f.title) + '" style="' + FIELD + ';font-family:Cormorant Garamond,Georgia,serif;font-size:20px">', 'esu-rtitle') +
      field('Your reflection', '<textarea id="esu-rbody" rows="14" maxlength="20000" data-in="rf-body" style="' + FIELD + ';font-family:Cormorant Garamond,Georgia,serif;font-size:19px;line-height:1.5">' + esc(f.body) + '</textarea>', 'esu-rbody') + '</div>' + aside + '</div>' + rfFlash() +
      '<div class="esu-acts" style="margin-top:12px"><button type="button" class="esu-btn pri" data-act="rf-share"' + (r.busy ? ' disabled' : '') + '>' + (revising ? 'Share version ' + n + ' with the cohort' : 'Share with the cohort') + '</button><button type="button" class="esu-btn out" data-act="rf-save"' + (r.busy ? ' disabled' : '') + '>Save as draft</button><button type="button" class="esu-btn out" data-act="rf-cancel">Cancel</button></div></div>';
  }
  function rfPostModal() {
    var r = state.rf, d = r.detail;
    if (!r.post || !d) return '';
    var v = d.versions.filter(function (x) { return x.shared; }).pop(), name = (state.first || (state.data && state.data.greeting && state.data.greeting.firstName) || 'You');
    var excerpt = v.body.length > 240 ? v.body.slice(0, 240).replace(/\s+\S*$/, '') + '…' : v.body;
    return '<div class="esu-ov" data-act="rf-post-close" data-bg="1"><div class="esu-dlg" role="dialog" aria-modal="true" aria-label="Post to Sādhana School"><h2 class="esu-h2">Post to Sādhana School?</h2>' +
      '<p class="esu-muted" style="margin:8px 0 12px">Version ' + v.n + ' goes to <b>Reflections</b> in Sādhana School, where the whole school can read it and reply. This is how it will look:</p>' +
      '<div class="esu-prev"><div class="esu-rhead"><span class="esu-av" style="background:#A5432A">' + esc(String(name).slice(0, 2).toUpperCase()) + '</span><b>' + esc(name) + '</b><span class="esu-muted" style="font-size:13px">in Reflections</span><span class="esu-mchip">FROM THE SAHṚDAYA UPĀYA COHORT</span></div><h3 class="esu-rt1" style="font-size:22px;margin:8px 0 4px">' + esc(v.title) + '</h3><p style="font-size:15px;line-height:1.45;margin:0">' + esc(excerpt) + '</p></div>' +
      '<p class="esu-muted" style="font-size:13px;margin:12px 0">The cohort’s feedback and your earlier versions stay here. You can take the post down from Sādhana School at any time.</p>' + rfFlash() +
      '<div class="esu-acts"><button type="button" class="esu-btn pri" data-act="rf-post-confirm"' + (r.busy ? ' disabled' : '') + '>' + (r.busy === 'post' ? 'Posting…' : 'Post to Sādhana School') + '</button><button type="button" class="esu-btn out" data-act="rf-post-close">Not yet</button></div></div></div>';
  }
  function reflHtml() {
    var r = state.rf, m = r.meta ? rfMonth(r.meta.month) : 'this month', mineNow = (r.list || []).filter(function (x) { return x.mine && r.meta && x.month === r.meta.month; })[0];
    if (state.error && !r.list) return '<h1 class="esu-h1">Reflections</h1><p class="esu-muted" style="margin-top:8px">' + esc(state.error) + '</p>';
    return '<div class="esu-eye">Sahṛdaya Upāya · The cohort’s reflections</div><div class="esu-head"><div><h1 class="esu-h1">Reflections</h1><div class="esu-sub">Write, share it with the cohort, revise from their feedback, then post it to Sādhana School.</div></div>' +
      (mineNow ? '<button type="button" class="esu-btn pri" data-act="rf-open" data-id="' + esc(mineNow.id) + '">Open your ' + esc(m) + ' reflection</button>' : '<button type="button" class="esu-btn pri" data-act="rf-new">Write ' + esc(m) + '’s reflection</button>') + '</div>' +
      pageSwitch('reflections') + rfSteps() + (r.list === null && r.err ? rfFlash() : '') + '<div class="esu-rcols">' + rfList() + (r.mode === 'edit' ? rfEditor() : rfReader()) + '</div>' + rfPostModal();
  }
  function rfClick(a, t) {
    var r = state.rf;
    if (a === 'rf-filter') { r.filter = t.dataset.f; render(); return true; }
    if (a === 'rf-new') { r.detail = null; r.id = ''; r.mode = 'edit'; r.form = { title: '', body: '' }; r.err = ''; r.ticked = {}; render(); return true; }
    if (a === 'rf-open') { r.mode = 'read'; r.err = ''; r.replyTo = ''; loadRefl(t.dataset.id); return true; }
    if (a === 'rf-ver') { r.vn = Number(t.dataset.n); render(); return true; }
    if (a === 'rf-cancel') { r.mode = 'read'; r.err = ''; render(); return true; }
    if (a === 'rf-edit') { var v = r.detail.versions[r.detail.versions.length - 1]; r.form = { title: v.title, body: v.body }; r.mode = 'edit'; r.ticked = {}; render(); return true; }
    if (a === 'rf-revise') { rfAct('revise').then(function () { var d = state.rf.detail; if (d) { var v2 = d.versions[d.versions.length - 1]; state.rf.form = { title: v2.title, body: v2.body }; state.rf.mode = 'edit'; state.rf.ticked = {}; render(); } }); return true; }
    if (a === 'rf-save' || a === 'rf-share') {
      var f = r.form, share = a === 'rf-share', n = r.detail && r.detail.workingN ? r.detail.workingN : 1;
      rfAct('save', { title: f.title, body: f.body }).then(function (d) {
        if (!d || !d.ok) return;
        var go = share ? rfAct('share') : Promise.resolve(d);
        return go.then(function (d2) {
          if (!d2 || !d2.ok) return;
          var ids = Object.keys(state.rf.ticked).filter(function (k) { return state.rf.ticked[k]; });
          return (n > 1 ? rfAct('address', { comments: ids, n: n }) : Promise.resolve()).then(function () { if (!state.rf.err) { state.rf.mode = 'read'; render(); } });
        });
      });
      return true;
    }
    if (a === 'rf-discard') { if (window.confirm('Delete this draft?')) rfAct('discard').then(function () { state.rf.mode = 'read'; render(); }); return true; }
    if (a === 'rf-kind') { r.ckind = t.dataset.k; render(); return true; }
    if (a === 'rf-comment') { rfAct('comment', { kind: r.ckind, body: r.ctext }).then(function (d) { if (d && d.ok && !state.rf.err) { state.rf.ctext = ''; render(); } }); return true; }
    if (a === 'rf-replyto') { r.replyTo = r.replyTo === t.dataset.id ? '' : t.dataset.id; r.reply = ''; render(); var inp = root.querySelector('#esu-rr'); if (inp) inp.focus(); return true; }
    if (a === 'rf-reply-send') { rfAct('comment', { parentId: r.replyTo, body: r.reply }).then(function (d) { if (d && d.ok && !state.rf.err) { state.rf.reply = ''; state.rf.replyTo = ''; render(); } }); return true; }
    if (a === 'rf-post-open') { r.post = true; r.err = ''; render(); return true; }
    if (a === 'rf-post-close') { r.post = false; r.err = ''; render(); return true; }
    if (a === 'rf-post-confirm') { rfAct('post').then(function () { if (!state.rf.err) { state.rf.post = false; render(); } }); return true; }
    if (a === 'rf-del-item') { var st = t.dataset.st; if (window.confirm(st === 'draft' ? 'Delete this draft?' : st === 'posted' ? 'Delete this reflection for good? It also comes down from Sādhana School, and the cohort’s feedback goes with it.' : 'Delete this reflection for good? The cohort’s feedback on it goes with it.')) { r.id = t.dataset.id; rfAct(st === 'draft' ? 'discard' : 'delete').then(function () { state.rf.mode = 'read'; render(); }); } return true; }
    if (a === 'rf-delete') { var dd = r.detail; if (window.confirm(dd && dd.status === 'posted' ? 'Delete this reflection for good? It also comes down from Sādhana School, and the cohort’s feedback goes with it.' : 'Delete this reflection for good? The cohort’s feedback on it goes with it.')) rfAct('delete').then(function () { state.rf.mode = 'read'; render(); }); return true; }
    if (a === 'rf-takedown') { if (window.confirm('Take this reflection down from Sādhana School? It stays here, with the cohort’s feedback.')) rfAct('takedown'); return true; }
    return false;
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
    // Circle's own page, with Edit lessons, when asked for (?native=1)
    if (/[?&]native=1/.test(location.search)) { unmount(); drawStrip(); return; }
    // A lesson page stays Circle's own; it only gets the strip at the top
    if (isLesson()) { if (root) unmount(); drawStrip(); return; }
    drawStrip();
    if (root && document.body.contains(root)) return;
    var box = document.querySelector(HOST) || pageContainer();
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    root = document.createElement('div'); root.__box = box;
    root.className = 'esu'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Sahṛdaya Upāya');
    root.addEventListener('click', onClick); root.addEventListener('input', onInput); root.addEventListener('change', onInput);
    box.insertBefore(root, box.firstChild);
    render(); uncloak();
  }
  function unmount() {
    var sp = document.getElementById('esu-strip'); if (sp && !isLesson()) sp.remove();
    uncloak();
    if (!root) return;
    var box = root.__box; root.remove(); root = null;
    if (box) for (var i = 0; i < box.children.length; i++) box.children[i].style.display = '';
  }

  // Escape closes a popup (the key listener is on the document: the page re-draws itself, so focus can sit outside it)
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root && document.body.contains(root) && (state.books || state.modal || state.rf.post || yrState.all)) { yrState.all = false; state.books = false; state.modal = null; state.rf.post = false; render(); } });

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css();
    state.data = cached();
    // A mentee seen before this session: take the space at once so the hub doesn't flash up first
    if (store(SKEY)) { try { var s = JSON.parse(store(SKEY)); if (s.until > Date.now() && s.who === String((window.circleUser && window.circleUser.email) || '').toLowerCase()) { state.admin = !!s.admin; setMentee(s.ok ? 'yes' : 'no'); } } catch (e) {} }
    signIn().then(function () {
      setMentee(state.ok ? 'yes' : 'no');
      if (!state.ok) { unmount(); return; }
      if (isLesson()) { mount(); return loadWb(); }
      mount(); render(); if (isWorkbook()) { if (state.ok) loadWb(); return load(); } loadPods(); loadPp(); if (currentView() === 'schedule') loadSched(); return isRefl() ? startRefl() : isMentor() ? loadMentor() : load();
    }).catch(function () { setMentee('no'); state.error = 'Please sign in to Circle to see your page.'; })
      .then(function () { mount(); render(); });
  }
  function startRefl() { var m = /[?&]post=(\d+)/.exec(location.search); return loadRefl(m ? m[1] : '').then(function () { if (m && state.rf.detail && state.rf.detail.mine && state.rf.detail.status === 'shared') { state.rf.post = true; render(); } }); }
  start();
  // Circle is a single-page app: draw when someone navigates here, give Circle's own page back when they leave
  // Our own redraws are ignored, and the page is only redrawn when the address changes (mentorship <-> reflections):
  // redrawing on every change re-triggered itself every 250 ms and threw the cursor out of text boxes.
  var timer = null, lastPath = location.pathname;
  new MutationObserver(function (muts) {
    if (root && muts.every(function (m) { return root.contains(m.target); })) return;
    var stp = document.getElementById('esu-strip'); if (stp && muts.every(function (m) { return stp.contains(m.target); })) return;
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      if (!PAGE.test(location.pathname)) { unmount(); return; }
      var moved = location.pathname !== lastPath; lastPath = location.pathname;
      if (!started) start(); else { if (moved && state.ok === true && (isWorkbook() || isLesson())) { loadWb(); if (isWorkbook() && !state.data) load(); } mount(); if (root && isRefl() && state.rf.list === null && state.ok === true) startRefl(); else if (root && isMentor() && state.mt.data === null && !state.mt.err) loadMentor().then(render); else if (root && moved) render(); }
    }, 250);
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', function () { if (!PAGE.test(location.pathname)) { unmount(); return; } state.view = /[?&]view=schedule/.test(location.search) ? 'schedule' : 'month'; if (state.view === 'schedule') loadSched(); render(); drawStrip(); });
})();
