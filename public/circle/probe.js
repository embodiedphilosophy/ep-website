/* Embodied Philosophy · page-structure probe for Circle (ss.embodiedphilosophy.com)
   Loaded by public/circle/today.js. Does nothing unless the address has ?epdebug=1. Then it adds a button (bottom right,
   above the other badges): "Copy page structure". It copies a short outline of the page (tags, class names, labels and the first
   words of text, never anything typed into a box) so the Circle restyle can be written against the real markup. */
(function () {
  if (window.__epProbe) return; window.__epProbe = true;
  if (!/[?&]epdebug=1/.test(location.search)) return;

  var HOST = '[data-testid="circle-ai-shell-workspace-body"]';
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, PATH: 1, CIRCLE: 1, RECT: 1, LINE: 1, POLYGON: 1, G: 1, DEFS: 1, USE: 1 };
  var MAX = 700;

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
  function outline(root) {
    var lines = [], n = 0;
    (function walk(el, depth) {
      if (n >= MAX || depth > 16 || SKIP[el.tagName.toUpperCase()]) return;
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

  function add() {
    if (!document.body || document.getElementById('ep-probe')) return;
    var b = document.createElement('button'); b.id = 'ep-probe'; b.type = 'button'; b.textContent = 'Copy page structure';
    b.style.cssText = 'position:fixed;right:12px;bottom:200px;z-index:2147483647;background:#A5432A;color:#fff;border:0;border-radius:6px;padding:10px 14px;font:600 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)';
    b.addEventListener('click', function () {
      var root = document.querySelector(HOST) || document.querySelector('main') || document.body;
      var text = 'PAGE: ' + location.pathname + location.search + '\nVIEWPORT: ' + innerWidth + 'x' + innerHeight + '\n' + colors() + '\n\n' + outline(root);
      copy(text).then(function () { b.textContent = 'Copied ✓ (' + Math.round(text.length / 1000) + ' KB). Paste it to Claude'; setTimeout(function () { b.textContent = 'Copy page structure'; }, 5000); });
    });
    document.body.appendChild(b);
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  setInterval(add, 2000); // Circle redraws the page; put the button back if it goes
})();
