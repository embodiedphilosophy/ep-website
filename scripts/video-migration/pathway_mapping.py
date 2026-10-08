#!/usr/bin/env python3
"""Map Vimeo videos to the 13 Learning Pathways and 4 Certificate Programs. Offline, changes nothing.

Scope (Jacob, 8 Oct 2026): whole courses, never single modules, and only what belongs to the Learning Pathways (website "Site Pathways" tab:
its `courses` column = the short talks that are the Circle course sections, its `kajabi_contents`
column = the full Kajabi courses) and the certificate programs. Everything else stays out of Circle. The 2021/22 Yoga Philosophy
cohort (longer programme) is held back for the planned Yoga Studio library.

Reads vimeo-inventory.csv; writes
  pathway-mapping.csv   one row per video (or per missing course), for review
  pathway-summary.csv   one row per programme/course: expected vs found
"""
import csv, re, unicodedata
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
CIRCLE_LIMIT_GB = 4.0


def norm(s):
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()


# Each source: (kind, label, expected videos, title regex, folder prefix or None, note)
#   kind 'talk'   = a short talk that is one of the existing Circle sections (section = label)
#   kind 'course' = a full Kajabi course (becomes its own section after the talks)
#   kind 'cohort' = a certificate cohort folder taken whole
NF = '(no folder)'
PROGRAMS = [
    ('Classical Yoga & the Yoga Sūtras', 2897811, 'pathway', [
        ('talk', '1. Origins and Hidden History', 1, None, None, ''),
        ('talk', '2. Classical Yoga', 1, None, None, 'part of a longer course: Jacob wants whole courses, not single modules (8 Oct)'),
        ('talk', '3. The Five Vṛttis', 1, None, None, ''),
        ('talk', '4. The Eight Limbs', 1, None, None, ''),
        ('talk', '5. The Cause of Suffering', 1, None, None, ''),
        ('talk', '6. The Yoga Canon', 1, r'^the yoga canon seminar$', NF, ''),
        ('course', 'Sāṃkhya with Jacob Kyle', 4, r'^samkhya philosophy - module', 'EP_Courses', ''),
        ('course', 'The Yoga Sūtras with Edwin Bryant', 8, r'^yoga sutras( of patanjali)?( -)? module', NF, '2020 recordings'),
        ('course', 'Hidden Teachings of the Yoga Sūtra with Graham Schweig', 8, r'^hidden teachings of the yoga sutras - module', 'EP_Courses', ''),
        ('course', 'Yoga Sūtra Meditation with Ramesh Bjonnes & Mary Reilly Nichols', 4, r'.', 'Meditation and the Yoga Sutras', ''),
    ]),
    ('The Subtle Body: Chakras, Prāṇa & Breath', 2897812, 'pathway', [
        ('talk', '1. Subtle Body Anatomy', 1, None, None, 'part of a longer course: Jacob wants whole courses, not single modules (8 Oct)'),
        ('talk', '2. Neuroecopsychology of the Subtle Body', 1, r'^neuroecopsychology of the subtle body$', None, ''),
        ('talk', '3. Chakras Illuminated', 5, r'^chakras illuminated - module', 'EP_Courses', 'the full Kajabi course with Hareesh Wallis; Q&A video not found'),
        ('talk', '4. Breath Mechanics', 1, None, None, 'part of a longer course: Jacob wants whole courses, not single modules (8 Oct)'),
        ('talk', '5. Are the Chakras Real or Imaginary?', 1, None, None, ''),
        ('course', 'Prāṇa & the Energy Body with Mary Reilly Nichols', 3, None, None, ''),
        ('course', 'Haṭha Yoga Texts with Zoë Slatoff', 2, r'^hatha yoga texts module [12]$', 'Yoga Phil. Cert', '2021 recordings; a 2022 cohort version also exists'),
    ]),
    ('Sound, Mantra & Sacred Speech', 2897813, 'pathway', [
        ('talk', '1. The Science of Mantras', 1, None, None, ''),
        ('talk', '2. The Sound Bath Experience', 1, r'^sound bath for peace in uncertain times$', NF, 'guess: one of three sound baths'),
        ('talk', '3. Yoga of Sound', 1, r'^yoga of sound seminar', NF, ''),
        ('talk', '4. Sanskrit Chanting', 1, r'^seminar: sanskrit chanting$', NF, ''),
        ('talk', '5. Om Namah Shivaya: Why Mantra Matters', 1, r'^om namah shivaya - why mantra matters', 'EPTV', ''),
        ('course', 'Introduction to the Vedas with Katy Jane', 1, r'^module [12]: intro to the vedas$', 'YP CERT 2021/22', 'Kajabi has 1 video; Vimeo has 2 modules'),
        ('course', 'Mantra Recitation with Jacob Kyle', 2, r'mantra-recitation', NF, ''),
        ('course', 'Lalitā Sahasranāma with Kavitha Chinnaiyan', 1, r'^lalita seminar$', 'YP CERT 2021/22', ''),
    ]),
    ('Meditation for Real Life', 2897437, 'pathway', [
        ('talk', '1. The Benefits of a Meditation Practice', 1, r'^the benefits of a meditation practice$', NF, ''),
        ('talk', '2. Spiritual Microdosing', 1, r'^spiritual microdosing', 'Living Room Lectures', ''),
        ('talk', '3. Working with Metaphor, Mantra & Meditation', 1, r'^working with metaphor, mantra, and meditation', 'Wisdom School 2026', ''),
        ('talk', '4. Healing Stress', 8, r'^class \d', 'Blitz 2023 / Healing Stress', 'Pilar Jennings, 8 short classes'),
        ('course', 'Contemplative Psychology: the Four Noble Truths', 6, r'^contemplative psychology', NF, 'only 1 of 6 found; guided meditations not found'),
        ('course', 'Yoga & Contemplative Science', 2, r'^module [12]: yoga & contemplative science$', 'YP CERT 2021/22', ''),
    ]),
    ('Death, Dreams & the Luminous Mind', 2897814, 'pathway', [
        ('talk', '1. Study the Tibetan Book of the Dead: Stages of Dissolution', 1, r'^seminar: tibetan book of the dead$', NF, ''),
        ('talk', '2. Emptiness and Luminosity', 1, None, None, ''),
        ('talk', '3. Dream Yoga', 1, r'^dream yoga$', 'Sadhana School', 'from Fall 2025 Sādhana School'),
        ('course', 'Tibetan Buddhism: A Path of Becoming Fully Human', 4, r'^tibetan buddhism: a path of becoming fully human - module', 'EP_Courses', ''),
        ('course', 'Yoga & Buddhism with Tias Little', 2, r'^yoga & buddhism module [12]', NF, '2021 recordings; a 2022 cohort version also exists'),
    ]),
    ('Myth, Shadow & the Inner Journey', 2897815, 'pathway', [
        ('talk', '1. The Call to Depth', 1, r'^the call to depth', 'Wisdom School 2026', 'Pilgrimage 2026 lecture'),
        ('talk', '2. Crossing the Threshold', 1, r'^crossing the threshold', 'Wisdom School 2026', 'Pilgrimage 2026 lecture'),
        ('talk', '3. The Descent into the Shadow', 1, r'^the descent into the shadow', 'Wisdom School 2026', 'Pilgrimage 2026 lecture'),
        ('talk', '4. Revelation', 1, r'^revelation:', 'Wisdom School 2026', 'Pilgrimage 2026 lecture'),
        ('talk', '5. The Alchemy of Longing', 1, r'^the alchemy of longing$', 'Living Room Lectures', ''),
        ('course', 'The Universal Mystic', 4, r'^universal mystic - module', 'EP_Courses', ''),
        ('course', 'The Purāṇas with Stephanie Corigliano', 1, r'^puranas - module 1', NF, ''),
    ]),
    ('Roots & Branches: A History of Yoga', 2900094, 'pathway', [
        ('course', 'A Brief History of Yoga with Daniel Simpson', 4, r'^history of yoga[ _]module ?\d', NF, 'module 2 is audio only, module 3 missing'),
        ('course', 'Roots & Branches I with Marcy Braverman Goldstein', 4, r'^roots and branches of yoga ?- ?course 1', 'EP_Courses', ''),
        ('course', 'Roots & Branches II', 4, r'^roots and branches of yoga ?- ?course 2', 'EP_Courses', ''),
        ('course', 'Roots & Branches III', 4, r'^roots and branches of yoga ?- ?course 3', 'EP_Courses', ''),
    ]),
    ('The Gītā & the Path of Devotion', 2900095, 'pathway', [
        ('course', 'The Bhagavad Gītā', 8, r'^the bhagavad gita - module', 'EP_Courses', ''),
        ('course', 'Bhakti Yoga', 9, r'^bhakti yoga - module', 'EP_Courses', ''),
        ('course', 'Bhakti Poetry', 4, None, None, ''),
        ('course', 'Vaiṣṇava Bhakti with Robert Lindsey', 2, r'^vaishnava bhakti - module', NF, '2021 recordings; a 2022 cohort version also exists'),
    ]),
    ('The Goddess & Śākta Tantra', 2900096, 'pathway', [
        ('course', 'Foundations of Tantra', 4, r'^foundations of tantra - module', 'EP_Courses', ''),
        ('course', 'Śākta Tantra with Laura Amazzone', 2, r'^(sakta-tantra-module-1|shakta tantra 2)', NF, '2021 recordings; a 2022 cohort version also exists'),
        ('course', 'The 10 Goddesses of Transcendent Wisdom', 5, r'^the 10 goddesses - module', 'EP_Courses', ''),
        ('course', 'Navarātri: the Devī Māhātmya', 4, r"^navarathri: an inner path to shakti's realm", 'EP_Courses', ''),
        ('course', 'Yogini Mandalas', 4, r'^yogini mandalas - module', 'EP_Courses', ''),
    ]),
    ('Non-Duality: Vedānta & Kashmir Śaivism', 2900097, 'pathway', [
        ('course', 'Upaniṣads & Vedānta Sūtras', 8, r'^upanisads( -)? module \d', NF, 'guess: 2021 Upaniṣads course, 8 × 3 hours'),
        ('course', 'Nonduality: Advaita Vedānta', 4, r'^nonduality: discovering wholeness - module', 'EP_Courses', 'guess'),
        ('course', 'I Am That', 4, r'^i am that - +module', 'EP_Courses', ''),
        ('course', 'Advaita Vedānta', 2, r'^module [12]: advaita vedanta$', 'YP CERT 2021/22', ''),
        ('course', 'Śiva Sūtras', 3, r'.', 'Śiva Sūtras', 'the 2024 Śiva Sūtras course (16 videos) is another option'),
    ]),
    ('Indian Philosophy: Paths & Worldviews', 2900098, 'pathway', [
        ('course', 'Starting Points with Jacob Kyle & Stephanie Corigliano', 2, None, None, ''),
        ('course', 'Indian Philosophy: Paths & Worldviews', 8, r'^indian philosophy - module', 'EP_Courses', ''),
        ('course', 'The Upaniṣads with Daniel Simpson', 2, r'^upanishads module 2 video$', 'EP_Courses', 'only module 2 found'),
        ('course', 'Ethical Questions with Daniel Simpson', 2, r'^ethical questions module [12]', NF, ''),
    ]),
    ('Sanskrit for Yogis', 2900099, 'pathway', [
        ('course', 'Introduction to Sanskrit', 4, r'^module [1-4]: intro to sanskrit$', 'YP CERT 2021/22', 'the 2020 version only has modules 3–4 in Vimeo'),
        ('course', 'Sanskrit Level 2', 8, r'^sanskrit (level )?2[ _]', NF, 'Vimeo has 9 modules, Kajabi lists 8'),
        ('course', 'The Sanskrit Seminar', 9, r'^the sanskrit seminar - module', 'EP_Courses', ''),
    ]),
    ('Esoteric Wisdom: Mystics, Siddhas & Sacred Arts', 2900100, 'pathway', [
        ('course', 'Shamans & Siddhas', 5, r'^shamans & siddhas - (module|q&a)', NF, ''),
        ('course', 'The Universal Mystic', 0, None, None, 'same course as in Myth, Shadow: upload once, link from both'),
        ('course', 'Deity: The Path to Liberation', 4, r'.', 'Deity: A Path to Liberation', 'an older version is in "OLD Deity"'),
    ]),
    ('Embodied Yoga Therapy Certificate', 2900102, 'certificate', [
        ('cohort', 'Embodied Yoga Therapy (2023)', 0, r'.', 'Embodied Yoga Therapy', 'faculty bio clips left out'),
    ]),
    ('Buddhist Psychology Certificate', 2900103, 'certificate', [
        ('cohort', 'Buddhist Psychology Cert (2023)', 0, r'.', 'Buddhist Psychology Cert', 'a 2017 Kajabi course "Buddhist Psychology & Contemplative Psychotherapy" (4) also exists'),
    ]),
    ('Yoga Philosophy Certificate', 2900101, 'certificate', [
        ('cohort', 'Yoga Philosophy (Fall 2024, 8 weeks)', 8, r'.', 'PUBLIC 200-Hour YTT / 3. Fall 2024 Weekly Sessions',
         'the recent course, also the YTT plug-in; TO CONFIRM with Jacob (he said 30 hours, this is ~20)'),
    ]),
    ('Awakened Body Certificate', 2900104, 'certificate', [
        ('cohort', 'Awakened Body Cert On Demand', 0, r'.', 'Awakened Body Cert On Demand', 'the more recent version (Jun 2023), per Jacob'),
    ]),
]
SKIP_IN_COHORT = re.compile(r'faculty bios|meet the faculty', re.I)


