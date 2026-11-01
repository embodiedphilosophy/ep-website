/* Embodied Philosophy · Sahṛdaya Upāya page for mentees (ss.embodiedphilosophy.com/c/mentorship)
   Loaded by public/circle/today.js. Draws the page in place of the space's content (no frame), like This week.
   Mentees and Circle admins only: anyone else keeps the Sādhana School hub, which season-loader.js shows.
   Sets window.__epMentee to 'yes' or 'no' once it knows, so season-loader.js knows whether to leave the space to us.
   Data: /api/member/this-week (lib/mentee/load.js → home.js). See docs/sahrdaya-upaya-page.md. */
(function () {
  if (window.__epSahrdaya) return; window.__epSahrdaya = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/(mentorship|reflections)\/?$/;
  var isRefl = function () { return /^\/c\/reflections\/?$/.test(location.pathname); };
  var isMentor = function () { return /^\/c\/mentorship\/?$/.test(location.pathname) && /[?&]view=mentor/.test(location.search) && state.admin === true; };
  var SKEY = 'ep_su_session';
  var state = { admin: null, mt: { data: null, err: '', filter: 'all', open: '', busy: '', msg: '' }, session: null, first: '', ok: null, data: null, error: '', busy: '', msg: '', going: {}, tab: 'formation', room: 'chat', modal: null, form: {}, progress: '', say: '', picks: {}, books: false, ask: '', rf: { list: null, meta: null, detail: null, id: '', filter: 'cohort', mode: 'read', form: { title: '', body: '' }, vn: 0, ckind: 'landed', ctext: '', replyTo: '', reply: '', ticked: {}, post: false, busy: '', err: '' } };

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
      state.session = r.session; state.first = r.firstName || ''; state.ok = !!(r.admin || (r.tier && r.tier.tier === 'mentee')); state.admin = !!r.admin;
      store(SKEY, JSON.stringify({ session: r.session, first: state.first, ok: state.ok, admin: state.admin, until: Date.now() + 11 * 3600 * 1000 }));
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
      '.esu{font-family:"IBM Plex Sans",system-ui,sans-serif;color:#1E1A14;max-width:1120px;margin:0 auto;padding:28px 24px 64px;line-height:1.5;font-size:15px;background:#F1E9DC}',
      '.esu *{box-sizing:border-box}.esu a{color:#A5432A}.esu a.esu-btn{color:inherit}.esu :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.esu-eye{font:500 11px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#A5432A}',
      '.esu-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px 28px;flex-wrap:wrap;margin:6px 0 20px}',
      '.esu-h1{margin:0;font:600 48px/1.05 "Cormorant Garamond",Georgia,serif}.esu-h1 em{color:#A5432A;font-style:italic}',
      '.esu-sub{font-size:13.5px;color:#5A5346;margin-top:6px}',
      '.esu-tot{min-width:210px}.esu-tot b{font:600 28px/1 "Cormorant Garamond",Georgia,serif;font-variant-numeric:lining-nums;font-feature-settings:"lnum" 1}.esu-tot span{font-size:13px;color:#5A5346}',
      '.esu-ever{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin:0 0 18px}.esu-ever .esu-card{display:flex;flex-direction:column;gap:6px}.esu-ever .esu-h2{font-size:21px}.esu-ever .esu-btm{margin-top:auto;padding-top:10px}',
      '.esu-ever .esu-poll{grid-column:1/-1}',
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
      '.esu-gt-t{position:relative;display:block;min-height:98px}.esu-gt-t.hd{min-height:0;display:grid;grid-template-columns:repeat(9,minmax(0,1fr));text-align:center}.esu-gt-t.hd b{font:500 11px \"IBM Plex Mono\",monospace;letter-spacing:.08em;color:#5A5346;padding:8px 0 6px;border-radius:6px 6px 0 0}.esu-gt-t.hd b.cur{color:#A5432A;background:#F6EEDA}.esu-gt-tag{position:absolute;top:-1px;transform:translateX(-50%);font:600 9.5px \"IBM Plex Sans\",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#A5432A;border-radius:99px;padding:1px 6px;font-style:normal;display:none}',
      '.esu-gt-s{position:absolute;inset:0;display:grid;grid-template-columns:repeat(9,minmax(0,1fr));pointer-events:none}.esu-gt-s i{border-left:1px solid #EDE3D3}.esu-gt-s i.cur{background:#F6EEDA}.esu-gt-bars{position:absolute;left:0;right:0;top:10px;height:40px}.esu-gt-b{position:absolute;top:0;height:40px;border-radius:6px;display:flex;align-items:center;justify-content:center;padding:2px 4px;font:600 11px/1.15 \"IBM Plex Sans\",sans-serif;text-align:center;white-space:normal;overflow:hidden;box-sizing:border-box}',
      '.esu-gt-dots{position:absolute;left:0;right:0;top:58px;height:40px}.esu-gt-d1{position:absolute;display:inline-flex;width:12px;height:12px}.esu-gt-now{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#A5432A;opacity:.55;pointer-events:none}',
      '.esu-ln-p{display:none}.esu-lp3{display:grid;grid-template-columns:46px minmax(0,1fr) minmax(0,1fr);border-top:1px solid #E3D8C6}.esu-lpm{padding:10px 0;font-size:11px;letter-spacing:.06em;color:#5A5346}.esu-lpm.cur{color:#A5432A}.esu-lpc{padding:8px 6px;display:flex;flex-direction:column;gap:4px}.esu-lpc.cur{background:#F6EEDA}.esu-lpl{display:flex;gap:6px;align-items:flex-start;font-size:12.5px;line-height:1.3}.esu-lpl .esu-ldot{margin-top:2px}.esu-lp3>.esu-proj{padding:8px 6px}',
      '.esu-rck{display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;padding:10px 0;align-items:start;font-size:14px;cursor:pointer}.esu-rck.dis{cursor:default;color:#8A8072}.esu-rck input{width:18px;height:18px;margin:1px 0 0;accent-color:#2E5A4B}.esu-clamp{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}',
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
      '.esu-st{grid-template-columns:minmax(0,1fr) auto}.esu-sw{grid-column:1/-1;flex-direction:row;gap:8px;align-items:baseline}.esu-cue{grid-template-columns:minmax(0,1fr)}.esu-steps4{grid-template-columns:repeat(2,minmax(0,1fr))}.esu-rcols,.esu-ed2{grid-template-columns:minmax(0,1fr)}.esu-rpane{padding:16px}.esu-rt1{font-size:28px}',
      '.esu{padding:24px 16px 56px}.esu-h1{font-size:36px}.esu-tabs{display:flex;gap:6px;margin:0 0 14px;background:#E3D8C6;border-radius:99px;padding:4px}',
      '.esu-tabs button{flex:1;min-height:40px;border:0;border-radius:99px;background:transparent;font:600 14px "IBM Plex Sans",system-ui,sans-serif;color:#5A5346;cursor:pointer}.esu-tabs button[aria-selected=true]{background:#20302A;color:#fff}',
      '.esu-cols{display:flex;flex-direction:column;flex-wrap:nowrap;align-items:stretch;gap:14px}.esu-c1,.esu-c2{display:contents}',
      '.esu-cols>*,.esu-c1>*,.esu-c2>*{order:0}',
      '[data-g=ever]{order:0}[data-g=immersion]{order:1}[data-g=guide]{order:2}[data-g=month]{order:3}[data-g=steps]{order:4}[data-g=one]{order:5}[data-g=review]{order:6}[data-g=lanes]{order:7}[data-g=assign]{order:8}[data-g=partner]{order:9}[data-g=pods]{order:10}[data-g=hours]{order:11}[data-g=feedback]{order:12}[data-g=room]{order:13}',
      '.esu-ln-d{display:none}.esu-ln-p{display:block}',
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
    var r = w.home.reflection, month = dayFmt(r.month + '-01', { month: 'long' }), m = r.mine;
    var body = m ? '<h2 class="esu-h2">' + esc(m.title) + '</h2><p class="esu-muted" style="font-size:13.5px">' + esc(r.line) + '</p>' : '<h2 class="esu-h2">Write your ' + esc(month) + ' reflection</h2><p class="esu-muted" style="font-size:13.5px">Write it, share it with the cohort, and revise it from what they say.</p>';
    var fresh = r.unread ? '<p class="esu-muted" style="font-size:13.5px">New in the cohort: ' + r.unread + (r.unread === 1 ? ' reflection' : ' reflections') + ' you haven’t read</p>' : '';
    var btns = safeUrl(r.url) ? '<div class="esu-btm esu-acts">' + link(r.url, 'Open Reflections', 'esu-btn pri') + (m && m.status === 'shared' ? link(r.url + (r.url.indexOf('?') < 0 ? '?' : '&') + 'post=' + encodeURIComponent(m.id), 'Post to SS', 'esu-btn out') : '') + '</div>' : '<p class="esu-muted esu-btm" style="font-size:13px">Reflections opens here soon.</p>';
    return '<section class="esu-card" data-g="ever"><div class="esu-eye">Your ' + esc(month) + ' reflection</div>' + body + fresh + btns + '</section>';
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
    var tabs = [['chat', 'Cohort Chat'], ['pair', 'Articulation Buddy'], ['jacob', 'Message Jacob']];
    var bar = '<div class="esu-rt" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" aria-selected="' + (state.room === t[0]) + '" data-act="room" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var body;
    if (state.room === 'pair') {
      body = r.pairChatUrl
        ? '<p class="esu-muted" style="margin-bottom:12px">Your own chat with ' + esc(p && p.name ? p.name : 'your partner') + ' for this rotation. Use it to find a time and to share what you are working on.</p><div class="esu-acts">' + ext(r.pairChatUrl, 'Open your articulation chat', 'esu-btn pri') + '</div>'
        : '<div class="esu-empty">' + (p ? 'Your articulation chat will appear here once Jacob has opened it for this rotation.' : 'You’ll see your articulation chat here once you have a partner.') + '</div>';
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

  var COMPS = [['genealogy', 'Genealogy & diagnosis'], ['attunement', 'Subtle attunement'], ['speech', 'Ethical speech'], ['transmission', 'Experience-based transmission'], ['curriculum', 'Curriculum design'], ['lineage', 'Lineage & creativity']];
  var HOW = { immersions: 'Added for you from the Zoom attendance report', 'one-to-ones': 'Added for you when a booking is held', observation: 'You log it, with competencies · Jacob confirms', 'practice-teaching': 'You log it · a partner co-signs · Jacob confirms', peer: 'One of the pair logs a session · both are credited', reflections: 'Counted for you from Reflections · 9 posts', retreat: 'Summer retreat · added for you', assessment: 'Hand-in, assessed against the rubric · revisable once', report: 'Hand-in', competency: 'Open-book quiz' };
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

  function hoursCard(w) {
    var f = w.formation;
    if (!f) return '<section class="esu-card" data-g="hours">' + hd('Formation hours') + '<p class="esu-muted">Your hours record isn’t available just now.</p></section>';
    var rm = w.home.reflectionMonths, rurl = w.home.reflection && w.home.reflection.url;
    var comps = '<div class="esu-grid2">' + f.components.map(function (c) {
      var conf = Math.min(100, Math.round(c.credited / c.target * 100)), pend = Math.min(100 - conf, Math.round((c.pending || 0) / c.target * 100));
      var circles = c.id === 'reflections' && rm && rm.months.length ? '<div class="esu-mc" aria-label="Months with a reflection counted">' + rm.months.map(function (m) { return '<span class="esu-mcd' + (m.filled ? ' on' : '') + (m.now ? ' now' : '') + '" title="' + esc(m.ym) + '">' + esc(m.label) + '</span>'; }).join('') + (safeUrl(rurl) ? ' <a href="' + esc(rurl) + '" target="_top" style="font-size:12.5px">Reflections</a>' : '') + '</div>' : '';
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
    }).join('') + '</ul>' : '<p class="esu-muted" style="margin-top:14px">Your record starts with your first observation or Practicum.</p>';
    var hs = w.home.hours;
    return '<section class="esu-card" data-g="hours">' + hd('Formation hours', '<span class="esu-leg"><span><i class="c"></i>Confirmed</span><span><i class="p"></i>Pending Jacob</span></span>') +
      '<p class="esu-muted" style="margin:-6px 0 10px;font-size:13px">' + hs.confirmed + ' confirmed · ' + hs.pending + ' pending · of ' + f.target + ' hrs</p>' + comps + rec +
      '<div class="esu-acts" style="margin-top:14px"><button type="button" class="esu-btn pri" data-act="open-hours">Log hours</button><button type="button" class="esu-btn out" data-act="open-articulation">Log an articulation session</button></div>' +
      '<p class="esu-muted" style="margin-top:8px;font-size:13px">Immersions, Practicums and one-to-ones are added for you. Log observation, practice-teaching and retreat practicum here.</p></section>';
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
        action = '<button type="button" class="esu-tk' + (inn && sub.status === 'submitted' ? ' on' : '') + '" data-act="open-handin" data-id="' + esc(it.id) + '">' + (!sub ? 'Hand in' : sub.status === 'draft' ? 'Continue' : sub.status === 'returned' ? 'Edit and resend' : 'View') + '</button>';
      } else {
        status = it.done ? 'Read' : (due ? 'Due ' + due : (it.where || ''));
        action = '<button type="button" class="esu-tk' + (it.done ? ' on' : '') + '" role="checkbox" aria-checked="' + it.done + '" data-act="tick" data-id="' + esc(it.id) + '" data-done="' + (it.done ? '0' : '1') + '"' + (state.busy === 'tick' + it.id ? ' disabled' : '') + '>' + (it.done ? 'Read ✓' : 'Mark read') + '</button>';
      }
      return '<li class="' + (it.done ? 'done' : '') + '"><div class="l"><div class="t">' + t + '</div>' + (status ? '<div class="u"' + (sub && sub.status === 'returned' ? ' style="color:#A5432A"' : '') + '>' + esc(status) + '</div>' : '') + (sub && sub.status === 'returned' && sub.note ? '<div class="esu-rnote"><b>Jacob:</b> ' + esc(sub.note) + '</div>' : '') + '</div>' + action + '</li>';
    }).join('') + '</ul>' : '<p class="esu-muted">Nothing due this week. Start with <em>Start Here</em> in the Workbook' + (h.startLessons && h.startLessons.length ? ':</p><ul class="esu-rows" style="margin-top:6px">' + h.startLessons.map(function (l) { return '<li class="' + (l.done ? 'done' : '') + '"><div class="l"><div class="t">' + (safeUrl(l.url) ? ext(l.url, esc(l.name), '') : esc(l.name)) + '</div></div>' + (l.done ? '<span class="esu-ok" style="font-size:13px">Done ✓</span>' : '') + '</li>'; }).join('') + '</ul>' : ': How This Workbook Works, Your Year at a Glance, The Practice &amp; Study Imperative, and Your Monthly 1-on-1 with Jacob.</p>');
    return '<section class="esu-card" data-g="assign">' + hd('Assignments', d.total ? '<span class="esu-mono">' + d.done + ' / ' + d.total + ' IN</span>' : '') +
      '<p class="esu-muted" style="margin:-4px 0 8px;font-size:13px">' + sub + 'Everything you hand in goes to Jacob and into your formation record.</p>' + rows +
      (safeUrl(h.workbookUrl) ? '<p style="margin:12px 0 0;font-size:13px">' + ext(h.workbookUrl, 'Programme expectations and full briefs, in the Workbook.', '') + '</p>' : '') + '</section>';
  }

  // ---- The mentee year: next project steps, this month, the two lanes, the quarterly review, and the one-to-one summary (docs/sahrdaya-upaya-page.md) ----
  var PROJ = { both: ['Both projects', '#4B4F8C'], talk: ['60-minute talk', '#B8801C'], offering: ['Three-session offering', '#2F6B4F'] };
  var yrState = { all: false, keep: {}, editing: false, text: '', msg: '', busy: '' };
  function dmy(d) { return wd(d) + ' ' + dayFmt(d, { month: 'short' }); }
  function dm(d) { return dayFmt(d, { day: 'numeric' }) + ' ' + dayFmt(d, { month: 'short' }); }
  function dml(d) { return dayFmt(d, { day: 'numeric' }) + ' ' + dayFmt(d, { month: 'long' }); }
  function dmyT(iso) { return fmtTime(iso, { weekday: 'short' }) + ' ' + fmtTime(iso, { day: 'numeric' }) + ' ' + fmtTime(iso, { month: 'short' }); }
  function hmT(iso) { return hmT(iso); }
  var YR = function (w) { return w && w.home && w.home.year; };
  function projChip(p) { var x = PROJ[p] || PROJ.both; return '<span class="esu-proj"><i style="background:' + x[1] + '"></i>' + x[0] + '</span>'; }
  function whenText(s) { var n = s.daysTo; return n < 0 ? Math.abs(n) + (n === -1 ? ' day overdue' : ' days overdue') : n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days'; }
  function nextSteps(y) {
    var list = y.allSteps.filter(function (s) { return s.status !== 'done' || yrState.keep[s.id]; });
    var od = list.filter(function (s) { return s.overdue && s.status !== 'done'; }), rest = list.filter(function (s) { return !(s.overdue && s.status !== 'done'); });
    return od.concat(rest).slice(0, 3);
  }
  function stepRow(s, y, flat) {
    var late = s.overdue && s.status !== 'done', done = s.status === 'done';
    var btn = y.ticksOk === false ? '' : '<button type="button" class="esu-tk" aria-pressed="' + done + '" data-act="yr-tick" data-id="' + esc(s.id) + '"' + (yrState.busy === s.id ? ' disabled' : '') + '>' + (done ? 'Done ✓' : 'Mark done') + '</button>';
    return '<li class="esu-st' + (late ? ' late' : '') + '"><span class="esu-sw"><span class="esu-mono esu-sd"' + (late ? ' style="color:#A5432A"' : '') + '>' + esc(dmy(s.date)) + '</span><span class="esu-sn"' + (late ? ' style="color:#A5432A"' : '') + '>' + (done ? 'done' : whenText(s)) + '</span></span>' +
      '<span class="esu-sm">' + projChip(s.project) + '<span class="esu-stt">' + esc(s.title) + '</span>' + (flat ? '' : (s.detail ? '<span class="esu-muted" style="font-size:13.5px">' + esc(s.detail) + '</span>' : '') + (s.evidence ? '<span class="esu-muted" style="font-size:12.5px"><span class="esu-mono" style="font-size:10.5px;letter-spacing:.12em;text-transform:uppercase">Evidence</span> · ' + esc(s.evidence) + '</span>' : '')) + '</span>' + (btn ? '<span class="esu-sb">' + btn + '</span>' : '') + '</li>';
  }
  function stepsCard(w) {
    var y = YR(w); if (!y) return '';
    var head = '<div class="esu-hd"><h2 class="esu-h2">Your next project steps</h2>' + (y.started ? '<button type="button" class="esu-lnk" style="color:#A5432A;font-weight:600;text-decoration:none" data-act="yr-all">All ' + y.total + ' steps</button>' : '') + '</div>';
    if (!y.started) return '<section class="esu-card" data-g="steps">' + head + '<div class="esu-zero">Your project steps start in November.</div></section>';
    var list = nextSteps(y), body;
    if (!list.length) body = '<div class="esu-zero">You’re up to date. Your next step appears here when it’s close.</div>';
    else body = (y.ticksOk === false ? '<p class="esu-err" style="margin-bottom:6px">Your ticks couldn’t be loaded just now. The steps are still right.</p>' : '') + '<ul class="esu-sl">' + list.map(function (s) { return stepRow(s, y); }).join('') + '</ul>';
    return '<section class="esu-card" data-g="steps">' + head + body + (yrState.msg && yrState.msgFor === 'tick' ? '<p class="esu-err" role="alert" style="margin-top:8px">' + esc(yrState.msg) + '</p>' : '') +
      '<p class="esu-muted" style="font-size:13px;margin-top:10px">Ticking a step tells Jacob you’ve done it. Bring the evidence to your next one-to-one.</p>' +
      '<p id="reminders" class="esu-muted" style="font-size:13px;margin-top:6px">Reminders by email: <b>' + (y.reminders ? 'on' : 'off') + '</b> · <button type="button" class="esu-lnk" data-act="yr-remind">' + (y.reminders ? 'Turn off' : 'Turn on') + '</button></p></section>';
  }
  function allStepsModal(w) {
    var y = YR(w); if (!y || !yrState.all) return '';
    var by = {}; y.allSteps.forEach(function (s) { (by[s.month] = by[s.month] || []).push(s); });
    var months = (y.months || []).filter(function (m) { return by[m.id]; });
    var body = months.map(function (m) {
      return '<div style="margin-top:14px"><div class="esu-eye" style="color:#5A5346">' + esc(m.title) + '</div>' + (m.theme ? '<div class="esu-h2" style="font-size:19px;font-style:italic;margin:2px 0 0">' + esc(m.theme) + '</div>' : '') + '<ul class="esu-sl">' + by[m.id].map(function (s) { return stepRow(s, y, true); }).join('') + '</ul></div>';
    }).join('');
    return '<div class="esu-ov" data-act="yr-close" data-bg="1"><div class="esu-dlg" role="dialog" aria-modal="true" aria-label="The year ahead" style="max-width:680px"><div class="esu-hd"><h2 class="esu-h2">The year ahead</h2><button type="button" class="esu-btn out" data-act="yr-close">Close</button></div>' +
      '<p class="esu-muted" style="font-size:13px">' + y.doneCount + ' of ' + y.total + ' project steps done.</p>' + body + '</div></div>';
  }
  function lastMonday(ym) { var p = ym.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1], 0)); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }
  function dotRow(label, dot, main, sub, act) {
    var inner = '<span style="display:flex;gap:6px;align-items:center">' + (dot ? '<i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + dot + '"></i>' : '') + '<span style="font-weight:600">' + main + '</span></span>' + (sub ? '<span style="font-size:12.5px;color:#5A5346">' + sub + '</span>' : '');
    return '<dt class="esu-mono esu-dt">' + label + '</dt><dd class="esu-dd">' + (act ? '<button type="button" class="esu-rowb" data-act="' + act + '">' + inner + '</button>' : inner) + '</dd>';
  }
  // A visible way into the year page and the manual (they live on /school/mentee-year; not drawn inside Circle)
  function guideCard(w) {
    return '<section class="esu-card" data-g="guide"><div class="esu-eye">Start here</div><h2 class="esu-h2" style="margin:6px 0 6px">Your year, and the manual</h2>' +
      '<p class="esu-muted" style="font-size:14px;margin:0 0 12px">The whole year on one page: the monthly rhythm, every project step with its date, and the one-to-one template. And the formation manual, with the Sanskrit sources in full, to read here or download as a PDF.</p>' +
      '<div class="esu-acts">' + ext(API + '/school/mentee-year', 'See your year', 'esu-btn pri') + ext(API + '/school/mentee-year?tab=manual', 'Read the manual', 'esu-btn out') + '</div></section>';
  }
  // Study pods: who is hosting and how to join (read only here; joining happens on the Study pods tab)
  function podsCard(w) {
    var d = state.pods; if (!d || !d.on) return '';
    var rows = d.pods.map(function (x) {
      var st = x.started ? x.count + ' in · ' + (x.spots > 0 ? x.spots + ' places left' : 'full') : x.count + ' of ' + d.min + ' to begin · ' + x.needs + ' more needed';
      var act = x.mine ? (x.roomUrl ? ext(x.roomUrl, 'Join the live room', 'esu-btn pri') : '') + (x.chatUrl ? ' ' + ext(x.chatUrl, 'Pod chat', 'esu-btn out') : '') : x.canJoin ? ext(d.url, 'Join', 'esu-btn out') : '';
      return '<li style="padding:10px 0;border-top:1px solid #E3D8C6"><div style="font-weight:600">' + esc(x.topic) + (x.mine ? ' <span class="esu-muted" style="font-weight:400">· yours</span>' : '') + '</div><div class="esu-muted" style="font-size:13px">Led by ' + esc(x.leader) + (x.schedule ? ' · ' + esc(x.schedule) : '') + ' · ' + esc(st) + '</div>' + (act ? '<div class="esu-acts" style="margin-top:6px">' + act + '</div>' : '') + '</li>';
    }).join('');
    var lead = d.leader === 'approved' ? '<p style="margin:10px 0 0;font-size:14px"><b>You can lead a pod.</b> ' + ext(d.url, 'Start one', 'esu-lnk') + '</p>' : d.leader === 'applied' ? '<p class="esu-muted" style="margin:10px 0 0;font-size:13px">Your request to lead a pod is with the team.</p>' : '<p class="esu-muted" style="margin:10px 0 0;font-size:13px">Would you like to host one? ' + ext(d.url, 'Ask to lead a pod', 'esu-lnk') + '</p>';
    return '<section class="esu-card" data-g="pods"><div class="esu-hd"><h2 class="esu-h2">Study pods</h2>' + ext(d.url, 'See all', 'esu-lnk') + '</div>' +
      '<p class="esu-muted" style="font-size:13.5px;margin:0 0 4px">Small student-led groups that study something together. A pod begins at ' + d.min + ' people and meets in a Circle live room.</p>' +
      (rows ? '<ul style="list-style:none;margin:0;padding:0">' + rows + '</ul>' : '<p class="esu-muted" style="margin:8px 0 0">No pods are open yet.</p>') + lead + '</section>';
  }
  function monthCard(w) {
    var y = YR(w); if (!y || !y.started || !y.month) return '';
    var m = y.month, h = w.home, rows = '', G = '#B5A88F', A = '#B8801C', OK = '#2E5A4B';
    var monthName = dayFmt(w.today.slice(0, 7) + '-01', { month: 'long' });
    var im = h.immersion;
    if (im && (im.sat.slice(0, 7) === w.today.slice(0, 7) || im.happening)) rows += dotRow('Immersion', '', esc(im.n + ' · ' + im.title), esc(wd(im.sat) + ' – ' + dmy(im.sun) + ' · ' + (im.happening ? 'this weekend' : im.daysTo === 1 ? 'tomorrow' : 'in ' + im.daysTo + ' days')));
    var bk = h.books && h.books.current;
    if (bk && bk.required.length) rows += dotRow('Read', '', esc(bk.required[0].title), esc((bk.required[0].author ? bk.required[0].author + ' · ' : '') + 'required' + (bk.suggested.length ? '. Suggested: ' + bk.suggested[0].title + (bk.suggested[0].author ? ', ' + bk.suggested[0].author : '') : '')), 'all-books');
    var rf = h.reflection && h.reflection.mine, due = m.reflectionDue || lastMonday(w.today.slice(0, 7));
    rows += dotRow('Reflection', rf && rf.status === 'posted' ? OK : rf ? A : G, 'Due ' + esc(dmy(due)), rf ? (rf.status === 'posted' ? 'Posted to Sādhana School' : rf.status === 'shared' ? 'Shared with the cohort, ready to post' : 'Draft saved') : 'Not started yet');
    var p = h.partner, a = h.articulation;
    if (p) rows += dotRow('Partner', '', esc(p.name), esc((a.rotation ? 'Rotation ' + a.rotation.n + ', until ' + dm(a.rotation.to) + ' · ' : '') + a.sessions + ' of ' + a.target + ' sessions'));
    var o = h.oneToOne.booked, has = y.oneToOne.summary;
    rows += o ? dotRow('One-to-one', has ? OK : A, 'Booked ' + esc(dmyT(o.start) + ', ' + hmT(o.start)), has ? 'Summary sent' : 'Summary needed') : dotRow('One-to-one', G, 'Not booked yet', '');
    if (y.review && y.review.state === 'open') rows += dotRow('Review', A, esc(y.review.name + ' review'), y.review.ticked + ' of ' + y.review.total + ' ticked');
    else { var ns = y.steps[0]; if (ns) rows += dotRow('Project step', ns.overdue ? '#A5432A' : '', esc(ns.title), (ns.overdue ? 'was due ' : 'due ') + esc(dmy(ns.date))); }
    return '<section class="esu-card" data-g="month"><div class="esu-hd" style="margin-bottom:4px"><p class="esu-eye">' + esc(monthName) + ' · Month ' + m.n + ' of ' + m.of + '</p>' + '<span>' + ext(API + '/school/mentee-year', 'The year', 'esu-lnk') + ' · ' + ext(API + '/school/mentee-year?tab=manual', 'The manual', 'esu-lnk') + '</span>' + '</div>' +
      '<h2 class="esu-h2" style="font-style:italic;font-size:23px">' + esc(m.theme) + '</h2>' + (m.focus ? '<p class="esu-muted" style="font-size:13.5px;margin:6px 0 4px">' + esc(m.focus) + '</p>' : '') + '<dl class="esu-dl">' + rows + '</dl></section>';
  }
  var LS = { done: 'background:#2E5A4B;border:2px solid #2E5A4B', due: 'background:#fff;border:2px solid #D2A65A', overdue: 'background:#A5432A;border:2px solid #A5432A', coming: 'background:#fff;border:1.5px solid #B5A88F' };
  var LL = { done: 'Done', due: 'Due this month', overdue: 'Overdue', coming: 'Coming up' };
  function ld(s) { return '<i class="esu-ldot" style="' + LS[s] + '"></i>'; }
  function lanesCard(w) {
    var y = YR(w); if (!y) return '';
    var head = '<div class="esu-hd"><h2 class="esu-h2">Your two final projects</h2>' + (y.lanes ? '<span class="esu-mono">' + y.lanes.doneCount + ' of ' + y.lanes.total + ' steps done</span>' : '') + '</div>';
    if (!y.lanes) return '<section class="esu-card" data-g="lanes">' + head + '<div class="esu-zero">Your project steps start in November.</div></section>';
    var L = y.lanes, st = function (id) { var m = y.allSteps.filter(function (s) { return s.id === id; })[0]; return m ? (m.status === 'done' ? 'done' : m.overdue ? 'overdue' : m.month === w.today.slice(0, 7) ? 'due' : 'coming') : 'coming'; };
    var legend = '<div class="esu-lg">' + ['done', 'due', 'overdue', 'coming'].map(function (k) { return '<span>' + ld(k) + LL[k] + '</span>'; }).join('') + '</div>';
    // A timeline: each project is a row of phase bars across the months, with its steps as dots at their real dates and a line for today
    var cols = L.months.length, TONE = { talk: ['#F6EBD8', '#8A5A12'], offering: ['#E1F0E7', '#2F6B4F'] };
    var at = function (date) { var i = -1; L.months.forEach(function (m, k) { if (m.ym === date.slice(0, 7)) i = k; }); if (i < 0) return null; var y = +date.slice(0, 4), mo = +date.slice(5, 7), dim = new Date(Date.UTC(y, mo, 0)).getUTCDate(); return (i + (+date.slice(8) - 0.5) / dim) / cols * 100; };
    var todayAt = at(w.today);
    var stripes = '<span class="esu-gt-s">' + L.months.map(function (m) { return '<i' + (m.current ? ' class="cur"' : '') + '></i>'; }).join('') + '</span>';
    var todayLine = todayAt === null ? '' : '<span class="esu-gt-now" style="left:' + todayAt + '%"></span>';
    var grid = '<div class="esu-gt esu-ln-d" role="table" aria-label="Final projects by month"><div class="esu-gt-r hd"><span class="esu-gt-l"></span><span class="esu-gt-t hd">' +
      L.months.map(function (m) { return '<b class="' + (m.current ? 'cur' : '') + '">' + esc(m.label.toUpperCase()) + '</b>'; }).join('') + (todayAt === null ? '' : '<em class="esu-gt-tag" style="left:' + todayAt + '%">today</em>') + '</span></div>';
    [L.talk, L.offering].forEach(function (ln) {
      var tone = TONE[ln.key], dots = ln.steps.slice().sort(function (x, y) { return x.date < y.date ? -1 : 1; }), prev = -9, lvl = 0;
      var bars = ln.phases.map(function (p) { return '<span class="esu-gt-b" style="left:calc(' + (p.from / cols * 100) + '% + 1px);width:calc(' + ((p.to - p.from) / cols * 100) + '% - 2px);background:' + tone[0] + ';color:' + tone[1] + '" title="' + esc(p.label) + '">' + esc(p.label) + '</span>'; }).join('');
      var dd = dots.map(function (s) {
        var x = at(s.date); if (x === null) return '';
        lvl = x - prev < 2.4 ? (lvl + 1) % 3 : 0; prev = x;
        var k = st(s.id);
        return '<span class="esu-gt-d1" style="left:calc(' + x + '% - 6px);top:' + (4 + lvl * 15) + 'px" title="' + esc(s.title + ' · ' + dmy(s.date) + ' · ' + LL[k]) + '" role="img" aria-label="' + esc(s.title + ', ' + dmy(s.date) + ', ' + LL[k]) + '">' + ld(k) + '</span>';
      }).join('');
      grid += '<div class="esu-gt-r"><span class="esu-gt-l">' + projChip(ln.key) + '</span><span class="esu-gt-t">' + stripes + '<span class="esu-gt-bars">' + bars + '</span><span class="esu-gt-dots">' + dd + '</span>' + todayLine + '</span></div>';
    });
    grid += '</div>';
    var phone = '<div class="esu-ln-p"><div class="esu-lp3"><span></span>' + projChip('talk').replace('60-minute talk', 'Talk') + projChip('offering').replace('Three-session offering', 'Offering') + '</div>' + L.months.map(function (m, c) {
      var cell = function (ln) { return '<span class="esu-lpc' + (m.current ? ' cur' : '') + '">' + ln.steps.filter(function (s) { return s.col === c; }).map(function (s) { return '<span class="esu-lpl">' + ld(st(s.id)) + esc(s.title.length > 42 ? s.title.slice(0, 40) + '…' : s.title) + '</span>'; }).join('') + '</span>'; };
      return '<div class="esu-lp3"><span class="esu-mono esu-lpm' + (m.current ? ' cur' : '') + '">' + esc(m.label.toUpperCase()) + '</span>' + cell(L.talk) + cell(L.offering) + '</div>';
    }).join('') + '</div>';
    return '<section class="esu-card" data-g="lanes">' + head + legend + grid + phone + (L.here ? '<p class="esu-muted" style="font-size:13px;margin-top:10px">' + esc(L.here) + '</p>' : '') + '</section>';
  }
  var LOCK = '<svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true" style="flex:none"><rect x="1.5" y="5" width="8" height="6" rx="1.2" fill="none" stroke="#8A8072" stroke-width="1.3"/><path d="M3.3 5V3.6a2.2 2.2 0 0 1 4.4 0V5" fill="none" stroke="#8A8072" stroke-width="1.3"/></svg>';
  function reviewCard(w) {
    var y = YR(w), r = y && y.review; if (!r) return '';
    var st = r.state, col = st === 'complete' ? '#2E5A4B' : st === 'open' ? '#B8801C' : '#8A8072', bd = st === 'complete' ? '#BFD3C6' : st === 'open' ? '#D2A65A' : '#E3D8C6';
    var tag = st === 'locked' ? 'Opens ' + dm(r.opensOn) : st === 'complete' ? 'Complete' : r.ticked + ' of ' + r.total;
    var when = dayFmt(r.month + '-15', { month: 'long' });
    var intro = st === 'locked' ? 'A look back at your ' + (r.key === 'q1' ? 'first quarter' : r.key === 'mid' ? 'first half of the year' : 'year') + ', before your ' + when + ' one-to-one. You can tick these from ' + dml(r.opensOn) + '.' : 'Tick each one as you do it. Take your answers to your ' + when + ' one-to-one.';
    var items = r.checks.map(function (c) { return '<li style="border-top:1px solid #E3D8C6"><label class="esu-rck' + (st === 'locked' ? ' dis' : '') + '"><input type="checkbox" ' + (c.done ? 'checked ' : '') + (st === 'locked' || y.ticksOk === false ? 'disabled ' : '') + 'data-act="yr-rv" data-id="' + esc(c.id) + '">' + esc(c.text) + '</label></li>'; }).join('');
    var note = st === 'locked' ? 'Nothing to do yet.' : st === 'complete' ? 'All done. Jacob has been told your ' + r.name + ' review is ready, and you’ll talk it through at your ' + when + ' one-to-one.' : 'When every box is ticked, Jacob sees that your review is ready.';
    var later = (y.later || []).filter(function (l) { return l.key !== r.key && l.month > r.month; }).map(function (l) { return '<span style="display:inline-flex;gap:6px;align-items:center">' + LOCK + esc(l.name + ' review · end of ' + dayFmt(l.month + '-15', { month: 'long' }) + ' · opens ' + dml(l.opensOn)) + '</span>'; }).join('');
    return '<section class="esu-card" data-g="review" style="border-color:' + bd + '"><div class="esu-hd" style="margin-bottom:2px"><p class="esu-eye">Quarterly review · ' + esc(r.name) + '</p><span style="font-size:12.5px;font-weight:600;color:' + col + ';display:inline-flex;gap:6px;align-items:center"><i style="width:8px;height:8px;border-radius:50%;background:' + col + ';display:inline-block"></i>' + esc(tag) + '</span></div>' +
      '<h2 class="esu-h2" style="font-size:22px">End of ' + esc(when) + '</h2><p class="esu-muted" style="font-size:13px;margin:4px 0 8px">' + esc(intro) + '</p><ul style="list-style:none;margin:0;padding:0">' + items + '</ul>' +
      '<div style="background:' + (st === 'complete' ? '#E4EDE8' : '#F1E9DC') + ';border-radius:8px;padding:10px 12px;font-size:13px;margin-top:6px">' + esc(note) + '</div>' + (yrState.msg && yrState.msgFor === 'review' ? '<p class="esu-err" role="alert" style="margin-top:6px">' + esc(yrState.msg) + '</p>' : '') +
      (later ? '<div style="display:flex;flex-direction:column;gap:2px;margin-top:10px;font-size:12.5px;color:#5A5346">' + later + '</div>' : '') + '</section>';
  }
  function oneCard(w) {
    var o = w.home.oneToOne, win = o.window, city = myZone().split('/').pop().replace(/_/g, ' '), y = YR(w) || { oneToOne: {} };
    var inWindow = win && w.today >= win.from, bk = o.booked, sum = y.oneToOne.summary;
    var out = hd('One-to-one with Jacob', '<span class="esu-mono" style="text-align:right">45<br>MIN</span>');
    if (bk) {
      out += '<p style="margin:0 0 ' + (sum ? '2px' : '10px') + ';font-size:14px"><b>Booked:</b> ' + esc(dmyT(bk.start) + ' · ' + hmT(bk.start)) + ' your time · with Jacob</p>';
      var until = y.oneToOne.editableUntil ? dmyT(y.oneToOne.editableUntil) : '';
      var tpl = (y.oneToOne.template || []).join(' ');
      if (yrState.editing || (!sum && y.oneToOne.canEdit)) {
        out += '<div style="background:#FBEFD9;border:1px solid #E8C98A;border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px"><label for="esu-sum" style="display:flex;flex-direction:column;gap:6px;font-size:14px"><span><b>' + (sum ? 'Edit your summary' : 'Add your summary') + '</b>' + (sum ? '' : ' · needed before you meet') + '</span><span style="font-size:13px;color:#5A5346">What would you like to work on, discuss, or are you struggling with?' + (until ? ' Send it by ' + esc(until) + ' so Jacob can prepare.' : '') + '</span></label>' +
          '<textarea id="esu-sum" class="esu-in" rows="4" maxlength="2000" data-in="yr-text" placeholder="' + esc(tpl) + '" style="min-height:110px">' + esc(yrState.text) + '</textarea>' +
          (yrState.msg && yrState.msgFor === 'sum' ? '<p class="esu-err" role="alert">' + esc(yrState.msg) + '</p>' : '') + '<div class="esu-acts"><button type="button" class="esu-btn pri" data-act="yr-save-sum"' + (yrState.busy === 'sum' ? ' disabled' : '') + '>' + (yrState.busy === 'sum' ? 'Sending…' : 'Send to Jacob') + '</button>' + (sum ? '<button type="button" class="esu-btn out" data-act="yr-edit-cancel">Cancel</button>' : '') + '</div></div>';
      } else if (sum) {
        out += '<p class="esu-muted" style="font-size:13px;margin:0 0 10px">The Zoom link is in your email and on the booking.</p><div style="border-left:3px solid #2E5A4B;background:#F1E9DC;border-radius:0 8px 8px 0;padding:10px 12px;margin:0 0 10px"><p class="esu-eye" style="color:#2E5A4B;margin-bottom:4px">Your summary' + (sum.source === 'calendly' ? ' · from your booking' : '') + '</p><p class="esu-clamp" style="margin:0;font-size:14px;white-space:pre-wrap">' + esc(sum.text) + '</p></div>' +
          '<div class="esu-acts">' + (y.oneToOne.canEdit ? '<button type="button" class="esu-tk" data-act="yr-edit">Edit summary</button>' + (until ? '<span style="font-size:12.5px;color:#5A5346">You can edit it until ' + esc(until) + '.</span>' : '') : '<span style="font-size:12.5px;color:#5A5346">It’s close to your session, so this is now fixed. Message Jacob if something changed.</span>') + '</div>';
      } else out += '<p class="esu-muted" style="font-size:13px">Your session is close, so there’s no time to add a summary here. Message Jacob if you’d like him to know what you want to work on.</p>';
      out += '<div class="esu-acts" style="margin-top:10px">' + ext(o.bookingUrl, 'Change time', 'esu-btn out') + ext(o.messageUrl, 'Message Jacob', 'esu-btn out') + '</div>';
      return '<section class="esu-card" data-g="one">' + out + '</section>';
    }
    out += win ? '<p style="margin:0 0 4px;font-size:14px"><b>' + esc(dayFmt(win.from, { month: 'long' })) + ' window:</b> ' + esc(wd(win.from) + ' – ' + wd(win.to) + ' ' + dayFmt(win.to, { month: 'short' })) + ', UK evenings.</p><p class="esu-muted" style="font-size:13.5px;margin:0 0 12px">Times are shown in your time (' + esc(city) + ').</p>' : '<p class="esu-muted" style="margin-bottom:12px">The next window will be announced here.</p>';
    out += '<div style="background:#F1E9DC;border-radius:8px;padding:12px 14px;margin:0 0 12px"><p class="esu-eye" style="color:#5A5346;margin-bottom:4px">When you book, you’ll be asked</p><p style="margin:0;font-weight:600;font-size:14px">What would you like to work on, discuss, or are you struggling with?</p><p class="esu-muted" style="font-size:13px;margin-top:4px">A few lines is enough. Jacob reads it before you meet. Some prompts: what you want to work on · one thing from your practice log · where you are on the talk · where you are on the offering.</p></div>';
    if (o.slots && o.slots.length) out += '<div class="esu-slots">' + o.slots.map(function (sl) {
      return ext(sl.url, esc(dmyT(sl.start)) + ' · ' + esc(hmT(sl.start)), 'esu-slot');
    }).join('') + '</div>';
    else if (win && inWindow) out += '<p class="esu-muted" style="margin-bottom:12px">No open times are showing right now.</p>';
    out += '<div class="esu-acts">' + ext(o.bookingUrl, o.slots && o.slots.length ? 'More times' : inWindow ? 'Book your one-to-one' : 'See times', o.slots && o.slots.length ? 'esu-btn out' : 'esu-btn pri') + ext(o.messageUrl, 'Message Jacob', 'esu-btn out') + '</div>';
    return '<section class="esu-card" data-g="one">' + out + '</section>';
  }
  // Ticks save at once on the page and are rolled back with a message if the save fails
  function yrTick(id, kind) {
    var y = YR(state.data); if (!y) return;
    var s = y.allSteps.filter(function (x) { return x.id === id; })[0], c = y.review && y.review.checks.filter(function (x) { return x.id === id; })[0];
    var item = s || c; if (!item) return;
    var was = s ? s.status === 'done' : c.done, now = !was;
    var set = function (v) { if (s) { s.status = v ? 'done' : 'open'; var n = y.steps.filter(function (x) { return x.id === id; })[0]; if (n) n.status = s.status; if (v) yrState.keep[id] = true; else delete yrState.keep[id]; y.doneCount += v ? 1 : -1; if (y.lanes) y.lanes.doneCount += v ? 1 : -1; } else { c.done = v; y.review.ticked += v ? 1 : -1; y.review.state = y.review.ticked === y.review.total ? 'complete' : 'open'; } };
    set(now); yrState.msg = ''; yrState.busy = ''; render();
    call('/api/member/year/tick', { id: id, done: now, today: localToday() }).catch(function (e) { set(was); yrState.msg = e.message || 'That didn’t save. Please try again.'; yrState.msgFor = s ? 'tick' : 'review'; render(); });
  }
  function yrClick(a, t, e) {
    var y = YR(state.data);
    if (a === 'yr-tick' || a === 'yr-rv') { yrTick(t.dataset.id); return; }
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
    if (isRefl()) return reflHtml();
    if (isMentor()) return mentorHtml();
    if (state.error && !state.data) return '<h1 class="esu-h1">Sahṛdaya Upāya</h1><p class="esu-muted" style="margin-top:8px">' + esc(state.error) + '</p>';
    var w = state.data, name = (w && w.greeting.firstName) || state.first;
    var head = function (sub, right) { return '<div class="esu-eye">Sahṛdaya Upāya · Teacher formation in SLBT</div><div class="esu-head"><div><h1 class="esu-h1">Your formation' + (name ? ', <em>' + esc(name) + '</em>' : '') + '.</h1>' + (sub ? '<div class="esu-sub">' + sub + '</div>' : '') + '</div>' + (right || '') + '</div>'; };
    if (!w) return head('Opening your page…') + '<div class="esu-cols"><div class="esu-c1"><div class="esu-sk"></div><div class="esu-sk"></div></div><div class="esu-c2"><div class="esu-sk"></div></div></div>';
    var g = w.greeting, im = w.home.immersion, f = w.formation;
    var sub = esc(dayFmt(w.today, { weekday: 'long', day: 'numeric', month: 'long' })) + (im ? ' · ' + (im.happening ? 'Immersion ' + im.n + ' is this weekend' : im.daysTo + ' days to Immersion ' + im.n) : '') + ' · week ' + g.week + ' of ' + esc(g.seasonTitle);
    var hs = w.home.hours, tot = f ? '<div class="esu-tot"><b>' + hs.confirmed + '</b> <span>confirmed · ' + hs.pending + ' pending · of ' + f.target + ' hrs</span><div class="esu-bar"><i style="width:' + Math.min(100, Math.round(f.total / f.target * 100)) + '%"></i></div></div>' : '';
    var manual = '<a class="esu-btn out" href="' + MANUAL + '" target="_blank" rel="noopener">Open the Manual</a>';
    return head(sub, '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px">' + manual + tot + '</div>') +
      (w.unavailable.length ? '<p class="esu-note" role="status">Some things couldn’t be loaded just now (' + esc(w.unavailable.join(', ')) + '). The rest is up to date.</p>' : '') +
      (state.msg && !state.modal ? '<p class="esu-err" role="alert">' + esc(state.msg) + '</p>' : '') +
      '<div class="esu-tabs" role="tablist"><button type="button" role="tab" aria-selected="' + (state.tab === 'formation') + '" data-act="tab" data-tab="formation">Formation</button><button type="button" role="tab" aria-selected="' + (state.tab === 'room') + '" data-act="tab" data-tab="room">Room</button></div>' +
      evergreen(w) + '<div class="esu-cols"><div class="esu-c1">' + immersionCard(w) + integrateCard(w) + cosignCard(w) + stepsCard(w) + lanesCard(w) + roomCard(w) + hoursCard(w) + feedbackCard(w) + '</div><div class="esu-c2">' + guideCard(w) + monthCard(w) + reviewCard(w) + assignCard(w) + oneCard(w) + podsCard(w) + partnerCard(w) + '</div></div>' + modal(w) + booksModal(w) + allStepsModal(w);
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
  function render() { if (root && document.body.contains(root)) { root.setAttribute('data-tab', state.tab); root.innerHTML = html(); var ch = root.querySelector('.esu-chat'); if (ch) ch.scrollTop = ch.scrollHeight; } }
  function onInput(e) {
    var k = e.target && e.target.dataset && e.target.dataset.in;
    if (!k) return;
    if (k.indexOf('rf-') === 0) { var q = state.rf; if (k === 'rf-title') q.form.title = e.target.value; else if (k === 'rf-body') q.form.body = e.target.value; else if (k === 'rf-ctext') q.ctext = e.target.value; else if (k === 'rf-reply') q.reply = e.target.value; else if (k.indexOf('rf-tick:') === 0) q.ticked[k.slice(8)] = e.target.checked; return; }
    if (k === 'say') { state.say = e.target.value; return; }
    if (k === 'ask') { state.ask = e.target.value; return; }
    if (k === 'yr-text') { yrState.text = e.target.value; return; }
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
    if (a === 'tab') { state.tab = t.dataset.tab; render(); window.scrollTo && root.scrollIntoView && root.scrollIntoView({ block: 'start' }); }
    else if (a === 'room') { state.room = t.dataset.tab; render(); }
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
      return '<button type="button" class="esu-ri' + (x.id === r.id ? ' on' : '') + '" data-act="rf-open" data-id="' + esc(x.id) + '"><span class="esu-rim"><span class="esu-eye" style="color:#5A5346">' + esc(rfMonth(x.month)) + '</span><span class="esu-rist">' + (x.unread ? '<i class="esu-dotn" aria-label="New"></i>' : '') + esc(statusLabel(x)) + '</span></span><b>' + esc(x.title || 'Untitled') + '</b><span class="esu-muted" style="font-size:13px">' + esc(x.mine ? 'You' : x.author) + ' · ' + (x.comments ? x.comments + (x.comments === 1 ? ' comment' : ' comments') : 'no comments yet') + '</span></button>';
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
        (d.status === 'draft' ? '<button type="button" class="esu-btn out" data-act="rf-discard">Delete this draft</button>' : '') + '</div>' +
        '<p class="esu-muted" style="font-size:13px;margin-top:8px">' + (d.status === 'shared' ? 'Posts version ' + d.versions.filter(function (x) { return x.shared; }).length + ' to the Reflections in Sādhana School. The cohort’s comments stay here.' : d.status === 'posted' ? 'The cohort’s feedback and your earlier versions stay here. You can take the post down from Sādhana School at any time.' : 'Only you can see this draft until you share it with the cohort.') + '</p></div>';
    }
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
      rfSteps() + (r.list === null && r.err ? rfFlash() : '') + '<div class="esu-rcols">' + rfList() + (r.mode === 'edit' ? rfEditor() : rfReader()) + '</div>' + rfPostModal();
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
  // The Sahṛdaya Upāya formation manual (the manual tab on the site), linked at the top of the mentee page
  var MANUAL = 'https://www.embodiedphilosophy.com/school/mentee-year?tab=manual';
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
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root && document.body.contains(root) && (state.books || state.modal || state.rf.post || yrState.all)) { yrState.all = false; state.books = false; state.modal = null; state.rf.post = false; render(); } });

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css();
    state.data = cached();
    // A mentee seen before this session: take the space at once so the hub doesn't flash up first
    if (store(SKEY)) { try { var s = JSON.parse(store(SKEY)); if (s.until > Date.now()) { state.admin = !!s.admin; setMentee(s.ok ? 'yes' : 'no'); } } catch (e) {} }
    signIn().then(function () {
      setMentee(state.ok ? 'yes' : 'no');
      if (!state.ok) { unmount(); return; }
      mount(); render(); loadPods(); return isRefl() ? startRefl() : isMentor() ? loadMentor() : load();
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
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      if (!PAGE.test(location.pathname)) { unmount(); return; }
      var moved = location.pathname !== lastPath; lastPath = location.pathname;
      if (!started) start(); else { mount(); if (root && isRefl() && state.rf.list === null && state.ok === true) startRefl(); else if (root && isMentor() && state.mt.data === null && !state.mt.err) loadMentor().then(render); else if (root && moved) render(); }
    }, 250);
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', function () { if (!PAGE.test(location.pathname)) unmount(); });
})();
