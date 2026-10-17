/* Embodied Philosophy · page-structure probe for Circle (ss.embodiedphilosophy.com)
   Loaded by public/circle/today.js. Hidden from everyone by default. Shows only with ?epdebug=1 on the address, or after pressing
   Control+Option+P. It adds a button (bottom right): "Copy page structure". It copies a short outline of the page (tags, class names, labels and the first
   words of text, never anything typed into a box) so the Circle restyle can be written against the real markup. */
(function () {
  if (window.__epProbe) return; window.__epProbe = true;
  function flag(v) { try { if (v === undefined) return sessionStorage.getItem('ep_probe'); if (v) sessionStorage.setItem('ep_probe', v); else sessionStorage.removeItem('ep_probe'); } catch (e) { return null; } }
  function wanted() {
    return /[?&]epdebug=1/.test(location.search) || flag() === '1';
  }
  // Control+Option+P switches the button on or off, for pages where the address can't be changed
  window.addEventListener('keydown', function (e) { if (e.ctrlKey && e.altKey && e.code === 'KeyP') { flag(flag() === '1' ? '' : '1'); add(); } });

  var HOST = '[data-testid="circle-ai-shell-workspace-body"]';
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, PATH: 1, CIRCLE: 1, RECT: 1, LINE: 1, POLYGON: 1, G: 1, DEFS: 1, USE: 1 };
  var MAX = 500;

  function sig(el) {
    var s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id.slice(0, 30);
    var cls = (typeof el.className === 'string' ? el.className : '').split(/\s+/).filter(Boolean).slice(0, 8).map(function (c) { return c.slice(0, 44); });
    if (cls.length) s += '.' + cls.join('.');
    ['data-testid', 'role', 'aria-label', 'type', 'href', 'placeholder'].forEach(function (a) {
      var v = el.getAttribute(a); if (v) s += '[' + a.replace('data-', '') + '=' + String(v).slice(0, 40).replace(/\s+/g, ' ') + ']';
    });
    return s;
  }
  function ownText(el) {
    var t = ''; for (var i = 0; i < el.childNodes.length; i++) if (el.childNodes[i].nodeType === 3) t += el.childNodes[i].nodeValue;
    return t.replace(/\s+/g, ' ').trim().slice(0, 40);
  }
  function outline(root, max, deep) {
    var lines = [], n = 0, cap = max || MAX, lim = deep || 40;
    (function walk(el, depth) {
      if (n >= cap || depth > lim || SKIP[el.tagName.toUpperCase()]) return;
      var kids = Array.prototype.filter.call(el.children, function (k) { return !SKIP[k.tagName.toUpperCase()]; });
      var tag = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') ? '' : ownText(el);
      lines.push(new Array(depth + 1).join('  ') + sig(el) + (tag ? ' "' + tag + '"' : '')); n++;
      // repeated siblings with the same signature: show the first one and say how many there are
      var i = 0;
      while (i < kids.length) {
        var s = sig(kids[i]), j = i; while (j + 1 < kids.length && sig(kids[j + 1]) === s) j++;
        walk(kids[i], depth + 1);
        if (j > i) lines.push(new Array(depth + 2).join('  ') + '… ×' + (j - i + 1) + ' like the one above');
        i = j + 1;
      }
    })(root, 0);
    return lines.join('\n');
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(function () { fallback(text); });
    fallback(text); return Promise.resolve();
  }
  function fallback(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove();
  }
  function colors() {
    // a few computed styles of the main areas, so the restyle can be matched to what is there now
    var out = [], pick = [['body', 'body'], [HOST, 'content area']];
    pick.forEach(function (p) { var el = document.querySelector(p[0]); if (el) { var c = getComputedStyle(el); out.push(p[1] + ': background ' + c.backgroundColor + ', text ' + c.color + ', font ' + c.fontFamily.slice(0, 50)); } });
    return out.join('\n');
  }

  // The parts that matter most for a chat restyle, each outlined in full on its own (the main outline can run out of room)
  function extras() {
    var out = '\n\n===== MESSAGES (first 3, in full) =====\n';
    Array.prototype.slice.call(document.querySelectorAll('[data-testid=message-item]'), 0, 3).forEach(function (m) { out += outline(m, 90, 14) + '\n--\n'; });
    [['RIGHT PANEL', '#rail-bar-content'], ['HEADER / TITLE BAR', 'header,[role=banner]'], ['LEFT SIDEBAR', 'aside,[role=complementary],nav'], ['CHAT LIST ITEMS', '[data-testid*=chat-room-item],[data-testid*=conversation],[data-testid*=dm-]']].forEach(function (g) {
      var el = document.querySelector(g[1]); out += '\n===== ' + g[0] + ' (' + g[1] + ') =====\n' + (el ? outline(el, 120, 14) : '(not found on this page)') + '\n';
    });
    var ids = {}; Array.prototype.forEach.call(document.querySelectorAll('[data-testid]'), function (e) { ids[e.getAttribute('data-testid')] = 1; });
    out += '\n===== ALL data-testid VALUES =====\n' + Object.keys(ids).slice(0, 250).join(', ') + '\n';
    return out;
  }
  function add() {
    var have = document.getElementById('ep-probe');
    if (!wanted()) { if (have) have.remove(); return; }
    if (!document.body || have) return;
    var b = document.createElement('button'); b.id = 'ep-probe'; b.type = 'button'; b.textContent = 'Copy page structure';
    b.style.cssText = 'position:fixed;right:12px;bottom:200px;z-index:2147483647;background:#A5432A;color:#fff;border:0;border-radius:6px;padding:10px 14px;font:600 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)';
    b.addEventListener('click', function () {
      var root = document.querySelector(HOST) || document.querySelector('main') || document.body;
      var text = 'PAGE: ' + location.pathname + location.search + '\nVIEWPORT: ' + innerWidth + 'x' + innerHeight + '\n' + colors() + '\n\n' + outline(root) + extras();
      copy(text).then(function () { b.textContent = 'Copied ✓ (' + Math.round(text.length / 1000) + ' KB). Paste it to Claude'; setTimeout(function () { b.textContent = 'Copy page structure'; }, 5000); });
    });
    document.body.appendChild(b);
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  setInterval(add, 2000); // Circle redraws the page; put the button back if it goes
})();
