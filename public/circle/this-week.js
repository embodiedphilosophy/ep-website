/* Embodied Philosophy · "This week" for Sahṛdaya Upāya mentees (ss.embodiedphilosophy.com/c/this-week)
   Loaded by public/circle/today.js (no extra Circle snippet needed). Draws the page in place of the space's content,
   the same way the Schedule page does (no frame). Mentees and Circle admins only: for anyone else it does nothing.
   Data: /api/member/this-week (lib/mentee/load.js). Practice log: /api/member/practice. See docs/mentee-this-week.md. */
(function () {
  if (window.__epThisWeek) return; window.__epThisWeek = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/this-week(-[a-z0-9]{3,10})?\/?$/;
  var SKEY = 'ep_week_session';
  var state = { session: null, first: '', ok: false, data: null, error: '', logOpen: false, minutes: '20', line: '', busy: '', msg: '', hours: false, going: {} };

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
  var tzq = function () { return 'today=' + localToday() + '&tz=' + encodeURIComponent(myZone()); };
  function load() {
    return call('/api/member/this-week?' + tzq()).then(function (d) { state.data = d; state.error = ''; })
      .catch(function (e) { state.error = e.status === 403 ? 'This page is for Sahṛdaya Upāya mentees.' : e.message; });
  }
  function act(key, fn) {
    state.busy = key; state.msg = ''; render();
    return fn().then(function (d) { if (d && d.due) state.data = d; }).catch(function (e) { state.msg = e.message; })
      .then(function () { state.busy = ''; render(); });
  }

  function css() {
    if (document.getElementById('etw-css')) return;
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Inter:wght@400;500;600&display=swap'; document.head.appendChild(l); }
    var s = document.createElement('style'); s.id = 'etw-css';
    s.textContent = [
      '.etw{font-family:inherit;color:#1E1A14;max-width:1120px;margin:0 auto;padding:28px 20px 64px;line-height:1.5}',
      '.etw *{box-sizing:border-box}',
      '.etw a{color:#A5432A;text-underline-offset:3px}',
      '.etw :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.etw-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}',
      '.etw-h1{margin:0;font:600 44px/1.05 "Cormorant Garamond",Georgia,serif}',
      '.etw-sub{margin:6px 0 0;color:#5A5346;font-size:16px}',
      '.etw-badge{flex:none;background:#20302A;color:#FAF5EB;font-size:12px;font-weight:600;letter-spacing:.04em;padding:7px 14px;border-radius:99px}',
      '.etw-warn{background:#EADDC6;border:1px solid #D8C9AE;border-radius:6px;padding:10px 14px;margin:0 0 14px;font-size:14px}',
      '.etw-row3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:16px}',
      '.etw-cols{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px;align-items:start}',
      '.etw-col{display:grid;gap:16px;min-width:0}',
      '.etw-card{background:#FAF5EB;border:1px solid #D8C9AE;border-radius:8px;padding:20px 22px;min-width:0}',
      '.etw-card h2{margin:0 0 10px;font:600 23px/1.15 "Cormorant Garamond",Georgia,serif}',
      '.etw-big{margin:0 0 12px;font:600 44px/1 "Cormorant Garamond",Georgia,serif;color:#20302A}',
      '.etw-big span{font:500 15px Inter,system-ui,sans-serif;color:#5A5346;margin-left:8px}',
      '.etw-strong{font-weight:600;color:#20302A;margin:0 0 2px}',
      '.etw-muted{color:#5A5346;font-size:14px;margin:0 0 6px}',
      '.etw-ok{color:#20302A;font-weight:600;font-size:14px;margin:0 0 8px}',
      '.etw-err{color:#9b2c16;font-size:14px;margin:6px 0 0}',
      '.etw-acts{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;align-items:center}',
      '.etw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 20px;border-radius:6px;border:1px solid #20302A;background:#20302A;color:#FAF5EB!important;font:600 15px inherit;font-family:inherit;cursor:pointer;text-decoration:none;white-space:nowrap}',
      '.etw-btn.ghost{background:transparent;color:#20302A!important}',
      '.etw-btn:disabled{opacity:.5;cursor:default}',
      '.etw-link{background:none;border:0;padding:0;min-height:44px;color:#A5432A;font:600 14px inherit;font-family:inherit;text-decoration:underline;cursor:pointer}',
      '.etw-bar{height:8px;background:#EADDC6;border-radius:99px;overflow:hidden}.etw-bar i{display:block;height:100%;background:#20302A}',
      '.etw-form{display:grid;gap:8px}.etw-form label{font-weight:600;color:#20302A;font-size:14px}',
      '.etw-form input,.etw-form textarea{width:100%;font:16px inherit;font-family:inherit;padding:10px 12px;border:1px solid #D8C9AE;border-radius:6px;background:#fff;min-height:44px;color:#1E1A14}',
      '.etw-days{list-style:none;margin:0;padding:0}',
      '.etw-days li{display:grid;grid-template-columns:84px minmax(0,1fr);gap:12px;padding:10px 0;border-top:1px solid #D8C9AE}.etw-days li:first-child{border-top:0}',
      '.etw-days li.today .dn{color:#A5432A}.etw .dn{font-weight:600;font-size:14px}',
      '.etw-dot{width:12px;height:12px;border-radius:50%;border:2px solid #20302A;display:inline-block;margin-left:6px;vertical-align:-1px}',
      '.etw-dot.done{background:#20302A}.etw-dot.future,.etw-dot.missed{border-color:#D8C9AE}.etw-dot.today{border-color:#A5432A}',
      '.etw-item{margin:0 0 4px;font-size:15px}',
      '.etw-sanskrit{font:600 26px/1.35 "Cormorant Garamond",Georgia,serif;margin:0 0 8px}',
      '.etw-trans{font-style:italic;font-size:17px;margin:0 0 6px}',
      '.etw-list{list-style:none;margin:0;padding:0}',
      '.etw-list li{padding:8px 0;border-top:1px solid #D8C9AE;font-size:15px}.etw-list li:first-child{border-top:0}',
      '.etw-task{display:flex;gap:10px;align-items:flex-start}',
      '.etw-tick{flex:none;width:44px;height:44px;margin:-8px -6px -8px -10px;background:none;border:0;padding:0;cursor:pointer;display:grid;place-items:center}',
      '.etw-tick b{width:24px;height:24px;border:2px solid #20302A;border-radius:6px;background:#fff;color:#FAF5EB;display:grid;place-items:center;font-size:15px;line-height:1}',
      '.etw-tick[aria-checked=true] b{background:#20302A}.etw-tick:disabled{opacity:.5}',
      '.etw-task.done .etw-strong{text-decoration:line-through;color:#5A5346}',
      '.etw-quote{margin:0 0 12px;padding:10px 14px;border-left:3px solid #A5432A;background:#fff;border-radius:0 6px 6px 0;font-size:15px}.etw-quote small{display:block;color:#5A5346;margin-top:4px}',
      '.etw-beads{display:grid;grid-template-columns:repeat(18,1fr);gap:4px;margin-bottom:10px}',
      '.etw-beads i{aspect-ratio:1;border-radius:50%;border:1.5px solid #D8C9AE;display:block}.etw-beads i.on{background:#A5432A;border-color:#A5432A}',
      '.etw-types li{display:flex;justify-content:space-between;gap:12px;font-size:14px}',
      '@media (max-width:900px){.etw-row3,.etw-cols{grid-template-columns:minmax(0,1fr)}}',
      '@media (max-width:700px){.etw{padding:20px 16px 48px}.etw-head{flex-direction:column}.etw-h1{font-size:34px}.etw-acts .etw-btn{width:100%}.etw-beads{grid-template-columns:repeat(12,1fr)}.etw-days li{grid-template-columns:70px minmax(0,1fr)}}'
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

  function card(title, inner) { return '<section class="etw-card"><h2>' + esc(title) + '</h2>' + inner + '</section>'; }

  function practiceCard(w) {
    var p = w.practice, b = state.busy === 'practice';
    var out = '<p class="etw-big">' + p.streak + '<span>day' + (p.streak === 1 ? '' : 's') + ' in a row</span></p>';
    if (p.reached) out += '<p class="etw-ok">' + p.reached + ' days. Beautifully done.</p>';
    if (state.logOpen) {
      out += '<div class="etw-form"><label for="etw-min">Minutes you sat today</label><input id="etw-min" type="number" inputmode="numeric" min="1" max="600" value="' + esc(state.minutes) + '" data-in="minutes">' +
        '<div class="etw-acts"><button type="button" class="etw-btn" data-act="save-practice"' + (b ? ' disabled' : '') + '>' + (b ? 'Saving…' : 'Save') + '</button><button type="button" class="etw-btn ghost" data-act="cancel-log">Cancel</button></div></div>';
    } else if (p.loggedToday) out += '<p class="etw-ok">Logged for today. <button type="button" class="etw-link" data-act="open-log">Change</button></p>';
    else out += '<button type="button" class="etw-btn" data-act="open-log">Log today’s practice</button>';
    return card('Practice', out);
  }
  function nextLiveCard(w) {
    var s = w.nextLive;
    if (!s) return card('Next live', '<p class="etw-muted">' + (w.unavailable.indexOf('sessions') >= 0 ? 'We couldn’t reach Circle just now.' : 'The next session will appear here.') + '</p>');
    var open = joinOpen(s, Date.now()), going = s.rsvped || state.going[s.id];
    var out = '<p class="etw-strong">' + esc(s.title) + '</p><p class="etw-muted">' + esc(fmt(s.start, { weekday: 'short', day: 'numeric', month: 'short' })) + ', ' + esc(fmt(s.start, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })) + '</p><div class="etw-acts">';
    if (open) out += link(s.url, 'Join', 'etw-btn');
    else {
      out += going ? '<span class="etw-ok">You’ll be reminded</span>' : '<button type="button" class="etw-btn" data-act="remind" data-id="' + esc(s.id) + '"' + (state.busy === 'remind' ? ' disabled' : '') + '>Remind me</button>';
      out += link(s.url, 'Open in Circle', 'etw-btn ghost');
    }
    return card('Next live', out + '</div>');
  }
  function countCard(w) {
    var d = w.due;
    return card('Due this week', '<p class="etw-big">' + d.done + '<span>of ' + d.total + ' done</span></p><div class="etw-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + d.total + '" aria-valuenow="' + d.done + '" aria-label="Assignments done this week"><i style="width:' + (d.total ? Math.round(d.done / d.total * 100) : 0) + '%"></i></div>');
  }
  function weekCard(w) {
    return card('The week ahead', '<ol class="etw-days">' + w.week.map(function (d) {
      var items = d.items.length ? d.items.map(function (it) {
        var t = it.url ? link(it.url, esc(it.title), '', !it.circle) : esc(it.title);
        return '<p class="etw-item">' + t + (it.start ? '<span class="etw-muted"> · ' + esc(fmt(it.start, { hour: 'numeric', minute: '2-digit' })) + '</span>' : '') + '</p>';
      }).join('') : '<span class="etw-muted">—</span>';
      return '<li class="' + (d.day === w.today ? 'today' : '') + '"><div><span class="dn">' + esc(dayFmt(d.day, { weekday: 'short', day: 'numeric' })) + '</span><i class="etw-dot ' + esc(d.dot) + '"' + (d.dot === 'done' ? ' role="img" aria-label="Practised"' : ' aria-hidden="true"') + '></i></div><div>' + items + '</div></li>';
    }).join('') + '</ol>');
  }
  function readingCard(w) {
    var r = w.reading;
    if (!r) return card('This week’s reading', '<p class="etw-muted">This week’s reading will be here before the session.</p>');
    return card('This week’s reading', (r.sanskrit ? '<p class="etw-sanskrit" lang="sa">' + esc(r.sanskrit) + '</p>' : '') + (r.translation ? '<p class="etw-trans">' + esc(r.translation) + '</p>' : '') + (r.citation ? '<p class="etw-muted">' + esc(r.citation) + '</p>' : '') +
      '<div class="etw-acts">' + link(r.url, 'Open reading', 'etw-btn') + link(w.workbookUrl, 'Apprentice Workbook', 'etw-btn ghost') + '</div>');
  }
  function dueCard(w) {
    var items = w.due.items;
    return card('Due this week', (items.length ? '<ul class="etw-list">' + items.map(function (a) {
      var meta = [a.where, a.due && 'due ' + dayFmt(a.due, { weekday: 'short', day: 'numeric', month: 'short' })].filter(Boolean).join(' · ');
      return '<li><div class="etw-task' + (a.done ? ' done' : '') + '"><button type="button" class="etw-tick" role="checkbox" aria-checked="' + a.done + '" aria-label="' + esc(a.title + ': ' + (a.done ? 'done' : 'not done')) + '" data-act="tick" data-id="' + esc(a.id) + '" data-done="' + (a.done ? '0' : '1') + '"' + (state.busy === 'tick' + a.id ? ' disabled' : '') + '><b>' + (a.done ? '✓' : '') + '</b></button>' +
        '<div>' + (safeUrl(a.url) ? link(a.url, esc(a.title), 'etw-strong') : '<span class="etw-strong">' + esc(a.title) + '</span>') + '<p class="etw-muted">' + esc(meta) + '</p></div></div></li>';
    }).join('') + '</ul>' : '<p class="etw-muted">Nothing is due this week.</p>'));
  }
  function mentorCard(w) {
    var m = w.mentorship, out = '';
    m.feedback.forEach(function (f) { out += '<blockquote class="etw-quote"><p style="margin:0">' + esc(f.notes) + '</p><small>Jacob' + (f.date ? ', ' + esc(dayFmt(f.date, { day: 'numeric', month: 'short' })) : '') + '</small></blockquote>'; });
    if (m.posts.length) out += '<ul class="etw-list">' + m.posts.map(function (p) { return '<li>' + (safeUrl(p.url) ? link(p.url, esc(p.title), 'etw-strong') : '<span class="etw-strong">' + esc(p.title) + '</span>') + '<p class="etw-muted">' + esc([p.who, p.replies ? p.replies + (p.replies === 1 ? ' reply' : ' replies') : ''].filter(Boolean).join(' · ')) + '</p></li>'; }).join('') + '</ul>';
    if (!m.feedback.length && !m.posts.length) out += '<p class="etw-muted">Threads from the Mentorship Circle and Jacob’s notes will gather here.</p>';
    return card('Mentorship', out + '<div class="etw-acts">' + link(m.circleUrl, 'Open the Mentorship Circle', 'etw-btn ghost') + link(m.messageUrl, 'Message Jacob', 'etw-btn', true) + '</div>');
  }
  function oneCard(w) {
    var o = w.oneToOne, out = '<p class="etw-muted">45 minutes, in the last week of the month, in the UK evening.</p>';
    if (o) out += '<p class="etw-strong">Book for ' + esc(dayFmt(o.from, { day: 'numeric', month: 'long' }) + ' – ' + dayFmt(o.to, { day: 'numeric', month: 'long' })) + '</p>' + link(o.url, 'Choose a time', 'etw-btn', true);
    else out += '<p class="etw-muted">Booking opens about three weeks before the last week of the month.</p>';
    return card('One-to-one with Jacob', out);
  }
  function malaCard(w) {
    var m = w.mala, beads = ''; for (var i = 0; i < 108; i++) beads += '<i' + (i < m.filled ? ' class="on"' : '') + '></i>';
    return card('Your mālā', '<div class="etw-beads" role="img" aria-label="' + m.filled + ' of 108 beads filled">' + beads + '</div><p class="etw-muted">' + m.days + ' practice day' + (m.days === 1 ? '' : 's') + (m.round > 1 ? ' · round ' + m.round : '') + ' · next milestone ' + m.next + '</p>');
  }
  function hoursCard(w) {
    var f = w.formation;
    if (!f) return card('Formation hours', '<p class="etw-muted">Your hours record isn’t available just now.</p>');
    var out = '<p class="etw-big">' + f.total + '<span>of ' + f.target + ' hours</span></p><ul class="etw-list etw-types">' + f.byType.map(function (t) { return '<li><span>' + esc(t.type) + '</span><b>' + t.hours + ' h</b></li>'; }).join('') + '</ul>' +
      '<button type="button" class="etw-link" data-act="hours" aria-expanded="' + state.hours + '">' + (state.hours ? 'Hide record' : 'View record') + '</button>';
    if (state.hours) out += f.entries.length ? '<ul class="etw-list etw-types">' + f.entries.map(function (e) { return '<li><span>' + esc(dayFmt(e.day, { day: 'numeric', month: 'short' })) + '</span><span>' + esc(e.note || e.component) + '</span><b>' + e.hours + ' h</b></li>'; }).join('') + '</ul>' : '<p class="etw-muted">No hours have been credited yet.</p>';
    return card('Formation hours', out);
  }
  function travelCard(w) {
    var b = state.busy === 'line';
    return card('Inner Travelogue', '<p class="etw-muted">One private line before the day begins. Only you can see this.</p><div class="etw-form"><label for="etw-line" style="position:absolute;left:-9999px">Today’s line</label>' +
      '<textarea id="etw-line" rows="2" maxlength="1000" placeholder="What is moving in you today?" data-in="line">' + esc(state.line) + '</textarea><div class="etw-acts"><button type="button" class="etw-btn" data-act="add-line"' + (b ? ' disabled' : '') + '>' + (b ? 'Saving…' : 'Add a line') + '</button></div></div>' +
      (w.travelogue.length ? '<ul class="etw-list">' + w.travelogue.map(function (l) { return '<li><span class="etw-muted">' + esc(dayFmt(l.day, { day: 'numeric', month: 'short' })) + '</span> ' + esc(l.text) + '</li>'; }).join('') + '</ul>' : ''));
  }
  function launchCard(w) {
    if (!w.launches.length) return '';
    return card('Coming soon at EP', '<ul class="etw-list">' + w.launches.map(function (l) {
      var when = /^\d{4}-\d\d-\d\d$/.test(l.date) ? dayFmt(l.date, { day: 'numeric', month: 'long' }) : l.date;
      return '<li>' + (safeUrl(l.url) ? link(l.url, esc(l.title), 'etw-strong', true) : '<span class="etw-strong">' + esc(l.title) + '</span>') + '<p class="etw-muted">' + esc([when, l.line].filter(Boolean).join(' · ')) + '</p></li>';
    }).join('') + '</ul>');
  }

  function html() {
    if (state.error && !state.data) return '<div class="etw-head"><div><h1 class="etw-h1">This week</h1><p class="etw-sub">' + esc(state.error) + '</p></div></div>';
    var w = state.data;
    if (!w) return '<p class="etw-sub">Opening your week…</p>';
    var g = w.greeting, note = clockNote(w.today);
    return '<div class="etw-head"><div><h1 class="etw-h1">' + esc(hello() + (g.firstName || state.first ? ', ' + (g.firstName || state.first) : '')) + '</h1><p class="etw-sub">' + esc(dayFmt(w.today, { weekday: 'long', day: 'numeric', month: 'long' })) + ' · Week ' + g.week + ' of ' + esc(g.seasonTitle) + '</p></div><span class="etw-badge">' + esc(g.badge) + '</span></div>' +
      (w.unavailable.length ? '<p class="etw-warn" role="status">Some things couldn’t be loaded just now (' + esc(w.unavailable.join(', ')) + '). The rest is up to date.</p>' : '') +
      (note ? '<p class="etw-warn" role="note">' + esc(note) + '</p>' : '') +
      (state.msg ? '<p class="etw-err" role="alert">' + esc(state.msg) + '</p>' : '') +
      '<div class="etw-row3">' + practiceCard(w) + nextLiveCard(w) + countCard(w) + '</div>' +
      '<div class="etw-cols"><div class="etw-col">' + weekCard(w) + readingCard(w) + dueCard(w) + mentorCard(w) + '</div><div class="etw-col">' + oneCard(w) + malaCard(w) + hoursCard(w) + travelCard(w) + launchCard(w) + '</div></div>';
  }

  var root = null;
  function render() { if (root && document.body.contains(root)) root.innerHTML = html(); }
  function onClick(e) {
    var t = e.target.closest('[data-act]');
    if (!t || !root.contains(t)) return;
    var a = t.dataset.act;
    if (a === 'open-log') { state.logOpen = true; render(); var i = root.querySelector('#etw-min'); if (i) i.focus(); }
    else if (a === 'cancel-log') { state.logOpen = false; state.msg = ''; render(); }
    else if (a === 'hours') { state.hours = !state.hours; render(); }
    else if (a === 'save-practice') {
      act('practice', function () { return call('/api/member/practice', { today: localToday(), minutes: Math.max(1, parseInt(state.minutes, 10) || 1) }).then(function () { state.logOpen = false; return call('/api/member/this-week?' + tzq()); }); });
    } else if (a === 'tick') {
      act('tick' + t.dataset.id, function () { return call('/api/member/this-week/assignment', { id: t.dataset.id, done: t.dataset.done === '1', today: localToday(), tz: myZone() }); });
    } else if (a === 'add-line') {
      act('line', function () { return call('/api/member/this-week/travelogue', { text: state.line, today: localToday() }).then(function (r) { state.line = ''; state.data.travelogue = r.travelogue; }); });
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
  function mount() {
    if (!PAGE.test(location.pathname) || !state.ok) return;
    if (root && document.body.contains(root)) return;
    var box = pageContainer();
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    root = document.createElement('div');
    root.className = 'etw'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'This week');
    root.addEventListener('click', onClick); root.addEventListener('input', onInput);
    box.insertBefore(root, box.firstChild);
    render();
  }

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css();
    signIn().then(function () { if (state.ok) return load(); }).catch(function () { state.error = 'Please sign in to Circle to see your week.'; }).then(function () { mount(); render(); });
    // Keeps "Join" and today's date current; never while someone is typing
    setInterval(function () { if (root && document.body.contains(root) && !state.logOpen && !state.line && !state.busy) { render(); } }, 60000);
  }
  start();
  // Circle is a single-page app: mount when someone navigates to the page
  var t = null;
  new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; start(); if (started) mount(); }, 300); }).observe(document.body, { childList: true, subtree: true });
})();