def lesson_order(v):
    """Module/session/week/day number when the title has one (titles are inconsistent), then upload date."""
    t = norm(v['title'])
    m = re.search(r'module\s*#?[_ ]?(\d+)(?:\.(\d+))?', t) or re.search(r'(?:session|week|day|class)\s*[_ ]?(\d+)(?:\.(\d+))?', t)
    m = m or re.search(r'^(?:m)?(\d+)(?:\.(\d+))?[.: ]', t)
    return (int(m.group(1)), int(m.group(2) or 0), v['created']) if m else (999, 0, v['created'])


def main():
    videos = [v for v in csv.DictReader(open(HERE / 'vimeo-inventory.csv', encoding='utf-8'))
              if v['status'] == 'available' and int(v['duration_seconds']) > 0 and v['best_download'] != 'none']
    rows, summary, used = [], [], defaultdict(list)
    for prog, space_id, kind, sources in PROGRAMS:
        n_talk = sum(s[0] == 'talk' for s in sources)
        n_course = 0
        for src_kind, label, expected, pat, folder, note in sources:
            hits = []
            if pat:
                rx = re.compile(pat)
                for v in videos:
                    if folder and not (v['folder'] == folder or v['folder'].startswith(folder + ' /')
                                       or v['folder'].startswith(folder + ' ')):
                        continue
                    if src_kind == 'cohort' and SKIP_IN_COHORT.search(v['folder'] + v['title']):
                        continue
                    if rx.search(norm(v['title'])):
                        hits.append(v)
            # one copy per title+length (Vimeo has exact re-uploads)
            seen, uniq = set(), []
            for v in sorted(hits, key=lambda v: v['created']):
                k = (norm(v['title']).strip(), v['duration_seconds'])
                if k not in seen:
                    seen.add(k); uniq.append(v)
            uniq.sort(key=lambda v: v['created'] if src_kind == 'cohort' else lesson_order(v))  # cohorts: recording order
            if src_kind == 'course':
                n_course += 1
                section = f'{n_talk + n_course}. {label}' if space_id else label
            elif src_kind == 'cohort':
                section = label
            else:
                section = label
            status = ('not in Vimeo' if not uniq else 'partial' if expected and len(uniq) < expected else 'found')
            if expected == 0 and not uniq:
                status = 'n/a'
            summary.append({'programme': prog, 'type': kind, 'in_circle': 'yes' if space_id else 'NO SPACE YET',
                            'source': label, 'kind': src_kind, 'expected': expected, 'found_in_vimeo': len(uniq),
                            'status': status, 'gb': round(sum(float(v['size_1080p_gb']) or float(v['best_download_gb']) for v in uniq), 1),
                            'note': note})
            if not uniq and status != 'n/a':
                rows.append({'approve (Y/N/edit)': '', 'programme': prog, 'circle_space_id': space_id or 'to create',
                             'circle_section': section, 'order': '', 'lesson_title': '', 'source': label,
                             'status': 'MISSING: get from Kajabi/Uscreen', 'vimeo_id': '', 'vimeo_title': '',
                             'vimeo_folder': '', 'duration': '', 'upload_gb': '', 'notes': note})
            for i, v in enumerate(uniq, 1):
                gb = float(v['size_1080p_gb']) or float(v['best_download_gb'])
                notes = [note] if note else []
                if gb > CIRCLE_LIMIT_GB:
                    notes.append(f'{gb:.1f} GB at 1080p: over Circle’s 4 GB limit, upload 720p')
                if used[v['vimeo_id']]:
                    notes.append('also in ' + ', '.join(used[v['vimeo_id']]))
                used[v['vimeo_id']].append(prog)
                title = re.sub(r'\.(mp4|mov)$', '', v['title'], flags=re.I).replace('_', ' ').strip()
                rows.append({'approve (Y/N/edit)': '', 'programme': prog, 'circle_space_id': space_id or 'to create',
                             'circle_section': section, 'order': i, 'lesson_title': title, 'source': label,
                             'status': status, 'vimeo_id': v['vimeo_id'], 'vimeo_title': v['title'],
                             'vimeo_folder': v['folder'], 'duration': v['duration'], 'upload_gb': round(gb, 3),
                             'notes': '; '.join(notes)})
    for name, data in (('pathway-mapping.csv', rows), ('pathway-summary.csv', summary)):
        with open(HERE / name, 'w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=list(data[0])); w.writeheader(); w.writerows(data)

    vids = [r for r in rows if r['vimeo_id']]
    uniq_ids = {r['vimeo_id']: r['upload_gb'] for r in vids}
    print(f'{len(uniq_ids)} Vimeo videos, {sum(uniq_ids.values()):.0f} GB; '
          f'{sum(s["status"] == "not in Vimeo" for s in summary)} sources missing, '
          f'{sum(s["status"] == "partial" for s in summary)} partial')
    for p in dict.fromkeys(s['programme'] for s in summary):
        ss = [s for s in summary if s['programme'] == p]
        print(f"  {p[:45]:45s} {sum(s['found_in_vimeo'] for s in ss):4d} videos {sum(s['gb'] for s in ss):6.1f} GB  "
              f"missing: {', '.join(s['source'][:28] for s in ss if s['status'] == 'not in Vimeo') or '-'}")


if __name__ == '__main__':
    main()
