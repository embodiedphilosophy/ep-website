#!/usr/bin/env python3
"""Draft Vimeo -> Circle mapping from vimeo-inventory.csv. Offline, changes nothing anywhere.

Writes:
  mapping-draft.csv     one row per Vimeo video: proposed action, Circle space/section, order, lesson title
  mapping-by-folder.csv one row per Vimeo folder: the same decision summarised, for quick review

Actions:
  MIGRATE  confident match to an existing Circle course section
  SUGGEST  plausible home in Circle, needs Jacob's yes/no
  DECIDE   no obvious home in Circle: Circle library, offline archive, or drop
  ARCHIVE  keep a copy offline (not Circle): old cohorts, raw files
  SKIP     broken upload, empty, a duplicate, or a marketing clip
"""
import csv, re, unicodedata
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
CIRCLE_LIMIT_GB = 4.0  # Circle's per-file upload limit (help.circle.so)

SPACES = {
    2897811: 'Classical Yoga & the Yoga Sūtras', 2897812: 'The Subtle Body: Chakras, Prāṇa & Breath',
    2897813: 'Sound, Mantra & Sacred Speech', 2897814: 'Death, Dreams & the Luminous Mind',
    2897815: 'Myth, Shadow & the Inner Journey', 2897437: 'Meditation for Real Life',
    2897436: 'The Pilgrimage Project 2026', 2897426: 'Meditation Mondays · Library',
    2896663: 'Fall Recordings & Readings', 2896665: 'Winter Recordings & Readings',
    2896667: 'Spring Recordings & Readings', 2896669: 'Summer Recordings & Readings',
    2896982: 'Navarātri · Recordings & Reflections',
}

# Hand-picked lessons for the themed courses whose sections already exist in Circle: vimeo_id -> (space, section, note)
LESSONS = {
    '1026665599': (2897811, '2. Classical Yoga', 'YTT Fall 2024 Week 2 (with slides)'),
    '1016554463': (2897811, '6. The Yoga Canon', ''),
    '1055773645': (2897812, '1. Subtle Body Anatomy', 'YTT Winter 2025 Week 4 (with slides)'),
    '827779144': (2897812, '2. Neuroecopsychology of the Subtle Body', ''),
    '465504448': (2897812, '3. Chakras Illuminated', 'Module 1 of 4'),
    '465508270': (2897812, '3. Chakras Illuminated', 'Module 2 of 4'),
    '465512215': (2897812, '3. Chakras Illuminated', 'Module 3 of 4'),
    '465516168': (2897812, '3. Chakras Illuminated', 'Module 4 of 4'),
    '1136787753': (2897812, '4. Breath Mechanics', ''),
    '1136733586': (2897812, '4. Breath Mechanics', ''),
    '731151720': (2897813, '2. The Sound Bath Experience', 'one of three sound baths; pick one'),
    '734479212': (2897813, '2. The Sound Bath Experience', 'one of three sound baths; pick one'),
    '737281765': (2897813, '2. The Sound Bath Experience', 'one of three sound baths; pick one'),
    '663053075': (2897813, '3. Yoga of Sound', ''),
    '562574035': (2897813, '4. Sanskrit Chanting', ''),
    '401656218': (2897813, '5. Om Namah Shivaya: Why Mantra Matters', ''),
    '583220238': (2897814, '1. Study the Tibetan Book of the Dead: Stages of Dissolution', ''),
    '1140133013': (2897814, '3. Dream Yoga', 'from Fall 2025 Sadhana School'),
    '1119287925': (2897815, '5. The Alchemy of Longing', ''),
    '631243254': (2897437, '1. The Benefits of a Meditation Practice', ''),
    '1128046946': (2897437, '2. Spiritual Microdosing', ''),
    '1176391516': (2897437, '3. Working with Metaphor, Mantra & Meditation', 'also a Pilgrimage workshop'),
}
# Pilgrimage lectures that also fit the Myth, Shadow course (would be a second copy in Circle)
ALSO_MYTH = {'1153021115': '1. The Call to Depth', '1170964173': '2. Crossing the Threshold',
             '1189610636': '3. The Descent into the Shadow', '1213701032': '4. Revelation'}
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
          'October', 'November', 'December']
PILGRIMAGE_SECTIONS = ['January · The Call to Depth', 'February · Refusal and Resistance',
                       'March · Crossing the Threshold', 'April · Sacred Companions and Guides',
                       'May · The Descent into the Shadow', 'June · Sacrifice and Letting Go',
                       'July · Revelation', 'August · The Trials of Integration',
                       'September · The Gift of the Real', 'October · The Return with Wisdom',
                       'November · The Circle Reopens']

