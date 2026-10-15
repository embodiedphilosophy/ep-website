/* Embodied Philosophy · Today strip for Circle (ss.embodiedphilosophy.com)
   Loaded by one line in Circle → Settings → Code snippets → JavaScript:
     (function(){var s=document.createElement('script');s.src='https://www.embodiedphilosophy.com/circle/today.js';s.defer=true;document.head.appendChild(s);})();
   Shows a Today strip at the top of the Circle feed for every membership (SHOW_FOR): daily practice log,
   the next event for their membership, (mentees) the monthly one-to-one, and one quiet, dismissible
   suggestion for the next step up (NUDGES). The full Today page (/c/today) is for PAGE_FOR.
   Admins preview with ?today=1, a tier with ?as=<tier>, and the suggestion with ?nudge=1.
   Circle admins see the mentor view (the Sahṛdaya Upāya cohort's practice, and portfolio pages mentees chose to
   share) at the top of /c/today. The Practice Portfolio itself is /c/portfolio (public/circle/portfolio.js). */
(function () {
  if (window.__epToday) return; window.__epToday = true;
  // The CE credits page (/c/ce-credits) has its own script; load it here so Circle needs no extra snippet.
  if (!window.__epCe) { var ce = document.createElement('script'); ce.src = 'https://www.embodiedphilosophy.com/circle/ce.js'; ce.defer = true; document.head.appendChild(ce); }
  // The Practice Portfolio (/c/portfolio) likewise
  if (!window.__epPortfolio) { var pf = document.createElement('script'); pf.src = 'https://www.embodiedphilosophy.com/circle/portfolio.js'; pf.defer = true; document.head.appendChild(pf); }
  // …and the Schedule (/c/schedule)
  if (!window.__epSchedule) { var sc = document.createElement('script'); sc.src = 'https://www.embodiedphilosophy.com/circle/schedule.js'; sc.defer = true; document.head.appendChild(sc); }

  var API = 'https://www.embodiedphilosophy.com';
  var SITE = 'https://www.embodiedphilosophy.com';
  var TIERS = ['none', 'meditation', 'wisdom', 'wisdom_plus', 'ss_season', 'ss_year', 'mentee'];
  var SHOW_FOR = TIERS.slice(); // who sees the feed strip ('none' = course buyers, no membership)
  var PAGE_FOR = ['ss_year', 'mentee']; // who gets the full Today page
  // Upgrades and seasonal credits come worked out from the server (lib/member/pricing.js): state.offer.
  var BOOKING = 'https://calendly.com/embodied-philosophy/sah-daya-upaya-monthly-1-1-mentorship';
  var FEED = /^\/(feed|home)?\/?$/;
  var PAGE = /^\/c\/today\/?$/; // the "Today" space in Circle (Sahṛdaya Upāya · Mentorship)
  var PORTFOLIO_FOR = ['ss_season', 'ss_year', 'mentee']; // who keeps a Practice Portfolio (/c/portfolio)
  var LINKS = [['Schedule', '/c/schedule'], ['Practice Portfolio', '/c/portfolio'], ['Fall Live Sessions', '/c/fall-live-sessions'], ['Fall Recordings & Readings', '/c/fall-recordings-readings'], ['Practice Resources', '/c/practice-resources'], ['Open Sessions', '/c/open-sessions']];
  var MENTEE_LINKS = [['Mentorship Circle', '/c/mentorship-circle'], ['Mentorship Sessions', '/c/mentorship-sessions'], ['Apprentice Workbook', '/c/apprentice-workbook']];
  var state = { session: null, tier: null, seasons: [], first: '', practice: null, event: null, form: false, saving: false, error: '', why: false, offer: null, preview: false, cohort: null, cohortErr: '', pick: '' };

  var EYEBROW = {
    none: 'Your practice · Today', meditation: 'Meditation Pass · Today', wisdom: 'Wisdom School · Today',
    wisdom_plus: 'Wisdom School Plus · Today', ss_season: 'Sādhana School · Today', ss_year: 'Sādhana School · Today',
    mentee: 'Sahṛdaya Upāya · Today'
  };
  // Which events each membership sees as "next": matched against the event's program, series and title.
  var EVENTS_FOR = {
    meditation: /meditation monday/i, wisdom: /meditation monday|wisdom/i, wisdom_plus: /meditation monday|wisdom/i,
    ss_season: /s[aā]dhana/i, ss_year: /s[aā]dhana/i, mentee: /s[aā]dhana/i
  };
  var NEXT_LABEL = { none: 'Coming up at EP', meditation: 'Next Meditation Monday', wisdom: 'Next live session', wisdom_plus: 'Next live session' };
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

  function loadData() {
    return Promise.all([
      api('/api/member/practice?today=' + localToday()).then(function (p) { state.practice = p; }).catch(function (e) { state.error = e.message; }),
      fetch(API + '/api/events').then(function (r) { return r.json(); }).then(function (j) {
        var today = localToday();
        var upcoming = (j.events || []).filter(function (e) { return (e.end_date || e.date) >= today; });
        var re = EVENTS_FOR[state.tier];
        state.events = upcoming.filter(function (e) { return !re || re.test([e.program, e.series, e.title].join(' ')); }).slice(0, 5);
        state.event = state.events[0] || null;
      }).catch(function () {}),
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
        sharedHtml((state.shared || []).filter(function (p) { return p.email === m.email; }), true) + '</div>';
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
      '.ept-det{display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid #E3D8C6;border-radius:4px;background:#FFFDF8}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function anchor() {
    // Circle's "Start a post" box at the top of the feed; the strip goes just above it.
    // Circle's feed column has a "space-y-*" class (pinned welcome post, composer, posts); the strip goes at its top.
    var nodes = document.querySelectorAll('p, span, div, button');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length === 0 && /^\s*Start a post\s*$/.test(n.textContent || '')) {
        var card = n, fallback = null;
        for (var k = 0; k < 12 && card && card.parentElement; k++) {
          if (/(^|\s)space-y-/.test(String(card.parentElement.className || ''))) return card.parentElement.firstElementChild;
          if (!fallback && card.parentElement.children.length > 1 && card.offsetWidth > 300) fallback = card;
          card = card.parentElement;
        }
        if (fallback) return fallback;
      }
    }
    return null;
  }

  var MS_TEXT = { 7: 'Seven days in a row.', 21: 'Twenty-one days unbroken.', 40: 'Forty days unbroken.', 108: 'One hundred and eight days of sādhana.' };

  function html() {
    var p = state.practice, ev = state.event;
    var out = '<div class="ept-top"><div><div class="ept-eye">' + esc(EYEBROW[state.tier] || 'Today') + '</div>' +
      '<h2 class="ept-h">Today, <em>' + esc(state.first || 'friend') + '</em></h2></div>' +
      (PAGE_FOR.indexOf(state.tier) >= 0 ? '<a class="ept-link" href="/c/today">Open Today →</a>' : (state.tier === 'wisdom_plus' ? '<a class="ept-link" href="/c/ce-credits">Your CE hours →</a>' : '')) + '</div><div class="ept-grid">';
    // Practice
    out += '<div class="ept-cell"><span class="ept-l">Daily practice</span>';
    if (p) {
      out += '<span class="ept-big">' + p.streak + '<small> day' + (p.streak === 1 ? '' : 's') + '</small></span>';
      out += '<div class="ept-heat" role="img" aria-label="Your last eight weeks of practice">' + p.grid.map(function (col) {
        return '<div class="ept-col">' + col.map(function (c) { return '<span class="ept-d ' + c.state + '"></span>'; }).join('') + '</div>';
      }).join('') + '</div>';
      if (emptyLog(p)) out += '<span class="ept-s">Your log begins with today’s sitting.</span>'; else out += '<span class="ept-s">' + p.weekCount + ' of 7 this week' + (p.nextMilestone ? ' · next milestone ' + p.nextMilestone : '') + '</span>';
      out += p.loggedToday ? '<button class="ept-q" data-act="form">Logged today · edit</button>' : '<button class="ept-btn" data-act="form">Log today’s practice</button>';
      if (PORTFOLIO_FOR.indexOf(state.tier) >= 0) out += '<a class="ept-s ept-pf" href="/c/portfolio">Write today’s portfolio page →</a>';
    } else out += '<span class="ept-err">' + esc(state.error || 'Loading…') + '</span>';
    out += '</div>';
    // Next session
    out += '<div class="ept-cell"><span class="ept-l">' + esc(NEXT_LABEL[state.tier] || 'Next live session') + '</span>';
    if (ev) out += '<span class="ept-t">' + esc(ev.title) + '</span><span class="ept-s">' + esc(niceDate(ev.date)) + (ev.time ? ' · ' + esc(ev.time) : '') + '</span>';
    else out += '<span class="ept-s">Nothing scheduled this week.</span>';
    out += '<a class="ept-q" href="/events">See what’s coming up</a></div>';
    // One-to-one (mentees)
    if (state.tier === 'mentee') {
      out += '<div class="ept-cell"><span class="ept-l">Your monthly 1:1</span><span class="ept-t">Book in the last week of the month</span>' +
        '<span class="ept-s">45 minutes with Jacob · UK evenings</span><a class="ept-btn" target="_blank" rel="noopener" href="' + BOOKING + '">Book a time</a></div>';
    }
    if (p && p.reached && MS_TEXT[p.reached]) out += '<div class="ept-ms" role="status"><strong>' + MS_TEXT[p.reached] + '</strong>' + (p.nextMilestone ? ' Next milestone: ' + p.nextMilestone + ' days.' : '') + '</div>';
    if (state.form && p) out += formHtml(p);
    out += '</div>';
    var co = offer(), n = offer(true) ? null : nudge(); // no other suggestion while an offer is open
    if (co) out += offerHtml(co);
    else if (n) {
      out += '<div class="ept-nudge" role="note" aria-label="A suggestion"><div class="ept-nt"><span class="ept-l ept-red">' + esc(n.eyebrow) + '</span>' +
        '<button type="button" class="ept-x" data-act="dismiss" aria-label="Hide this suggestion">×</button></div>' +
        '<strong class="ept-n-h">' + esc(n.title) + '</strong><span>' + esc(n.body) + '</span>' +
        '<div class="ept-row"><a class="ept-q ept-q-red" href="' + esc(n.href) + '"' + (/^\//.test(n.href) ? '' : ' target="_blank" rel="noopener"') + '>' + esc(n.cta) + '</a><span class="ept-s">' + esc(n.note) + '</span></div>' +
        '<button type="button" class="ept-why" data-act="why" aria-expanded="' + state.why + '">Why am I seeing this?</button>' +
        (state.why ? '<span class="ept-s ept-whyt">' + esc(n.why || ('You’ve logged ' + n.at + ' days of practice.')) + ' You can hide it with ×, and we won’t show it again this season.</span>' : '') + '</div>';
    } else if (state.hidNudge) out += '<p class="ept-s ept-hid" role="status">Suggestion hidden. We won’t show it again this season.</p>';
    return out;
  }

  function formHtml(p) {
    return '<form class="ept-form" data-form="log"><span class="ept-l">Today’s practice</span>' +
        '<label class="ept-s">Minutes <input class="ept-in" name="minutes" type="number" min="0" max="600" inputmode="numeric" value="' + esc(state.minutes || '') + '"></label>' +
        '<span class="ept-s">Quality of practice</span><div class="ept-chips" role="group" aria-label="Quality of practice">' + p.qualities.map(function (q) { return '<button type="button" class="ept-chip" data-q="' + esc(q) + '" aria-pressed="' + (state.quality === q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
        '<span class="ept-s">Greater body of sādhana</span><div class="ept-chips" role="group" aria-label="Other practices">' + (p.extras || []).map(function (x) { return '<button type="button" class="ept-chip" data-x="' + esc(x) + '" aria-pressed="' + ((state.extras || []).indexOf(x) >= 0) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:8px"><button class="ept-btn" type="submit"' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? 'Saving…' : 'Save') + '</button><button class="ept-q" type="button" data-act="close">Cancel</button></div>' +
        (state.error ? '<span class="ept-err">' + esc(state.error) + '</span>' : '') + '</form>';
  }

  function pageHtml() {
    var p = state.practice, evs = state.events || [];
    var d = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    var out = '<div class="ept-top"><div><div class="ept-eye">' + esc(EYEBROW[state.tier] || 'Today') + ' · ' + esc(d) + '</div>' +
      '<h1 class="ept-h ept-h1">Good ' + greet() + ', <em>' + esc(state.first || 'sādhaka') + '</em>.</h1></div></div>';
    out += '<div class="ept-pg">';
    if (mentorView()) out += cohortHtml();
    // Practice
    out += '<section class="ept-card" aria-labelledby="ept-p"><div class="ept-ch"><h2 id="ept-p" class="ept-h2">Practice</h2><span class="ept-l">Sahṛdaya Meditation</span></div>';
    if (p) {
      out += '<div class="ept-row"><span class="ept-big ept-xl">' + p.streak + '<small> day streak</small></span><span class="ept-s">' + p.weekCount + ' of 7 this week</span></div>';
      out += '<div class="ept-heat ept-heat-l" role="img" aria-label="Your last eight weeks of practice">' + p.grid.map(function (col) {
        return '<div class="ept-col">' + col.map(function (c) { return '<span class="ept-d ' + c.state + '" title="' + esc(c.day) + '"></span>'; }).join('') + '</div>';
      }).join('') + '</div>';
      out += '<div class="ept-chips">' + [7, 21, 40, 108].map(function (m) { return '<span class="ept-ms-chip' + (p.streak >= m ? ' on' : '') + '">' + m + ' days</span>'; }).join('') + '</div>';
      if (emptyLog(p) && !state.form) out += '<p class="ept-first">Your log begins with today’s sitting. Each square is one day of sādhana; the milestones mark 7, 21, 40 and 108 days.<span class="ept-first-l">Sit for as long as feels right, then tap “Log today’s practice” to add the first square. A few minutes counts.</span></p>';
      if (p.reached && MS_TEXT[p.reached]) out += '<div class="ept-ms" role="status"><strong>' + MS_TEXT[p.reached] + '</strong>' + (p.nextMilestone ? ' Next milestone: ' + p.nextMilestone + ' days.' : '') + '</div>';
      if (state.form) out += formHtml(p);
      else out += p.loggedToday ? '<button class="ept-q" data-act="form">Logged today · edit</button>' : '<button class="ept-btn" data-act="form">Log today’s practice</button>';
    } else out += '<span class="ept-err">' + esc(state.error || 'Loading…') + '</span>';
    out += '</section>';
    // Coming up
    out += '<section class="ept-card" aria-labelledby="ept-c"><div class="ept-ch"><h2 id="ept-c" class="ept-h2">Coming up</h2><a class="ept-link" href="/events">All events</a></div>';
    if (evs.length) out += evs.map(function (e) { return '<div class="ept-ev"><span class="ept-mono">' + esc(niceDate(e.date)) + '<br>' + esc(e.time || '') + '</span><span class="ept-t">' + esc(e.title) + '</span></div>'; }).join('');
    else out += '<span class="ept-s">Nothing scheduled yet.</span>';
    out += '</section>';
    // Mentor (mentees)
    if (state.tier === 'mentee') {
      out += '<section class="ept-card" aria-labelledby="ept-m"><div class="ept-ch"><h2 id="ept-m" class="ept-h2">Your mentor</h2><span class="ept-l">Jacob Kyle</span></div>' +
        '<span class="ept-t">Monthly one-to-one · 45 minutes</span><span class="ept-s">Book in the last week of the month, UK evenings.</span>' +
        '<div class="ept-chips"><a class="ept-btn" target="_blank" rel="noopener" href="' + BOOKING + '">Book a time</a><a class="ept-q" href="/messages">Message Jacob</a></div></section>';
    }
    // Links
    var links = (state.tier === 'mentee' ? MENTEE_LINKS : []).concat(LINKS);
    out += '<section class="ept-card" aria-labelledby="ept-k"><div class="ept-ch"><h2 id="ept-k" class="ept-h2">Your spaces</h2></div>' +
      links.map(function (l) { return '<a class="ept-li" href="' + l[1] + '">' + esc(l[0]) + '<span aria-hidden="true">→</span></a>'; }).join('') + '</section>';
    return out + '</div>';
  }

  function greet() { var h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; }

  var root = null, pageRoot = null;
  function render() {
    if (root && document.body.contains(root)) root.innerHTML = html();
    if (pageRoot && document.body.contains(pageRoot)) pageRoot.innerHTML = pageHtml();
  }

  function onClick(e) {
    var t = e.target.closest('[data-act],[data-q],[data-x],[data-pick]');
    if (!t || !e.currentTarget.contains(t)) return;
    if (t.dataset.pick) { state.pick = state.pick === t.dataset.pick ? '' : t.dataset.pick; render(); return; }
    if (t.dataset.x) { var xs = state.extras || []; var i0 = xs.indexOf(t.dataset.x); state.extras = i0 >= 0 ? xs.filter(function (z) { return z !== t.dataset.x; }) : xs.concat([t.dataset.x]); render(); return; }
    if (t.dataset.q) { state.quality = state.quality === t.dataset.q ? '' : t.dataset.q; render(); return; }
    if (t.dataset.act === 'form') { state.form = true; state.error = ''; render(); var i = e.currentTarget.querySelector('input[name=minutes]'); if (i) i.focus(); }
    if (t.dataset.act === 'close') { state.form = false; render(); }
    if (t.dataset.act === 'dismiss') { local(nudgeKey(), 'hidden'); state.hidNudge = true; render(); }
    if (t.dataset.act === 'offer-hide') { local('ep_offer_' + t.dataset.key, 'hidden'); state.hidNudge = true; render(); }
    if (t.dataset.act === 'why') { state.why = !state.why; render(); }
  }
  function onInput(e) { if (e.target.name === 'minutes') state.minutes = e.target.value; }
  function onSubmit(e) {
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
    if (!PAGE.test(location.pathname) || !PAGE_OK()) return;
    if (pageRoot && document.body.contains(pageRoot)) return;
    var box = pageContainer();
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].style.display = 'none';
    pageRoot = document.createElement('div');
    pageRoot.className = 'ept-page'; pageRoot.setAttribute('role', 'region'); pageRoot.setAttribute('aria-label', 'Today');
    pageRoot.addEventListener('click', onClick);
    pageRoot.addEventListener('submit', onSubmit);
    pageRoot.addEventListener('input', onInput);
    box.insertBefore(pageRoot, box.firstChild);
    render();
  }

  function mount() {
    mountPage();
    if (!FEED.test(location.pathname) || !FEED_OK()) return;
    if (root && document.body.contains(root)) return;
    var a = anchor();
    if (!a) return;
    root = document.createElement('section');
    root.className = 'ept'; root.setAttribute('aria-label', 'Today');
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    root.addEventListener('input', onInput);
    a.parentElement.insertBefore(root, a);
    render();
  }

  // Members in SHOW_FOR see the strip; PAGE_FOR also get the Today page. Admins preview the page any time and the
  // strip with ?today=1; ?as=<tier> previews that membership (and ?as=ss_season&season=fall a Fall-only student).
  function isAdmin() { var u = window.circleUser || {}; return !!u.isAdmin; }
  function FEED_OK() { return SHOW_FOR.indexOf(state.tier) >= 0 || (isAdmin() && /[?&]today=1/.test(location.search)); }
  function PAGE_OK() { return PAGE_FOR.indexOf(state.tier) >= 0 || isAdmin(); }
  function allowed() { return FEED_OK() || PAGE_OK(); }

  signIn().then(function () {
    var as = (location.search.match(/[?&]as=([a-z_]+)/) || [])[1];
    if (as && isAdmin() && TIERS.indexOf(as) >= 0) {
      state.tier = as;
      var se = (location.search.match(/[?&]season=([a-z,]+)/) || [])[1];
      state.seasons = as === 'ss_season' ? (se ? se.split(',') : ['fall']) : [];
    }
    if (!allowed()) return;
    css();
    return loadData().then(function () {
      mount();
      // Circle is a single-page app: re-check when the page changes
      var t = null;
      new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; mount(); }, 300); }).observe(document.body, { childList: true, subtree: true });
    });
  }).catch(function () { /* signed out or not available: show nothing */ });
})();
