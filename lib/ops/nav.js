// Who sees which part of the ops dashboard. Teachers: Home and Events (plus a short Team page linked
// from Home). Staff add Content and Team. Directors add Insights and Admin.
export const isTeacher = u => !u?.director && (u?.newTeacher || String(u?.type || '').toLowerCase() === 'teacher');
export const isStaff = u => !!u && !isTeacher(u);
// Who can edit events (Schedule and Event Details): directors, the general manager and the project manager
// Social posts: the editors above plus anyone with the Social role (approve, edit captions, libraries)
export const canEditSocial = u => canEditEvents(u) || (u?.roles || []).some(r => /^social$/i.test(r));
// The same three people edit the website content (Content → Website)
export const canEditSite = u => canEditEvents(u);
export const canEditEvents = u => !!u && (u.director || ['manager', 'projects'].includes(String(u.type || '').toLowerCase()));

const ITEMS = [
  { key: 'home', href: '/ops', label: 'Home', who: () => true },
  { key: 'events', href: '/ops/events', label: 'Events', who: () => true },
  { key: 'content', href: '/ops/content', label: 'Content', who: isStaff },
  { key: 'team', href: '/ops/team', label: 'Team', who: isStaff },
  { key: 'insights', href: '/ops/insights', label: 'Insights', who: u => !!u?.director },
  { key: 'admin', href: '/ops/admin', label: '⚙ Admin', who: u => !!u?.director },
];

export const navFor = u => ITEMS.filter(i => i.who(u));
