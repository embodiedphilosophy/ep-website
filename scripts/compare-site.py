# Compare what the public site shows on two running builds (e.g. main on :3200, a branch on :3100), page by
# page, so dashboard work can't quietly change the website. Reads the sitemap, plus /api/events.
#   python3 scripts/compare-site.py 3200 3100
# Prints SAME / DIFF per page with the changed lines; sitemap lastmod times always differ and are ignored.
import re, urllib.request, html, difflib, sys
A, B = (sys.argv[1:3] + ["3200", "3100"])[:2]
def get(port, path):
    try:
        r = urllib.request.urlopen(f'http://localhost:{port}{path}', timeout=60); return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e: return e.code, ''
def text(h):
    h = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', h, flags=re.S)
    return [l for l in (html.unescape(x).strip() for x in re.sub(r'<[^>]+>', '\n', h).split('\n')) if l]
st, sm = get(A, '/sitemap.xml')
paths = sorted({re.sub(r'https?://[^/]+', '', u) or '/' for u in re.findall(r'<loc>(.*?)</loc>', sm)})
paths += ['/api/events', '/sitemap.xml']
bad = 0
for p in paths:
    a, b = get(A, p), get(B, p)
    if a[0] != b[0]: print('STATUS', p, a[0], b[0]); bad += 1; continue
    ta, tb = (a[1].splitlines(), b[1].splitlines()) if p.startswith('/api') or p.endswith('.xml') else (text(a[1]), text(b[1]))
    d = [l for l in difflib.unified_diff(ta, tb, lineterm='', n=0) if l[:1] in '+-' and not l.startswith(('+++', '---')) and '<lastmod>' not in l]
    print(('SAME  ' if not d else 'DIFF  ') + f'{a[0]} {p}')
    for l in d[:12]: print('     ', l[:160])
    bad += bool(d)
print(len(paths), 'pages compared,', bad, 'differ')
