/* Embodied Philosophy · Today for Circle (ss.embodiedphilosophy.com)
   Loaded by one line in Circle → Settings → Code snippets → JavaScript:
     (function(){var s=document.createElement('script');s.src='https://www.embodiedphilosophy.com/circle/today.js';s.defer=true;document.head.appendChild(s);})();
   Draws the Today page at /c/today for every signed-in member, whatever they have bought: the free practice layer on
   top (today's sit and timer, the streak and mālā, the teaching, the moon and sacred days), then one card per
   programme they are in and a locked card for each they are not. The Home feed is left as Circle made it.
   Data comes from one call, /api/member/today (lib/member/today.js). Admins preview a membership with ?as=<tier>
   and the suggestion with ?nudge=1. Circle admins also see the mentor view (the Sahṛdaya Upāya cohort's practice,
   and portfolio pages mentees chose to share) at the top. The Practice Portfolio itself is /c/portfolio. */
(function () {
  if (window.__epToday) return; window.__epToday = true;
  // The CE credits page (/c/ce-credits) has its own script; load it here so Circle needs no extra snippet.
  if (!window.__epCe) { var ce = document.createElement('script'); ce.src = 'https://www.embodiedphilosophy.com/circle/ce.js'; ce.defer = true; document.head.appendChild(ce); }
  // The Practice Portfolio (/c/portfolio) likewise
  if (!window.__epPortfolio) { var pf = document.createElement('script'); pf.src = 'https://www.embodiedphilosophy.com/circle/portfolio.js'; pf.defer = true; document.head.appendChild(pf); }
  // …and the Schedule (/c/schedule)
  if (!window.__epSchedule) { var sc = document.createElement('script'); sc.src = 'https://www.embodiedphilosophy.com/circle/schedule.js'; sc.defer = true; document.head.appendChild(sc); }
  // …and "This week" for Sahṛdaya Upāya mentees (/c/this-week; does nothing for anyone else)
  // …and a troubleshooting helper that only shows with ?epdebug=1 (copies the page's structure for the restyle)
  if (!window.__epProbe) { var pr = document.createElement('script'); pr.src = 'https://www.embodiedphilosophy.com/circle/probe.js'; pr.defer = true; document.head.appendChild(pr); }
  // …and the chat restyle for Sādhana School students and mentees (does nothing for anyone else)
  if (!window.__epChatSkin) { var cs = document.createElement('script'); cs.src = 'https://www.embodiedphilosophy.com/circle/chat-skin.js'; cs.defer = true; document.head.appendChild(cs); }
  // …and "My Practice", the Meditation Pass homepage (/c/my-practice; does nothing for anyone else)
  if (!window.__epMyPractice) { var mp = document.createElement('script'); mp.src = 'https://www.embodiedphilosophy.com/circle/my-practice.js'; mp.defer = true; document.head.appendChild(mp); }
  // …and the Library by department (/c/library)
  if (!window.__epLibrary) { var lb = document.createElement('script'); lb.src = 'https://www.embodiedphilosophy.com/circle/library.js'; lb.defer = true; document.head.appendChild(lb); }
  if (!window.__epThisWeek) { var tw = document.createElement('script'); tw.src = 'https://www.embodiedphilosophy.com/circle/this-week.js'; tw.defer = true; document.head.appendChild(tw); }

  var API = 'https://www.embodiedphilosophy.com';
  var SITE = 'https://www.embodiedphilosophy.com';
  var TIERS = ['none', 'meditation', 'wisdom', 'wisdom_plus', 'ss_season', 'ss_year', 'mentee'];
  // Upgrades and seasonal credits come worked out from the server (lib/member/pricing.js): state.offer.
  var BOOKING = 'https://calendly.com/embodied-philosophy/sah-daya-upaya-monthly-1-1-mentorship';
  var PAGE = /^\/c\/today\/?$/; // the "Today" space in Circle (open to every member)
  var PORTFOLIO_FOR = ['ss_season', 'ss_year', 'mentee']; // who keeps a Practice Portfolio (/c/portfolio)
  var state = { session: null, tier: null, seasons: [], first: '', practice: null, data: null, form: false, len: 20, timer: null, line: '', lineOpen: false, lineBusy: false, lineErr: '', lines: null, saving: false, error: '', why: false, offer: null, preview: false, cohort: null, cohortErr: '', pick: '' };

  var EYEBROW = {
    none: 'Your practice · Today', meditation: 'Meditation Pass · Today', wisdom: 'Wisdom School · Today',
    wisdom_plus: 'Wisdom School Plus · Today', ss_season: 'Sādhana School · {season} · Today', ss_year: 'Sādhana School · Today',
    mentee: 'Sahṛdaya Upāya · Today'
  };
  // One suggestion per membership, shown once the member has practised `at` days (in a row, or in the last
  // eight weeks). Dismissed suggestions stay hidden for the season.
  var NUDGES = {
    none: { at: 7, eyebrow: 'Seven days in', title: 'Keep practising, with company', body: 'Meditation Mondays is a live sit with EP faculty every Monday at 12:00 ET. Your practice log comes with you.', cta: 'Start a 7-day free trial', note: 'Then $9.99/mo or $99/yr', href: SITE + '/meditation-pass' },
    meditation: { at: 21, eyebrow: 'Twenty-one days in', title: 'Go further between Mondays', body: 'Wisdom School adds this year’s Pilgrimage Project and a full learning pathway, Meditation for Real Life, to your Mondays.', cta: 'See Wisdom School', note: '$27/mo or $297 a year', href: SITE + '/wisdom-school' },
    wisdom: { at: 21, eyebrow: 'Twenty-one days in', title: 'Every pathway, and the certificates', body: 'Wisdom School Plus opens every learning pathway and four certificate programs, the Yoga Philosophy Certificate among them.', cta: 'See Wisdom School Plus', note: '$49/mo or $497 a year', href: SITE + '/wisdom-school' },
    wisdom_plus: { at: 40, eyebrow: 'Forty days of practice', title: 'Study within a living lineage', body: 'Sādhana School is EP’s deeper path: live Wednesday sessions, a cohort, and the daily practice of Sahṛdaya Meditation. This winter’s season is Poetry as Philosophy.', cta: 'See the Winter season', note: '$497 for the season, or the full year', href: SITE + '/sadhana-school' },
    ss_year: { at: 40, eyebrow: 'Forty days of practice', title: 'Teach from your practice', body: 'Sahṛdaya Upāya is the 100-hour formation in Subtle Liberation-Based Teaching: Sunday Practicums after the Open Sessions you already attend, and a monthly one-to-one with Jacob.', cta: 'Read about Sahṛdaya Upāya', note: '+$1,300 on your year', href: SITE + '/sahrdaya-upaya' }
  };
  function seasonKey() { var d = new Date(), m = d.getMonth(); return d.getFullYear() + '-' + (m < 2 ? 'w' : m < 5 ? 'sp' : m < 8 ? 'su' : 'f'); }
  function local(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function nudgeKey() { return 'ep_nudge_' + state.tier + '_' + seasonKey(); }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function longDate(s) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'long', timeZone: 'UTC' }); } catch (e) { return s; } }
  // The server's offer for this person (a Sādhana School upgrade or a seasonal-sādhana credit), unless hidden
  function offer(evenHidden) {
    var o = state.offer;
    if (!o || !o.options || !o.options.length) return null;
    if (!evenHidden && local('ep_offer_' + o.key) === 'hidden' && !state.preview) return null;
    return o;
  }
  function offerHtml(o) {
    return '<div class="ept-nudge" role="note" aria-label="' + esc(o.title) + '"><div class="ept-nt"><span class="ept-l ept-red">' + esc(o.eyebrow) + (o.until ? ' · until ' + esc(longDate(o.until)) : '') + '</span>' +
      '<button type="button" class="ept-x" data-act="offer-hide" data-key="' + esc(o.key) + '" aria-label="Hide this offer">×</button></div>' +
      '<strong class="ept-n-h">' + esc(o.title) + '</strong><span>' + esc(o.body) + '</span>' +
      '<div class="ept-row">' + o.options.map(function (x, i) { return '<a class="ept-q' + (i === o.options.length - 1 ? ' ept-q-red' : '') + '" href="' + esc(x.href) + '">' + esc(/\$/.test(x.label) ? x.label : x.label + ' · ' + money(x.price)) + '</a>'; }).join('') +
      (o.note ? '<span class="ept-s">' + esc(o.note) + '</span>' : '') + '</div>' +
      '<button type="button" class="ept-why" data-act="why" aria-expanded="' + state.why + '">Why am I seeing this?</button>' +
      (state.why ? '<span class="ept-s ept-whyt">' + esc(o.why) + ' Hide this with × if it isn’t for you.</span>' : '') + '</div>';
  }
  function nudge() {
    var n = NUDGES[state.tier], p = state.practice;
    if (!n || !n.href || !p) return null;
    if (n.fallOnly && (state.seasons.length !== 1 || state.seasons[0] !== 'fall')) return null;
    var forced = isAdmin() && /[?&]nudge=1/.test(location.search);
    if (!forced && local(nudgeKey()) === 'hidden') return null;
    var days = 0; (p.grid || []).forEach(function (col) { col.forEach(function (c) { if (c.state === 'done') days++; }); });
    if (!forced && Math.max(p.streak || 0, days) < n.at) return null;
    return n;
  }

  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function localToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function niceDate(s) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return s; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

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

  // Admin preview of an offer, worked out by the server: ?as=<tier>&season=fall,winter&credit=79&day=2027-02-03
  function previewParams() {
    var q = location.search, g = function (k) { return (q.match(new RegExp('[?&]' + k + '=([^&]+)')) || [])[1]; };
    if (!g('as') && !g('credit') && !g('day')) return null;
    return { tier: g('as') || 'none', seasons: (g('season') || (g('as') === 'ss_season' ? 'fall' : '')).split(',').filter(Boolean), credit: g('credit') || 0, day: g('day') || '' };
  }
  function signIn() {
    var pv = previewParams();
    var saved = pv ? null : store('ep_today_session');
    if (saved) { try { var s = JSON.parse(saved); if (s.until > Date.now()) { state.session = s.session; state.tier = s.tier; state.seasons = s.seasons || []; state.offer = s.offer || null; state.admin = !!s.admin; state.first = s.first; return Promise.resolve(); } } catch (e) {} }
    return waitForUser(25).then(function (u) {
      return api('/api/member/session', { method: 'POST', body: { identityToken: u.identityToken, preview: pv || undefined } });
    }).then(function (r) {
      state.session = r.session; state.tier = r.tier && r.tier.tier; state.seasons = (r.tier && r.tier.seasons) || []; state.offer = r.offer || null; state.first = r.firstName || ''; state.admin = !!r.admin;
      state.preview = !!pv;
      if (!pv) store('ep_today_session', JSON.stringify({ session: r.session, tier: state.tier, seasons: state.seasons, offer: state.offer, admin: state.admin, first: state.first, until: Date.now() + 10 * 60 * 60 * 1000 }));
    });
  }

  function asParam() { var a = (location.search.match(/[?&]as=([a-z_]+)/) || [])[1]; return a && isAdmin() && TIERS.indexOf(a) >= 0 ? '&as=' + a : ''; }
  function zone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
  function loadData() {
    return Promise.all([
      api('/api/member/today?today=' + localToday() + '&tz=' + encodeURIComponent(zone()) + asParam()).then(function (d) { state.data = d; state.practice = d.practice; if (!d.practice) state.error = 'Your practice log isn’t connected yet'; }).catch(function (e) { state.error = e.message; state.failed = true; }),
      mentorView() ? api('/api/member/cohort?today=' + localToday()).then(function (c) { state.cohort = c; }).catch(function (e) { state.cohortErr = e.message; }) : null,
      mentorView() ? api('/api/member/portfolio?shared=1&today=' + localToday()).then(function (r) { state.shared = r.pages || []; }).catch(function () { state.shared = []; }) : null
    ]);
  }
  // Mentor view: Circle admins on /c/today, unless previewing a member's view with ?as=
  function mentorView() { return isAdmin() && !/[?&]as=/.test(location.search); }
  function heat(grid, big) {
    return '<div class="ept-heat' + (big ? ' ept-heat-l' : '') + '" role="img" aria-label="Last eight weeks of practice">' + grid.map(function (col) {
      return '<div class="ept-col">' + col.map(function (c) { return '<span class="ept-d ' + c.state + '" title="' + esc(c.day) + '"></span>'; }).join('') + '</div>';
    }).join('') + '</div>';
  }
  // Nothing logged yet (no practised square in the last eight weeks): show a welcome instead of a bare zero.
  function emptyLog(p) { return !!p && !p.streak && !(p.grid || []).some(function (col) { return col.some(function (c) { return c.state === 'done'; }); }); }
  function lastText(r) { return r.last === null ? 'No practice logged yet' : r.daysSince === 0 ? 'Practised today' : r.daysSince === 1 ? 'Last practised yesterday' : 'Last practised ' + r.daysSince + ' days ago'; }
  // Portfolio pages mentees chose to share with Jacob (only shared pages ever reach here)
  function sharedPage(p, open) {
    var d = p.data || {}, body = '';
    if (p.kind === 'week') {
      body = (d.answers || []).map(function (a, i) { return a ? '<p><b>' + ['Emerging patterns', 'Turning points', 'Integration into life', 'Commitment adjustment'][i] + '.</b> ' + esc(a) + '</p>' : ''; }).join('');
    } else {
      var facts = [d.minutes ? d.minutes + ' min' : '', d.quality, (d.bodies || []).join(', '), d.energy, d.aware].filter(Boolean).join(' · ');
      body = (facts ? '<p class="ept-s">' + esc(facts) + '</p>' : '') + (d.feel ? '<p>' + esc(d.feel) + '</p>' : '') +
        (d.reflections || []).map(function (r, i) { return r ? '<p><b>' + ['Felt sense', 'Insight', 'Obstacle', 'Integration'][i] + '.</b> ' + esc(r) + '</p>' : ''; }).join('') +
        (d.dedication ? '<p><em>' + esc(d.dedication) + '</em></p>' : '');
    }
    return '<details class="ept-sh"' + (open ? ' open' : '') + '><summary><strong>' + esc(p.name || p.email) + '</strong> · ' + (p.kind === 'week' ? 'weekly reflection, week of ' : '') + esc(niceDate(p.day)) + '</summary>' + body + '</details>';
  }
  function sharedHtml(list, mine) {
    if (!list.length) return mine ? '<span class="ept-s">No portfolio pages shared yet.</span>' : '';
    return '<div class="ept-l">' + (mine ? 'Portfolio pages shared with you' : 'Recently shared with you') + '</div>' + list.map(function (p, i) { return sharedPage(p, mine && i === 0); }).join('');
  }
  // Formation hours toward the 100-hour certificate. Mentees see their own record; mentors credit hours per mentee.
  function fmtH(n) { return (Math.round(n * 100) / 100).toString(); }
  function fmBar(f) { return '<div class="ept-bar" role="img" aria-label="' + fmtH(f.total) + ' of ' + f.target + ' hours"><span style="width:' + Math.min(100, f.total / f.target * 100) + '%"></span></div>'; }
  function fmRows(f) {
    return '<div class="ept-fm" role="list">' + f.components.map(function (c) {
      return '<div class="ept-fr" role="listitem"><span><span class="ept-t">' + esc(c.name) + '</span><span class="ept-s">' + esc(c.what) + ' · ' + esc(c.type) + '</span></span><span class="ept-mono">' + fmtH(c.credited) + ' / ' + c.target + '</span></div>';
    }).join('') + '</div>';
  }
  function fmtMentor(m) {
    var f = (state.fm || {})[m.email];
    if (!f) return '<div class="ept-l">Formation hours</div><span class="' + (state.fmErr ? 'ept-err' : 'ept-s') + '">' + esc(state.fmErr || 'Loading…') + '</span>';
    var names = {}; f.components.forEach(function (c) { names[c.id] = c.name; });
    return '<div class="ept-l">Formation hours</div><span class="ept-s"><b class="ept-mono">' + fmtH(f.total) + '</b> of ' + f.target + ' hrs credited</span>' + fmBar(f) + fmRows(f) +
      '<form class="ept-fmf" data-form="credit" data-email="' + esc(m.email) + '"><span class="ept-l">Credit hours</span>' +
        '<label class="ept-s">Counts toward <select name="component" class="ept-in ept-sel">' + f.components.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></label>' +
        '<div class="ept-row"><label class="ept-s">Hours <input class="ept-in" name="hours" type="number" step="0.25" min="0.25" max="40" inputmode="decimal" required></label>' +
        '<label class="ept-s">Date <input class="ept-in ept-date" name="day" type="date" value="' + localToday() + '" required></label></div>' +
        '<label class="ept-s">Note (optional) <input class="ept-in ept-note" name="note" maxlength="200" placeholder="e.g. October immersion"></label>' +
        '<div><button class="ept-btn" type="submit"' + (state.fmSaving ? ' disabled' : '') + '>' + (state.fmSaving ? 'Saving…' : 'Credit hours') + '</button></div>' +
        (state.fmErr ? '<span class="ept-err">' + esc(state.fmErr) + '</span>' : '') + '</form>' +
      (f.entries.length ? '<details class="ept-sh"><summary>' + f.entries.length + ' credited ' + (f.entries.length === 1 ? 'entry' : 'entries') + '</summary>' + f.entries.map(function (x) {
        return '<div class="ept-fr"><span><span class="ept-t">' + esc(names[x.component] || x.component) + ' · ' + fmtH(x.hours) + ' hrs</span><span class="ept-s">' + esc(niceDate(x.day)) + (x.note ? ' · ' + esc(x.note) : '') + '</span></span>' +
          '<button type="button" class="ept-q" data-fmdel="' + esc(x.id) + '" data-email="' + esc(m.email) + '" aria-label="Remove this entry">Remove</button></div>';
      }).join('') + '</details>' : '');
  }
  function loadFm(email) {
    if (!email || (state.fm || {})[email]) return;
    state.fmErr = '';
    api('/api/member/formation?email=' + encodeURIComponent(email)).then(function (f) { (state.fm = state.fm || {})[email] = f; }).catch(function (e) { state.fmErr = e.message; }).then(render);
  }
  function cohortHtml() {
    var c = state.cohort;
    var out = '<section class="ept-card ept-wide" aria-labelledby="ept-co"><div class="ept-ch"><h2 id="ept-co" class="ept-h2">Your cohort</h2><span class="ept-l">Sahṛdaya Upāya · mentor view</span></div>';
    if (!c) return out + '<span class="' + (state.cohortErr ? 'ept-err' : 'ept-s') + '">' + esc(state.cohortErr || 'Loading…') + '</span></section>';
    if (!c.rows.length) return out + '<span class="ept-s">No one has the mentorship tag in Kit yet.</span></section>';
    out += '<span class="ept-s">Practice signals only: days and minutes. How a practice felt, and anything written in the Inner Travelogue, stays with the mentee, unless they share a portfolio page with you.</span>';
    if (c.attention.length) {
      out += '<div class="ept-l">Worth a word this week</div><div class="ept-chips">' + c.attention.map(function (a) {
        return '<button type="button" class="ept-att' + (a.good ? ' good' : '') + '" data-pick="' + esc(a.email) + '"><strong>' + esc(a.name) + '</strong> · ' + esc(a.why) + '</button>';
      }).join('') + '</div>';
    }
    out += '<div class="ept-tbl" role="list"><div class="ept-tr ept-th" aria-hidden="true"><span>Mentee</span><span>Streak</span><span>This week</span><span>8 weeks</span><span>Last practice</span></div>';
    out += c.rows.map(function (r) {
      return '<button type="button" role="listitem" class="ept-tr" data-pick="' + esc(r.email) + '" aria-pressed="' + (state.pick === r.email) + '"><span class="ept-t">' + esc(r.name) + '</span><span class="ept-mono">' + r.streak + 'd</span><span class="ept-mono">' + r.weekCount + '/7</span><span class="ept-mono">' + r.days8w + ' days · ' + Math.round(r.minutes8w / 60 * 10) / 10 + ' h</span><span class="ept-s">' + esc(lastText(r)) + '</span></button>';
    }).join('') + '</div>';
    var m = c.rows.filter(function (r) { return r.email === state.pick; })[0];
    if (m) {
      out += '<div class="ept-det" aria-live="polite"><div class="ept-ch"><h3 class="ept-h2">' + esc(m.name) + '</h3><a class="ept-q" href="mailto:' + esc(m.email) + '">Email</a></div>' +
        '<span class="ept-s">' + m.streak + '-day streak · ' + m.weekCount + ' of 7 this week · ' + esc(lastText(m)) + '</span>' + heat(m.grid, true) +
        fmtMentor(m) + sharedHtml((state.shared || []).filter(function (p) { return p.email === m.email; }), true) + '</div>';
    }
    if (!m) out += sharedHtml((state.shared || []).slice(0, 5), false);
    return out + '</section>';
  }

  function css() {
    if (document.getElementById('ept-css')) return;
    var s = document.createElement('style'); s.id = 'ept-css';
    s.textContent = [
      '.ept{background:#FBF6EE;border:1px solid #E3D8C6;border-radius:6px;box-shadow:inset 0 3px 0 #A5432A;padding:18px 20px;margin:0 0 14px;font-family:inherit;color:#1E1A14}',
      '.ept *{box-sizing:border-box}',
      '.ept-pf{color:#A5432A;text-decoration:underline;text-underline-offset:3px}',
      '.ept-sh{border-top:1px solid #E3D8C6;padding:10px 0;font-size:13px}',
      '.ept-sh summary{cursor:pointer;min-height:32px;display:flex;align-items:center;gap:4px}',
      '.ept-sh p{margin:6px 0 0;line-height:1.5}',
      '.ept-top{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:12px}',
      '.ept-eye{font:500 10.5px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em;color:#A5432A;text-transform:uppercase}',
      '.ept-h{margin:2px 0 0;font:600 26px/1.1 "Cormorant Garamond",Georgia,serif}',
      '.ept-h em{color:#A5432A}',
      '.ept-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1px;background:#FFFDF8;border:1px solid #E3D8C6;border-radius:4px;overflow:hidden}',
      '.ept-cell{background:#FFFDF8;padding:14px;display:flex;flex-direction:column;gap:8px;box-shadow:0 0 0 1px #E3D8C6}',
      '.ept-l{font:500 10.5px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em;color:#6B6152;text-transform:uppercase}',
      '.ept-big{font:500 24px/1 "IBM Plex Mono",ui-monospace,monospace;color:#A5432A}',
      '.ept-big small{font-size:11px;color:#6B6152}',
      '.ept-t{font-weight:600;line-height:1.3}',
      '.ept-s{font-size:12px;color:#6B6152}',
      '.ept-btn{background:#A5432A;color:#fff;border:0;border-radius:4px;min-height:38px;padding:0 14px;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}',
      '.ept-btn:hover{background:#83341F;color:#fff}',
      '.ept-btn:disabled{opacity:.5;cursor:default}',
      '.ept-q{background:transparent;border:1px solid #D8C9AE;border-radius:4px;min-height:38px;padding:0 12px;font-size:13px;color:#1E1A14;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}',
      '.ept-q:hover{border-color:#1E1A14}',
      '.ept-chips{display:flex;flex-wrap:wrap;gap:6px}',
      '.ept-chip{background:transparent;border:1px solid #D8C9AE;border-radius:999px;min-height:32px;padding:0 11px;font-size:12.5px;cursor:pointer;color:#1E1A14}',
      '.ept-chip[aria-pressed="true"]{background:#1E1A14;color:#FBF6EE;border-color:#1E1A14}',
      '.ept-form{grid-column:1/-1;background:#FFFDF8;padding:14px;display:flex;flex-direction:column;gap:10px}',
      '.ept-in{width:90px;min-height:38px;border:1px solid #D8C9AE;border-radius:4px;padding:0 10px;background:#fff}',
      '.ept-heat{display:grid;grid-template-columns:repeat(8,12px);gap:3px}',
      '.ept-col{display:grid;grid-template-rows:repeat(7,12px);gap:3px}',
      '.ept-d{width:12px;height:12px;border-radius:2px;background:#E8D9C2}',
      '.ept-d.done{background:#A5432A}.ept-d.today{background:transparent;box-shadow:inset 0 0 0 1.5px #A5432A}.ept-d.future{background:transparent;box-shadow:inset 0 0 0 1px #E3D8C6}',
      '.ept-ms{grid-column:1/-1;background:#A5432A;color:#fff;padding:12px 14px;font-size:13px}',
      '.ept-err{font-size:12px;color:#83341F}',
      '.ept :focus-visible,.ept-page :focus-visible{outline:2px solid #A5432A;outline-offset:2px}',
      '.ept-link{color:#A5432A;font-size:13px;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}',
      '.ept-page{max-width:1040px;margin:0 auto;padding:24px 20px 48px;color:#1E1A14}',
      '.ept-page *{box-sizing:border-box}',
      '.ept-h1{font-size:36px}',
      '.ept-pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:16px;align-items:start}',
      '.ept-card{background:#FBF6EE;border:1px solid #E3D8C6;border-radius:6px;padding:18px 20px;display:flex;flex-direction:column;gap:10px}',
      '.ept-ch{display:flex;justify-content:space-between;align-items:baseline;gap:10px}',
      '.ept-h2{margin:0;font:600 24px/1.1 "Cormorant Garamond",Georgia,serif}',
      '.ept-row{display:flex;gap:16px;align-items:baseline;flex-wrap:wrap}',
      '.ept-xl{font-size:32px}',
      '.ept-heat-l{grid-template-columns:repeat(8,16px)}.ept-heat-l .ept-col{grid-template-rows:repeat(7,16px)}.ept-heat-l .ept-d{width:16px;height:16px}',
      '.ept-due{display:flex;gap:10px;align-items:flex-start;cursor:pointer;padding:6px 0}.ept-due input{width:18px;height:18px;margin:2px 0 0;accent-color:#A5432A}.ept-due>span{display:flex;flex-direction:column}',
      '.ept-bar{height:6px;background:#E3D8C6}.ept-bar span{display:block;height:100%;background:#A5432A}',
      '.ept-fm{display:flex;flex-direction:column}.ept-fr{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:8px 0;border-top:1px solid #E3D8C6}.ept-fr>span:first-child{display:flex;flex-direction:column;min-width:0}',
      '.ept-fmf{display:flex;flex-direction:column;gap:8px;padding:12px 0;border-top:1px solid #E3D8C6}.ept-sel{width:100%;display:block;margin-top:4px}.ept-date{width:150px}.ept-note{width:100%;display:block;margin-top:4px}',
      '.ept-first{margin:0;font:italic 500 20px/1.35 "Cormorant Garamond",Georgia,serif;color:#6B6152}',
      '.ept-first-l{font-style:normal;font:400 13px/1.5 "IBM Plex Sans",system-ui,sans-serif;display:block;margin-top:8px}',
      '.ept-ms-chip{font:500 11.5px/1 "IBM Plex Mono",ui-monospace,monospace;padding:5px 8px;border:1px solid #D8C9AE;border-radius:4px;color:#6B6152}',
      '.ept-ms-chip.on{background:#A5432A;border-color:#A5432A;color:#fff}',
      '.ept-ev{display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px;padding:10px 0;border-top:1px solid #E3D8C6;align-items:center}',
      '.ept-mono{font:500 12px/1.4 "IBM Plex Mono",ui-monospace,monospace;color:#6B6152}',
      '.ept-li{display:flex;justify-content:space-between;padding:11px 0;border-top:1px solid #E3D8C6;color:#1E1A14;text-decoration:none}',
      '.ept-li:hover{color:#A5432A}',
      '.ept-page .ept-form{padding:14px;border:1px solid #E3D8C6;border-radius:4px}',
      '.ept-nudge{margin-top:12px;padding:12px 14px;border:1px solid #E3D8C6;border-radius:4px;background:#FFFDF8;display:flex;flex-direction:column;gap:6px;font-size:13px;color:#3A342B}',
      '.ept-nt{display:flex;justify-content:space-between;align-items:center}',
      '.ept-red{color:#A5432A}',
      '.ept-n-h{font:600 19px/1.15 "Cormorant Garamond",Georgia,serif;color:#1E1A14}',
      '.ept-x{background:transparent;border:0;width:32px;height:32px;font-size:18px;color:#6B6152;cursor:pointer}',
      '.ept-q-red{border-color:#A5432A;color:#A5432A}',
      '.ept-why{align-self:flex-start;background:transparent;border:0;padding:0;font-size:12px;color:#6B6152;text-decoration:underline;text-underline-offset:3px;cursor:pointer}',
      '.ept-whyt{background:#F2E8D6;border-radius:4px;padding:8px 10px}',
      '.ept-hid{margin:10px 0 0}',
      '.ept-wide{grid-column:1/-1}',
      '.ept-att{background:#FFFDF8;border:1px solid #D8C9AE;border-left:3px solid #A5432A;border-radius:4px;min-height:36px;padding:6px 10px;font-size:12.5px;text-align:left;cursor:pointer;color:#1E1A14}',
      '.ept-att.good{border-left-color:#6B8F5E}',
      '.ept-tbl{display:flex;flex-direction:column;border:1px solid #E3D8C6;border-radius:4px;overflow:hidden}',
      '.ept-tr{display:grid;grid-template-columns:minmax(120px,1.4fr) 70px 80px minmax(110px,1fr) minmax(140px,1.2fr);gap:10px;align-items:center;padding:10px 12px;background:#FFFDF8;border:0;border-top:1px solid #E3D8C6;text-align:left;font:inherit;color:inherit;cursor:pointer}',
      '.ept-tr:first-child{border-top:0}.ept-tr:hover{background:#F6EEE1}.ept-tr[aria-pressed="true"]{background:#F2E8D6;box-shadow:inset 3px 0 0 #A5432A}',
      '.ept-th{cursor:default;background:#F8F1E7;font:500 10.5px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em;color:#6B6152;text-transform:uppercase}.ept-th:hover{background:#F8F1E7}',
      '@media (max-width:640px){.ept-tr{grid-template-columns:1fr 60px 60px}.ept-tr>:nth-child(4),.ept-tr>:nth-child(5){display:none}}',
      '.ept-det{display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid #E3D8C6;border-radius:4px;background:#FFFDF8}',
      '.etd{max-width:1080px;padding:28px 24px 56px;font:13px/1.45 "IBM Plex Sans",system-ui,sans-serif}',
      '.etd-top{display:flex;flex-direction:column;gap:4px;margin-bottom:18px}',
      '.etd-h1{margin:0;font:600 46px/1.05 "Cormorant Garamond",Georgia,serif}.etd-h1 em{color:#A5432A}',
      '.etd-sub{color:#5A5346;font-size:14px}',
      '.etd-cols{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start}',
      '.etd-main{flex:999 1 520px;min-width:0;display:flex;flex-direction:column;gap:18px}',
      '.etd-rail{flex:1 1 260px;max-width:100%;min-width:240px;display:flex;flex-direction:column;gap:14px}',
      '.etd-card{padding:20px 22px}',
      '.etd-div{display:flex;align-items:center;gap:10px}.etd-rule{flex:1;height:1px;background:#D8C9AE}',
      '.etd-mono{font:500 10.5px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase}',
      '.etd-gold{color:#D2A65A}.etd-mut{color:#C8BEAC}.etd-cream{color:#F4EDE0}',
      '.etd-hero{background:#20302A;color:#F4EDE0;border-radius:8px;display:flex;flex-wrap:wrap;overflow:hidden}',
      '.etd-sit{flex:999 1 320px;min-width:0;padding:26px 28px;display:flex;flex-direction:column;gap:18px}',
      '.etd-rec{flex:1 1 300px;min-width:0;padding:26px 28px;background:#263A32;display:flex;flex-direction:column;gap:16px}',
      '.etd-col{display:flex;flex-direction:column;gap:6px}.etd-col2{display:flex;flex-direction:column;gap:8px}',
      '.etd-h2l{margin:0;font:600 34px/1.05 "Cormorant Garamond",Georgia,serif}.etd-h2l em{color:#D2A65A;font-weight:500}',
      '.etd-lens{display:flex;gap:6px;flex-wrap:wrap}',
      '.etd-len{min-width:56px;min-height:40px;border-radius:999px;border:1px solid #5B6E64;background:transparent;color:#F4EDE0;font:13px "IBM Plex Mono",ui-monospace,monospace;cursor:pointer}',
      '.etd-len[aria-pressed="true"]{background:#F4EDE0;color:#16140F;border-color:#F4EDE0}',
      '.etd-go{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding-top:4px}',
      '.etd-begin{display:inline-flex;align-items:center;gap:12px;min-height:52px;padding:0 24px 0 8px;border:0;border-radius:999px;background:#D2A65A;color:#16140F;font:600 15px "IBM Plex Sans",system-ui,sans-serif;cursor:pointer}.etd-begin:hover{background:#E0B66B}',
      '.etd-play{width:38px;height:38px;border-radius:50%;background:#16140F;display:flex;align-items:center;justify-content:center}',
      '.etd-link{background:transparent;border:0;min-height:44px;padding:0 4px;font:inherit;font-size:13px;color:#F4EDE0;text-decoration:underline;text-underline-offset:4px;cursor:pointer}',
      '.etd-formwrap{background:#FBF6EE;color:#1E1A14;border-radius:6px;padding:4px}',
      '.etd-row{display:flex;align-items:baseline;gap:10px}.etd-big{font:500 52px/1 "IBM Plex Mono",ui-monospace,monospace;color:#D2A65A}',
      '.etd-between{display:flex;justify-content:space-between;gap:8px;font-size:12.5px}',
      '.etd-beads{display:flex;flex-wrap:wrap;gap:4px}.etd-bead{width:10px;height:10px;border-radius:50%;box-shadow:inset 0 0 0 1px #5B6E64}.etd-bead.on{background:#D2A65A;box-shadow:inset 0 0 0 1px #D2A65A}',
      '.etd-ms{border:1px solid #D2A65A;border-radius:6px;padding:12px 14px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;color:#D2A65A}.etd-ms .etd-link{color:#F4EDE0;min-height:36px;padding:0}',
      '.etd-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.etd-week>div{display:flex;flex-direction:column;align-items:center;gap:6px}',
      '.etd-day{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#16140F;box-shadow:inset 0 0 0 1.5px #5B6E64}',
      '.etd-day.done{background:#D2A65A;box-shadow:inset 0 0 0 1.5px #D2A65A}.etd-day.today{box-shadow:inset 0 0 0 1.5px #F4EDE0}',
      '.etd-pills{display:flex;flex-wrap:wrap;gap:6px}.etd-pill{font:500 11px/1 "IBM Plex Mono",ui-monospace,monospace;padding:3px 8px;border-radius:999px;border:1px solid #5B6E64;color:#C8BEAC}.etd-pill.on{background:#D2A65A;border-color:#D2A65A;color:#16140F}',
      '.etd-wp{color:#F4EDE0;font-size:12.5px;margin-top:auto}',
      '.etd-skt{margin:0;font:italic 500 24px/1.25 "Cormorant Garamond",Georgia,serif}.etd-tr{margin:0;color:#3A342B}',
      '.etd-q{display:flex;flex-direction:column;gap:8px;padding-top:12px;border-top:1px solid #E3D8C6}.etd-qt{font:19px/1.3 "Cormorant Garamond",Georgia,serif}',
      '.etd-quiet{background:transparent;border:1px solid #D8C9AE;border-radius:4px;min-height:44px;padding:0 14px;font-size:13px;color:#1E1A14;cursor:pointer}.etd-quiet:hover{border-color:#1E1A14}',
      '.etd-lineform{display:flex;flex-direction:column;gap:8px}.etd-ta{width:100%;border:1px solid #D8C9AE;border-radius:4px;padding:10px;background:#fff;font:inherit;resize:vertical}',
      '.etd-lines{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}.etd-lines li{display:flex;justify-content:space-between;gap:12px;padding-top:6px;border-top:1px solid #E3D8C6}.etd-lines b{font:500 11px "IBM Plex Mono",ui-monospace,monospace;color:#6B6152;white-space:nowrap}',
      '.etd-moons{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px;background:#E3D8C6;border:1px solid #E3D8C6}',
      '.etd-md{background:#FBF6EE;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}.etd-md.now{background:#F2E8D6}',
      '.etd-moon{width:16px;height:16px;border-radius:50%;border:1.5px solid #3A342B;display:block}.etd-note{font-size:11px;color:#5A5346;min-height:15px;text-align:center}',
      '.etd-sacred{display:flex;flex-direction:column;gap:6px}.etd-sd{display:grid;grid-template-columns:92px minmax(0,1fr) auto;gap:10px;align-items:baseline;padding-top:6px;border-top:1px solid #E3D8C6}',
      '.etd-sdn{display:flex;flex-direction:column}.etd-away{font-size:12px;color:#A5432A;white-space:nowrap}',
      '.etd-none{margin:0;color:#3A342B;font-size:14px}',
      '.etd-next{font-size:14px}.etd-subl{color:#3A342B}.etd-links{display:flex;flex-wrap:wrap;gap:8px}',
      '.etd-b{min-height:44px;padding:0 16px}',
      '.etd-morel{margin:0 0 8px}.etd-lg{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}',
      '.etd-lock{border:1px dashed #D8C9AE;border-radius:6px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;text-decoration:none;color:#6B6152;min-height:44px}.etd-lt{display:flex;align-items:center;gap:8px;font-weight:600;color:#1E1A14}.etd-op{color:#A5432A;font-size:12.5px}',
      '.etd-mentor{margin-top:28px;margin-bottom:12px}.etd-ev>.ept-mono{white-space:nowrap}.etd-ev{display:grid;grid-template-columns:62px minmax(0,1fr);gap:8px;padding:8px 0;border-top:1px solid #E3D8C6}.etd-evt{display:flex;flex-direction:column}',
      '.etd-green{color:#2E5A4B;font-size:12px}.etd-red{color:#A5432A;font-size:12px}',
      '.etd-timer{position:fixed;inset:0;z-index:2147483000;background:#20302A;color:#F4EDE0;display:flex;align-items:center;justify-content:center;font:14px/1.5 "IBM Plex Sans",system-ui,sans-serif;overflow:auto}',
      '.etd-tin{width:min(420px,100%);padding:32px 24px;display:flex;flex-direction:column;gap:20px;align-items:center;text-align:center}',
      '.etd-clock{font:500 72px/1 "IBM Plex Mono",ui-monospace,monospace;color:#F4EDE0}.etd-done{font:600 30px/1.1 "Cormorant Garamond",Georgia,serif}',
      '.etd-prog{width:100%;height:4px;background:#3E544A}.etd-prog span{display:block;height:100%;background:#D2A65A}',
      '.etd-tb{display:flex;flex-direction:column;gap:10px;width:100%}',
      '.etd-tbtn{min-height:48px;border-radius:999px;border:0;background:#D2A65A;color:#16140F;font:600 15px "IBM Plex Sans",system-ui,sans-serif;cursor:pointer}.etd-tbtn.q{background:transparent;color:#F4EDE0;border:1px solid #5B6E64;font-weight:400}',
      '.etd-lab{display:flex;flex-direction:column;gap:6px;color:#C8BEAC}.etd-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
      '.etd-chip{background:transparent;border:1px solid #5B6E64;color:#F4EDE0;border-radius:999px;min-height:40px;padding:0 12px;cursor:pointer}.etd-chip[aria-pressed="true"]{background:#F4EDE0;color:#16140F}',
      '.etd-err{color:#F0B7A5}',
      '.etd .ept-x{width:44px;height:44px}.etd .ept-q{min-height:44px}.etd .ept-why,.etd-rail>.etd-card>a,.etd-wp,.etd-ev a{min-height:44px;display:inline-flex;align-items:center}.etd-ev a{min-height:44px}',
      '.etd :focus-visible,.etd-timer :focus-visible{outline:2px solid #D2A65A;outline-offset:2px}',
      '@media (max-width:640px){.etd{padding:20px 16px 24px}.etd-h1{font-size:34px}.etd-sit,.etd-rec{padding:22px 20px}.etd-sd{grid-template-columns:1fr auto}.etd-sd>.ept-mono{grid-column:1/-1}.etd-clock{font-size:56px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  var MS_TEXT = { 7: 'Seven days in a row.', 21: 'Twenty-one days unbroken.', 40: 'Forty days unbroken.', 108: 'One hundred and eight days of sādhana.' };
  var LOCK = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="5.5" width="8" height="5.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

  function formHtml(p) {
    return '<form class="ept-form" data-form="log"><span class="ept-l">Today’s practice</span>' +
        '<label class="ept-s">Minutes <input class="ept-in" name="minutes" type="number" min="0" max="600" inputmode="numeric" value="' + esc(state.minutes || '') + '"></label>' +
        '<span class="ept-s">Quality of practice</span><div class="ept-chips" role="group" aria-label="Quality of practice">' + p.qualities.map(function (q) { return '<button type="button" class="ept-chip" data-q="' + esc(q) + '" aria-pressed="' + (state.quality === q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
        '<span class="ept-s">Greater body of sādhana</span><div class="ept-chips" role="group" aria-label="Other practices">' + (p.extras || []).map(function (x) { return '<button type="button" class="ept-chip" data-x="' + esc(x) + '" aria-pressed="' + ((state.extras || []).indexOf(x) >= 0) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:8px"><button class="ept-btn" type="submit"' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? 'Saving…' : 'Save') + '</button><button class="ept-q" type="button" data-act="close">Cancel</button></div>' +
        (state.error ? '<span class="ept-err">' + esc(state.error) + '</span>' : '') + '</form>';
  }

  function greet() { var h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; }
  function tierName() { return state.tier === 'course' ? 'none' : state.tier; }
  function eyebrow() {
    var s = (EYEBROW[tierName()] || 'Today'), se = state.seasons && state.seasons[0] ? state.seasons[0].charAt(0).toUpperCase() + state.seasons[0].slice(1) : '';
    return s.replace('{season}', se).replace(' · · ', ' · ');
  }
  // "Wed 21" within the coming week, "Dec 17" further out
  function dayShort(iso) {
    try {
      var d = new Date(iso), soon = d - Date.now() < 6 * 86400000;
      return soon ? d.toLocaleDateString(undefined, { weekday: 'short' }) + ' ' + d.getDate() : d.toLocaleDateString(undefined, { month: 'short' }) + ' ' + d.getDate();
    } catch (e) { return ''; }
  }
  function dayLong(iso) { try { return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return ''; } }
  function clock(iso) { try { return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }); } catch (e) { return ''; } }
  function away(n) { return n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days'; }

  // ---- the free half ----
  function heroHtml() {
    var p = state.practice, out = '<section class="etd-hero" aria-labelledby="etd-sit"><div class="etd-sit">' +
      '<div class="etd-col"><span class="etd-mono etd-gold">Today’s sit</span><h2 id="etd-sit" class="etd-h2l">Haṃsa <em>· Sahṛdaya Meditation</em></h2>' +
      '<span class="etd-mut">Rest with the breath’s own mantra: <em>ham</em> on the in-breath, <em>sa</em> on the out-breath.</span></div>' +
      '<div class="etd-col"><span class="etd-mono etd-mut">Timer</span><div class="etd-lens" role="group" aria-label="Length">' + [10, 20, 30, 45].map(function (n) {
        return '<button type="button" class="etd-len" data-act="len" data-len="' + n + '" aria-pressed="' + (state.len === n) + '">' + n + 'm</button>'; }).join('') + '</div></div>' +
      '<div class="etd-go"><button type="button" class="etd-begin" data-act="begin"><span class="etd-play" aria-hidden="true"><svg width="12" height="14" viewBox="0 0 12 14"><path d="M1 1l10 6-10 6z" fill="#D2A65A"/></svg></span>Begin · ' + state.len + ' min</button>' +
      (p ? '<button type="button" class="etd-link" data-act="form" aria-expanded="' + !!state.form + '">' + (p.loggedToday ? 'Logged today · edit' : 'Already sat today? Log it') + '</button>' : '') + '</div>';
    if (state.form && p) out += '<div class="etd-formwrap">' + formHtml(p) + '</div>';
    out += '</div><div class="etd-rec">';
    if (!p) return out + '<span class="etd-mut">' + esc(state.error || 'Loading…') + '</span></div></section>';
    var target = p.reached || p.nextMilestone || 108, beads = '';
    for (var i = 0; i < target; i++) beads += '<span class="etd-bead' + (i < p.streak ? ' on' : '') + '"></span>';
    var left = target - p.streak;
    out += '<div class="etd-row"><span class="etd-big">' + p.streak + '</span><span class="etd-mut">day' + (p.streak === 1 ? '' : 's') + ' in a row</span></div>';
    if (p.reached && MS_TEXT[p.reached]) {
      out += '<div class="etd-ms" role="status"><strong>' + MS_TEXT[p.reached] + '</strong><button type="button" class="etd-link" data-act="line-open">Write to the Travelogue</button></div>';
    } else {
      out += '<div class="etd-col2"><div class="etd-between"><span>' + left + (left === 1 ? ' day' : ' days') + ' to ' + target + '</span><span class="etd-mono etd-mut">' + Math.min(p.streak, target) + ' / ' + target + '</span></div>' +
        '<div class="etd-beads" role="img" aria-label="' + p.streak + ' of ' + target + ' days toward the next milestone">' + beads + '</div></div>';
    }
    var wk = (p.grid && p.grid[p.grid.length - 1]) || [], L = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    out += '<div class="etd-col2"><span class="etd-mono etd-mut">This week</span><div class="etd-week" role="list">' + wk.map(function (c, i) {
      var cls = c.state === 'done' ? 'done' : c.state === 'today' ? 'today' : c.state === 'future' ? 'future' : '';
      return '<div role="listitem" aria-label="' + (c.state === 'done' ? 'practised' : c.state === 'today' ? 'Today, not yet' : c.state === 'future' ? 'still to come' : 'not practised') + '"><span class="etd-day ' + cls + '" aria-hidden="true">' + (c.state === 'done' ? '✓' : '') + '</span><span class="etd-mono ' + (c.state === 'today' ? 'etd-cream' : 'etd-mut') + '">' + L[i] + '</span></div>';
    }).join('') + '</div></div>';
    out += '<div class="etd-pills">' + [7, 21, 40, 108].map(function (m) { return '<span class="etd-pill' + (p.streak >= m ? ' on' : '') + '">' + m + '</span>'; }).join('') + '</div>';
    if (PORTFOLIO_FOR.indexOf(tierName()) >= 0) out += '<a class="etd-wp" href="/c/portfolio">Your whole practice →</a>';
    return out + '</div></section>';
  }

  function teachingHtml() {
    var t = state.data && state.data.teaching, out = '<section class="ept-card etd-card" aria-labelledby="etd-teach">';
    if (t) {
      out += '<div class="ept-ch"><h2 id="etd-teach" class="ept-h2">Today’s teaching</h2><span class="ept-l">Sūtra of the week' + (t.source ? ' · ' + esc(t.source) : '') + '</span></div>' +
        (t.sanskrit ? '<p class="etd-skt">' + esc(t.sanskrit) + '</p>' : '') + (t.translation ? '<p class="etd-tr">' + esc(t.translation) + '</p>' : '');
    } else out += '<div class="ept-ch"><h2 id="etd-teach" class="ept-h2">Your Inner Travelogue</h2><span class="ept-l">Private</span></div>';
    out += '<div class="etd-q"><span class="ept-l">' + (t && t.question ? 'A question to carry' : 'A line for the day') + '</span>' + (t && t.question ? '<span class="etd-qt">' + esc(t.question) + '</span>' : '');
    if (!state.lineOpen) out += '<div><button type="button" class="etd-quiet" data-act="line-open">Write in your Travelogue · private</button></div>';
    else {
      out += '<form data-form="line" class="etd-lineform"><label class="ept-s" for="etd-line">One line, or two. Only you can see it.</label><textarea id="etd-line" name="text" rows="3" maxlength="1000" class="etd-ta">' + esc(state.line) + '</textarea>' +
        '<div class="ept-row"><button class="ept-btn etd-b" type="submit"' + (state.lineBusy ? ' disabled' : '') + '>' + (state.lineBusy ? 'Saving…' : 'Save privately') + '</button><button type="button" class="ept-q etd-b" data-act="line-close">Close</button></div>' + (state.lineErr ? '<span class="ept-err">' + esc(state.lineErr) + '</span>' : '') + '</form>';
      if (state.lines && state.lines.length) out += '<ul class="etd-lines">' + state.lines.map(function (l) { return '<li><span>' + esc(l.text) + '</span><b>' + esc(niceDate(l.day)) + '</b></li>'; }).join('') + '</ul>';
    }
    return out + '</div></section>';
  }

  function moonGlyph(d) {
    var bg = d.lit <= 2 ? '#1E1A14' : d.lit >= 98 ? '#FBF6EE' : d.waxing ? 'linear-gradient(90deg,#1E1A14 ' + (100 - d.lit) + '%,#FBF6EE ' + (100 - d.lit) + '%)' : 'linear-gradient(90deg,#FBF6EE ' + d.lit + '%,#1E1A14 ' + d.lit + '%)';
    return '<span class="etd-moon" style="background:' + bg + '" role="img" aria-label="' + esc(d.phase) + '" title="' + esc(d.phase) + '"></span>';
  }
  function moonHtml() {
    var m = state.data && state.data.moon, sa = (state.data && state.data.sacred) || [];
    if (!m) return '';
    var out = '<section class="ept-card etd-card" aria-labelledby="etd-moon"><div class="ept-ch"><h2 id="etd-moon" class="ept-h2">This week’s moon</h2></div>' +
      '<div class="etd-moons" role="list">' + m.days.map(function (d) {
        return '<div role="listitem" class="etd-md' + (d.today ? ' now' : '') + '"><span class="ept-l">' + esc(d.dow) + '</span>' + moonGlyph(d) + '<span class="etd-note">' + (d.today ? 'Today' : '') + '</span></div>'; }).join('') + '</div>';
    if (sa.length) out += '<div class="etd-sacred"><span class="ept-l">Sacred days ahead</span>' + sa.map(function (x) {
      return '<div class="etd-sd"><span class="ept-mono">' + esc(niceDate(x.date)) + '</span><span class="etd-sdn"><b>' + esc(x.name) + '</b><span class="ept-s">' + esc(x.note) + '</span></span><span class="etd-away">' + away(x.inDays) + '</span></div>'; }).join('') +
      '<span class="ept-s">Dates as reckoned for the US; some fall a day differently where you are.</span></div>';
    return out + '</section>';
  }

  // ---- your enrolment ----
  function nextText(c) {
    var n = c.next;
    if (n && n.start) return dayLong(n.start) + ' · ' + clock(n.start);
    if (n) return niceDate(n.date);
    return c.nextLine || '';
  }
  function cardHtml(c) {
    var live = false, n = c.next;
    if (c.primary.live && n && n.start) { var now = Date.now(), st = new Date(n.start).getTime(), en = n.end ? new Date(n.end).getTime() : st + 3600000; live = now >= st - 600000 && now <= en; }
    var ext = c.primary.external ? ' target="_blank" rel="noopener"' : '';
    return '<section class="ept-card etd-card" aria-label="' + esc(c.title) + '"><div class="ept-ch"><h2 class="ept-h2">' + esc(c.title) + '</h2><span class="ept-l">' + esc(c.tag || '') + '</span></div>' +
      '<strong class="etd-next">' + (live ? 'Live now · ' : '') + esc(nextText(c)) + '</strong>' + (c.sub ? '<span class="etd-subl">' + esc(c.sub) + '</span>' : '') +
      '<div class="etd-links"><a class="ept-btn etd-b" href="' + esc(c.primary.href) + '"' + ext + '>' + esc(live && c.primary.liveLabel ? c.primary.liveLabel : c.primary.label) + '</a>' +
      (c.links || []).map(function (l) { return '<a class="ept-q etd-b" href="' + esc(l.href) + '">' + esc(l.label) + '</a>'; }).join('') + '</div></section>';
  }
  function nudgeBlock() {
    var co = offer(), n = offer(true) ? null : nudge();
    if (co) return offerHtml(co);
    if (n) return '<div class="ept-nudge" role="note" aria-label="A suggestion"><div class="ept-nt"><span class="ept-l ept-red">' + esc(n.eyebrow) + '</span>' +
      '<button type="button" class="ept-x" data-act="dismiss" aria-label="Hide this suggestion">×</button></div>' +
      '<strong class="ept-n-h">' + esc(n.title) + '</strong><span>' + esc(n.body) + '</span>' +
      '<div class="ept-row"><a class="ept-q ept-q-red" href="' + esc(n.href) + '">' + esc(n.cta) + '</a><span class="ept-s">' + esc(n.note) + '</span></div>' +
      '<button type="button" class="ept-why" data-act="why" aria-expanded="' + state.why + '">Why am I seeing this?</button>' +
      (state.why ? '<span class="ept-s ept-whyt">' + esc(n.why || ('You’ve logged ' + n.at + ' days of practice.')) + ' You can hide it with ×, and we won’t show it again this season.</span>' : '') + '</div>';
    return state.hidNudge ? '<p class="ept-s ept-hid" role="status">Suggestion hidden. We won’t show it again this season.</p>' : '';
  }
  function enrolHtml() {
    var d = state.data || {}, cards = d.cards || [], locked = d.locked || [];
    var out = '<div class="etd-div"><span class="ept-l">' + (cards.length ? 'Your enrolment' : 'When you’re ready') + '</span><span class="etd-rule"></span></div>';
    if (!cards.length) out += '<p class="etd-none">Your practice, the daily teaching and the moon calendar are yours to keep, free. When you join a programme, its sessions and spaces appear here.</p>';
    out += cards.map(cardHtml).join('') + nudgeBlock();
    if (locked.length) out += '<section aria-labelledby="etd-more"><h2 id="etd-more" class="ept-l etd-morel">Also at Embodied Philosophy</h2><div class="etd-lg">' + locked.map(function (c) {
      return '<a class="etd-lock" href="' + esc(c.href) + '" target="_top"><span class="etd-lt">' + LOCK + esc(c.title) + '</span><span class="ept-s">' + esc(c.line) + '</span><span class="etd-op">Opens with ' + esc(c.opens) + ' →</span></a>'; }).join('') + '</div></section>';
    return out;
  }

  // ---- the right-hand rail ----
  function railHtml() {
    var d = state.data || {}, cu = d.comingUp || [], cards = d.cards || [];
    var out = '<aside class="etd-rail" aria-label="Coming up"><section class="ept-card etd-card" aria-labelledby="etd-cu"><h2 id="etd-cu" class="ept-h2">Coming up</h2>';
    if (!cu.length) out += '<span class="ept-s">Nothing scheduled just yet.</span>';
    out += cu.map(function (e) {
      var when = e.start ? dayShort(e.start) : e.end_date ? (e.date.slice(8).replace(/^0/, '') + '–' + e.end_date.slice(8).replace(/^0/, '')) : niceDate(e.date);
      var sub = e.open ? '<span class="etd-green">Open to everyone</span>' : e.book ? '<a class="etd-red" href="' + esc(e.book) + '" target="_blank" rel="noopener">Book a time</a>' : '<span class="ept-s">' + (e.start ? esc(clock(e.start)) + ' · yours' : '') + '</span>';
      return '<div class="etd-ev"><span class="ept-mono">' + esc(when) + '</span><span class="etd-evt"><b>' + esc(e.title) + '</b>' + sub + '</span></div>'; }).join('');
    out += '<a class="ept-pf" href="' + (cards.length ? '/c/schedule' : SITE + '/events') + '">' + (cards.length ? 'Your full schedule' : 'All events') + '</a></section>';
    if (d.practisingToday) out += '<section class="ept-card etd-card" aria-labelledby="etd-pw"><h2 id="etd-pw" class="ept-h2">Practising with you</h2><span class="ept-s">' + d.practisingToday + ' people logged a sit today.</span></section>';
    return out + '</aside>';
  }

  function pageHtml() {
    var d = state.data, first = state.first || (d && d.firstName) || 'friend';
    var tithi = d && d.moon && d.moon.tithi ? d.moon.tithi.text : '';
    var date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    var out = '<header class="etd-top"><span class="ept-l ept-red">' + esc(eyebrow()) + '</span><h1 class="etd-h1">Good ' + greet() + ', <em>' + esc(first) + '</em>.</h1>' +
      '<span class="etd-sub">' + esc(date) + (tithi ? ' · ' + esc(tithi) : '') + '</span></header>';
    if (!d) return out + '<p class="' + (state.failed ? 'ept-err' : 'ept-s') + '" role="status">' + esc(state.failed ? 'We couldn’t load Today just now. Please refresh the page.' : 'Loading…') + '</p>';
    out += '<div class="etd-cols"><div class="etd-main"><div class="etd-div"><span class="ept-l">Free for everyone · the same as in the app</span><span class="etd-rule"></span></div>' +
      heroHtml() + teachingHtml() + moonHtml() + enrolHtml() + '</div>' + railHtml() + '</div>';
    // Circle admins: the Sahṛdaya Upāya cohort, below the student's page so it never crowds it
    if (mentorView()) out += '<div class="etd-div etd-mentor"><span class="ept-l">Mentor view · only Circle admins see this</span><span class="etd-rule"></span></div><div class="ept-pg">' + cohortHtml() + '</div>';
    return out;
  }

  var root = null, pageRoot = null;
  function render() {
    if (pageRoot && document.body.contains(pageRoot)) {
      var f = document.activeElement, keep = f && f.id === 'etd-line' ? f.selectionStart : null;
      pageRoot.innerHTML = pageHtml();
      if (keep !== null) { var t = pageRoot.querySelector('#etd-line'); if (t) { t.focus(); t.setSelectionRange(keep, keep); } }
    }
  }

  // ---- the sitting timer: a calm countdown in a full-screen panel; never logs on its own ----
  var tm = null, tmInt = null, wakeLock = null;
  function bell() {
    try {
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      var c = new C(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = 528; o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 2.6);
      o.start(); o.stop(c.currentTime + 2.7); setTimeout(function () { try { c.close(); } catch (e) {} }, 3200);
    } catch (e) {}
  }
  function wake(on) {
    try {
      if (on && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }).catch(function () {});
      else if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
    } catch (e) {}
  }
  function leftMs() { return tm.pausedLeft != null ? tm.pausedLeft : Math.max(0, tm.endsAt - Date.now()); }
  function mmss(ms) { var s = Math.ceil(ms / 1000), m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); }
  function startTimer() {
    if (tm) return;
    local('ep_timer_len', String(state.len));
    tm = { mins: state.len, endsAt: Date.now() + state.len * 60000, pausedLeft: null, phase: 'run', min: state.len, quality: '', saving: false, err: '' };
    bell(); wake(true); paintTimer();
    tmInt = setInterval(function () { if (tm && tm.phase === 'run' && leftMs() <= 0) finishTimer(true); else paintTimer(); }, 500);
  }
  function finishTimer(full) {
    clearInterval(tmInt); wake(false);
    var sat = full ? tm.mins : Math.floor((tm.mins * 60000 - leftMs()) / 60000);
    if (full) bell();
    if (sat < 1) { closeTimer(); return; }
    tm.phase = full ? 'done' : 'early'; tm.min = sat; paintTimer();
  }
  function closeTimer() { clearInterval(tmInt); wake(false); tm = null; var o = document.getElementById('etd-timer'); if (o) o.remove(); }
  function paintTimer() {
    if (!tm) return;
    var o = document.getElementById('etd-timer');
    if (!o) {
      o = document.createElement('div'); o.id = 'etd-timer'; o.className = 'etd-timer'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Sitting timer');
      o.addEventListener('click', timerClick); o.addEventListener('input', function (e) { if (tm && e.target.name === 'tmin') tm.min = e.target.value; });
      document.body.appendChild(o);
    }
    var inner;
    if (tm.phase === 'run') {
      var ms = leftMs(), pct = Math.min(100, (1 - ms / (tm.mins * 60000)) * 100);
      var focusBtn = o.querySelector('[data-t=pause]');
      inner = '<div class="etd-tin"><span class="etd-mono etd-gold">Sahṛdaya Meditation</span><div class="etd-clock" role="timer" aria-label="Time remaining">' + mmss(ms) + '</div>' +
        '<div class="etd-prog" aria-hidden="true"><span style="width:' + pct + '%"></span></div><div class="etd-tb"><button type="button" class="etd-tbtn" data-t="pause">' + (tm.pausedLeft != null ? 'Resume' : 'Pause') + '</button><button type="button" class="etd-tbtn q" data-t="end">End</button></div></div>';
      if (focusBtn && o.dataset.phase === 'run') { var c = o.querySelector('.etd-clock'); if (c) { c.textContent = mmss(ms); o.querySelector('.etd-prog span').style.width = pct + '%'; return; } }
      o.dataset.phase = 'run';
    } else {
      var p = state.practice || { qualities: [] };
      inner = '<div class="etd-tin"><span class="etd-mono etd-gold">' + (tm.phase === 'done' ? 'Sit complete' : 'You sat for ' + tm.min + ' min') + '</span><div class="etd-done">' + (tm.phase === 'done' ? 'Thank you for sitting.' : 'Log what you sat?') + '</div>' +
        '<label class="etd-lab">Minutes <input class="ept-in" name="tmin" type="number" min="1" max="600" inputmode="numeric" value="' + esc(tm.min) + '"></label>' +
        '<div class="etd-chips" role="group" aria-label="Quality of practice">' + (p.qualities || []).map(function (q) { return '<button type="button" class="etd-chip" data-t="q" data-q="' + esc(q) + '" aria-pressed="' + (tm.quality === q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
        (tm.err ? '<span class="etd-err">' + esc(tm.err) + '</span>' : '') +
        '<div class="etd-tb"><button type="button" class="etd-tbtn" data-t="log"' + (tm.saving ? ' disabled' : '') + '>' + (tm.saving ? 'Saving…' : 'Log ' + (parseInt(tm.min, 10) || 0) + ' minutes') + '</button><button type="button" class="etd-tbtn q" data-t="skip">' + (tm.phase === 'done' ? 'Not now' : 'Don’t log') + '</button></div></div>';
      o.dataset.phase = tm.phase;
    }
    o.innerHTML = inner;
    var b = o.querySelector('[data-t=pause],[data-t=log]'); if (b && o.dataset.focused !== tm.phase + (tm.saving ? 's' : '')) { b.focus(); o.dataset.focused = tm.phase + (tm.saving ? 's' : ''); }
  }
  function timerClick(e) {
    var t = e.target.closest('[data-t]'); if (!t || !tm) return;
    var k = t.dataset.t;
    if (k === 'pause') { if (tm.pausedLeft != null) { tm.endsAt = Date.now() + tm.pausedLeft; tm.pausedLeft = null; } else tm.pausedLeft = leftMs(); paintTimer(); }
    else if (k === 'end') finishTimer(false);
    else if (k === 'skip') closeTimer();
    else if (k === 'q') { tm.quality = tm.quality === t.dataset.q ? '' : t.dataset.q; paintTimer(); }
    else if (k === 'log') {
      var mins = parseInt(tm.min, 10); if (!(mins >= 1)) { tm.err = 'Add the minutes you sat.'; paintTimer(); return; }
      tm.saving = true; tm.err = ''; paintTimer();
      api('/api/member/practice', { method: 'POST', body: { today: localToday(), minutes: mins, quality: tm.quality || '', extras: [], add: true } })
        .then(function (p) { state.practice = p; closeTimer(); render(); })
        .catch(function (er) { if (tm) { tm.saving = false; tm.err = er.status === 401 ? 'Please refresh the page and try again.' : er.message; if (er.status === 401) store('ep_today_session', ''); paintTimer(); } });
    }
  }

  function onClick(e) {
    var t = e.target.closest('[data-act],[data-q],[data-x],[data-pick],[data-fmdel]');
    if (!t || !e.currentTarget.contains(t)) return;
    if (t.dataset.fmdel) { var em = t.dataset.email; api('/api/member/formation?email=' + encodeURIComponent(em) + '&id=' + encodeURIComponent(t.dataset.fmdel), { method: 'DELETE' }).then(function (f) { state.fm[em] = f; state.fmErr = ''; }).catch(function (er) { state.fmErr = er.message; }).then(render); return; }
    if (t.dataset.pick) { state.pick = state.pick === t.dataset.pick ? '' : t.dataset.pick; render(); loadFm(state.pick); return; }
    if (t.dataset.x) { var xs = state.extras || []; var i0 = xs.indexOf(t.dataset.x); state.extras = i0 >= 0 ? xs.filter(function (z) { return z !== t.dataset.x; }) : xs.concat([t.dataset.x]); render(); return; }
    if (t.dataset.q) { state.quality = state.quality === t.dataset.q ? '' : t.dataset.q; render(); return; }
    var a = t.dataset.act;
    if (a === 'len') { state.len = parseInt(t.dataset.len, 10) || 20; local('ep_timer_len', String(state.len)); render(); }
    if (a === 'begin') startTimer();
    if (a === 'form') { state.form = !state.form; state.error = ''; render(); var i = e.currentTarget.querySelector('input[name=minutes]'); if (i) i.focus(); }
    if (a === 'close') { state.form = false; render(); }
    if (a === 'line-open') { state.lineOpen = true; state.lineErr = ''; render(); var ta = pageRoot.querySelector('#etd-line'); if (ta) { ta.focus(); ta.scrollIntoView({ block: 'center' }); }
      if (!state.lines) api('/api/member/travelogue').then(function (r) { state.lines = r.travelogue || []; render(); }).catch(function () { state.lines = []; }); }
    if (a === 'line-close') { state.lineOpen = false; render(); }
    if (a === 'dismiss') { local(nudgeKey(), 'hidden'); state.hidNudge = true; render(); }
    if (a === 'offer-hide') { local('ep_offer_' + t.dataset.key, 'hidden'); state.hidNudge = true; render(); }
    if (a === 'why') { state.why = !state.why; render(); }
  }
  function onInput(e) {
    if (e.target.name === 'minutes') state.minutes = e.target.value;
    if (e.target.name === 'text') state.line = e.target.value;
  }
  function onSubmit(e) {
    if (e.target.matches('[data-form=credit]')) {
      e.preventDefault();
      var fe = e.target, em2 = fe.dataset.email;
      state.fmSaving = true; state.fmErr = '';
      api('/api/member/formation', { method: 'POST', body: { email: em2, component: fe.component.value, hours: fe.hours.value, day: fe.day.value, note: fe.note.value } })
        .then(function (f) { state.fm[em2] = f; }).catch(function (er) { state.fmErr = er.message; }).then(function () { state.fmSaving = false; render(); });
      return;
    }
    if (e.target.matches('[data-form=line]')) {
      e.preventDefault();
      state.line = e.target.text.value; state.lineBusy = true; state.lineErr = ''; render();
      api('/api/member/travelogue', { method: 'POST', body: { text: state.line, today: localToday() } })
        .then(function (r) { state.lines = r.travelogue || []; state.line = ''; })
        .catch(function (er) { state.lineErr = er.message; })
        .then(function () { state.lineBusy = false; render(); });
      return;
    }
    if (!e.target.matches('[data-form=log]')) return;
    e.preventDefault();
    state.minutes = e.target.minutes.value; state.saving = true; state.error = ''; render();
    api('/api/member/practice', { method: 'POST', body: { today: localToday(), minutes: state.minutes, quality: state.quality || '', extras: state.extras || [] } })
      .then(function (p) { state.practice = p; state.form = false; })
      .catch(function (err) { state.error = err.status === 401 ? 'Please refresh the page and try again.' : err.message; if (err.status === 401) store('ep_today_session', ''); })
      .then(function () { state.saving = false; render(); });
  }

  function pageContainer() {
    // Circle's content area for a space: the "[container-type:inline-size] bg-secondary" wrapper
    var all = document.querySelectorAll('div');
    for (var i = 0; i < all.length; i++) { var c = String(all[i].className || ''); if (c.indexOf('container-type:inline-size') >= 0 && c.indexOf('bg-secondary') >= 0) return all[i]; }
    return null;
  }
  function mountPage() {
    if (!PAGE.test(location.pathname)) return;
    if (pageRoot && document.body.contains(pageRoot)) return;
    var box = pageContainer();
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    pageRoot = document.createElement('div');
    pageRoot.className = 'ept-page etd'; pageRoot.setAttribute('role', 'region'); pageRoot.setAttribute('aria-label', 'Today');
    pageRoot.addEventListener('click', onClick);
    pageRoot.addEventListener('submit', onSubmit);
    pageRoot.addEventListener('input', onInput);
    box.insertBefore(pageRoot, box.firstChild);
    render();
  }

  // 108 days in a row: a full-screen celebration, shown once. Admins can preview it with ?milestone=108.
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function showMilestone() {
    var p = state.practice;
    if (state.ms108 || !p) return;
    var preview = isAdmin() && /[?&]milestone=108/.test(location.search);
    if (!preview && !(p.reached === 108 && local('ep_ms108_' + p.today) !== 'seen')) return;
    state.ms108 = true;
    var tones = ['#5B6343', '#8F7843', '#D2A65A'], beads = '';
    for (var i = 0; i < 108; i++) beads += '<i style="background:' + (i === 107 ? '#F4EDE0' : tones[(i * 5) % 3]) + ';animation-delay:' + (i * 12) + 'ms"></i>';
    var o = document.createElement('div');
    o.className = 'ept108'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', '108 days of sādhana');
    o.innerHTML = '<style>.ept108{position:fixed;inset:0;z-index:2147483000;background:#20302A;color:#F4EDE0;overflow:auto;font:14px/1.5 "IBM Plex Sans",system-ui,sans-serif}' +
      '.ept108 *{box-sizing:border-box}.ept108-in{max-width:430px;min-height:100%;margin:0 auto;padding:56px 24px 32px;display:flex;flex-direction:column;gap:24px}' +
      '.ept108-n{font:500 56px/1 "IBM Plex Mono",ui-monospace,monospace;color:#D2A65A}' +
      '.ept108-h{margin:8px 0;font:600 34px/1.1 "Cormorant Garamond",Georgia,serif}.ept108-h em{color:#D2A65A}.ept108 p{margin:0;color:#C8BEAC}' +
      '.ept108-g{display:grid;grid-template-columns:repeat(18,minmax(0,1fr));gap:3px}.ept108-g i{aspect-ratio:1;animation:ept108-in .4s ease-out both}' +
      '@keyframes ept108-in{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.ept108-g i{animation:none}}' +
      '.ept108-b{margin-top:auto;display:flex;flex-direction:column;gap:10px}.ept108 a,.ept108 button{display:flex;align-items:center;justify-content:center;min-height:48px;font:600 15px "IBM Plex Sans",system-ui,sans-serif;text-decoration:none;cursor:pointer}' +
      '.ept108-p{background:#B98A3E;color:#16140F;border:0}.ept108-p:hover{background:#D2A65A}.ept108-q{background:transparent;color:#F4EDE0;border:1px solid #3E544A;font-weight:400!important}.ept108-q:hover{border-color:#F4EDE0}' +
      '.ept108 :focus-visible{outline:2px solid #D2A65A;outline-offset:2px}</style>' +
      '<div class="ept108-in"><div><div class="ept108-n">108</div><h1 class="ept108-h">One hundred and eight days of <em>sādhana</em>.</h1>' +
      '<p>A full turn of the mālā, one bead a day, since ' + esc(longDate(addDays(p.today, -107))) + '.</p></div>' +
      '<div class="ept108-g" role="img" aria-label="108 squares, every one filled">' + beads + '</div>' +
      '<div class="ept108-b"><a class="ept108-p" href="/c/portfolio" data-close>Write to the Travelogue</a><button type="button" class="ept108-q" data-close>Back to today</button></div></div>';
    function close() { if (!preview) local('ep_ms108_' + p.today, 'seen'); o.remove(); document.removeEventListener('keydown', key); }
    function key(e) { if (e.key === 'Escape') close(); }
    o.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(o);
    o.querySelector('.ept108-p').focus();
  }

  function mount() {
    showMilestone();
    mountPage();
  }

  // Every signed-in member gets the Today page. Admins preview a membership with ?as=<tier> (and ?as=ss_season&season=fall
  // a Fall-only student).
  function isAdmin() { var u = window.circleUser || {}; return !!u.isAdmin; }

  signIn().then(function () {
    var as = (location.search.match(/[?&]as=([a-z_]+)/) || [])[1];
    if (as && isAdmin() && TIERS.indexOf(as) >= 0) {
      state.tier = as;
      var se = (location.search.match(/[?&]season=([a-z,]+)/) || [])[1];
      state.seasons = as === 'ss_season' ? (se ? se.split(',') : ['fall']) : [];
    }
    if (state.tier === 'course') state.tier = 'none';
    var saved = parseInt(local('ep_timer_len'), 10); if ([10, 20, 30, 45].indexOf(saved) >= 0) state.len = saved;
    css();
    // Only the Today page needs data; elsewhere in Circle this script stays quiet (the other pages have their own scripts)
    if (!PAGE.test(location.pathname)) {
      new MutationObserver(function () { if (PAGE.test(location.pathname) && !state.loaded) { state.loaded = true; loadData().then(mount); } }).observe(document.body, { childList: true, subtree: true });
      return;
    }
    state.loaded = true;
    return loadData().then(function () {
      mount();
      // Circle is a single-page app: re-check when the page changes
      var t = null;
      new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; mount(); }, 300); }).observe(document.body, { childList: true, subtree: true });
    });
  }).catch(function () { /* signed out or not available: show nothing */ });
})();
