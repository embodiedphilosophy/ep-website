/* Embodied Philosophy · Practice Portfolio for Circle (ss.embodiedphilosophy.com/c/portfolio)
   Loaded by public/circle/today.js (no extra Circle snippet needed). Draws the member's portfolio in place of the
   space's content: today's page (sittings, quality, the greater body of sādhana, four reflections, everyday
   awareness, a closing dedication), the weekly reflection, and past pages.
   Private by default. Mentees can share a page with Jacob; only shared pages reach the mentor view.
   Saving a daily page with practice times also logs the day for the streak.
   Data: /api/member/portfolio (lib/member/portfolio.js). Unsent writing is kept on this device as a draft. */
(function () {
  if (window.__epPortfolio) return; window.__epPortfolio = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/portfolio\/?$/;
  var state = { session: null, first: '', view: null, error: '', tab: 'day', day: '', draft: null, wdraft: null, saving: false, saved: '', formErr: '' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function keep(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function localToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function longDay(s) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }); } catch (e) { return s; } }
  function shortDay(s) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', timeZone: 'UTC' }); } catch (e) { return s; } }
  function weekRange(mon) { try { var f = function (d) { return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', timeZone: 'UTC' }); }, a = new Date(mon + 'T12:00:00Z'); return f(a) + ' – ' + f(new Date(a.getTime() + 6 * 864e5)); } catch (e) { return mon; } }
  function weekday(s) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }); } catch (e) { return ''; } }
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
  // Shares the Today strip's session (same browser tab storage), or signs in with Circle's identity token
  function signIn() {
    var saved = store('ep_today_session');
    if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now()) { state.session = s.session; state.first = s.first || ''; return Promise.resolve(); } } catch (e) {} }
    return waitForUser(25).then(function (u) {
      return api('/api/member/session', { method: 'POST', body: { identityToken: u.identityToken } });
    }).then(function (r) {
      state.session = r.session; state.first = r.firstName || '';
      store('ep_today_session', JSON.stringify({ session: r.session, tier: r.tier && r.tier.tier, seasons: (r.tier && r.tier.seasons) || [], offer: r.offer || null, admin: !!r.admin, first: state.first, until: Date.now() + 10 * 60 * 60 * 1000 }));
    });
  }

  // ---- drafts: what's on the page, kept on this device until saved ----
  function blankDay() { return { sittings: [{ start: '', end: '' }, { start: '', end: '' }], extraMinutes: '', quality: '', feel: '', bodies: [], bodyQuality: '', supplemental: '', reflections: ['', '', '', ''], noticed: [], energy: '', aware: '', dedication: '', shared: false }; }
  function draftKey(kind, day) { return 'ep_portfolio_' + kind + '_' + day; }
  function fromView(v) {
    var d = blankDay(), e = v.entry;
    if (e) { var x = e.data || {}; Object.keys(d).forEach(function (k) { if (x[k] !== undefined) d[k] = x[k]; }); d.extraMinutes = x.extraMinutes || ''; d.shared = !!e.shared; }
    var local = keep(draftKey('day', v.day)); if (local && v.editable) { try { var l = JSON.parse(local); if (!e || l.at > Date.parse(e.at)) { d = l.d; d.unsaved = true; } } catch (er) {} }
    var w = { answers: ['', '', '', ''], shared: false };
    if (v.weekly) { w.answers = (v.weekly.data && v.weekly.data.answers) || w.answers; w.shared = !!v.weekly.shared; }
    var lw = keep(draftKey('week', v.weekStart)); if (lw && v.weekEditable) { try { var m = JSON.parse(lw); if (!v.weekly || m.at > Date.parse(v.weekly.at)) { w = m.d; w.unsaved = true; } } catch (er) {} }
    state.draft = d; state.wdraft = w;
  }
  function stash(kind) {
    if (!state.view) return;
    if (kind === 'week') keep(draftKey('week', state.view.weekStart), JSON.stringify({ at: Date.now(), d: state.wdraft }));
    else keep(draftKey('day', state.view.day), JSON.stringify({ at: Date.now(), d: state.draft }));
  }
  function mins(a, b) {
    if (!/^\d\d:\d\d$/.test(a || '') || !/^\d\d:\d\d$/.test(b || '')) return 0;
    var x = a.split(':').map(Number), y = b.split(':').map(Number), d = y[0] * 60 + y[1] - (x[0] * 60 + x[1]);
    if (d < 0) d += 1440; return d > 0 && d <= 600 ? d : 0;
  }
  function total(d) { return Math.min(600, d.sittings.reduce(function (a, s) { return a + mins(s.start, s.end); }, 0) + (parseInt(d.extraMinutes, 10) || 0)); }

  function load(day) {
    state.error = '';
    return api('/api/member/portfolio?today=' + localToday() + (day ? '&day=' + day : '')).then(function (v) { state.view = v; state.day = v.day; fromView(v); })
      .catch(function (e) { state.error = e.message; if (e.status === 401) store('ep_today_session', ''); });
  }

  function css() {
    if (document.getElementById('epf-css')) return;
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&display=swap'; document.head.appendChild(l); }
    var s = document.createElement('style'); s.id = 'epf-css';
    s.textContent = [
      '.epf{font-family:inherit;color:#1E1A14;max-width:1120px;margin:0 auto;padding:28px 20px 64px;display:flex;flex-direction:column;gap:24px;line-height:1.5}',
      '.epf *{box-sizing:border-box}',
      '.epf a{color:#A5432A;text-underline-offset:3px}',
      '.epf :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.epf-eye{font-size:12px;letter-spacing:.04em;color:#5A5346}',
      '.epf-h1{margin:4px 0 0;font:600 44px/1.05 "Cormorant Garamond",Georgia,serif}',
      '.epf-h1 em{color:#A5432A}',
      '.epf-lede{margin:6px 0 0;color:#5A5346;max-width:620px}',
      '.epf-head{display:flex;flex-direction:column;gap:4px;padding-bottom:12px;border-bottom:1px solid #D8C9AE}',
      '.epf-tabs{display:flex;flex-wrap:wrap;gap:20px;border-bottom:1px solid #D8C9AE}',
      '.epf-tab{font:inherit;font-size:14px;background:transparent;border:0;border-bottom:2px solid transparent;min-height:44px;padding:0 2px;color:#5A5346;cursor:pointer}',
      '.epf-tab[aria-pressed=true]{color:#1E1A14;border-bottom-color:#A5432A;font-weight:600}',
      '.epf-cols{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start}',
      '.epf-main{flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:18px}',
      '.epf-side{flex:1 1 260px;display:flex;flex-direction:column;gap:18px}',
      '.epf-card{background:#F2E8D6;border:1px solid #D8C9AE;border-radius:6px;padding:22px;display:flex;flex-direction:column;gap:14px}',
      '.epf-h2{margin:0;font:600 26px/1.1 "Cormorant Garamond",Georgia,serif}',
      '.epf-l{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5A5346}',
      '.epf-sit{display:grid;grid-template-columns:80px minmax(0,1fr) minmax(0,1fr) 72px;gap:10px;align-items:end}',
      '.epf-sit b{font-weight:600;padding-bottom:12px}',
      '.epf-sit .epf-m{font-variant-numeric:tabular-nums;padding-bottom:12px;text-align:right}',
      '.epf-f{display:flex;flex-direction:column;gap:5px;font-size:13px;color:#3A342B}',
      '.epf-f small{color:#5A5346;font-size:12px}',
      '.epf-in,.epf-ta{font:inherit;color:#1E1A14;background:#FAF5EB;border:1px solid #D8C9AE;border-radius:4px;padding:9px 11px;width:100%}',
      '.epf-in{min-height:44px}',
      '.epf-ta{font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;line-height:1.4;resize:vertical;min-height:72px}',
      '.epf-ded{font-family:"Cormorant Garamond",Georgia,serif;font-size:20px;font-style:italic}',
      '.epf-total{display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #D8C9AE;font-variant-numeric:tabular-nums}',
      '.epf-total span:last-child{font-size:18px;color:#A5432A;font-weight:600}',
      '.epf-chips{display:flex;flex-wrap:wrap;gap:6px}',
      '.epf-chip{font:inherit;font-size:13px;background:transparent;border:1px solid #D8C9AE;border-radius:3px;min-height:36px;padding:0 12px;cursor:pointer;color:#1E1A14}',
      '.epf-chip:hover{border-color:#1E1A14}',
      '.epf-chip[aria-pressed=true]{background:#1E1A14;color:#FAF5EB;border-color:#1E1A14}',
      '.epf-scale{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:#D8C9AE;border:1px solid #D8C9AE}',
      '.epf-scale .epf-chip{border:0;border-radius:0;min-height:48px;background:#FAF5EB}',
      '.epf-scale .epf-chip[aria-pressed=true]{background:#1E1A14}',
      '.epf-q{display:grid;grid-template-columns:24px minmax(0,1fr);gap:4px 10px;font-size:13px}',
      '.epf-q .n{color:#A5432A;grid-row:span 2;font-variant-numeric:tabular-nums}',
      '.epf-share{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid #D8C9AE;border-radius:4px;cursor:pointer;background:#FAF5EB}',
      '.epf-share input{width:18px;height:18px;margin:2px 0 0;accent-color:#A5432A;flex:none}',
      '.epf-share b{display:block;font-weight:600}',
      '.epf-share span span{font-size:13px;color:#5A5346}',
      '.epf-acts{display:flex;flex-wrap:wrap;gap:12px;align-items:center}',
      '.epf-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 20px;border-radius:4px;font:inherit;font-size:14px;font-weight:600;border:0;background:#A5432A;color:#FAF5EB;cursor:pointer;text-decoration:none}',
      '.epf-btn:hover{background:#83341F;color:#FAF5EB}',
      '.epf-btn:disabled{background:#D8C9AE;color:#5A5346;cursor:not-allowed}',
      '.epf-btn.quiet{background:transparent;color:#5A5346;border:1px solid #D8C9AE;font-weight:500}',
      '.epf-ok{font-size:13px;color:#20302A}',
      '.epf-err{font-size:13px;color:#A5432A}',
      '.epf-note{font-size:13px;color:#5A5346;margin:0}',
      '.epf-wk{display:grid;grid-template-columns:44px minmax(0,1fr) 12px;gap:10px;align-items:center;padding:7px 0;border-top:1px solid #D8C9AE;font-size:13px}',
      '.epf-wk button{font:inherit;font-size:12px;background:none;border:0;padding:0;color:#5A5346;text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:3px}',
      '.epf-wk .on{color:#A5432A;font-weight:600;text-decoration:none}',
      '.epf-sq{width:12px;height:12px;box-shadow:inset 0 0 0 1px #D8C9AE}',
      '.epf-days{display:grid;grid-template-columns:repeat(7,minmax(92px,1fr));gap:1px;background:#D8C9AE;border:1px solid #D8C9AE;overflow-x:auto}',
      '.epf-days > div{background:#F2E8D6;padding:12px;display:flex;flex-direction:column;gap:6px}',
      '.epf-days .bar{height:6px}',
      '.epf-days b{font-size:18px;font-variant-numeric:tabular-nums;font-weight:500}',
      '.epf-quote{margin:0;padding:0 4px;font:italic 600 21px/1.4 "Cormorant Garamond",Georgia,serif;color:#5A5346}',
      '.epf-quote footer{margin-top:8px;font-family:"IBM Plex Sans","Helvetica Neue",sans-serif;font-size:11px;font-weight:500;line-height:1.4;font-style:normal;letter-spacing:.08em;text-transform:uppercase}',
      '.epf-past{display:flex;flex-direction:column}',
      '.epf-past button{font:inherit;display:flex;justify-content:space-between;gap:12px;align-items:center;min-height:44px;padding:0 4px;background:none;border:0;border-top:1px solid #D8C9AE;cursor:pointer;color:#1E1A14;text-align:left}',
      '.epf-past button:hover{color:#A5432A}',
      '.epf-past small{color:#5A5346;font-size:12px}',
      '.epf-ro{white-space:pre-wrap;font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;line-height:1.45;margin:0}',
      '@media (max-width:620px){.epf-h1{font-size:34px}.epf-sit{grid-template-columns:1fr 1fr}.epf-sit b{grid-column:1/-1;padding:0}.epf-sit .epf-m{grid-column:1/-1;text-align:left;padding:0}.epf-scale{display:flex;flex-wrap:wrap;gap:6px;background:none;border:0}.epf-scale .epf-chip{border:1px solid #D8C9AE;border-radius:3px;min-height:40px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function chips(group, list, chosen, multi, cls) {
    return '<div class="' + (cls || 'epf-chips') + '" role="group">' + list.map(function (x) {
      var on = multi ? chosen.indexOf(x) >= 0 : chosen === x;
      return '<button type="button" class="epf-chip" data-g="' + group + '" data-v="' + esc(x) + '"' + (multi ? ' data-multi="1"' : '') + ' aria-pressed="' + on + '">' + esc(x) + '</button>';
    }).join('') + '</div>';
  }
  function ta(name, val, rows, label, hint, ro) {
    if (ro) return val ? '<div class="epf-f">' + label + '<p class="epf-ro">' + esc(val) + '</p></div>' : '';
    return '<label class="epf-f">' + label + (hint ? ' <small>' + hint + '</small>' : '') + '<textarea class="epf-ta" name="' + name + '" rows="' + (rows || 2) + '">' + esc(val) + '</textarea></label>';
  }

  function dayHtml() {
    var v = state.view, d = state.draft, ro = !v.editable, O = v.options;
    var out = '<form class="epf-main" data-form="day">';
    // Core sādhana
    out += '<section class="epf-card" aria-labelledby="epf-core"><h2 id="epf-core" class="epf-h2">Core sādhana</h2>';
    ['Morning', 'Evening'].forEach(function (lab, i) {
      var s = d.sittings[i] || { start: '', end: '' };
      out += '<div class="epf-sit"><b>' + lab + '</b>' +
        '<label class="epf-f">Start<input class="epf-in" type="time" name="s' + i + 'start" value="' + esc(s.start) + '"' + (ro ? ' disabled' : '') + '></label>' +
        '<label class="epf-f">End<input class="epf-in" type="time" name="s' + i + 'end" value="' + esc(s.end) + '"' + (ro ? ' disabled' : '') + '></label>' +
        '<span class="epf-m" data-mins="' + i + '">' + mins(s.start, s.end) + ' min</span></div>';
    });
    if (!ro) out += '<label class="epf-f">Other sitting, in minutes <small>Optional, if you didn’t note the times</small><input class="epf-in" type="number" min="0" max="600" inputmode="numeric" name="extraMinutes" value="' + esc(d.extraMinutes) + '" style="max-width:140px"></label>';
    out += '<div class="epf-total"><span>Total</span><span data-total>' + total(d) + ' min</span></div>';
    out += '<div class="epf-f" role="group" aria-label="Quality of practice">Quality of practice' + (ro ? '<span>' + esc(d.quality || '—') + '</span>' : chips('quality', O.qualities, d.quality)) + '</div>';
    out += ta('feel', d.feel, 2, 'In a few words: how did the practice feel today?', '', ro);
    out += '</section>';
    // Greater body
    out += '<section class="epf-card" aria-labelledby="epf-body"><h2 id="epf-body" class="epf-h2">Greater body of sādhana</h2>';
    out += ro ? '<span>' + esc(d.bodies.join(' · ') || '—') + '</span>' : chips('bodies', O.bodies, d.bodies, true);
    out += ta('bodyQuality', d.bodyQuality, 2, 'What quality did it contribute to your core practice?', '', ro);
    out += ta('supplemental', d.supplemental, 2, 'Supplemental or supportive practices', 'Optional — journaling, japa, devotional offering, creative work, silence', ro);
    out += '</section>';
    // Reflections
    out += '<section class="epf-card" aria-labelledby="epf-refl"><h2 id="epf-refl" class="epf-h2">Reflections</h2>';
    v.reflections.forEach(function (r, i) {
      if (ro) { if (d.reflections[i]) out += '<div class="epf-q"><span class="n">' + (i + 1) + '</span><span><b>' + esc(r[0]) + '</b></span><p class="epf-ro">' + esc(d.reflections[i]) + '</p></div>'; return; }
      out += '<label class="epf-q"><span class="n">' + (i + 1) + '</span><span><b>' + esc(r[0]) + '</b> <span style="color:#5A5346">' + esc(r[1]) + '</span></span><textarea class="epf-ta" name="r' + i + '" rows="2">' + esc(d.reflections[i] || '') + '</textarea></label>';
    });
    out += '</section>';
    // Everyday awareness
    out += '<section class="epf-card" aria-labelledby="epf-aw"><h2 id="epf-aw" class="epf-h2">Everyday awareness</h2>';
    out += '<div class="epf-f">Today I noticed…' + (ro ? '<span>' + esc(d.noticed.join(' · ') || '—') + '</span>' : chips('noticed', O.noticed, d.noticed, true)) + '</div>';
    out += '<div class="epf-f">Energy and mood' + (ro ? '<span>' + esc(d.energy || '—') + '</span>' : chips('energy', O.energy, d.energy, false, 'epf-scale')) + '</div>';
    out += '<div class="epf-f">Quality of awareness' + (ro ? '<span>' + esc(d.aware || '—') + '</span>' : chips('aware', O.aware, d.aware)) + '</div>';
    out += '</section>';
    // Closing
    out += '<section style="display:flex;flex-direction:column;gap:12px" aria-labelledby="epf-close"><h2 id="epf-close" class="epf-h2">Closing intention or dedication</h2>';
    out += ro ? (d.dedication ? '<p class="epf-ro epf-ded">' + esc(d.dedication) + '</p>' : '') :
      '<label class="epf-f">One line to seal the practice or dedicate its fruits<input class="epf-in epf-ded" type="text" name="dedication" maxlength="300" value="' + esc(d.dedication) + '"></label>';
    if (!ro && v.canShare) out += '<label class="epf-share"><input type="checkbox" name="shared"' + (d.shared ? ' checked' : '') + '><span><b>Share this page with Jacob</b><span>Off unless you tick it. Your days and minutes count toward your streak either way; the words stay yours unless you share them.</span></span></label>';
    if (ro) out += '<p class="epf-note">Pages can be written or changed for a week afterwards. This one is kept as it was' + (state.view.entry && state.view.entry.shared ? ', shared with Jacob' : '') + '.</p>';
    else {
      out += '<div class="epf-acts"><button class="epf-btn" type="submit"' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? 'Saving…' : 'Save page') + '</button>';
      if (state.saved) out += '<span class="epf-ok" role="status">' + esc(state.saved) + '</span>';
      else if (d.unsaved) out += '<span class="epf-note" role="status">Draft kept on this device. Save to keep it.</span>';
      if (state.formErr) out += '<span class="epf-err" role="alert">' + esc(state.formErr) + '</span>';
      out += '</div>';
      if (!v.canShare) out += '<p class="epf-note">Your portfolio is private: only you can read it.</p>';
    }
    out += '</section></form>';
    return out;
  }

  function weekSide() {
    var v = state.view;
    var out = '<aside class="epf-side"><div class="epf-card" style="gap:6px"><span class="epf-l">This week</span>';
    v.week.forEach(function (d) {
      var txt = d.logged ? d.minutes + ' min' + (d.quality ? ' · ' + d.quality.toLowerCase() : '') : d.page ? 'Page written' : d.day === v.today ? 'Today' : '';
      var bg = d.logged ? (d.minutes >= 45 ? '#A5432A' : d.minutes >= 20 ? '#C27459' : '#DDB49C') : 'transparent';
      var go = d.day <= v.today;
      out += '<div class="epf-wk"><span style="color:#5A5346">' + esc(weekday(d.day)) + '</span>' +
        (go ? '<button type="button" data-day="' + d.day + '" class="' + (d.day === v.day ? 'on' : '') + '">' + esc(txt || 'Write') + '</button>' : '<span></span>') +
        '<span class="epf-sq" style="background:' + bg + '"></span></div>';
    });
    out += '<button type="button" class="epf-btn quiet" data-tab="week" style="margin-top:8px">Weekly reflection →</button></div>';
    out += '<blockquote class="epf-quote">There will be days of radiance and days of resistance … all are equally relevant to the path of sādhana.<footer>Jacob Kyle · from the Portfolio’s opening letter</footer></blockquote></aside>';
    return out;
  }

  function weekHtml() {
    var v = state.view, w = state.wdraft, ro = !v.weekEditable;
    var out = '<div class="epf-main" style="flex-basis:100%">';
    out += '<section class="epf-days" aria-label="Your week in practice">' + v.week.map(function (d) {
      var bg = d.logged ? (d.minutes >= 45 ? '#A5432A' : d.minutes >= 20 ? '#C27459' : '#DDB49C') : '#FAF5EB';
      return '<div><span class="epf-l">' + esc(shortDay(d.day)) + '</span><div class="bar" style="background:' + bg + '"></div><b>' + (d.logged ? d.minutes : '–') + '<small style="font-size:12px;color:#5A5346"> min</small></b><span style="font-size:13px;color:#5A5346">' + esc(d.quality || (d.page ? 'page written' : '')) + '</span></div>';
    }).join('') + '</section>';
    out += '<p class="epf-note">' + esc(v.weekLine) + '</p>';
    out += '<form data-form="week" style="display:flex;flex-direction:column;gap:20px;max-width:760px">';
    v.weeklyQuestions.forEach(function (q, i) {
      if (ro) { if (w.answers[i]) out += '<div class="epf-q"><span class="n">' + (i + 1) + '</span><span><b style="font:600 22px/1.2 \'Cormorant Garamond\',Georgia,serif">' + esc(q[0]) + '</b></span><p class="epf-ro">' + esc(w.answers[i]) + '</p></div>'; return; }
      out += '<label class="epf-q"><span class="n">' + (i + 1) + '</span><span style="display:flex;flex-direction:column"><b style="font:600 22px/1.2 \'Cormorant Garamond\',Georgia,serif">' + esc(q[0]) + '</b><span style="color:#5A5346">' + esc(q[1]) + '</span></span><textarea class="epf-ta" name="w' + i + '" rows="3">' + esc(w.answers[i] || '') + '</textarea></label>';
    });
    if (ro) out += '<p class="epf-note">' + (w.answers.some(Boolean) ? 'This week’s reflection is kept as it was.' : 'No reflection was written this week.') + '</p>';
    else {
      if (v.canShare) out += '<label class="epf-share"><input type="checkbox" name="wshared"' + (w.shared ? ' checked' : '') + '><span><b>Bring this to my next one-to-one</b><span>Shares this weekly page with Jacob ahead of your monthly one-to-one.</span></span></label>';
      out += '<div class="epf-acts"><button class="epf-btn" type="submit"' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? 'Saving…' : 'Save reflection') + '</button>';
      if (state.saved) out += '<span class="epf-ok" role="status">' + esc(state.saved) + '</span>';
      else if (w.unsaved) out += '<span class="epf-note" role="status">Draft kept on this device. Save to keep it.</span>';
      if (state.formErr) out += '<span class="epf-err" role="alert">' + esc(state.formErr) + '</span>';
      out += '</div>';
    }
    return out + '</form></div>';
  }

  function pastHtml() {
    var v = state.view;
    if (!v.recent.length) return '<div class="epf-main"><p class="epf-note">Your saved pages will be listed here.</p></div>';
    return '<div class="epf-main"><div class="epf-card"><span class="epf-l">Past pages</span><div class="epf-past">' + v.recent.map(function (r) {
      return '<button type="button" data-day="' + r.day + '"' + (r.kind === 'week' ? ' data-to="week"' : '') + '><span>' + (r.kind === 'week' ? 'Weekly reflection · ' + esc(weekRange(r.day)) : esc(longDay(r.day))) + '</span><small>' + (r.shared ? 'Shared with Jacob' : 'Private') + '</small></button>';
    }).join('') + '</div></div></div>';
  }

  function html() {
    if (state.error && !state.view) return '<div class="epf-head"><h1 class="epf-h1">Practice <em>Portfolio</em></h1><p class="epf-lede">' + esc(state.error) + '</p></div>';
    var v = state.view;
    if (!v) return '<p class="epf-note">Opening your portfolio…</p>';
    var head = state.tab === 'week'
      ? '<span class="epf-eye">' + esc(weekRange(v.weekStart)) + '</span><h1 class="epf-h1">The week, <em>witnessed</em></h1>'
      : state.tab === 'past' ? '<span class="epf-eye">Practice Portfolio</span><h1 class="epf-h1">Past <em>pages</em></h1>'
        : '<span class="epf-eye">' + esc(longDay(v.day)) + (v.entryNumber ? ' · page ' + v.entryNumber : '') + '</span><h1 class="epf-h1">' + (v.day === v.today ? 'Today’s' : 'The day’s') + ' <em>tapas</em></h1>' +
          '<p class="epf-lede">Not a measure of achievement — a witness to the process. Fill in what serves; leave the rest.</p>';
    var out = '<div class="epf-head">' + head + '</div>';
    out += '<div class="epf-tabs" role="group" aria-label="Portfolio">' + [['day', 'Daily page'], ['week', 'Weekly reflection'], ['past', 'Past pages']].map(function (t) {
      return '<button type="button" class="epf-tab" data-tab="' + t[0] + '" aria-pressed="' + (state.tab === t[0]) + '">' + t[1] + '</button>';
    }).join('') + '</div>';
    if (state.tab === 'week') return out + weekHtml();
    if (state.tab === 'past') return out + pastHtml();
    return out + '<div class="epf-cols">' + dayHtml() + weekSide() + '</div>';
  }

  var root = null;
  function render() { if (root && document.body.contains(root)) root.innerHTML = html(); }

  function onClick(e) {
    var t = e.target.closest('[data-g],[data-tab],[data-day]');
    if (!t || !root.contains(t)) return;
    if (t.dataset.tab) { state.tab = t.dataset.tab; state.saved = ''; state.formErr = ''; render(); return; }
    if (t.dataset.day) {
      state.saved = ''; state.formErr = '';
      var to = t.dataset.to === 'week' ? 'week' : 'day';
      load(t.dataset.day).then(function () { state.tab = to; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      return;
    }
    var g = t.dataset.g, val = t.dataset.v, d = state.draft;
    if (t.dataset.multi) { var i = d[g].indexOf(val); d[g] = i >= 0 ? d[g].filter(function (x) { return x !== val; }) : d[g].concat([val]); }
    else d[g] = d[g] === val ? '' : val;
    d.unsaved = true; state.saved = '';
    stash('day');
    // Update the chip in place, so typing elsewhere on the page is never redrawn
    var group = t.parentElement.querySelectorAll('[data-g="' + g + '"]');
    for (var k = 0; k < group.length; k++) group[k].setAttribute('aria-pressed', String(t.dataset.multi ? d[g].indexOf(group[k].dataset.v) >= 0 : d[g] === group[k].dataset.v));
  }
  function onInput(e) {
    var n = e.target.name; if (!n) return;
    var d = state.draft, w = state.wdraft, m;
    if ((m = n.match(/^s(\d)(start|end)$/))) { d.sittings[+m[1]][m[2]] = e.target.value; var s = d.sittings[+m[1]]; var el = root.querySelector('[data-mins="' + m[1] + '"]'); if (el) el.textContent = mins(s.start, s.end) + ' min'; }
    else if ((m = n.match(/^r(\d)$/))) d.reflections[+m[1]] = e.target.value;
    else if ((m = n.match(/^w(\d)$/))) { w.answers[+m[1]] = e.target.value; w.unsaved = true; stash('week'); return; }
    else if (n === 'wshared') { w.shared = e.target.checked; stash('week'); return; }
    else if (n === 'shared') d.shared = e.target.checked;
    else if (n in d) d[n] = e.target.value;
    var tt = root.querySelector('[data-total]'); if (tt) tt.textContent = total(d) + ' min';
    d.unsaved = true; stash('day');
  }
  function onSubmit(e) {
    var f = e.target, kind = f.matches('[data-form=week]') ? 'week' : f.matches('[data-form=day]') ? 'day' : null;
    if (!kind) return;
    e.preventDefault();
    var v = state.view, d = kind === 'week' ? state.wdraft : state.draft;
    var data = kind === 'week' ? { answers: d.answers } : Object.assign({}, d, { extraMinutes: parseInt(d.extraMinutes, 10) || 0 });
    state.saving = true; state.formErr = ''; state.saved = ''; render();
    api('/api/member/portfolio', { method: 'POST', body: { today: localToday(), day: kind === 'week' ? v.weekStart : v.day, kind: kind, data: data, shared: !!d.shared } })
      .then(function (nv) {
        keep(draftKey(kind, kind === 'week' ? v.weekStart : v.day), null);
        state.view = nv; fromView(nv);
        var sh = nv.canShare && (kind === 'week' ? nv.weekly && nv.weekly.shared : nv.entry && nv.entry.shared);
        state.saved = 'Saved' + (kind === 'day' && nv.entry && nv.entry.data.minutes ? ' · ' + nv.entry.data.minutes + ' min logged' : '') + (nv.canShare ? (sh ? ' · shared with Jacob' : ' · kept private') : '');
      })
      .catch(function (err) { state.formErr = err.status === 401 ? 'Please refresh the page and sign in again. Your writing is kept on this device.' : err.message; if (err.status === 401) store('ep_today_session', ''); })
      .then(function () { state.saving = false; render(); });
  }

  function pageContainer() {
    var all = document.querySelectorAll('div');
    for (var i = 0; i < all.length; i++) { var c = String(all[i].className || ''); if (c.indexOf('container-type:inline-size') >= 0 && c.indexOf('bg-secondary') >= 0) return all[i]; }
    return null;
  }
  function mount() {
    if (!PAGE.test(location.pathname)) return;
    if (root && document.body.contains(root)) return;
    var box = pageContainer();
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    root = document.createElement('div');
    root.className = 'epf'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Practice Portfolio');
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onInput);
    root.addEventListener('submit', onSubmit);
    box.insertBefore(root, box.firstChild);
    render();
  }

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css();
    var d = (location.search.match(/[?&]day=(\d{4}-\d\d-\d\d)/) || [])[1];
    var tb = (location.search.match(/[?&]tab=(week|past)/) || [])[1]; if (tb) state.tab = tb;
    signIn().then(function () { return load(d); }).catch(function () { state.error = 'Please sign in to Circle to open your portfolio.'; }).then(function () { mount(); render(); });
  }
  start();
  // Circle is a single-page app: mount when someone navigates to the page
  var t = null;
  new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; start(); if (started) mount(); }, 300); }).observe(document.body, { childList: true, subtree: true });
})();
