// Files attached to reflections and replies. Pure helpers (no network, no @-imports) shared by the browser, the API routes and
// lib/school/reflections.js. A file lives in the ep-media Blob store under school/; in Circle it appears as its own paragraph,
// "Attachment: <name>", linked to the file, so it reads (and opens) the same in Circle as on the season page.
export const ATTACH_TYPES = [
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
  'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/webm',
  'video/mp4', 'video/quicktime', 'video/webm',
];
export const ATTACH_ACCEPT = '.pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif,.heic,.mp3,.m4a,.wav,.mp4,.mov,.webm';
export const ATTACH_MAX_BYTES = 250 * 1024 * 1024;
export const ATTACH_MAX_FILES = 5;
export const ATTACH_LABEL = 'Attachment: ';

const BLOB = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/school\/[^\s?#]+$/i;
const cleanName = n => String(n || 'file').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'file';

// What the browser sent → at most five { name, url } that really are our school uploads. Anything else is dropped.
export function cleanFiles(list) {
  return (Array.isArray(list) ? list : []).filter(f => f && BLOB.test(String(f.url || ''))).slice(0, ATTACH_MAX_FILES)
    .map(f => ({ name: cleanName(f.name), url: String(f.url) }));
}

// One TipTap paragraph per file. plain: no link mark, the address written out after the name (the fallback if Circle refuses marks).
export const attachNodes = (files, { plain = false } = {}) => (files || []).map(f => ({
  type: 'paragraph',
  content: plain
    ? [{ type: 'text', text: `${ATTACH_LABEL}${f.name} — ${f.url}` }]
    : [{ type: 'text', text: `${ATTACH_LABEL}${f.name}`, marks: [{ type: 'link', attrs: { href: f.url, target: '_blank', rel: 'noopener noreferrer nofollow' } }] }],
}));

// The files in a Circle post or comment: our "Attachment:" links (linked or written out), links in Circle's HTML body, and files a
// member attached in Circle itself (tiptap_body.attachments). Read defensively; Circle's shapes vary by endpoint.
export function filesOf(raw) {
  const out = [], seen = new Set();
  const add = (name, url) => { url = String(url || ''); if (!/^https:\/\//i.test(url) || seen.has(url)) return; seen.add(url); out.push({ name: cleanName(name || decodeURIComponent(url.split('/').pop() || 'file')), url }); };
  const walk = v => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v.type === 'text' && typeof v.text === 'string' && v.text.startsWith(ATTACH_LABEL)) {
      const link = (v.marks || []).find(m => m?.type === 'link' && m.attrs?.href);
      const rest = v.text.slice(ATTACH_LABEL.length);
      if (link) add(rest, link.attrs.href);
      else { const m = /^(.*?)\s+—\s+(https:\/\/\S+)\s*$/.exec(rest); if (m) add(m[1], m[2]); }
    }
    for (const k of ['content', 'body', 'tiptap_body']) if (v[k] && typeof v[k] === 'object') walk(v[k]);
  };
  walk(raw?.tiptap_body);
  for (const k of ['body', 'html', 'rich_text_body']) {
    const html = typeof raw?.[k] === 'string' ? raw[k] : typeof raw?.[k]?.body === 'string' ? raw[k].body : '';
    for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>\s*Attachment:\s*([^<]*)<\/a>/gi)) add(m[2], m[1].replace(/&amp;/g, '&'));
  }
  const native = raw?.tiptap_body?.attachments || raw?.attachments || [];
  for (const a of Array.isArray(native) ? native : []) add(a?.filename || a?.name || a?.file_name, a?.url || a?.signed_url || a?.download_url);
  return out;
}

// The text without the "Attachment: …" lines (they are shown as file links instead)
export const stripAttachLines = text => String(text || '').split('\n').filter(l => !l.trim().startsWith(ATTACH_LABEL.trim())).join('\n').replace(/\n{3,}/g, '\n\n').trim();
