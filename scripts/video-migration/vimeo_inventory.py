#!/usr/bin/env python3
"""Read-only inventory of the Embodied Philosophy Vimeo account.

Writes vimeo-inventory.csv next to this file: one row per video with its folder,
showcases, duration, privacy and which download files Vimeo offers (incl. whether
the original "source" upload is still available). Changes nothing on Vimeo.

Needs VIMEO_ACCESS_TOKEN in the environment. Run: python3 scripts/video-migration/vimeo_inventory.py
"""
import csv, json, os, sys, time, urllib.request, urllib.error
from pathlib import Path

API = 'https://api.vimeo.com'
HERE = Path(__file__).resolve().parent
TOKEN = os.environ.get('VIMEO_ACCESS_TOKEN') or sys.exit('VIMEO_ACCESS_TOKEN is not set')


def get(path):
    url = path if path.startswith('http') else API + path
    req = urllib.request.Request(url, headers={
        'Authorization': f'bearer {TOKEN}', 'Accept': 'application/vnd.vimeo.*+json;version=3.4'})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                left = r.headers.get('X-RateLimit-Remaining')
                if left is not None and int(left) < 5:
                    time.sleep(30)
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429 or e.code >= 500:
                time.sleep(10 * (attempt + 1)); continue
            raise
    raise RuntimeError(f'Vimeo kept failing for {path}')


def pages(path):
    while path:
        d = get(path)
        yield from d['data']
        path = (d.get('paging') or {}).get('next')


def hms(s):
    s = int(s or 0)
    return f'{s // 3600}:{s // 60 % 60:02d}:{s % 60:02d}'


def main():
    # Folder id -> "Parent / Child" path
    folders = {}
    for f in pages('/me/projects?per_page=100&fields=uri,name,metadata.connections.ancestor_path'):
        anc = [a['name'] for a in reversed(f['metadata']['connections'].get('ancestor_path') or [])]
        folders[f['uri']] = ' / '.join(anc + [f['name']])

    # Video id -> showcase names
    showcases = {}
    for a in pages('/me/albums?per_page=100&fields=uri,name'):
        for v in pages(f"{a['uri']}/videos?per_page=100&fields=uri"):
            showcases.setdefault(v['uri'], []).append(a['name'])

    fields = ('uri,name,description,duration,created_time,privacy.view,status,link,'
              'parent_folder.uri,download.quality,download.rendition,download.size,download.width,download.height')
    rows = []
    for v in pages(f'/me/videos?per_page=100&fields={fields}'):
        dl = v.get('download') or []
        source = next((d for d in dl if d.get('quality') == 'source'), None)
        best = source or max(dl, key=lambda d: d.get('size') or 0, default=None)
        pf = (v.get('parent_folder') or {}).get('uri')
        rows.append({
            'vimeo_id': v['uri'].rsplit('/', 1)[-1],
            'title': v.get('name') or '',
            'folder': folders.get(pf, '(no folder)' if not pf else pf),
            'showcases': ' | '.join(showcases.get(v['uri'], [])),
            'duration': hms(v.get('duration')),
            'duration_seconds': v.get('duration') or 0,
            'created': (v.get('created_time') or '')[:10],
            'privacy': (v.get('privacy') or {}).get('view', ''),
            'status': v.get('status', ''),
            'original_available': 'yes' if source else 'no',
            'best_download': (best or {}).get('rendition') or (best or {}).get('quality') or 'none',
            'best_download_gb': round(((best or {}).get('size') or 0) / 1e9, 3),
            'size_1080p_gb': round(next((d.get('size') or 0 for d in dl if d.get('rendition') == '1080p'), 0) / 1e9, 3),
            'vimeo_link': f"https://vimeo.com/{v['uri'].rsplit('/', 1)[-1]}",  # no unlisted hash: it works like a password
            'description': (v.get('description') or '').replace('\r', ' ').strip()[:500],
        })
        if len(rows) % 500 == 0:
            print(f'{len(rows)} videos…', file=sys.stderr)

    rows.sort(key=lambda r: (r['folder'].lower(), r['created'], r['title'].lower()))
    out = HERE / 'vimeo-inventory.csv'
    with open(out, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader(); w.writerows(rows)
    total = sum(r['best_download_gb'] for r in rows)
    hours = sum(r['duration_seconds'] for r in rows) / 3600
    print(f'{len(rows)} videos, {hours:,.0f} hours, {total:,.1f} GB at best quality '
          f'({sum(r["original_available"] == "yes" for r in rows)} with original file) -> {out}')


if __name__ == '__main__':
    main()
