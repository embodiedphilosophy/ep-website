// Pure helpers for the season's Reflections tab: opening lines, who is a mentee, threads of replies. No network and no @-imports,
// so scripts/ops-test/school-reflections.mjs can run it directly. Circle's field names are read defensively (the headless API's
// comment and post shapes are checked against the mock only; see docs/school-seasons.md).
import { filesOf, stripAttachLines } from './attachments.js';
export { filesOf };
const first = (...v) => v.find(x => x !== undefined && x !== null && x !== '');
const ms = iso => (iso ? new Date(iso).getTime() : NaN);

// Circle sends a body as HTML, plain text, a rich-text object ({ body: '<p>…' } or { html }) or a TipTap document
// ({ type: 'doc', content: [...] }), depending on the endpoint. Turn any of them into one string (HTML stays HTML here).
function bodyString(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v !== 'object') return String(v);
  if (Array.isArray(v)) return v.map(bodyString).filter(Boolean).join('\n');
  if (v.type === 'text') return v.text || '';
  if (v.type === 'hardBreak') return '\n';
  if (v.type && Array.isArray(v.content)) {
    const inner = v.content.map(bodyString).join(v.type === 'doc' || /list/i.test(v.type) ? '\n\n' : '');
    return /^(paragraph|heading|blockquote|listItem)$/.test(v.type) ? `${inner}\n\n` : inner;
  }
  for (const k of ['html', 'body', 'plain_text', 'text', 'content', 'tiptap_body']) if (v[k] !== undefined && v[k] !== null && v[k] !== '') return bodyString(v[k]);
  return '';
}

// The first field that actually holds some text (Circle may send body as an empty object and the text elsewhere)
// Circle's older body fields hold a stand-in ("Update available. Please update the app to view this post.") for posts written
// in its newer editor; the real text is then in tiptap_body. Never show the stand-in.
const STAND_IN = /^\s*update available\b[\s\S]{0,40}update the app/i;
export function bodyOf(raw, keys) {
  for (const k of keys) { const t = stripAttachLines(plainText(raw?.[k])); if (t && !STAND_IN.test(t)) return t; } // attached files are shown as links, not text
  return '';
}

export function plainText(v) {
  return bodyString(v)
    .replace(/<\s*br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n\n').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// The opening lines of a post for the card (~300 characters, cut at a word)
export function opening(raw, max = 300) {
  const t = fullText(raw).replace(/\s*\n+\s*/g, ' ');
  if (t.length <= max) return t;
  const cut = t.slice(0, max).replace(/\s+\S*$/, '');
  return `${cut}…`;
}

// The whole post as plain paragraphs (blank line between them), for "Read the whole reflection"
export const POST_BODY_KEYS = ['tiptap_body', 'rich_text_body', 'plain_text_body', 'body_plain', 'body', 'truncated_content', 'description'];
export function fullText(raw) { return bodyOf(raw, POST_BODY_KEYS); }

export const authorOf = p => ({
  id: String(first(p.author?.community_member_id, p.community_member_id, p.user?.community_member_id, p.author?.id, p.user?.id) ?? ''),
  name: String(first(p.author?.name, p.user?.name, p.community_member?.name, p.user_name) || '').trim(),
});

export function initials(name) {
  const w = String(name || '?').trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] || '?') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
}
// A steady colour for a person, so the same name always gets the same avatar
const COLOURS = ['#A5432A', '#2E5A4B', '#7A5A2E', '#3E4C7A', '#6B3E5A', '#20302A'];
export function colourOf(key) { let h = 0; for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLOURS[h % COLOURS.length]; }

// "Week 2": the number of the live session whose week the post was written in (sessions are weekly), counted from the season's start
export function weekOf(at, startsOn, of = 8) {
  const d = Math.floor((ms(at) - Date.parse(`${startsOn}T00:00:00Z`)) / 86400000);
  return Number.isNaN(d) ? 0 : Math.min(of, Math.max(1, Math.floor(d / 7) + 1));
}

// A person's badge: teacher (a Circle admin or moderator, or listed as a teacher) beats mentee (a member of the Mentorship Circle).
// `flags` is the author's Circle record; ids = { menteeIds:Set, teacherIds:Set } of Circle member ids.
export function roleOf(authorId, flags = {}, ids = {}) {
  if (flags.community_admin || flags.moderator || flags.admin || (authorId && ids.teacherIds?.has(String(authorId)))) return 'teacher';
  if (authorId && ids.menteeIds?.has(String(authorId))) return 'mentee';
  return '';
}
export const flagsOf = rec => rec?.author || rec?.user || rec?.community_member || {};

// Comments from Circle → plain lines, oldest first. parent is the id of the comment replied to (null for a reply to the post itself)
export function commentLines(list) {
  return (list || []).map(c => ({
    id: String(c.id), parent: first(c.parent_comment_id, c.parent_id, c.parent?.id) != null ? String(first(c.parent_comment_id, c.parent_id, c.parent?.id)) : null,
    who: authorOf(c).name || 'A member', authorId: authorOf(c).id, at: first(c.created_at, c.published_at) || '',
    text: bodyOf(c, ['tiptap_body', 'rich_text_body', 'plain_text_body', 'body_plain', 'body', 'text']),
    files: filesOf(c),
    flags: flagsOf(c),
  })).filter(c => c.text || c.files.length).sort((a, b) => ms(a.at) - ms(b.at));
}

// Two levels: a comment on the post, and replies under it. A reply to a reply joins its comment's replies (oldest first), tagged with
// who it answered. A reply whose parent is gone (deleted) is shown as a comment on the post.
// opts.ids = { menteeIds, teacherIds }: every comment carries its author's badge (role: 'teacher' | 'mentee' | ''), wherever they write.
export function threadOf(lines, { ids = {} } = {}) {
  const byId = new Map(lines.map(l => [l.id, l]));
  const rootOf = l => { let cur = l, guard = 0; while (cur.parent && byId.has(cur.parent) && guard++ < 50) cur = byId.get(cur.parent); return cur; };
  const withRole = l => { const { flags, ...rest } = l; return { ...rest, role: roleOf(l.authorId, flags, ids) }; };
  const roots = [], kids = new Map();
  for (const l of lines) {
    const r = rootOf(l);
    if (r === l) { roots.push(l); continue; }
    (kids.get(r.id) || kids.set(r.id, []).get(r.id)).push({ ...l, to: byId.get(l.parent)?.who && byId.get(l.parent).id !== r.id ? byId.get(l.parent).who : '' });
  }
  return roots.map(r => ({ ...withRole(r), replies: (kids.get(r.id) || []).map(withRole) }));
}
export const countComments = threads => threads.reduce((n, t) => n + 1 + t.replies.length, 0);

// The list's filters: all | mentees | mine
export const filterReflections = (list, filter) => (filter === 'mentees' ? list.filter(p => p.role === 'mentee' || p.mentee) : filter === 'mine' ? list.filter(p => p.mine) : list);