# Folder rules, first match wins: (folder prefix, action, space id or None, section, note)
FOLDERS = [
    ('Wisdom School 2026 - Pilgrimage / Meditation Mondays', 'SUGGEST', 2897426, '{month} 2026',
     'adds month sections Jan–Sep 2026 (only Oct–Dec exist)'),
    ('Wisdom School 2026 - Pilgrimage', 'MIGRATE', 2897436, '{pilgrimage}', ''),
    ('Blitz 2023 / Healing Stress - Pilar', 'MIGRATE', 2897437, '4. Healing Stress', 'Pilar Jennings, 8 short classes'),
    ('Sadhana School / Fall 2025 Sadhana School / Fall 2025 - NO SLIDES', 'SKIP', None, '', 'duplicate of the with-slides recordings'),
    ('Sadhana School / Winter 2026 Sadhana School / Winter 2026 - NO SLIDES', 'SKIP', None, '', 'duplicate of the with-slides recordings'),
    ('Sadhana School / Spring 2026 Sadhana School / Spring 2026 - NO SLIDES', 'SKIP', None, '', 'duplicate of the with-slides recordings'),
    ('Sadhana School / Swan Song 2026 / Swan Song - no slides', 'SKIP', None, '', 'duplicate of the with-slides recordings'),
    ('Sadhana School / Fall 2025 Sadhana School', 'SUGGEST', 2896663, 'Fall 2025 recordings', 'last cohort’s recordings as this year’s library?'),
    ('Sadhana School / Winter 2026 Sadhana School', 'SUGGEST', 2896665, 'Winter 2026 recordings', 'last cohort’s recordings as this year’s library?'),
    ('Sadhana School / Spring 2026 Sadhana School', 'SUGGEST', 2896667, 'Spring 2026 recordings', 'last cohort’s recordings as this year’s library?'),
    ('Sadhana School / Summer Retreat 2025 SS', 'SUGGEST', 2896669, 'Summer Retreat 2025', 'only a no-slides version exists'),
    ('Sadhana School / Swan Song 2026', 'DECIDE', None, '', 'no Circle space yet: Summer Recordings, or a new course?'),
    ('Sadhana School', 'ARCHIVE', None, '', 'older Sadhana School cohort'),
    ('Navaratri Fall 2025', 'SUGGEST', 2896982, 'Navarātri 2025', 'basic space: one post per video'),
    ('Raw Video Files from Camera', 'ARCHIVE', None, '', 'raw camera files'),
    ('CHITHEADS - New YouTube Videos / Motion Graphic Options', 'SKIP', None, '', 'design drafts'),
    ('SLO Clips for LPs', 'SKIP', None, '', 'landing-page clips'),
    ('SLO - Decoding Ancient Texts / Promo Interview Vids', 'SKIP', None, '', 'promo clips'),
    ('Embodied Yoga Therapy / Faculty Bios', 'SKIP', None, '', 'promo clips'),
    ('Visionary Experience LP', 'SKIP', None, '', 'landing-page clips'),
    ("EP's New Website", 'SKIP', None, '', 'website clips'),
]
MARKETING = re.compile(r'(?<![a-z])(trailer|promo|upsell|clip for lp|test)(?![a-z])', re.I)  # titles use _ as spaces


def clean_title(t):
    t = re.sub(r'\.(mp4|mov|m4v)$', '', t.strip(), flags=re.I)
    t = re.sub(r'\s*\((?:1|2)\)$', '', t)
    if '_' in t and ' ' not in t:
        t = t.replace('_', ' ')
    return t.strip()


