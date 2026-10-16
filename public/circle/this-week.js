/* Embodied Philosophy · "This week" for Sahṛdaya Upāya mentees (ss.embodiedphilosophy.com/c/this-week)
   Loaded by public/circle/today.js (no extra Circle snippet needed). Draws the page in place of the space's content,
   the same way the Schedule page does (no frame). Mentees and Circle admins only: for anyone else it does nothing.
   Data: /api/member/this-week (lib/mentee/load.js). Practice log: /api/member/practice. See docs/mentee-this-week.md. */
(function () {
  if (window.__epThisWeek) return; window.__epThisWeek = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/this-week(-[a-z0-9]{3,10})?\/?$/;
  var SKEY = 'ep_week_session';
  var state = { session: null, first: '', ok: false, data: null, error: '', logOpen: false, lineOpen: false, minutes: '20', line: '', busy: '', msg: '', hours: false, going: {} };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function localToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function myZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } }
  function fmt(iso, opts) { try { return new Date(iso).toLocaleString(undefined, Object.assign({ timeZone: myZone() }, opts)); } catch (e) { return ''; } }
  function dayFmt(s, opts) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, Object.assign({ timeZone: 'UTC' }, opts)); } catch (e) { return s; } }
  function safeUrl(u) { return /^(https?:|mailto:)/.test(String(u || '')) ? u : ''; }
  function hello() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  function link(u, text, cls, ext) { u = safeUrl(u); return u ? '<a class="' + cls + '" href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + text + '</a>' : ''; }

  // ---- sign-in: Circle's identity token → our bearer session (same as the Schedule page) ----
  function waitForUser(tries) {
    var u = window.circleUser;
    if (u && u.signedIn !== false && u.identityToken) return Promise.resolve(u);
    if (tries <= 0) return Promise.reject(new Error('not signed in'));
    return new Promise(function (res) { setTimeout(res, 400); }).then(function () { return waitForUser(tries - 1); });
  }
  var T = {};
  function lap(name, t0) { T[name] = ((Date.now() - t0) / 1000).toFixed(1) + 's'; }
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
  var DKEY = function () { return 'ep_week_data_' + ((window.circleUser && window.circleUser.email) || ''); };
  function keep(d) { if (d && d.due && !d.pending) store(DKEY(), JSON.stringify({ day: localToday(), d: d })); }
  function cached() { try { var c = JSON.parse(store(DKEY()) || 'null'); return c && c.day === localToday() ? c.d : null; } catch (e) { return null; } }
  var tzq = function () { return 'today=' + localToday() + '&tz=' + encodeURIComponent(myZone()); };
  // Fast answer first (practice, ticks, hours, reading, assignments), then the full one (sessions, threads, calendar)
  function load() {
    var fail = function (e) { state.error = e.status === 403 ? 'This page is for Sahṛdaya Upāya mentees.' : e.message; };
    var t1 = Date.now();
    return call('/api/member/this-week?fast=1&' + tzq()).then(function (d) { lap('first data', t1); T.server = JSON.stringify(d.timing || {}); if (!state.data || state.data.pending || !cached()) state.data = d; state.error = ''; render(); }).catch(fail)
      .then(function () {
        var t2 = Date.now();
        return call('/api/member/this-week?' + tzq()).then(function (d) { lap('all data', t2); T.serverAll = JSON.stringify(d.timing || {}); state.data = d; state.error = ''; keep(d); render(); })
          .catch(function (e) { if (!state.data) fail(e); else if (state.data.pending) { state.data.pending = false; state.data.unavailable = (state.data.unavailable || []).concat(['sessions']); } });
      });
  }
  function act(key, fn) {
    state.busy = key; state.msg = ''; render();
    return fn().then(function (d) { if (d && d.due) { state.data = d; keep(d); } }).catch(function (e) { state.msg = e.message; })
      .then(function () { state.busy = ''; render(); });
  }

  function css() {
    if (document.getElementById('etw-css')) return;
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Inter:wght@400;500;600&display=swap'; document.head.appendChild(l); }
    var s = document.createElement('style'); s.id = 'etw-css';
    s.textContent = [
      '.etw{font-family:Inter,system-ui,sans-serif;color:#1E1A14;max-width:1240px;margin:0 auto;padding:26px 28px 64px;line-height:1.5;font-size:15px}',
      '.etw *{box-sizing:border-box}',
      '.etw :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.etw-eye{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;font-size:12px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#A5432A}',
      '.etw-pill{background:#20302A;color:#FAF5EB;font-size:12px;font-weight:600;letter-spacing:0;text-transform:none;padding:3px 12px;border-radius:99px}',
      '.etw-top{display:flex;justify-content:space-between;align-items:flex-end;gap:12px 24px;flex-wrap:wrap;margin:6px 0 22px}',
      '.etw-h1{margin:0;font:600 54px/1.05 "Cormorant Garamond",Georgia,serif;color:#1E1A14}.etw-h1 em{color:#A5432A;font-style:italic}',
      '.etw-meta{font-size:13px;color:#5A5346}.etw-meta a{color:#1E1A14;text-decoration:underline;text-underline-offset:3px}',
      '.etw-note{background:#EADDC6;border:1px solid #D8C9AE;border-radius:8px;padding:10px 14px;margin:0 0 14px;font-size:14px}',
      '.etw-err{color:#9b2c16;font-size:14px;margin:0 0 12px}',
      '.etw-top3{display:grid;grid-template-columns:minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr);gap:14px;margin-bottom:16px}',
      '.etw-pm{display:grid;grid-template-columns:minmax(0,220px) minmax(0,1fr);gap:20px 30px;align-items:start}.etw-pml{display:flex;flex-direction:column;gap:8px}',
      '.etw-pmh{display:flex;justify-content:space-between;align-items:baseline;gap:10px}',
      '.etw-ms{display:flex;gap:8px;flex-wrap:wrap}.etw-ms span{font-size:12px;font-weight:600;padding:3px 10px;border-radius:99px;border:1px solid #D8C9AE;color:#5A5346}.etw-ms span.got{background:#A5432A;border-color:#A5432A;color:#fff}.etw-ms span.next{border-color:#A5432A;color:#A5432A}',
      '.etw-card{background:#FAF5EB;border:1px solid #E2D6BE;border-radius:12px;padding:18px 20px;min-width:0}',
      '.etw-card.sm{display:flex;flex-direction:column;gap:8px}.etw-card.sm .etw-btn{margin-top:auto}',
      '.etw-card.accent{border-top:3px solid #A5432A}',
      '.etw-lab{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#5A5346}.etw-lab.t{color:#A5432A}',
      '.etw-h2{margin:0;font:600 26px/1.15 "Cormorant Garamond",Georgia,serif}',
      '.etw-h3{margin:0;font:600 24px/1.2 "Cormorant Garamond",Georgia,serif}',
      '.etw-hd{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:12px}',
      '.etw-hd a,.etw-hd .lnk{font-size:13px;font-weight:600;color:#A5432A;text-decoration:none;white-space:nowrap}',
      '.etw-hd .sm{font-size:13px;color:#5A5346}',
      '.etw-streak{font:600 40px/1 "Cormorant Garamond",Georgia,serif;color:#A5432A}.etw-streak span{font:500 14px Inter,system-ui,sans-serif;color:#5A5346;margin-left:8px}',
      '.etw-line{font-weight:600;font-size:16px;line-height:1.3;color:#1E1A14}.etw-line a{color:inherit;text-decoration:none}.etw-line a:hover{text-decoration:underline}',
      '.etw-muted{color:#5A5346;font-size:14px;margin:0}',
      '.etw-ok{color:#20302A;font-weight:600;font-size:14px;margin:0}',
      '.etw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border-radius:8px;border:1px solid transparent;font:600 14px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none!important;white-space:nowrap;width:100%}',
      '.etw-btn.pri{background:#A5432A;color:#fff!important}.etw-btn.out{background:#FBF8F1;border-color:#D8C9AE;color:#1E1A14!important}.etw-btn.dark{background:#20302A;color:#fff!important}.etw-btn.lite{background:transparent;border-color:rgba(246,239,226,.35);color:#F6EFE2!important}',
      '.etw-btn.auto{width:auto}.etw-btn:disabled{opacity:.55;cursor:default}',
      '.etw-acts{display:flex;gap:10px;flex-wrap:wrap;align-items:center}',
      '.etw-link{background:none;border:0;padding:0;min-height:36px;color:#A5432A;font:600 14px Inter,system-ui,sans-serif;text-decoration:underline;cursor:pointer}',
      '.etw-form{display:grid;gap:8px}.etw-form label{font-weight:600;font-size:13px}',
      '.etw-form input,.etw-form textarea{width:100%;font:16px Inter,system-ui,sans-serif;padding:10px 12px;border:1px solid #D8C9AE;border-radius:8px;background:#fff;min-height:44px;color:#1E1A14}',
      '.etw-wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}',
      '.etw-d{background:#fff;border:1px solid #E2D6BE;border-radius:10px;padding:10px;min-height:150px;display:flex;flex-direction:column;gap:7px}',
      '.etw-d.today{border:2px solid #A5432A;padding:9px}',
      '.etw-dh{display:flex;justify-content:space-between;align-items:baseline}',
      '.etw-dh b{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.etw-dh span{font:600 19px/1 "Cormorant Garamond",Georgia,serif}',
      '.etw-chip{border-radius:6px;padding:7px 8px;font-size:12px;line-height:1.25;font-weight:600;word-break:break-word}.etw-chip a{color:inherit;text-decoration:none}.etw-chip a:hover{text-decoration:underline}',
      '.etw-chip small{display:block;font-size:10px;font-weight:600;letter-spacing:.04em;opacity:.85;margin-bottom:1px}',
      '.etw-chip.s{background:#20302A;color:#fff}.etw-chip.m{background:#EADDC6;color:#1E1A14}.etw-chip.x{background:#A5432A;color:#fff}',
      '.etw-dot{margin-top:auto;width:14px;height:14px;border-radius:50%;border:1.5px solid #D8C9AE;display:block}',
      '.etw-dot.done{background:#20302A;border-color:#20302A}.etw-dot.today{border-color:#A5432A}.etw-dot.today.done{background:#A5432A}',
      '.etw-key{display:flex;gap:6px;align-items:center;font-size:12px;color:#5A5346}.etw-key i{width:10px;height:10px;border-radius:50%;display:inline-block;background:#20302A}.etw-key i.o{background:none;border:1.5px solid #5A5346}',
      '.etw-cols{display:grid;grid-template-columns:minmax(0,1.95fr) minmax(0,1fr);gap:16px;align-items:start}',
      '.etw-col{display:grid;gap:16px;min-width:0}',
      '.etw-read{background:#20302A;color:#F6EFE2;border-radius:12px;padding:24px 26px}',
      '.etw-read .etw-lab{color:#C9A24B}',
      '.etw-sans{margin:12px 0 10px;font:italic 600 34px/1.2 "Cormorant Garamond",Georgia,serif;color:#fff}.etw-sans.dev{font-style:normal}',
      '.etw-read p{margin:0 0 16px;font-size:17px;line-height:1.55;max-width:62ch}',
      '.etw-read .etw-acts .etw-btn{width:auto}',
      '.etw-rows{list-style:none;margin:0;padding:0}',
      '.etw-rows li{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 0;border-top:1px solid #E2D6BE}.etw-rows li:first-child{border-top:0}',
      '.etw-rows .l{min-width:0}.etw-rows .t{font-weight:500;font-size:15px;line-height:1.3}.etw-rows .t a{color:inherit;text-decoration:none}.etw-rows .t a:hover{text-decoration:underline}',
      '.etw-rows .u{font-size:12.5px;color:#5A5346;margin-top:2px}',
      '.etw-rows .r{font-size:13px;font-weight:600;color:#A5432A;text-align:right;flex:none;text-decoration:none}.etw-rows .r.g{color:#5A5346;font-weight:500}',
      '.etw-task{display:flex;align-items:center;gap:8px;min-width:0}',
      '.etw-tk{flex:none;width:44px;height:44px;margin:-10px 0 -10px -12px;background:none;border:0;padding:0;cursor:pointer;display:grid;place-items:center}',
      '.etw-tk b{width:22px;height:22px;border:1.8px solid #20302A;border-radius:50%;background:#fff;color:#fff;display:grid;place-items:center;font-size:13px;line-height:1}',
      '.etw-tk[aria-checked=true] b{background:#20302A}.etw-tk:disabled{opacity:.5}',
      '.etw-rows li.done .t{color:#5A5346}',
      '.etw-beads{display:grid;grid-template-columns:repeat(18,1fr);gap:5px;margin:8px 0 12px}',
      '.etw-beads i{aspect-ratio:1;border-radius:50%;background:#E8DDC8;display:block}.etw-beads i.on{background:#A5432A}',
      '.etw-big2{font:600 34px/1 "Cormorant Garamond",Georgia,serif}',
      '.etw-bar{height:6px;background:#E8DDC8;border-radius:99px;overflow:hidden}.etw-bar i{display:block;height:100%;background:#A5432A;min-width:4px}',
      '.etw-types{list-style:none;margin:8px 0 0;padding:0}.etw-types li{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-top:1px solid #E2D6BE;font-size:13.5px}',
      '.etw-dk{background:#20302A;color:#F6EFE2;border-radius:12px;padding:18px 20px}.etw-dk .etw-lab{color:#C9A24B}',
      '.etw-dk .etw-rows li{border-color:rgba(246,239,226,.14)}.etw-dk .etw-rows .u{color:#CFC6B4}.etw-dk .etw-rows .r{color:#C9A24B}.etw-dk .etw-rows .t{font-weight:600;color:#fff}',
      '.etw-sk{height:150px;border-radius:12px;background:linear-gradient(90deg,#EADDC6 25%,#F3EADA 50%,#EADDC6 75%);background-size:200% 100%;animation:etwsh 1.4s ease-in-out infinite}.etw-sk.tall{height:320px}@keyframes etwsh{to{background-position:-200% 0}}@media (prefers-reduced-motion:reduce){.etw-sk{animation:none}}',
      '@media (max-width:1100px){.etw-top3{grid-template-columns:repeat(2,minmax(0,1fr))}.etw-pm{grid-column:1/-1}}',
      '@media (max-width:900px){.etw-cols{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:760px){.etw-wk{grid-template-columns:minmax(0,1fr)}.etw-d{min-height:0;flex-direction:row;flex-wrap:wrap;align-items:center}.etw-dh{width:100%}.etw-dot{margin-top:0}}',
      '@media (max-width:700px){.etw-pm{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:560px){.etw{padding:18px 16px 48px}.etw-top3{grid-template-columns:minmax(0,1fr)}.etw-h1{font-size:38px}.etw-sans{font-size:28px}.etw-beads{grid-template-columns:repeat(12,1fr)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // UK clocks change on the last Sunday of October, US clocks on the first Sunday of November
  function clockNote(today) {
    var y = Number(today.slice(0, 4));
    function sunday(yy, m, last) { var d = last ? new Date(Date.UTC(yy, m + 1, 0)) : new Date(Date.UTC(yy, m, 1)); while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + (last ? -1 : 1)); return d.toISOString().slice(0, 10); }
    var uk = sunday(y, 9, true), us = sunday(y, 10, false);
    if (today < uk || today > us) return '';
    return 'UK clocks changed on ' + dayFmt(uk, { day: 'numeric', month: 'long' }) + ' and US clocks change on ' + dayFmt(us, { day: 'numeric', month: 'long' }) + ', so a session may start an hour earlier or later than usual where you are. Times below are in your own time zone.';
  }
  function joinOpen(s, now) { var st = Date.parse(s.start), en = Date.parse(s.end) || st + 2 * 3600e3; return st - 10 * 60000 <= now && now <= en + 30 * 60000; }

  function range(a, b) {
    try { return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', timeZone: 'UTC' }).formatRange(new Date(a + 'T12:00:00Z'), new Date(b + 'T12:00:00Z')); }
    catch (e) { return dayFmt(a, { day: 'numeric', month: 'long' }) + ' – ' + dayFmt(b, { day: 'numeric', month: 'long' }); }
  }
  function dueLabel(a, today) {
    if (a.done) return ['Done', 'g'];
    if (!a.due) return ['', ''];
    var diff = Math.round((Date.parse(a.due) - Date.parse(today)) / 864e5);
    if (diff === 0) return ['Today', '']; if (diff === 1) return ['Tomorrow', ''];
    return [diff > 1 && diff < 7 ? dayFmt(a.due, { weekday: 'short' }) : dayFmt(a.due, { day: 'numeric', month: 'short' }), diff < 0 ? '' : ''];
  }
  function hd(title, right) { return '<div class="etw-hd"><h2 class="etw-h2">' + esc(title) + '</h2>' + (right || '') + '</div>'; }

  var LADDER = [7, 21, 40, 108];
  function practiceCard(w) {
    var p = w.practice, m = w.mala, b = state.busy === 'practice', beads = '';
    for (var i = 0; i < 108; i++) beads += '<i' + (i < m.filled ? ' class="on"' : '') + '></i>';
    var left = '<span class="etw-lab">Practice</span><div class="etw-streak">' + p.streak + '<span>day streak</span></div>' +
      '<p class="etw-muted">' + m.days + ' practice day' + (m.days === 1 ? '' : 's') + ' in all</p>';
    if (p.reached) left += '<p class="etw-ok">' + p.reached + ' days in a row. Beautifully done.</p>';
    if (state.logOpen) {
      left += '<div class="etw-form"><label for="etw-min">Minutes you sat today</label><input id="etw-min" type="number" inputmode="numeric" min="1" max="600" value="' + esc(state.minutes) + '" data-in="minutes">' +
        '<div class="etw-acts"><button type="button" class="etw-btn pri auto" data-act="save-practice"' + (b ? ' disabled' : '') + '>' + (b ? 'Saving…' : 'Save') + '</button><button type="button" class="etw-btn out auto" data-act="cancel-log">Cancel</button></div></div>';
    } else if (p.loggedToday) left += '<p class="etw-ok">Logged for today ✓</p><button type="button" class="etw-btn out" data-act="open-log">Change today’s log</button>';
    else left += '<button type="button" class="etw-btn pri" data-act="open-log">Log today’s practice</button>';
    var next = LADDER.filter(function (x) { return x > m.filled; })[0] || 108;
    var chips = LADDER.map(function (x) { var cls = x <= m.filled ? 'got' : x === next ? 'next' : ''; return '<span class="' + cls + '">' + (x <= m.filled ? '✓ ' : '') + x + ' days</span>'; }).join('');
    var right = '<div class="etw-pmh"><span class="etw-lab">Your mālā' + (m.round > 1 ? ' · round ' + m.round : '') + '</span><span class="etw-muted">' + m.filled + ' of 108</span></div>' +
      '<div class="etw-beads" role="img" aria-label="' + m.filled + ' of 108 beads filled">' + beads + '</div>' +
      '<div class="etw-ms" aria-label="Milestones">' + chips + (m.round > 1 ? '<span class="got">' + (m.round - 1) + (m.round === 2 ? ' mālā' : ' mālās') + ' complete</span>' : '') + '</div>' +
      '<p class="etw-muted" style="margin-top:8px">' + (m.days ? 'Next milestone: ' + next + ' days' + (next === 108 ? ' completes this mālā.' : '.') : 'Each day you log fills one bead. 108 beads is a full mālā; then a new one begins.') + '</p>';
    return '<section class="etw-card accent etw-pm"><div class="etw-pml">' + left + '</div><div class="etw-pmr">' + right + '</div></section>';
  }
  function nextLiveCard(w) {
    var s = w.nextLive, lab = '<span class="etw-lab t">Next live' + (s ? ' · ' + esc(fmt(s.start, { weekday: 'long' }).toUpperCase()) : '') + '</span>';
    if (!s) return '<section class="etw-card sm">' + lab + '<p class="etw-line">' + (w.pending ? 'Loading…' : w.unavailable.indexOf('sessions') >= 0 ? 'We couldn’t reach Circle just now.' : 'The next session will appear here.') + '</p></section>';
    var open = joinOpen(s, Date.now()), going = s.rsvped || state.going[s.id];
    var title = esc(s.title) + ' · ' + esc(fmt(s.start, { hour: 'numeric', minute: '2-digit' }).toLowerCase());
    var btn = open ? link(s.url, 'Join now', 'etw-btn pri')
      : going ? '<span class="etw-btn out" style="cursor:default">You’ll be reminded ✓</span>'
      : '<button type="button" class="etw-btn out" data-act="remind" data-id="' + esc(s.id) + '"' + (state.busy === 'remind' ? ' disabled' : '') + '>Remind me</button>';
    return '<section class="etw-card sm">' + lab + '<p class="etw-line">' + (safeUrl(s.url) ? link(s.url, title, '') : title) + '</p>' + btn + '</section>';
  }
  function countCard(w) {
    var d = w.due;
    return '<section class="etw-card sm"><span class="etw-lab">Due this week</span><p class="etw-line">' + d.done + ' of ' + d.total + ' done</p><button type="button" class="etw-btn out" data-act="jump-due">See list</button></section>';
  }
  function oneTop(w) {
    var o = w.oneToOne;
    return '<section class="etw-card sm"><span class="etw-lab">One-to-one</span>' + (o ? '<p class="etw-line">Book for ' + esc(range(o.from, o.to)) + '</p>' + link(o.url, 'Choose a time', 'etw-btn out', true) : '<p class="etw-line">Booking opens about three weeks before the last week of the month</p>') + '</section>';
  }

  function weekCard(w) {
    var key = '<span class="etw-key"><i></i> practised · <i class="o"></i> today</span>';
    return '<section class="etw-card">' + hd('The week ahead', key) + (w.pending ? '<p class="etw-muted" style="margin-bottom:10px">Loading sessions…</p>' : '') + '<div class="etw-wk">' + w.week.map(function (d) {
      var chips = d.items.map(function (it) {
        var cls = it.kind === 'session' ? 's' : it.kind === 'meditation' ? 'm' : 'x';
        var small = it.start ? fmt(it.start, { hour: 'numeric', minute: '2-digit' }).toLowerCase() : (it.kind === 'meditation' ? 'Live' : (it.label || ''));
        var t = it.url ? link(it.url, esc(it.title), '', !it.circle) : esc(it.title);
        return '<div class="etw-chip ' + cls + '">' + (small ? '<small>' + esc(small) + '</small>' : '') + t + '</div>';
      }).join('');
      var isToday = d.day === w.today;
      return '<div class="etw-d' + (isToday ? ' today' : '') + '"><div class="etw-dh"><b>' + esc(dayFmt(d.day, { weekday: 'short' })) + '</b><span>' + esc(dayFmt(d.day, { day: 'numeric' })) + '</span></div>' + chips +
        '<i class="etw-dot ' + (d.dot === 'done' ? 'done ' : '') + (isToday ? 'today' : '') + '" role="img" aria-label="' + (d.dot === 'done' ? 'Practised' : isToday ? 'Today' : 'Not logged') + '"></i></div>';
    }).join('') + '</div></section>';
  }
  function readingCard(w) {
    var r = w.reading;
    if (!r) return '<section class="etw-card"><span class="etw-lab">This week’s reading</span><p class="etw-muted" style="margin-top:6px">This week’s reading will be here before the session.</p></section>';
    return '<section class="etw-read"><span class="etw-lab">This week’s reading' + (r.citation ? ' · ' + esc(r.citation.toUpperCase()) : '') + '</span>' +
      (r.sanskrit ? '<div class="etw-sans' + (/[ऀ-ॿ]/.test(r.sanskrit) ? ' dev' : '') + '" lang="sa">' + esc(r.sanskrit) + '</div>' : '') + (r.translation ? '<p>' + esc(r.translation) + '</p>' : '') +
      '<div class="etw-acts">' + link(r.url, 'Open in Readings', 'etw-btn pri auto') + link(w.workbookUrl, 'Apprentice Workbook', 'etw-btn lite auto') + '</div></section>';
  }
  function dueCard(w) {
    var items = w.due.items;
    return '<section class="etw-card" id="etw-due">' + hd('Due this week') + (items.length ? '<ul class="etw-rows">' + items.map(function (a) {
      var dl = dueLabel(a, w.today);
      return '<li class="' + (a.done ? 'done' : '') + '"><div class="etw-task"><button type="button" class="etw-tk" role="checkbox" aria-checked="' + a.done + '" aria-label="' + esc(a.title + ': ' + (a.done ? 'done' : 'not done')) + '" data-act="tick" data-id="' + esc(a.id) + '" data-done="' + (a.done ? '0' : '1') + '"' + (state.busy === 'tick' + a.id ? ' disabled' : '') + '><b>' + (a.done ? '✓' : '') + '</b></button>' +
        '<div class="l"><div class="t">' + (safeUrl(a.url) ? link(a.url, esc(a.title), '') : esc(a.title)) + '</div>' + (a.where ? '<div class="u">' + esc(a.where) + '</div>' : '') + '</div></div>' + (dl[0] ? '<span class="r ' + dl[1] + '">' + esc(dl[0]) + '</span>' : '') + '</li>';
    }).join('') + '</ul>' : '<p class="etw-muted">Nothing is due this week.</p>') + '</section>';
  }
  function mentorCard(w) {
    var m = w.mentorship, rows = '';
    m.posts.forEach(function (p) {
      rows += '<li><div class="l"><div class="t">' + esc(p.title) + (p.replies ? ' · ' + p.replies + (p.replies === 1 ? ' reply' : ' replies') : '') + '</div><div class="u">' + esc(p.who || 'Mentorship Circle') + '</div></div>' + (safeUrl(p.url) ? link(p.url, 'Reply', 'r') : '') + '</li>';
    });
    var f = m.feedback[0];
    rows += '<li><div class="l"><div class="t">Teaching feedback</div><div class="u">' + esc(f ? f.notes : 'Jacob’s notes appear after your first Practicum') + '</div></div><span class="r g">' + (f ? esc(f.date ? dayFmt(f.date, { day: 'numeric', month: 'short' }) : 'New') : '—') + '</span></li>';
    rows += '<li><div class="l"><div class="t">Message Jacob</div><div class="u">Mentees can write directly</div></div>' + (safeUrl(m.messageUrl) ? link(m.messageUrl, 'Write', 'r', true) : '') + '</li>';
    return '<section class="etw-card">' + hd('Mentorship', safeUrl(m.circleUrl) ? link(m.circleUrl, 'Mentorship Circle →', 'lnk') : '') + '<ul class="etw-rows">' + rows + '</ul></section>';
  }
  function hoursCard(w) {
    var f = w.formation;
    if (!f) return '<section class="etw-card sm"><span class="etw-lab">Formation hours</span><p class="etw-muted">Your hours record isn’t available just now.</p></section>';
    var out = '<span class="etw-lab">Formation hours</span><div class="etw-big2">' + f.total + ' of ' + f.target + '</div><p class="etw-muted">Sessions, Practicum, one-to-ones and practice teaching, tallied by type.</p>' +
      '<div class="etw-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + f.target + '" aria-valuenow="' + f.total + '" aria-label="Formation hours"><i style="width:' + Math.min(100, Math.round(f.total / f.target * 100)) + '%"></i></div>' +
      '<button type="button" class="etw-btn dark" data-act="hours" aria-expanded="' + state.hours + '" style="margin-top:6px">' + (state.hours ? 'Hide record' : 'Full record') + '</button>';
    if (state.hours) out += '<ul class="etw-types">' + f.byType.map(function (t) { return '<li><span>' + esc(t.type) + '</span><b>' + t.hours + ' h</b></li>'; }).join('') + '</ul>' + (f.entries.length ? '<ul class="etw-types">' + f.entries.map(function (e) { return '<li><span>' + esc(dayFmt(e.day, { day: 'numeric', month: 'short' }) + ' · ' + (e.note || e.component)) + '</span><b>' + e.hours + ' h</b></li>'; }).join('') + '</ul>' : '<p class="etw-muted" style="margin-top:8px">No hours have been credited yet.</p>');
    return '<section class="etw-card sm">' + out + '</section>';
  }
  function oneSide(w) {
    var o = w.oneToOne;
    return '<section class="etw-card sm"><span class="etw-lab">One-to-one with Jacob</span>' + (o ? '<div class="etw-h3">Book for ' + esc(range(o.from, o.to)) + '</div>' : '') + '<p class="etw-muted">' + (o ? '45 minutes on a UK evening. Bring your practice log.' : 'Booking opens about three weeks before the last week of the month. 45 minutes on a UK evening.') + '</p>' + (o ? link(o.url, 'Choose a time', 'etw-btn dark', true) : '') + '</section>';
  }
  function travelCard(w) {
    var b = state.busy === 'line', out = '<span class="etw-lab">Inner Travelogue · Private</span><div class="etw-h3">One line, before the day begins.</div><p class="etw-muted">Only you can see it.</p>';
    if (state.lineOpen) out += '<div class="etw-form"><label for="etw-line" style="position:absolute;left:-9999px">Today’s line</label><textarea id="etw-line" rows="2" maxlength="1000" placeholder="What is moving in you today?" data-in="line">' + esc(state.line) + '</textarea><div class="etw-acts"><button type="button" class="etw-btn dark auto" data-act="add-line"' + (b ? ' disabled' : '') + '>' + (b ? 'Saving…' : 'Save line') + '</button><button type="button" class="etw-btn out auto" data-act="cancel-line">Cancel</button></div></div>';
    else out += '<button type="button" class="etw-btn dark" data-act="open-line">Add a line</button>';
    if (w.travelogue.length && state.lineOpen) out += '<ul class="etw-types">' + w.travelogue.map(function (l) { return '<li><span>' + esc(l.text) + '</span><b>' + esc(dayFmt(l.day, { day: 'numeric', month: 'short' })) + '</b></li>'; }).join('') + '</ul>';
    return '<section class="etw-card sm">' + out + '</section>';
  }
  function launchCard(w) {
    if (!w.launches.length) return '';
    return '<section class="etw-dk"><span class="etw-lab">Coming soon at EP</span><ul class="etw-rows" style="margin-top:6px">' + w.launches.map(function (l) {
      var when = /^\d{4}-\d\d-\d\d$/.test(l.date) ? dayFmt(l.date, { day: 'numeric', month: 'short' }) : l.date;
      return '<li><div class="l"><div class="t">' + (safeUrl(l.url) ? link(l.url, esc(l.title), '', true) : esc(l.title)) + '</div>' + (l.line ? '<div class="u">' + esc(l.line) + '</div>' : '') + '</div>' + (when ? '<span class="r">' + esc(when) + '</span>' : '') + '</li>';
    }).join('') + '</ul></section>';
  }

  function html() {
    if (state.error && !state.data) return '<h1 class="etw-h1">This week</h1><p class="etw-muted" style="margin-top:8px">' + esc(state.error) + '</p>';
    var w = state.data, name = (w && w.greeting.firstName) || state.first;
    var head = function (eye, meta) { return '<div class="etw-eye">' + eye + '</div><div class="etw-top"><h1 class="etw-h1">' + esc(hello()) + (name ? ', <em>' + esc(name) + '</em>' : '') + '</h1>' + (meta || '') + '</div>'; };
    if (!w) return head('<span>Opening your week…</span>') + '<div class="etw-top3"><div class="etw-sk"></div><div class="etw-sk"></div><div class="etw-sk"></div></div><div class="etw-sk tall"></div>';
    var g = w.greeting, note = clockNote(w.today), city = myZone().split('/').pop().replace(/_/g, ' ');
    return head('<span>' + esc(dayFmt(w.today, { weekday: 'long', day: 'numeric', month: 'long' })) + ' · Week ' + g.week + ' of ' + esc(g.seasonTitle) + '</span><span class="etw-pill">' + esc(g.badge) + '</span>',
        '<div class="etw-meta">Times in ' + esc(city) + ' time · <a href="/c/schedule">Subscribe in your calendar</a></div>') +
      (w.unavailable.length ? '<p class="etw-note" role="status">Some things couldn’t be loaded just now (' + esc(w.unavailable.join(', ')) + '). The rest is up to date.</p>' : '') +
      (note ? '<p class="etw-note" role="note">' + esc(note) + '</p>' : '') +
      (state.msg ? '<p class="etw-err" role="alert">' + esc(state.msg) + '</p>' : '') +
      '<div class="etw-top3">' + practiceCard(w) + nextLiveCard(w) + countCard(w) + '</div>' +
      weekCard(w).replace('<section class="etw-card">', '<section class="etw-card" style="margin-bottom:16px">') +
      '<div class="etw-cols"><div class="etw-col">' + readingCard(w) + dueCard(w) + mentorCard(w) + '</div><div class="etw-col">' + oneSide(w) + hoursCard(w) + travelCard(w) + launchCard(w) + '</div></div>';
  }

  var root = null;
  function render() { if (root && document.body.contains(root)) root.innerHTML = html(); }
  function onClick(e) {
    var t = e.target.closest('[data-act]');
    if (!t || !root.contains(t)) return;
    var a = t.dataset.act;
    if (a === 'open-log') { state.logOpen = true; render(); var i = root.querySelector('#etw-min'); if (i) i.focus(); }
    else if (a === 'cancel-log') { state.logOpen = false; state.msg = ''; render(); }
    else if (a === 'open-line') { state.lineOpen = true; render(); var l = root.querySelector('#etw-line'); if (l) l.focus(); }
    else if (a === 'cancel-line') { state.lineOpen = false; state.msg = ''; render(); }
    else if (a === 'hours') { state.hours = !state.hours; render(); }
    else if (a === 'jump-due') { var d = root.querySelector('#etw-due'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (a === 'save-practice') {
      act('practice', function () { return call('/api/member/practice', { today: localToday(), minutes: Math.max(1, parseInt(state.minutes, 10) || 1) }).then(function () { state.logOpen = false; return call('/api/member/this-week?' + tzq()); }); });
    } else if (a === 'tick') {
      act('tick' + t.dataset.id, function () { return call('/api/member/this-week/assignment', { id: t.dataset.id, done: t.dataset.done === '1', today: localToday(), tz: myZone() }); });
    } else if (a === 'add-line') {
      act('line', function () { return call('/api/member/this-week/travelogue', { text: state.line, today: localToday() }).then(function (r) { state.line = ''; state.lineOpen = false; state.data.travelogue = r.travelogue; }); });
    } else if (a === 'remind') {
      var id = t.dataset.id;
      act('remind', function () { return call('/api/member/this-week/rsvp', { eventId: id }).then(function () { state.going[id] = true; }); });
    }
  }
  function onInput(e) { var k = e.target && e.target.dataset && e.target.dataset.in; if (k) state[k] = e.target.value; }

  // The page area Circle draws a space into (same lookup as the Schedule page)
  function pageContainer() {
    var all = document.querySelectorAll('div');
    for (var i = 0; i < all.length; i++) { var c = String(all[i].className || ''); if (c.indexOf('container-type:inline-size') >= 0 && c.indexOf('bg-secondary') >= 0) return all[i]; }
    return null;
  }
  var HOST = '[data-testid="circle-ai-shell-workspace-body"]';
  function mount() {
    if (!PAGE.test(location.pathname) || state.ok === false) return;
    if (root && document.body.contains(root)) return;
    var box = document.querySelector(HOST) || pageContainer();
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    root = document.createElement('div'); root.__box = box;
    root.className = 'etw'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'This week');
    root.addEventListener('click', onClick); root.addEventListener('input', onInput);
    box.insertBefore(root, box.firstChild);
    render();
  }
  // Someone who turns out not to be a mentee gets Circle's own page back
  function unmount() {
    if (!root) return;
    var box = root.__box; root.remove(); root = null;
    if (box) for (var i = 0; i < box.children.length; i++) box.children[i].style.display = '';
  }

  // ?epdebug=1 on a Circle address shows a small status badge (bottom left) for troubleshooting
  var DEBUG = /[?&]epdebug=1/.test(location.search);
  function badge() {
    if (!DEBUG || !document.body) return;
    var b = document.getElementById('etw-debug');
    if (!b) { b = document.createElement('div'); b.id = 'etw-debug'; b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;background:#20302A;color:#fff;font:12px/1.5 monospace;padding:10px 12px;border-radius:6px;max-width:340px;white-space:pre-wrap'; document.body.appendChild(b); }
    var u = window.circleUser;
    b.textContent = 'this-week.js loaded: yes\n' +
      'address matches /c/this-week: ' + (PAGE.test(location.pathname) ? 'yes' : 'NO (' + location.pathname + ')') + '\n' +
      'signed in to Circle: ' + (u && u.identityToken ? 'yes' : 'NO') + '\n' +
      'signed in to EP: ' + (state.session ? 'yes' : 'no') + '\n' +
      'allowed (mentee/admin): ' + (state.ok ? 'yes' : 'NO') + '\n' +
      'page data: ' + (state.data ? 'loaded' : state.error || 'not yet') + '\n' +
      'page area: ' + (pageContainer() ? 'schedule-style' : document.querySelector(HOST) ? 'workspace body' : 'NOT FOUND') + '\n' +
      'drawn: ' + (root && document.body.contains(root) ? 'yes' : 'no') + '\n' +
      'time: ' + Object.keys(T).filter(function (k) { return k.indexOf('server') < 0; }).map(function (k) { return k + ' ' + T[k]; }).join(' · ') + '\n' +
      'slow parts: ' + (T.serverAll || T.server || '-');
  }

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css(); setInterval(badge, 1000);
    // Draw straight away (last answer or a skeleton), then sign in and refresh; no need to wait for either
    state.ok = null; state.data = cached(); mount(); render();
    var t0 = Date.now();
    signIn().then(function () { lap('sign-in', t0); if (!state.ok) { unmount(); return; } mount(); render(); return load(); })
      .catch(function () { state.error = 'Please sign in to Circle to see your week.'; })
      .then(function () { mount(); render(); });
    // Keeps "Join" and today's date current; never while someone is typing
    setInterval(function () { if (root && document.body.contains(root) && !state.logOpen && !state.lineOpen && !state.line && !state.busy) { render(); } }, 60000);
  }
  if (DEBUG) setInterval(badge, 1000);
  start();
  // Circle is a single-page app: mount when someone navigates to the page
  var t = null;
  new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; start(); if (started) mount(); }, 300); }).observe(document.body, { childList: true, subtree: true });
})();
