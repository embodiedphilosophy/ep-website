/* Embodied Philosophy · CE credits page for Circle (ss.embodiedphilosophy.com/c/ce-credits)
   Loaded by public/circle/today.js (no extra Circle snippet needed). Draws the member's continuing-education
   tracker in place of the space's content: hours this Yoga Alliance cycle, certified hours, hours by category,
   each pathway's progress, the reflection that issues a certificate, and certificate downloads.
   Data: /api/member/ce (lib/ce/*). Circle admins see the page as a Plus member would (with their own records). */
(function () {
  if (window.__epCe) return; window.__epCe = true;

  var API = 'https://www.embodiedphilosophy.com';
  var PAGE = /^\/c\/ce-credits\/?$/;
  var UPGRADE = 'https://www.embodiedphilosophy.com/wisdom-school';
  var YA_STEPS = [
    ['Sign in to Yoga Alliance', 'Open your dashboard and go to Continuing Education.'],
    ['Add a CE entry', 'Choose Embodied Philosophy as the provider.'],
    ['Copy the details', 'Pathway, hours, category and date are on each certificate and in your email.'],
    ['Keep the PDF', 'It stays here, with a verify link, in case of an audit.']
  ];
  var state = { session: null, first: '', data: null, error: '', filter: 'all', open: {}, reflecting: null, saving: false, formErr: '', issued: null, editRenewal: false, upgrade: false };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function localToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function niceDate(s) { try { return new Date(String(s).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return s; } }
  function monthYear(s) { try { return new Date(s + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return s; } }
  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    if (state.session) headers.Authorization = 'Bearer ' + state.session;
    return fetch(API + path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Something went wrong'); e.status = r.status; e.upgrade = !!j.upgrade; throw e; } return j; }); });
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
  function load() {
    return api('/api/member/ce?today=' + localToday()).then(function (d) { state.data = d; state.error = ''; })
      .catch(function (e) { state.error = e.message; state.upgrade = e.upgrade; if (e.status === 401) store('ep_today_session', ''); });
  }

  function css() {
    if (document.getElementById('epc-css')) return;
    if (!document.querySelector('link[href*="Cormorant+Garamond"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&display=swap'; document.head.appendChild(l); }
    var s = document.createElement('style'); s.id = 'epc-css';
    s.textContent = [
      '.epc{font-family:inherit;color:#1E1A14;max-width:1040px;margin:0 auto;padding:28px 20px 60px;display:flex;flex-direction:column;gap:28px}',
      '.epc *{box-sizing:border-box}',
      '.epc-eye{font-size:11px;font-weight:600;line-height:1.4;letter-spacing:.2em;text-transform:uppercase;color:#A5432A}',
      '.epc-h1{margin:6px 0 0;font:600 44px/1.05 "Cormorant Garamond",Georgia,serif}',
      '.epc-h1 em{color:#A5432A}',
      '.epc-h2{margin:0;font:600 30px/1.1 "Cormorant Garamond",Georgia,serif}',
      '.epc-lede{margin:8px 0 0;color:#5A5346;line-height:1.6;max-width:620px}',
      '.epc-top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:18px}',
      '.epc-ren{display:flex;flex-wrap:wrap;align-items:center;gap:10px;background:#F2E8D6;border-radius:6px;padding:12px 16px;font-size:14px;color:#5A5346}',
      '.epc-ren b{color:#1E1A14}',
      '.epc-ren input{font:inherit;min-height:40px;padding:0 10px;border:1px solid #D8C9AE;border-radius:4px;background:#fff}',
      '.epc-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}',
      '.epc-card{border-radius:6px;padding:22px;display:flex;flex-direction:column;gap:12px;background:#EADDC6}',
      '.epc-card.pine{background:#20302A;color:#F2E8D6}',
      '.epc-l{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#83341F}',
      '.epc-card.pine .epc-l{color:#B98A3E}',
      '.epc-num{display:flex;align-items:baseline;gap:8px}',
      '.epc-num b{font:600 52px/1 "Cormorant Garamond",Georgia,serif}',
      '.epc-card.pine .epc-num b{color:#FAF5EB}',
      '.epc-bar{height:7px;border-radius:4px;background:#D8C9AE;overflow:hidden}',
      '.epc-card.pine .epc-bar{background:rgba(242,232,214,.2)}',
      '.epc-bar span{display:block;height:100%;background:#A5432A}',
      '.epc-card.pine .epc-bar span{background:#B98A3E}',
      '.epc-cat{display:flex;flex-direction:column;gap:4px;font-size:14px}',
      '.epc-cat div:first-child{display:flex;justify-content:space-between;gap:8px}',
      '.epc-cat .epc-bar{height:5px}',
      '.epc-banner{background:#A5432A;color:#FAF5EB;border-radius:6px;padding:22px 26px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}',
      '.epc-banner .epc-l{color:#F2E8D6}',
      '.epc-banner strong{display:block;font:600 28px/1.15 "Cormorant Garamond",Georgia,serif;margin:4px 0}',
      '.epc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:4px;font:inherit;font-size:14px;font-weight:600;text-decoration:none;cursor:pointer;border:0;background:#A5432A;color:#FAF5EB}',
      '.epc-btn:hover{background:#83341F;color:#FAF5EB}',
      '.epc-btn:disabled{background:#D8C9AE;color:#5A5346;cursor:not-allowed}',
      '.epc-btn.light{background:#FAF5EB;color:#83341F}',
      '.epc-btn.pine{background:#20302A}',
      '.epc-btn.line{background:transparent;color:#83341F;border:1px solid #A5432A}',
      '.epc-btn.quiet{background:transparent;color:#5A5346;border:1px solid #D8C9AE;font-weight:500}',
      '.epc-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px}',
      '.epc-tabs{display:flex;gap:4px;background:#F2E8D6;padding:4px;border-radius:6px;flex-wrap:wrap}',
      '.epc-tabs button{font:inherit;font-size:14px;font-weight:600;border:0;border-radius:4px;min-height:40px;padding:0 14px;background:transparent;color:#5A5346;cursor:pointer}',
      '.epc-tabs button[aria-pressed=true]{background:#20302A;color:#FAF5EB}',
      '.epc-list{display:flex;flex-direction:column;gap:10px}',
      '.epc-row{background:#fff;border:1px solid #D8C9AE;border-radius:6px;padding:20px 22px;display:flex;flex-direction:column;gap:14px}',
      '.epc-rt{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px}',
      '.epc-rt > div:first-child{flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:6px}',
      '.epc-meta{display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:13px;color:#5A5346}',
      '.epc-pill{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:4px 9px;border-radius:3px}',
      '.epc-pill.reflect{background:#A5432A;color:#FAF5EB}.epc-pill.progress{background:#EADDC6;color:#83341F}',
      '.epc-pill.certified{background:#20302A;color:#F2E8D6}.epc-pill.held,.epc-pill.locked{background:#F2E8D6;color:#83341F}',
      '.epc-pill.new{border:1px solid #D8C9AE;color:#5A5346}',
      '.epc-title{margin:0;font:600 25px/1.15 "Cormorant Garamond",Georgia,serif}',
      '.epc-acts{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.epc-prog{display:flex;align-items:center;gap:12px;font-size:13px;color:#5A5346}',
      '.epc-prog .epc-bar{flex:1;height:6px;background:#EADDC6}',
      '.epc-mods{margin:0;padding:12px 0 0;border-top:1px solid #EADDC6;list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px 22px;font-size:14px}',
      '.epc-mods li{display:flex;gap:10px;align-items:baseline}',
      '.epc-mods li span{color:#A5432A;font-weight:600}',
      '.epc-steps{background:#F2E8D6;border-radius:6px;padding:28px;display:flex;flex-direction:column;gap:18px}',
      '.epc-steps ol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px}',
      '.epc-steps li{display:flex;flex-direction:column;gap:6px;font-size:14px;color:#5A5346;line-height:1.5}',
      '.epc-steps li b{color:#1E1A14}',
      '.epc-steps li i{font:600 32px/1 "Cormorant Garamond",Georgia,serif;color:#A5432A;font-style:normal}',
      '.epc-small{font-size:13px;color:#5A5346}',
      '.epc-err{color:#83341F;font-size:14px;font-weight:600}',
      '.epc-form{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start}',
      '.epc-side{flex:1 1 260px;min-width:0;background:#20302A;color:#F2E8D6;border-radius:6px;padding:26px;display:flex;flex-direction:column;gap:14px}',
      '.epc-side .epc-l{color:#B98A3E}',
      '.epc-side h2{margin:0;font:600 32px/1.1 "Cormorant Garamond",Georgia,serif;color:#FAF5EB}',
      '.epc-side dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:8px 14px;font-size:14px}',
      '.epc-side dt{color:#B98A3E}.epc-side dd{margin:0}',
      '.epc-main{flex:999 1 460px;min-width:0;display:flex;flex-direction:column;gap:22px}',
      '.epc-field{display:flex;flex-direction:column;gap:6px}',
      '.epc-field label{font-weight:600}',
      '.epc-field textarea,.epc-field input{font:inherit;font-size:15px;line-height:1.5;padding:12px 14px;border:1px solid #D8C9AE;border-radius:4px;background:#fff;color:#1E1A14}',
      '.epc-field input{min-height:46px;padding:0 14px}',
      '.epc-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}',
      '.epc-attest{display:flex;gap:12px;align-items:flex-start;background:#F2E8D6;border-radius:6px;padding:16px 18px;line-height:1.5;cursor:pointer}',
      '.epc-attest input{width:22px;height:22px;margin:2px 0 0;accent-color:#A5432A;flex:none}',
      '.epc-done{background:#fff;border:1px solid #D8C9AE;border-radius:6px;padding:32px;display:flex;flex-direction:column;gap:16px}',
      '@media (max-width:600px){.epc-h1{font-size:34px}.epc{padding:20px 14px 48px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  var LABEL = { reflect: 'Ready to reflect', progress: 'In progress', certified: 'Certified', held: 'With the EP team', locked: 'Finished', new: 'Not started' };

  function rowHtml(r) {
    var label = LABEL[r.status] + (r.status === 'certified' && r.cert ? ' · ' + niceDate(r.cert.issuedAt) : '');
    var act = '';
    if (r.status === 'reflect') act = '<button type="button" class="epc-btn" data-act="reflect" data-slug="' + esc(r.slug) + '">Write reflection</button>';
    else if (r.status === 'certified' && r.cert && r.cert.pdf) act = '<a class="epc-btn line" href="' + esc(r.cert.pdf) + '" target="_blank" rel="noopener">Download certificate</a>';
    else if (r.status === 'held') act = '<span class="epc-small">A quick look by the EP team, then it’s emailed to you</span>';
    else if (r.status === 'locked') act = '<a class="epc-btn" href="' + UPGRADE + '">Upgrade to Plus for the certificate</a>';
    else if (r.url) act = '<a class="epc-btn ' + (r.status === 'new' ? 'line' : 'pine') + '" href="' + esc(r.url) + '">' + (r.status === 'new' ? 'Start in Circle' : 'Continue') + '</a>';
    var prog = r.lessonsTotal ? r.lessonsDone + ' of ' + r.lessonsTotal + ' lessons' : r.percent === 100 ? 'All lessons complete' : r.lessonsDone ? r.lessonsDone + ' lessons done' : 'Not started';
    var pct = r.lessonsTotal ? r.percent : (r.percent === 100 ? 100 : 0);
    var open = !!state.open[r.slug];
    var out = '<article class="epc-row"><div class="epc-rt"><div><div class="epc-meta"><span class="epc-pill ' + r.status + '">' + esc(label) + '</span><span>' + esc(r.category) + ' · ' + esc(r.hours) + ' CE hours</span></div>' +
      '<h3 class="epc-title">' + esc(r.title) + '</h3></div><div class="epc-acts">' +
      (r.modules && r.modules.length ? '<button type="button" class="epc-btn quiet" data-act="toggle" data-slug="' + esc(r.slug) + '" aria-expanded="' + open + '">' + (open ? 'Hide modules' : 'Show modules') + '</button>' : '') + act + '</div></div>' +
      '<div class="epc-prog"><div class="epc-bar" role="img" aria-label="' + esc(prog) + '"><span style="width:' + pct + '%;' + (r.status === 'certified' ? 'background:#20302A' : '') + '"></span></div><span>' + esc(prog) + '</span></div>';
    if (open) out += '<ol class="epc-mods">' + r.modules.map(function (m, i) { return '<li><span>' + (i + 1) + '</span>' + esc(m) + '</li>'; }).join('') + '</ol>';
    return out + '</article>';
  }

  function trackerHtml() {
    var d = state.data, c = d.cycle;
    var cats = ['Yoga Humanities', 'Anatomy & Physiology', 'Techniques, Training & Practice'];
    Object.keys(d.byCategory).forEach(function (k) { if (cats.indexOf(k) < 0) cats.push(k); });
    var maxCat = Math.max.apply(null, [1].concat(cats.map(function (k) { return d.byCategory[k] || 0; })));
    var ready = d.rows.filter(function (r) { return r.status === 'reflect'; })[0];
    var rows = d.rows.filter(function (r) {
      return state.filter === 'all' || (state.filter === 'progress' && ['progress', 'reflect', 'held', 'locked'].indexOf(r.status) >= 0) || (state.filter === 'certified' && r.status === 'certified');
    });
    var certifiedCount = d.rows.filter(function (r) { return r.status === 'certified'; }).length;
    var going = d.rows.filter(function (r) { return r.status === 'progress' || r.status === 'reflect'; }).length;
    var out = '<div class="epc-top"><div><div class="epc-eye">' + (d.eligible ? 'Wisdom School Plus' : 'Wisdom School') + ' · Continuing education</div>' +
      '<h1 class="epc-h1">Your CE hours' + (state.first ? ', <em>' + esc(state.first) + '</em>' : '') + '</h1>' +
      '<p class="epc-lede">Finish a Learning Pathway in Circle, write a short reflection, and your certificate arrives straight away, ready to log with Yoga Alliance.</p></div>';
    if (state.editRenewal) out += '<form class="epc-ren" data-form="renewal"><label for="epc-rd">Your Yoga Alliance renewal date</label><input id="epc-rd" type="date" name="renewal" value="' + esc(d.renewal || '') + '"><button class="epc-btn pine" type="submit">Save</button><button class="epc-btn quiet" type="button" data-act="renewal-cancel">Cancel</button></form>';
    else out += '<div class="epc-ren"><span>' + (d.renewal ? 'Your Yoga Alliance renewal: <b>' + esc(monthYear(d.renewal)) + '</b>' : 'Add your Yoga Alliance renewal date to count this cycle') + '</span><button type="button" class="epc-btn quiet" data-act="renewal">' + (d.renewal ? 'Edit' : 'Add') + '</button></div>';
    out += '</div>';

    var toGo = Math.max(0, Math.round((c.need - c.hours) * 10) / 10);
    out += '<section class="epc-cards" aria-label="Summary">' +
      '<div class="epc-card pine"><span class="epc-l">This renewal cycle</span><div class="epc-num"><b>' + esc(c.hours) + '</b><span>of ' + c.need + ' hours</span></div>' +
      '<div class="epc-bar"><span style="width:' + Math.min(100, Math.round(c.hours / c.need * 100)) + '%"></span></div>' +
      '<span>' + (c.met ? 'Requirement met for this cycle.' : toGo + ' hours to go' + (c.set ? ' before ' + esc(monthYear(c.end)) + '.' : '.')) + '</span></div>' +
      '<div class="epc-card"><span class="epc-l">Certified with EP</span><div class="epc-num"><b>' + esc(d.certifiedHours) + '</b><span>of ' + esc(d.availableHours) + ' hours available</span></div>' +
      '<div class="epc-bar"><span style="width:' + Math.min(100, Math.round(d.certifiedHours / Math.max(1, d.availableHours) * 100)) + '%"></span></div>' +
      '<span class="epc-small">' + certifiedCount + ' certificate' + (certifiedCount === 1 ? '' : 's') + ' · ' + going + ' in progress</span></div>' +
      '<div class="epc-card"><span class="epc-l">By Yoga Alliance category</span>' + cats.map(function (k) {
        var h = d.byCategory[k] || 0;
        return '<div class="epc-cat"><div><span>' + esc(k) + '</span><b>' + h + ' h</b></div><div class="epc-bar"><span style="width:' + Math.round(h / maxCat * 100) + '%"></span></div></div>';
      }).join('') + '</div></section>';

    if (ready) out += '<section class="epc-banner"><div><span class="epc-l">Ready for your reflection</span><strong>' + esc(ready.title) + ' · ' + esc(ready.hours) + ' CE hours</strong><span>You’ve finished every lesson. Two short answers and your certificate is issued.</span></div>' +
      '<button type="button" class="epc-btn light" data-act="reflect" data-slug="' + esc(ready.slug) + '">Write reflection →</button></section>';
    if (!d.eligible) out += '<section class="epc-banner" style="background:#20302A"><div><span class="epc-l" style="color:#B98A3E">Certificates come with Plus</span><strong>Every pathway, with certificates</strong><span>Your progress on Meditation for Real Life is tracked here. Wisdom School Plus opens every pathway and issues your CE certificates.</span></div><a class="epc-btn light" href="' + UPGRADE + '">See Wisdom School Plus</a></section>';

    out += '<section aria-labelledby="epc-ph" style="display:flex;flex-direction:column;gap:16px"><div class="epc-head"><h2 id="epc-ph" class="epc-h2">Learning Pathways</h2>' +
      '<div class="epc-tabs" role="group" aria-label="Filter pathways">' + [['all', 'All'], ['progress', 'In progress'], ['certified', 'Certified']].map(function (t) {
        return '<button type="button" data-filter="' + t[0] + '" aria-pressed="' + (state.filter === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</div></div><div class="epc-list">' + (rows.length ? rows.map(rowHtml).join('') : '<p class="epc-small">Nothing here yet.</p>') + '</div></section>';

    out += '<section class="epc-steps" aria-labelledby="epc-ya"><h2 id="epc-ya" class="epc-h2">Logging your hours with Yoga Alliance</h2><ol>' +
      YA_STEPS.map(function (s, i) { return '<li><i>' + (i + 1) + '</i><b>' + esc(s[0]) + '</b>' + esc(s[1]) + '</li>'; }).join('') + '</ol>' +
      '<span class="epc-small">Yoga Alliance sets the rules and can change them. Check the current requirements for your credential.</span></section>';
    return out;
  }

  function reflectHtml() {
    var r = state.data.rows.filter(function (x) { return x.slug === state.reflecting; })[0];
    if (!r) { state.reflecting = null; return trackerHtml(); }
    if (state.issued) {
      var held = state.issued.status === 'held';
      var c = state.data.cycle;
      var row = state.data.rows.filter(function (x) { return x.slug === r.slug; })[0];
      return '<div class="epc-done"><span class="epc-eye">' + esc(r.title) + '</span><h1 class="epc-h1">' + (held ? 'Thank you, your reflection is in' : 'Your certificate is ready') + '</h1>' +
        '<p class="epc-lede">' + (held ? 'The EP team takes a quick look at every certificate finished unusually fast. You’ll have it by email within a couple of days.'
          : esc(r.hours) + ' CE hours added. That brings you to <b>' + esc(c.hours) + ' hours</b> this cycle' + (c.met ? ': your ' + c.need + '-hour Yoga Alliance requirement is met.' : '.')) + '</p>' +
        '<span class="epc-small">Certificate ' + esc(state.issued.id) + (state.issued.emailed ? ' · also sent to your email' : '') + '</span>' +
        '<div class="epc-acts">' + (!held && row && row.cert && row.cert.pdf ? '<a class="epc-btn" href="' + esc(row.cert.pdf) + '" target="_blank" rel="noopener">Download certificate (PDF)</a>' : '') +
        '<button type="button" class="epc-btn line" data-act="back">Back to my CE hours</button></div></div>';
    }
    return '<div class="epc-form"><aside class="epc-side"><span class="epc-l">Pathway complete</span><h2>' + esc(r.title) + '</h2>' +
      '<dl><dt>CE hours</dt><dd>' + esc(r.hours) + '</dd><dt>Category</dt><dd>' + esc(r.category) + '</dd><dt>Lessons</dt><dd>All complete</dd></dl>' +
      '<p style="margin:0;font-size:14px;line-height:1.6">Your reflection is kept with your certificate as the record of your study. Nobody grades it: write as you would in a practice journal.</p></aside>' +
      '<form class="epc-main" data-form="reflect"><div><span class="epc-eye">About ten minutes</span><h1 class="epc-h1">A short reflection, <em>then your certificate</em></h1></div>' +
      '<div class="epc-field"><label for="epc-q1">1. What shifted in your understanding or practice through this pathway?</label><span class="epc-small" id="epc-q1h">A few sentences. Around 75 words is plenty.</span><textarea id="epc-q1" name="r1" rows="5" aria-describedby="epc-q1h" required></textarea></div>' +
      '<div class="epc-field"><label for="epc-q2">2. How will you bring this into your teaching or your students’ practice?</label><span class="epc-small" id="epc-q2h">One concrete example is ideal.</span><textarea id="epc-q2" name="r2" rows="5" aria-describedby="epc-q2h" required></textarea></div>' +
      '<div class="epc-two"><div class="epc-field"><label for="epc-nm">Name as it should appear on the certificate</label><input id="epc-nm" name="name" type="text" autocomplete="name" required value="' + esc(state.name || '') + '"></div>' +
      '<div class="epc-field"><label for="epc-ya">Yoga Alliance member ID <span class="epc-small">(optional)</span></label><input id="epc-ya" name="yaId" type="text"></div></div>' +
      '<label class="epc-attest"><input type="checkbox" name="attest" required><span>I confirm that I completed every lesson of this pathway myself and that the ' + esc(r.hours) + ' hours reflect my own study.</span></label>' +
      (state.formErr ? '<p class="epc-err" role="alert">' + esc(state.formErr) + '</p>' : '') +
      '<div class="epc-acts"><button type="submit" class="epc-btn"' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? 'Issuing…' : 'Submit and issue my certificate') + '</button>' +
      '<button type="button" class="epc-btn quiet" data-act="back">Not now</button></div></form></div>';
  }

  function html() {
    if (state.error) {
      if (state.upgrade) return '<div class="epc-done"><span class="epc-eye">Continuing education</span><h1 class="epc-h1">CE hours come with <em>Wisdom School Plus</em></h1><p class="epc-lede">Plus opens every Learning Pathway, with a certificate for each one you complete, ready to log with Yoga Alliance.</p><div class="epc-acts"><a class="epc-btn" href="' + UPGRADE + '">See Wisdom School Plus</a></div></div>';
      return '<p class="epc-err" role="alert">' + esc(state.error) + '</p>';
    }
    if (!state.data) return '<p class="epc-small">Loading your CE hours…</p>';
    return state.reflecting ? reflectHtml() : trackerHtml();
  }

  var root = null;
  function render() { if (root && document.body.contains(root)) root.innerHTML = html(); }

  function onClick(e) {
    var t = e.target.closest('[data-act],[data-filter]');
    if (!t || !root.contains(t)) return;
    if (t.dataset.filter) { state.filter = t.dataset.filter; render(); return; }
    var a = t.dataset.act;
    if (a === 'toggle') { state.open[t.dataset.slug] = !state.open[t.dataset.slug]; render(); }
    if (a === 'reflect') { state.reflecting = t.dataset.slug; state.issued = null; state.formErr = ''; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (a === 'back') { state.reflecting = null; state.issued = null; render(); }
    if (a === 'renewal') { state.editRenewal = true; render(); }
    if (a === 'renewal-cancel') { state.editRenewal = false; render(); }
  }
  function onSubmit(e) {
    var f = e.target;
    if (f.matches('[data-form=renewal]')) {
      e.preventDefault();
      api('/api/member/ce', { method: 'POST', body: { action: 'renewal', renewal: f.renewal.value, today: localToday() } })
        .then(function (d) { state.data = d; state.editRenewal = false; }).catch(function (err) { state.error = err.message; }).then(render);
    }
    if (f.matches('[data-form=reflect]')) {
      e.preventDefault();
      state.name = f.name.value; state.saving = true; state.formErr = '';
      var body = { action: 'reflect', slug: state.reflecting, r1: f.r1.value, r2: f.r2.value, name: f.name.value, yaId: f.yaId.value, attest: f.attest.checked, today: localToday() };
      var keep = { r1: f.r1.value, r2: f.r2.value, yaId: f.yaId.value };
      render(); restore(keep);
      api('/api/member/ce', { method: 'POST', body: body })
        .then(function (r) { state.data = r.summary; state.issued = r.cert; state.saving = false; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); })
        .catch(function (err) { state.saving = false; state.formErr = err.status === 401 ? 'Please refresh the page and try again.' : err.message; if (err.status === 401) store('ep_today_session', ''); render(); restore(keep); });
    }
  }
  // Keep what they wrote when the form redraws
  function restore(v) { var f = root.querySelector('[data-form=reflect]'); if (!f) return; f.r1.value = v.r1; f.r2.value = v.r2; f.yaId.value = v.yaId; f.attest.checked = true; }

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
    root.className = 'epc'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Your CE hours');
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    box.insertBefore(root, box.firstChild);
    render();
  }

  var started = false;
  function start() {
    if (started || !PAGE.test(location.pathname)) return;
    started = true; css();
    signIn().then(load).catch(function () { state.error = 'Please sign in to Circle to see your CE hours.'; }).then(function () { mount(); render(); });
  }
  start();
  // Circle is a single-page app: mount when someone navigates to the page
  var t = null;
  new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; start(); if (started) mount(); }, 300); }).observe(document.body, { childList: true, subtree: true });
})();