def natural(t):
    """Sort key that ignores diacritics/case and orders 'Session 2' before 'Session 10'."""
    t = unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()
    return [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', t)]


def upload_gb(r):
    """Size of the file we'd upload: 1080p when Vimeo has it (keeps storage down), else the best available."""
    return float(r['size_1080p_gb']) or float(r['best_download_gb'])


def month_of(r):
    for i, m in enumerate(MONTHS):
        if re.search(rf'\b{m}\b', r['title']):
            return i
    return int(r['created'][5:7]) - 1


def decide(r, seen):
    vid, title = r['vimeo_id'], r['title']
    if r['status'] != 'available' or r['best_download'] == 'none' or int(r['duration_seconds']) == 0:
        return 'SKIP', None, '', f"broken on Vimeo ({r['status']}, no playable file)"
    key = (title.lower().strip(), r['duration_seconds'])
    if key in seen:
        return 'SKIP', None, '', f'duplicate of {seen[key]}'
    seen[key] = vid
    if vid in LESSONS:
        sp, sec, note = LESSONS[vid]
        return 'MIGRATE', sp, sec, note
    if MARKETING.search(title):
        return 'SKIP', None, '', 'marketing clip'
    for prefix, action, sp, sec, note in FOLDERS:
        if action and (r['folder'] == prefix or r['folder'].startswith(prefix + ' / ')):
            m = month_of(r)
            sec = (sec or '').replace('{month}', MONTHS[m]).replace(
                '{pilgrimage}', PILGRIMAGE_SECTIONS[min(m, len(PILGRIMAGE_SECTIONS) - 1)])
            if vid in ALSO_MYTH:
                note = (note + '; ' if note else '') + f'also fits Myth, Shadow course › {ALSO_MYTH[vid]} (second copy)'
            return action, sp, sec, note
    if r['folder'] == '(no folder)':
        return 'DECIDE', None, '', 'not in any folder'
    return 'DECIDE', None, '', 'older programme: Circle library, offline archive, or drop?'


def main():
    rows = list(csv.DictReader(open(HERE / 'vimeo-inventory.csv', encoding='utf-8')))
    rows.sort(key=lambda r: (r['created'], r['vimeo_id']))  # earliest copy wins duplicate checks
    seen, out = {}, []
    for r in rows:
        action, sp, sec, note = decide(r, seen)
        gb = upload_gb(r)
        if sp and r['title'].startswith('GMT20'):
            note = (note + '; ' if note else '') + 'Zoom file name: needs a proper lesson title'
        if action in ('MIGRATE', 'SUGGEST') and gb > CIRCLE_LIMIT_GB:
            note = (note + '; ' if note else '') + f'{gb:.1f} GB at 1080p is over Circle’s 4 GB limit: upload 720p'
        out.append({
            'approve (Y/N/edit)': '', 'proposed_action': action,
            'circle_space': SPACES.get(sp, ''), 'circle_space_id': sp or '', 'circle_section': sec,
            'order': '', 'lesson_title': clean_title(r['title']) if sp else '',
            'vimeo_id': r['vimeo_id'], 'vimeo_title': r['title'], 'vimeo_folder': r['folder'],
            'created': r['created'], 'duration': r['duration'], 'upload_gb': round(gb, 3),
            'privacy': r['privacy'], 'notes': note, 'description': r['description'],
        })
    # Lesson order inside each section: oldest first, except hand-picked lessons keep their listed order
    picked = list(LESSONS)
    groups = defaultdict(list)
    for o in out:
        if o['circle_space_id']:
            groups[(o['circle_space_id'], o['circle_section'])].append(o)
    for g in groups.values():
        g.sort(key=lambda o: (picked.index(o['vimeo_id']) if o['vimeo_id'] in picked else 999, o['created'], natural(o['lesson_title'])))
        for i, o in enumerate(g, 1):
            o['order'] = i
    rank = {'MIGRATE': 0, 'SUGGEST': 1, 'DECIDE': 2, 'ARCHIVE': 3, 'SKIP': 4}
    out.sort(key=lambda o: (rank[o['proposed_action']], o['circle_space'], o['circle_section'], o['order'] or 0,
                            o['vimeo_folder'].lower(), o['created']))
    with open(HERE / 'mapping-draft.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(out[0])); w.writeheader(); w.writerows(out)

    folders = defaultdict(lambda: {'videos': 0, 'gb': 0.0, 'hours': 0.0, 'actions': defaultdict(int), 'spaces': set(), 'span': set()})
    for o in out:
        f = folders[o['vimeo_folder']]
        f['videos'] += 1; f['gb'] += o['upload_gb']; f['actions'][o['proposed_action']] += 1
        h, m, s = map(int, o['duration'].split(':')); f['hours'] += h + m / 60 + s / 3600
        if o['circle_space']: f['spaces'].add(o['circle_space'])
        f['span'].add(o['created'][:4])
    with open(HERE / 'mapping-by-folder.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh)
        w.writerow(['approve (Y/N/edit)', 'vimeo_folder', 'videos', 'hours', 'upload_gb', 'years', 'proposed', 'circle_space(s)'])
        for name, f in sorted(folders.items(), key=lambda kv: (min(rank[a] for a in kv[1]['actions']), kv[0].lower())):
            w.writerow(['', name, f['videos'], round(f['hours'], 1), round(f['gb'], 1),
                        '–'.join(sorted({min(f['span']), max(f['span'])})),
                        ', '.join(f'{a} {n}' for a, n in sorted(f['actions'].items(), key=lambda x: rank[x[0]])),
                        ' | '.join(sorted(f['spaces']))])

    tot = defaultdict(lambda: [0, 0.0])
    for o in out:
        tot[o['proposed_action']][0] += 1; tot[o['proposed_action']][1] += o['upload_gb']
    for a in rank:
        print(f'{a:8s} {tot[a][0]:5d} videos {tot[a][1]:8.1f} GB')


if __name__ == '__main__':
    main()
