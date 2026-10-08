#!/usr/bin/env python3
"""Move videos from Vimeo into Circle course lessons, one at a time, following pathway-mapping.csv.

For each video: download from Vimeo (1080p, or the largest copy under Circle's 4 GB limit) →
upload to Circle → attach to a lesson → check it's there → delete the local copy → log the result
in progress.csv. A stopped run resumes where it left off (videos marked "done" are skipped).
Never changes anything in Vimeo.

Lessons: a talk section that holds one video and already has a placeholder "… · Overview" lesson
gets the video on that lesson; everything else gets a new lesson named after the video.

  python3 migrate.py --source "Roots & Branches I with Marcy Braverman Goldstein"
  python3 migrate.py --programme "Roots & Branches: A History of Yoga" --limit 2
  python3 migrate.py --dry-run --programme "..."      # show the plan, change nothing
Needs VIMEO_ACCESS_TOKEN and CIRCLE_API_TOKEN.
"""
import argparse, base64, csv, hashlib, html, json, os, subprocess, sys, time, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORK = Path(os.environ.get('MIGRATION_WORKDIR', '/tmp/ep-video-migration'))  # one video at a time lives here
CIRCLE = 'https://app.circle.so/api/admin/v2'
LIMIT = 4 * 1000**3 - 50 * 1000**2  # stay a little under Circle's 4 GB per file
PROGRESS = HERE / 'progress.csv'
FIELDS = ['vimeo_id', 'programme', 'section', 'lesson_title', 'status', 'lesson_id', 'lesson_url',
          'rendition', 'bytes', 'error', 'finished_at']
UA = 'ep-video-migration/1.0'  # Cloudflare in front of Circle rejects urllib's default


def api(url, method='GET', body=None, headers=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'User-Agent': UA, 'Content-Type': 'application/json', **(headers or {})})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                t = r.read().decode()
                return json.loads(t) if t else {}
        except urllib.error.HTTPError as e:
            if e.code in (429, 502, 503, 504) and attempt < 3:
                time.sleep(15 * (attempt + 1)); continue
            raise RuntimeError(f'{method} {url.split("?")[0]}: {e.code} {e.read().decode()[:300]}')


def circle(path, method='GET', body=None):
    return api(CIRCLE + path, method, body, {'Authorization': f'Bearer {os.environ["CIRCLE_API_TOKEN"]}'})


def vimeo(path):
    return api('https://api.vimeo.com' + path, headers={'Authorization': f'bearer {os.environ["VIMEO_ACCESS_TOKEN"]}',
                                                        'Accept': 'application/vnd.vimeo.*+json;version=3.4'})


def pick_file(vid):
    """1080p when it fits under Circle's limit, else the biggest file that does."""
    files = [f for f in vimeo(f'/videos/{vid}?fields=download').get('download', []) if f.get('size')]
    ok = [f for f in files if f['size'] <= LIMIT]
    if not ok:
        raise RuntimeError('no Vimeo file under 4 GB')
    hd = [f for f in ok if f.get('rendition') == '1080p']
    return hd[0] if hd else max(ok, key=lambda f: f['size'])


def load_progress():
    if not PROGRESS.exists():
        return {}
    return {r['vimeo_id']: r for r in csv.DictReader(open(PROGRESS, encoding='utf-8'))}


def save_progress(prog):
    tmp = PROGRESS.with_suffix('.tmp')
    with open(tmp, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=FIELDS); w.writeheader(); w.writerows(prog.values())
    tmp.replace(PROGRESS)


def sections_for(space_id, mapped_names):
    """Existing sections by name; creates the mapped ones that are missing, in mapping order."""
    have = {s['name']: s for s in circle(f'/course_sections?space_id={space_id}&per_page=100').get('records', [])}
    for name in mapped_names:
        if name not in have:
            s = circle('/course_sections', 'POST', {'space_id': int(space_id), 'name': name})
            s = s.get('course_section', s)
            have[name] = s
            print(f'  created section "{name}" ({s.get("id")})')
    return have


def overview_lesson(section_id):
    recs = circle(f'/course_lessons?section_id={section_id}&per_page=100').get('records', [])
    recs = [r for r in recs if str(r.get('section_id')) == str(section_id)]
    if len(recs) == 1 and recs[0]['name'].strip().endswith('· Overview') and not recs[0].get('featured_media'):
        return recs[0]
    return None


def upload(path, md5_b64, size, filename):
    blob = circle('/direct_uploads', 'POST', {'blob': {
        'filename': filename, 'content_type': 'video/mp4', 'byte_size': size, 'checksum': md5_b64}})
    du = blob['direct_upload']
    cmd = ['curl', '-sS', '--fail-with-body', '-X', 'PUT', '-T', str(path), '--retry', '3', '-o', '/dev/null',
           '-w', '%{http_code}']
    for k, v in (du.get('headers') or {}).items():
        cmd += ['-H', f'{k}: {v}']
    res = subprocess.run(cmd + [du['url']], capture_output=True, text=True)
    if res.returncode != 0 or not res.stdout.startswith('2'):
        host = du['url'].split('/')[2]
        raise RuntimeError(f'upload to {host} failed: {res.stdout} {res.stderr.strip()[:200]}')
    return blob['signed_id']


