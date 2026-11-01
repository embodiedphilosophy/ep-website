# Google Docs API JSON (documents.get) -> data/sahrdaya-manual.json
# Usage: python3 doc2manual.py doc.json out.json
import json, re, sys
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src)); d = d.get('content', d)
doc = d['tabs'][0]['documentTab']; LISTS = doc['lists']

def esc(s): return s.replace('\\', '\\\\').replace('*', '\\*').replace('_', '\\_')
def runs_of(elements):
    rs = []
    for r in elements:
        tr = r.get('textRun')
        if not tr: continue
        t = tr['content'].replace('\n', '')
        if not t: continue
        st = tr.get('textStyle', {})
        key = (bool(st.get('bold')), bool(st.get('italic')), st.get('link', {}).get('url', ''))
        if t.strip() == '' and rs: rs[-1][0] += t; continue
        if rs and rs[-1][1] == key: rs[-1][0] += t
        else: rs.append([t, key])
    return rs
def wrap(t, key):
    b, i, url = key
    lead = re.match(r'^\s*', t).group(); trail = re.search(r'\s*$', t).group(); core = t.strip()
    if not core: return t
    x = esc(core)
    if i: x = '_' + x + '_'
    if b: x = '**' + x + '**'
    if url: x = '[' + x + '](' + url + ')'
    return lead + x + trail
def inline(elements):
    return ''.join(wrap(t, k) for t, k in runs_of(elements)).strip()
def italic_share(elements):
    tot = it = 0
    for t, k in runs_of(elements):
        n = len(re.sub(r'[\s\d\[\]().|]', '', t)); tot += n
        if k[1]: it += n
    return it / tot if tot else 0
def plain(elements): return ''.join(r.get('textRun', {}).get('content', '') for r in elements).strip()
def slug(s): return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower().encode('ascii', 'ignore').decode())).strip('-')[:60]
def ordered(pa):
    lid = pa['bullet']['listId']; lvl = pa['bullet'].get('nestingLevel', 0)
    g = LISTS[lid]['listProperties']['nestingLevels'][lvl]
    return g.get('glyphType') in ('DECIMAL', 'ALPHA', 'UPPER_ALPHA', 'ROMAN', 'UPPER_ROMAN')

front = {}; chapters = []; ch = None; sec = None
def target(): return sec['blocks'] if sec else ch['blocks'] if ch else None
def add(b):
    t = target()
    if t is None: return
    if b['t'] in ('ul', 'ol', 'checks') and t and t[-1]['t'] == b['t']: t[-1]['items'] += b['items']
    else: t.append(b)

for el in doc['body']['content']:
    if 'table' in el:
        rows = []
        for row in el['table']['tableRows']:
            cells = []
            for cell in row['tableCells']:
                parts = [inline(c['paragraph']['elements']) for c in cell['content'] if 'paragraph' in c]
                cells.append(' / '.join(p for p in parts if p))
            rows.append(cells)
        add({'t': 'table', 'head': rows[0], 'rows': rows[1:]}); continue
    if 'paragraph' not in el: continue
    pa = el['paragraph']; ps = pa.get('paragraphStyle', {}); kind = ps.get('namedStyleType')
    txt = plain(pa['elements'])
    if not txt: continue
    if ch is None and kind != 'HEADING_2':
        txt = re.sub(r'\s*\x0b\s*', ' ', txt)
        if kind == 'HEADING_1': front['title'] = txt
        elif txt == 'Contents': pass
        elif 'eyebrow' not in front: front['eyebrow'] = txt
        elif 'subtitle' not in front: front['subtitle'] = txt
        else: front['edition'] = txt
        continue
    if kind == 'HEADING_2':
        m = re.match(r'^(Part [IVX]+|Appendix [A-Z])\.\s*(.*)$', txt)
        label, title = (m.group(1), m.group(2)) if m else ('', txt)
        cid = slug(label) if label else slug(txt)
        ch = {'id': cid, 'label': label, 'title': title, 'kind': 'appendix' if label.startswith('Appendix') else 'part' if label else 'front', 'blocks': [], 'sections': []}
        chapters.append(ch); sec = None; continue
    if kind in ('HEADING_3', 'HEADING_4'):
        title = txt
        sec = {'id': ch['id'] + '-' + slug(txt), 'title': title, 'level': 3 if kind == 'HEADING_3' else 4, 'blocks': []}
        ch['sections'].append(sec); continue
    s = inline(pa['elements'])
    runs = [r['textRun'] for r in pa['elements'] if 'textRun' in r and r['textRun']['content'].strip()]
    allit = all(r.get('textStyle', {}).get('italic') for r in runs)
    if 'bullet' in pa:
        if txt.startswith('☐'): add({'t': 'checks', 'items': [re.sub(r'^☐\s*', '', s)]})
        else: add({'t': 'ol' if ordered(pa) else 'ul', 'items': [s]})
    elif italic_share(pa['elements']) > 0.6 and ('\x0b' in txt or ps.get('indentStart')):
        lines = [x.strip() for x in plain(pa['elements']).split('\x0b') if x.strip()]
        v = {'t': 'verse', 'lines': lines}
        m = re.match(r'^(\d+\.|\[\d+\](?:\s*\(MS \d+\))?)\s*', lines[0])
        if m:
            v['n'] = m.group(1).rstrip('.'); rest = lines[0][m.end():].strip()
            v['lines'] = ([rest] if rest else []) + lines[1:]
        add(v)
    elif '\x0b' in txt:
        add({'t': 'lines', 'items': [x.strip() for x in s.split('\x0b') if x.strip()]})
    elif allit and len(runs) > 0:
        add({'t': 'note', 's': re.sub(r'^_(.*)_$', r'\1', s)})
    else:
        add({'t': 'p', 's': s})

for c in chapters:
    for s in c['sections']:
        s['id'] = s['id'][:70]
ids = [s['id'] for c in chapters for s in c['sections']]
assert len(ids) == len(set(ids)), 'duplicate section ids'
json.dump({'source': 'Google Doc 1u9O7F59dnj0I6mo0u0wIZ_SVjfbIMRZpcIsVzpnYuOw', 'revision': d.get('revisionId', ''), 'front': front, 'chapters': chapters}, open(out, 'w'), ensure_ascii=False, indent=1)
print('chapters', len(chapters), 'sections', len(ids))
for c in chapters: print(c['id'], '|', c['label'], '|', c['title'], len(c['blocks']), len(c['sections']))
