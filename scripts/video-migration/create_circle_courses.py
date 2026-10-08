#!/usr/bin/env python3
"""Create the empty Circle course spaces for pathways 7–13 and the certificate programs.

Approved by Jacob (8 Oct 2026). Safe to re-run: a space whose name already exists is left alone.
New spaces copy the settings of the existing pathway courses (private, self-paced) and start
HIDDEN, so members don't see empty courses; unhide them in Circle when they're filled.
Writes circle-spaces.csv (name, id, url, status). Needs CIRCLE_API_TOKEN.

  python3 create_circle_courses.py            # create all
  python3 create_circle_courses.py --only 1   # create just the first (test)
"""
import csv, json, os, re, sys, unicodedata, urllib.request, urllib.error
from pathlib import Path

HERE = Path(__file__).resolve().parent
API = 'https://app.circle.so/api/admin/v2'
TOKEN = os.environ.get('CIRCLE_API_TOKEN') or sys.exit('CIRCLE_API_TOKEN is not set')
PATHWAYS_GROUP, CERTIFICATES_GROUP = 1220854, 1221044
PLUS = {'locked_button_url': 'https://ss.embodiedphilosophy.com/checkout/wisdom-school-plus',
        'locked_button_label': 'Join Wisdom School Plus'}

SPACES = [(name, PATHWAYS_GROUP, PLUS) for name in [
    'Roots & Branches: A History of Yoga', 'The Gītā & the Path of Devotion', 'The Goddess & Śākta Tantra',
    'Non-Duality: Vedānta & Kashmir Śaivism', 'Indian Philosophy: Paths & Worldviews', 'Sanskrit for Yogis',
    'Esoteric Wisdom: Mystics, Siddhas & Sacred Arts']] + [(name, CERTIFICATES_GROUP, {}) for name in [
    'Yoga Philosophy Certificate', 'Embodied Yoga Therapy Certificate', 'Buddhist Psychology Certificate',
    'Awakened Body Certificate']]


def call(path, method='GET', body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json',
                                          'User-Agent': 'ep-video-migration/1.0'})  # Cloudflare rejects urllib's default
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'Circle {method} {path}: {e.code} {e.read().decode()[:300]}')


def slug(name):
    s = unicodedata.normalize('NFD', name).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s.replace('&', ' ')).strip('-')


def main():
    only = int(sys.argv[sys.argv.index('--only') + 1]) if '--only' in sys.argv else None
    existing = {s['name']: s for s in call('/spaces?per_page=100').get('records', [])}
    out = []
    for name, group, extra in SPACES[:only]:
        if name in existing:
            s, status = existing[name], 'already existed'
        else:
            s = call('/spaces', 'POST', {
                'name': name, 'slug': slug(name), 'space_type': 'course', 'space_group_id': group,
                'is_private': True, 'is_hidden': True, 'is_hidden_from_non_members': False,
                'locked_page_heading': name, **extra})
            s = s.get('space', s)
            status = 'created (hidden)'
        out.append({'name': name, 'id': s.get('id'), 'url': s.get('url', ''), 'status': status})
        print(f"{status:16s} {s.get('id')}  {name}")
    path = HERE / 'circle-spaces.csv'
    prior = {r['name']: r for r in csv.DictReader(open(path))} if path.exists() else {}
    prior.update({r['name']: r for r in out})
    with open(path, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['name', 'id', 'url', 'status']); w.writeheader(); w.writerows(prior.values())


if __name__ == '__main__':
    main()
