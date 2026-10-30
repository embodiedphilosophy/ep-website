/* Embodied Philosophy · Practice for Circle (ss.embodiedphilosophy.com/c/daily-practice)
   Loaded by public/circle/today.js (no extra Circle snippet needed). Three parts named for the three parts of kriyā-yoga:
     I · Tapas              today's sit (everyone): timer, log, streak, this week
     II · Svādhyāya         this week's readings, with a tick for each (Sādhana School)
     III · Īśvara-praṇidhāna  the Diary to the Divine: autosaving, private, optionally shared to SS Reflections (Sādhana School)
   Everyone else sees the sit, their sit totals and one locked card about the rest. The server decides who is in Sādhana School
   and only sends the readings, prompt and diary to them (/api/practice/summary, lib/practice/). Unsent writing is also kept on this device. */
(function () {
  if (window.__epPractice) return; window.__epPractice = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/daily-practice\/?$/;
  var state = { session: null, first: '', data: null, error: '', len: 20, timer: null, form: false, logDay: '', minutes: '20', busy: '', msg: '', text: '', saveState: '', diaryErr: '', pop: false, shareErr: {} };
  var root = null, saveT = null, tick = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function keep(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function localToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function niceDate(s) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return s; } }
  function longDate() { try { return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return ''; } }
  function entryDate(iso) { try { return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return ''; } }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function asParam() { var a = (location.search.match(/[?&]as=([a-z_]+)/) || [])[1]; return a ? '&as=' + a : ''; }

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
  // Shares the Today page's session (same tab storage), or signs in with Circle's identity token
  function signIn() {
    var saved = store('ep_today_session');
    if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now()) { state.session = s.session; state.first = s.first || ''; return Promise.resolve(); } } catch (e) {} }
    return waitForUser(25).then(function (u) { return api('/api/member/session', { method: 'POST', body: { identityToken: u.identityToken } }); }).then(function (r) {
      state.session = r.session; state.first = r.firstName || '';
      store('ep_today_session', JSON.stringify({ session: r.session, tier: r.tier && r.tier.tier, seasons: (r.tier && r.tier.seasons) || [], offer: r.offer || null, admin: !!r.admin, first: state.first, until: Date.now() + 10 * 60 * 60 * 1000 }));
    });
  }

  function load() {
    state.error = '';
    return api('/api/practice/summary?today=' + localToday() + asParam()).then(function (d) {
      state.data = d;
      var local = keep('ep_diary_draft'), mine = d.draft && d.draft.body || '';
      try { var l = local && JSON.parse(local); state.text = l && l.text && l.text !== mine && l.at > Date.parse(d.draft && d.draft.updatedAt || 0) ? l.text : mine; } catch (e) { state.text = mine; }
    }).catch(function (e) { state.error = e.message; if (e.status === 401) store('ep_today_session', ''); });
  }

  // ---- styles (the colours are Today's) ----
  function css() {
    if (document.getElementById('epq-css')) return;
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=JetBrains+Mono:wght@500&display=swap'; document.head.appendChild(l); }
    var s = document.createElement('style'); s.id = 'epq-css';
    s.textContent = [
      '.epq{container-type:inline-size;font-family:inherit;color:#2B2620;max-width:1120px;margin:0 auto;padding:28px 20px 64px;line-height:1.5;background:#F4EEE3}',
      '.epq *{box-sizing:border-box}.epq a{color:#A5402A;text-underline-offset:3px}.epq :focus-visible{outline:2px solid #A5402A;outline-offset:2px}',
      '.epq-mono{font:500 11px/1.3 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#6B6259}',
      '.epq-h1{margin:6px 0 4px;font:500 46px/1.05 "Cormorant Garamond",Georgia,serif}.epq-h1 em{color:#A5402A}',
      '.epq-mut{color:#6B6259;font-size:14px}',
      '.epq-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;margin-top:22px}',
      '.epq-main,.epq-side{display:flex;flex-direction:column;gap:22px;min-width:0}',
      '@container (max-width:760px){.epq-grid{grid-template-columns:minmax(0,1fr)}.epq-h1{font-size:36px}}','@media (max-width:520px){.epq{padding:20px 14px 56px}.epq-sec{padding:16px}}',
      '.epq-sec{background:#FBF7F0;border:1px solid #E4DACB;border-radius:14px;padding:20px}',
      '.epq-sh{display:flex;align-items:center;gap:12px;margin-bottom:14px}.epq-sh i{flex:1;height:1px;background:#EAE1D3}',
      '.epq-h2{margin:0 0 6px;font:500 26px/1.15 "Cormorant Garamond",Georgia,serif}',
      '.epq-sit{background:#1F2D27;color:#F4EEE3;border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:12px}.epq-sit .epq-mono{color:#D4A24C}.epq-sit .epq-mut{color:#B9C2B8}',
      '.epq-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.epq-btn,.epq-pill,.epq-q{min-height:44px;min-width:44px;border-radius:999px;border:1px solid #E4DACB;background:#FBF7F0;color:#2B2620;font:inherit;font-size:14px;padding:8px 16px;cursor:pointer}',
      '.epq-btn{background:#A5402A;border-color:#A5402A;color:#fff}.epq-btn[disabled]{opacity:.55;cursor:default}',
      '.epq-sit .epq-pill{background:#26362F;border-color:#3A4B43;color:#F4EEE3}.epq-sit .epq-pill[aria-pressed=true]{background:#D4A24C;border-color:#D4A24C;color:#1F2D27}',
      '.epq-sit .epq-btn{background:#D4A24C;border-color:#D4A24C;color:#1F2D27}.epq-sit .epq-q{background:transparent;border-color:#3A4B43;color:#F4EEE3}',
      '.epq-link{background:none;border:0;color:#D4A24C;text-decoration:underline;min-height:44px;font:inherit;font-size:14px;cursor:pointer;padding:0 6px}',
      '.epq-week{display:flex;flex-wrap:wrap;gap:4px}.epq-day{width:44px;height:44px;border-radius:50%;border:1px solid #3A4B43;background:transparent;color:#F4EEE3;font:inherit;cursor:pointer}.epq-day.done{background:#D4A24C;color:#1F2D27;border-color:#D4A24C}.epq-day.today{border-color:#F4EEE3}.epq-day[disabled]{opacity:.35;cursor:default}',
      '.epq-big{font:500 40px/1 "Cormorant Garamond",Georgia,serif;color:#D4A24C}',
      '.epq-form{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}.epq-form label{display:flex;flex-direction:column;gap:4px;font-size:13px}.epq-in{min-height:44px;border-radius:8px;border:1px solid #CFC3B0;padding:8px 10px;font:inherit;width:110px;background:#fff;color:#2B2620}',
      '.epq-bar{height:6px;border-radius:3px;background:#EAE1D3;overflow:hidden;margin:8px 0}.epq-bar span{display:block;height:100%;background:#2F5A47}',
      '.epq-rd{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid #EAE1D3}',
      '.epq-chk{flex:none;width:44px;height:44px;border-radius:10px;border:1px solid #CFC3B0;background:#fff;cursor:pointer;font-size:18px;color:#fff}.epq-chk[aria-pressed=true]{background:#2F5A47;border-color:#2F5A47}',
      '.epq-kind{font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.08em;color:#6B6259}',
      '.epq-prompt{font:italic 500 22px/1.3 "Cormorant Garamond",Georgia,serif;margin:4px 0 12px}',
      '.epq-ta{width:100%;min-height:200px;border:1px solid #CFC3B0;border-radius:10px;padding:14px;font:500 20px/1.5 "Cormorant Garamond",Georgia,serif;background:#fff;color:#2B2620;resize:vertical}',
      '.epq-ent{border-top:1px solid #EAE1D3;padding:14px 0}.epq-ent p{margin:6px 0;white-space:pre-wrap;font:500 18px/1.5 "Cormorant Garamond",Georgia,serif}',
      '.epq-tag{font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:999px;background:#EAE1D3;color:#6B6259}.epq-tag.on{background:#E3EEE7;color:#2F5A47}',
      '.epq-err{color:#A5402A;font-size:14px}.epq-ok{color:#2F5A47;font-size:14px}',
      '.epq-lock{border:1px dashed #CFC3B0;border-radius:12px;padding:18px;background:#FBF7F0}',
      '.epq-stat{display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #EAE1D3;font-size:14px}.epq-stat b{font-weight:600}',
      '.epq-pop{position:fixed;inset:0;background:rgba(31,45,39,.55);display:flex;align-items:center;justify-content:center;z-index:2147483000;padding:16px}.epq-pop>div{background:#FBF7F0;border-radius:14px;padding:24px;max-width:420px;width:100%}',
      '@media (prefers-reduced-motion:reduce){.epq *{transition:none!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  // ---- sections ----
  function head(t, tag) { return '<div class="epq-sh"><span class="epq-mono">' + t + '</span><i></i><span class="epq-mono">' + tag + '</span></div>'; }

  function sitHtml() {
    var p = state.data && state.data.sit, out = '<section class="epq-sec" aria-labelledby="epq-tapas">' + head('I · Tapas', 'For everyone') + '<div class="epq-sit"><span class="epq-mono">Today’s sit</span>' +
      '<h2 id="epq-tapas" class="epq-h2" style="margin:0">Haṃsa <em style="color:#B9C2B8">· Sahṛdaya Meditation</em></h2>';
    if (state.timer) {
      var left = Math.max(0, Math.ceil((state.timer.end - Date.now()) / 1000)), m = Math.floor(left / 60), sec = left % 60;
      out += '<div class="epq-big" role="timer" aria-live="off">' + m + ':' + String(sec).padStart(2, '0') + '</div><div class="epq-row"><button type="button" class="epq-q" data-act="stop">Stop</button></div>';
    } else {
      out += '<div class="epq-row" role="group" aria-label="Length">' + [10, 20, 30, 45].map(function (n) { return '<button type="button" class="epq-pill" data-act="len" data-len="' + n + '" aria-pressed="' + (state.len === n) + '">' + n + 'm</button>'; }).join('') +
        '<button type="button" class="epq-btn" data-act="begin">Begin · ' + state.len + ' min</button></div>';
    }
    if (!p) return out + '<span class="epq-mut">' + esc(state.error || 'Loading…') + '</span></div></section>';
    out += '<div class="epq-row"><span class="epq-big">' + p.streak + '</span><span class="epq-mut">day' + (p.streak === 1 ? '' : 's') + ' in a row</span>' +
      '<button type="button" class="epq-link" data-act="form" data-day="' + localToday() + '" aria-expanded="' + !!state.form + '">' + (p.loggedToday ? 'Logged today · edit' : 'Already sat today? Log it') + '</button>' +
      '<button type="button" class="epq-link" data-act="form" data-day="' + addDays(localToday(), -1) + '">Log an earlier day</button></div>';
    var wk = (p.grid && p.grid[p.grid.length - 1]) || [], L = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    out += '<div><span class="epq-mono">This week</span><div class="epq-week" role="list" style="margin-top:6px">' + wk.map(function (c, i) {
      var said = c.state === 'done' ? 'practised' : c.state === 'today' ? 'today, not yet' : c.state === 'future' ? 'still to come' : 'not practised';
      return '<div role="listitem"><button type="button" class="epq-day ' + (c.state === 'done' ? 'done' : c.state === 'today' ? 'today' : '') + '" data-act="form" data-day="' + esc(c.day) + '"' + (c.state === 'future' ? ' disabled' : '') + ' aria-label="' + esc(niceDate(c.day)) + ', ' + said + '">' + (c.state === 'done' ? '✓' : L[i]) + '</button></div>';
    }).join('') + '</div></div>';
    if (state.form) {
      out += '<form class="epq-form" data-form="log"><label>Minutes on ' + esc(state.logDay === localToday() ? 'today' : niceDate(state.logDay)) + '<input class="epq-in" name="minutes" type="number" inputmode="numeric" min="1" max="600" value="' + esc(state.minutes) + '"></label>' +
        '<button class="epq-btn" type="submit"' + (state.busy === 'log' ? ' disabled' : '') + '>' + (state.busy === 'log' ? 'Saving…' : 'Save') + '</button><button type="button" class="epq-q" data-act="form-close">Close</button></form>';
    }
    if (state.msg) out += '<span class="epq-mut" role="status">' + esc(state.msg) + '</span>';
    return out + '</div></section>';
  }

  function readingsHtml() {
    var d = state.data, plan = d.plan, out = '<section class="epq-sec" aria-labelledby="epq-sva">' + head('II · Svādhyāya', 'Sādhana School') +
      '<h2 id="epq-sva" class="epq-h2">This week’s readings</h2>';
    if (!plan || !plan.readings.length) return out + '<p class="epq-mut">This week’s readings will appear here soon.</p></section>';
    var pct = Math.round(plan.done / plan.readings.length * 100);
    out += '<span class="epq-mut">Week ' + esc(plan.week) + (d.season ? ' · ' + esc(d.season.title.replace(/^[^·]*·\s*/, '')) : '') + ' · ' + plan.done + ' of ' + plan.readings.length + ' read</span>' +
      '<div class="epq-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="width:' + pct + '%"></span></div>';
    plan.readings.forEach(function (r) {
      out += '<div class="epq-rd"><button type="button" class="epq-chk" data-act="read" data-id="' + esc(r.id) + '" aria-pressed="' + !!r.read + '" aria-label="Mark ' + esc(r.title) + ' as read">' + (r.read ? '✓' : '') + '</button>' +
        '<div style="flex:1;min-width:0"><span class="epq-kind">' + esc(r.kind) + '</span><div><b>' + esc(r.title) + '</b></div>' + (r.meta ? '<span class="epq-mut">' + esc(r.meta) + '</span>' : '') + '</div>' +
        (r.url ? '<a class="epq-q" style="display:inline-flex;align-items:center;text-decoration:none" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.action) + ' →</a>' : '') + '</div>';
    });
    return out + '</section>';
  }

  function diaryHtml() {
    var d = state.data, plan = d.plan, out = '<section class="epq-sec" id="diary" aria-labelledby="epq-dd">' + head('III · Īśvara-praṇidhāna', 'Sādhana School') +
      '<h2 id="epq-dd" class="epq-h2">Diary to the Divine</h2><span class="epq-mono">Your Inner Travelogue · private</span>';
    if (plan && plan.prompt) out += '<p class="epq-prompt">' + esc(plan.prompt) + '</p>';
    out += '<label class="epq-mut" for="epq-text" style="display:block;margin:8px 0 6px">Write to the Divine. Only you can see this until you choose to share it.</label>' +
      '<textarea id="epq-text" class="epq-ta" maxlength="20000" data-in="text">' + esc(state.text) + '</textarea>' +
      '<div class="epq-row" style="margin-top:10px"><button type="button" class="epq-btn" data-act="save"' + (state.busy ? ' disabled' : '') + '>Save to my diary</button>' +
      (d.sharing ? '<button type="button" class="epq-q" data-act="save-post"' + (state.busy ? ' disabled' : '') + '>Save &amp; post to SS Reflections</button>' : '') +
      '<span class="epq-mut" role="status">' + esc(state.saveState) + '</span></div>' + (state.diaryErr ? '<p class="epq-err" role="alert">' + esc(state.diaryErr) + '</p>' : '');
    if (!d.sharing) out += '<p class="epq-mut">Sharing to SS Reflections will open soon. Until then your entries stay private.</p>';
    if (d.entries && d.entries.length) {
      out += '<div style="margin-top:16px"><span class="epq-mono">Your entries</span>' + d.entries.map(function (e) {
        return '<div class="epq-ent"><div class="epq-row"><span class="epq-mut">' + esc(entryDate(e.at)) + '</span><span class="epq-tag' + (e.posted ? ' on' : '') + '">' + (e.posted ? 'Shared in SS Reflections' : 'Private') + '</span>' +
          (e.posted && e.postUrl ? '<a href="' + esc(e.postUrl) + '">View post</a>' : '') +
          (!e.posted && d.sharing ? '<button type="button" class="epq-q" data-act="post" data-id="' + esc(e.id) + '"' + (state.busy === e.id ? ' disabled' : '') + '>Post to SS Reflections</button>' : '') + '</div>' +
          '<p>' + esc(e.body) + '</p>' + (state.shareErr[e.id] ? '<span class="epq-err" role="alert">' + esc(state.shareErr[e.id]) + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    }
    return out + '</section>';
  }

  function lockedHtml() {
    return '<section class="epq-sec" aria-labelledby="epq-lock">' + head('II · Svādhyāya &nbsp;·&nbsp; III · Īśvara-praṇidhāna', 'Sādhana School') +
      '<div class="epq-lock"><h2 id="epq-lock" class="epq-h2">Readings, and a diary to the Divine</h2><p class="epq-mut">Each week of a season brings its readings, a prompt, and a private diary where you write to the Divine, and can share an entry with the school when you wish.</p>' +
      '<div class="epq-row"><button type="button" class="epq-btn" data-act="pop">Join Sādhana School</button><a class="epq-q" style="display:inline-flex;align-items:center;text-decoration:none" href="' + esc(state.data.join.landing) + '" target="_blank" rel="noopener">What’s in a season?</a></div></div></section>';
  }

  function sideHtml() {
    var d = state.data, t = d.totals || {}, out = '<aside class="epq-side" aria-label="Your season">';
    out += '<section class="epq-sec"><span class="epq-mono">' + (d.isSS ? 'Your season' : 'Your sits') + '</span>' +
      '<div class="epq-stat"><span>Sits logged</span><b>' + (t.sits || 0) + '</b></div><div class="epq-stat"><span>Practice hours</span><b>' + (t.hours || 0) + '</b></div>';
    if (d.isSS) out += '<div class="epq-stat"><span>Readings done</span><b>' + (t.readingsDone || 0) + ' of ' + (t.readingsTotal || 0) + '</b></div><div class="epq-stat"><span>Diary entries</span><b>' + (t.diary || 0) + '</b></div>';
    out += '</section>';
    if (d.isSS && d.season) out += '<section class="epq-sec"><span class="epq-mono">SS Reflections</span><p class="epq-mut" style="margin:6px 0">Read what others in the school have shared.</p><a href="/c/' + esc(d.season.hubSlug) + '?tab=reflections">Open SS Reflections →</a></section>';
    return out + '</aside>';
  }

  function popHtml() {
    var j = state.data.join;
    return '<div class="epq-pop" data-act="pop-close"><div role="dialog" aria-modal="true" aria-labelledby="epq-pt"><h2 id="epq-pt" class="epq-h2">Join Sādhana School</h2><p class="epq-mut">A season of live Wednesday sessions, weekly readings and the diary. You can join for one season or the year.</p>' +
      '<div class="epq-row">' + (j.enrol ? '<a class="epq-btn" style="display:inline-flex;align-items:center;text-decoration:none;color:#fff" href="' + esc(j.enrol) + '" target="_blank" rel="noopener">Join with Circle checkout</a>' : '') +
      '<a class="epq-q" style="display:inline-flex;align-items:center;text-decoration:none" href="' + esc(j.landing) + '" target="_blank" rel="noopener">Read about it first</a><button type="button" class="epq-q" data-act="pop-close">Close</button></div></div></div>';
  }

  function render() {
    if (!root) return;
    var a = document.activeElement, keepFocus = a && root.contains(a) && a.id === 'epq-text' ? { s: a.selectionStart, e: a.selectionEnd } : null;
    var d = state.data, out;
    if (!d) out = '<p class="epq-mut" role="status">' + esc(state.error || 'Loading your practice…') + '</p>';
    else {
      var wk = d.isSS && d.plan ? ' · WEEK ' + d.plan.week : d.isSS && d.week ? ' · WEEK ' + d.week : '';
      out = '<header><span class="epq-mono">Practice · Sādhana School' + (d.season ? ' · ' + esc(d.season.short.split(' ')[0]) : '') + esc(wk) + '</span><h1 class="epq-h1">Your <em>practice.</em></h1><span class="epq-mut">' + esc(longDate()) + '</span></header>' +
        '<div class="epq-grid"><div class="epq-main">' + sitHtml() + (d.isSS ? readingsHtml() + diaryHtml() : lockedHtml()) + '</div>' + sideHtml() + '</div>' + (state.pop ? popHtml() : '');
    }
    root.innerHTML = out;
    if (keepFocus) { var ta = root.querySelector('#epq-text'); if (ta) { ta.focus(); try { ta.setSelectionRange(keepFocus.s, keepFocus.e); } catch (e) {} } }
  }

  // ---- actions ----
  function refresh() { return api('/api/practice/summary?today=' + localToday() + asParam()).then(function (d) { state.data = d; }).catch(function () {}); }
  function stopTimer() { if (tick) { clearInterval(tick); tick = null; } state.timer = null; }
  function logMinutes(day, minutes, add) {
    return api('/api/member/practice', { method: 'POST', body: { today: localToday(), day: day, minutes: minutes, add: !!add } }).then(refresh);
  }
  function begin() {
    state.msg = ''; state.timer = { end: Date.now() + state.len * 60000, len: state.len }; render();
    tick = setInterval(function () {
      if (!state.timer) return;
      if (Date.now() >= state.timer.end) {
        var n = state.timer.len; stopTimer();
        logMinutes(localToday(), n, true).then(function () { state.msg = 'Sit complete · ' + n + ' min logged'; render(); }).catch(function () { state.msg = 'Your sit finished, but we couldn’t log it. Use “Log it” to add it.'; render(); });
      } else render();
    }, 1000);
  }

  function stash() { keep('ep_diary_draft', state.text ? JSON.stringify({ text: state.text, at: Date.now() }) : null); }
  function autosave() {
    if (!state.data || !state.data.isSS) return;
    stash(); clearTimeout(saveT); state.saveState = 'Writing…';
    saveT = setTimeout(flush, 1500);
  }
  function flush() {
    clearTimeout(saveT); saveT = null;
    if (!state.data || !state.data.isSS) return Promise.resolve();
    var text = state.text;
    return api('/api/practice/diary/draft', { method: 'PUT', body: { body: text, today: localToday() } })
      .then(function () { state.saveState = 'Draft saved'; var s = root && root.querySelector('[role=status]'); if (s && !state.busy) s.textContent = ''; setStatus(); })
      .catch(function (e) { state.saveState = 'Not saved yet — ' + (e.status === 401 ? 'please refresh the page' : 'we’ll keep trying; your words are kept on this device'); setStatus(); });
  }
  function setStatus() { var el = root && root.querySelector('.epq-row [role=status]'); if (el && el.parentNode.querySelector('[data-act=save]')) el.textContent = state.saveState; }

  function save(post) {
    if (!state.text.trim()) { state.diaryErr = 'Write something before saving.'; render(); return; }
    clearTimeout(saveT); state.busy = 'save'; state.diaryErr = ''; state.saveState = ''; render();
    api('/api/practice/diary/save', { method: 'POST', body: { body: state.text, post: !!post, today: localToday() } }).then(function (r) {
      state.text = ''; keep('ep_diary_draft', null);
      state.saveState = r.shared ? 'Saved and shared in SS Reflections' : 'Saved to your diary · private';
      if (r.error) state.diaryErr = r.error;
      return refresh();
    }).catch(function (e) { state.diaryErr = e.message; }).then(function () { state.busy = ''; render(); });
  }
  function postEntry(id) {
    state.busy = id; state.shareErr[id] = ''; render();
    api('/api/practice/diary/' + encodeURIComponent(id) + '/post', { method: 'POST', body: {} }).then(function (r) { if (r.error) state.shareErr[id] = r.error; return refresh(); })
      .catch(function (e) { state.shareErr[id] = e.message; }).then(function () { state.busy = ''; render(); });
  }
  function toggleRead(id) {
    var plan = state.data.plan; if (!plan) return;
    var r = plan.readings.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    function sync() { plan.done = plan.readings.filter(function (x) { return x.read; }).length; if (state.data.totals) state.data.totals.readingsDone = Math.max(0, (state.data.totals.readingsDone || 0) + (r.read ? 1 : -1)); }
    r.read = !r.read; sync(); render();
    api('/api/practice/readings/' + encodeURIComponent(id), { method: 'PUT', body: { read: r.read } }).then(refresh).then(render).catch(function () { r.read = !r.read; sync(); render(); });
  }

  function onClick(e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var a = t.dataset.act;
    if (a === 'pop-close') { if (t.classList.contains('epq-pop') && e.target !== t) return; state.pop = false; render(); return; }
    if (a === 'len') { state.len = Number(t.dataset.len); render(); }
    else if (a === 'begin') begin();
    else if (a === 'stop') { stopTimer(); render(); }
    else if (a === 'form') { state.form = true; state.logDay = t.dataset.day; state.msg = ''; state.minutes = '20'; render(); var i = root.querySelector('[name=minutes]'); if (i) i.focus(); }
    else if (a === 'form-close') { state.form = false; render(); }
    else if (a === 'read') toggleRead(t.dataset.id);
    else if (a === 'save') save(false);
    else if (a === 'save-post') save(true);
    else if (a === 'post') postEntry(t.dataset.id);
    else if (a === 'pop') { state.pop = true; render(); var c = root.querySelector('.epq-pop .epq-q:last-child'); if (c) c.focus(); }
  }
  function onInput(e) { if (e.target.dataset && e.target.dataset.in === 'text') { state.text = e.target.value; autosave(); } }
  function onFocusOut(e) { if (e.target && e.target.id === 'epq-text' && saveT) flush(); }
  function onSubmit(e) {
    var f = e.target.closest('[data-form=log]'); if (!f) return;
    e.preventDefault();
    var m = parseInt(f.elements.minutes.value, 10);
    if (!(m > 0)) return;
    state.busy = 'log'; render();
    logMinutes(state.logDay, m, false).then(function () { state.form = false; state.msg = 'Logged · ' + m + ' min on ' + (state.logDay === localToday() ? 'today' : niceDate(state.logDay)); })
      .catch(function (er) { state.msg = er.message; }).then(function () { state.busy = ''; render(); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.pop) { state.pop = false; render(); } });

  function pageContainer() {
    var all = document.querySelectorAll('div');
    for (var i = 0; i < all.length; i++) { var c = String(all[i].className || ''); if (c.indexOf('container-type:inline-size') >= 0 && c.indexOf('bg-secondary') >= 0) return all[i]; }
    return null;
  }
  function mount() {
    if (!PAGE.test(location.pathname)) return;
    if (root && document.body.contains(root)) return;
    var box = pageContainer(); if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    root = document.createElement('div'); root.className = 'epq'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Practice');
    root.addEventListener('click', onClick); root.addEventListener('input', onInput); root.addEventListener('submit', onSubmit); root.addEventListener('focusout', onFocusOut);
    box.insertBefore(root, box.firstChild);
    render(); hideBanner();
    if (location.hash === '#diary') setTimeout(function () { var el = root && root.querySelector('#diary'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 600);
  }

  // Circle puts the space's own banner ("Daily practice" and its New post button) above the page. Like Today, the Practice page
  // is a dashboard, so it goes: found by its "New post" button (or the space title), then the largest banner-sized block around it in
  // the content column that doesn't hold our page. Put back when the member moves to another space (Circle reuses it there).
  var hidden = [];
  function bannerOf(el, box) {
    var n = el;
    while (n.parentElement && n.parentElement !== document.body && !n.parentElement.contains(root)) n = n.parentElement;
    if (!n || n.contains(root) || n === document.body) return null;
    var r = n.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (r.height < 20 || r.height > 220 || r.width > b.width + 120 || r.width < 200 || r.left < b.left - 120 || r.right > b.right + 120) return null;
    return n;
  }
  function hideBanner() {
    if (!root || !document.body.contains(root) || !root.parentElement) return;
    var box = root.parentElement, title = String(document.title || '').split(/\s[·|–—-]\s/)[0].trim();
    var c = document.querySelectorAll('button, a, h1, h2');
    for (var i = 0; i < c.length; i++) {
      var el = c[i], t = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      if (root.contains(el) || !(t === 'New post' || (title && t === title && /^H[12]$/.test(el.tagName)))) continue;
      var n = bannerOf(el, box);
      if (n && n.style.display !== 'none') { n.style.display = 'none'; hidden.push(n); }
    }
  }
  function restoreBanner() { while (hidden.length) hidden.pop().style.display = ''; }

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css();
    signIn().then(load).catch(function () { state.error = 'Please sign in to Circle to open your practice.'; }).then(function () { mount(); render(); });
  }
  start();
  // Circle is a single-page app: mount when someone navigates to the page
  var t = null;
  new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; start(); if (started) mount(); if (PAGE.test(location.pathname)) hideBanner(); else restoreBanner(); }, 300); }).observe(document.body, { childList: true, subtree: true });
})();