def migrate_one(row, sections, dry):
    vid = row['vimeo_id']
    if dry:
        print(f"→ {row['lesson_title'][:60]}  [{row['programme'][:30]} › {row['circle_section'][:40]}]")
        return None
    section = sections[row['circle_section']]
    target = overview_lesson(section['id']) if row['_single'] else None
    print(f"→ {row['lesson_title'][:60]}  [{row['programme'][:30]} › {row['circle_section'][:40]}]"
          f"{'  (onto existing Overview lesson)' if target else ''}")
    f = pick_file(vid)
    WORK.mkdir(parents=True, exist_ok=True)
    local = WORK / f'{vid}.mp4'
    try:
        print(f"  downloading {f.get('rendition')} ({f['size'] / 1e9:.2f} GB)…", flush=True)
        r = subprocess.run(['curl', '-sS', '-L', '--fail', '--retry', '3', '-o', str(local), f['link']],
                           capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(f'download failed: {r.stderr.strip()[:200]}')
        size = local.stat().st_size
        if size != f['size']:
            raise RuntimeError(f'download incomplete: {size} of {f["size"]} bytes')
        md5 = hashlib.md5()
        with open(local, 'rb') as fh:
            for chunk in iter(lambda: fh.read(8 << 20), b''):
                md5.update(chunk)
        print('  uploading to Circle…', flush=True)
        signed = upload(local, base64.b64encode(md5.digest()).decode(), size, f"{vid}.mp4")
        media = {'featured_media': signed, 'is_featured_media_enabled': True}
        if target:
            lesson = circle(f"/course_lessons/{target['id']}", 'PATCH', media)
        else:
            desc = (row.get('description') or '').strip()
            lesson = circle('/course_lessons', 'POST', {
                'section_id': int(section['id']), 'name': row['lesson_title'][:250], 'status': 'published',
                'is_comments_enabled': True, **media,
                **({'body_html': '<p>' + html.escape(desc).replace('\n', '<br>') + '</p>'} if desc else {})})
        lesson = lesson.get('course_lesson', lesson)
        check = circle(f"/course_lessons/{lesson['id']}")
        check = check.get('course_lesson', check)
        fm = check.get('featured_media') or {}
        if not fm:
            raise RuntimeError('lesson saved but has no video attached')
        if fm.get('byte_size') and int(fm['byte_size']) != size:
            raise RuntimeError(f"Circle has {fm['byte_size']} bytes, sent {size}")
        return {'lesson_id': check['id'], 'rendition': f.get('rendition'), 'bytes': size,
                'lesson_url': check.get('url') or ''}
    finally:
        local.unlink(missing_ok=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--programme'); ap.add_argument('--source'); ap.add_argument('--vimeo-id', action='append')
    ap.add_argument('--limit', type=int); ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--retry-failed', action='store_true')
    a = ap.parse_args()
    if not (a.programme or a.source or a.vimeo_id):
        sys.exit('Choose what to move: --programme, --source or --vimeo-id')

    inv = {r['vimeo_id']: r for r in csv.DictReader(open(HERE / 'vimeo-inventory.csv', encoding='utf-8'))}
    rows = [r for r in csv.DictReader(open(HERE / 'pathway-mapping.csv', encoding='utf-8')) if r['vimeo_id']]
    for r in rows:
        r['description'] = inv.get(r['vimeo_id'], {}).get('description', '')
    per_section = {}
    for r in rows:
        per_section.setdefault((r['circle_space_id'], r['circle_section']), []).append(r)
    for r in rows:
        r['_single'] = len(per_section[(r['circle_space_id'], r['circle_section'])]) == 1
    chosen = [r for r in rows if (not a.programme or r['programme'] == a.programme)
              and (not a.source or r['source'] == a.source) and (not a.vimeo_id or r['vimeo_id'] in a.vimeo_id)]
    if any(not r['circle_space_id'].isdigit() for r in chosen):
        sys.exit('Some chosen rows have no Circle course yet')

    prog = load_progress()
    todo = [r for r in chosen if prog.get(r['vimeo_id'], {}).get('status') != 'done'
            and (a.retry_failed or prog.get(r['vimeo_id'], {}).get('status') != 'failed')]
    done_before = len(chosen) - len(todo)
    if a.limit:
        todo = todo[:a.limit]
    print(f'{len(chosen)} chosen, {done_before} already done/skipped, {len(todo)} to move now'
          f'{" (dry run)" if a.dry_run else ""}')

    by_space = {}
    for r in todo:
        by_space.setdefault(r['circle_space_id'], [])
        if r['circle_section'] not in by_space[r['circle_space_id']]:
            by_space[r['circle_space_id']].append(r['circle_section'])
    sections = {}
    for space, names in by_space.items():
        # create every mapped section of this course in order, so later runs keep the order
        all_names = list(dict.fromkeys(r['circle_section'] for r in rows if r['circle_space_id'] == space))
        if a.dry_run:
            have = {s['name'] for s in circle(f'/course_sections?space_id={space}&per_page=100').get('records', [])}
            for n in all_names:
                if n not in have:
                    print(f'  would create section "{n}"')
            continue
        sections[space] = sections_for(space, all_names)

    for r in todo:
        entry = {k: '' for k in FIELDS} | {'vimeo_id': r['vimeo_id'], 'programme': r['programme'],
                                          'section': r['circle_section'], 'lesson_title': r['lesson_title']}
        if a.dry_run:
            migrate_one(r, {}, True)
            continue
        try:
            res = migrate_one(r, sections.get(r['circle_space_id'], {}), False)
            entry |= res | {'status': 'done'}
            print(f"  ✓ done: lesson {res['lesson_id']}")
        except Exception as e:
            entry |= {'status': 'failed', 'error': str(e)[:300]}
            print(f'  ✗ failed: {e}')
        entry['finished_at'] = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')
        prog[r['vimeo_id']] = entry
        save_progress(prog)


if __name__ == '__main__':
    main()
