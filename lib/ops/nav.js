// Who sees which part of the ops dashboard. Teachers: Today and Events (plus a short People page linked
// from Today). Staff add Publish and People. Directors add Business and Admin.
export const isTeacher = u => !u?.director && (u?.newTeacher || String(u?.type || '').toLowerCase() === 'teacher');
export const isStaff = u => !!u && !isTeacher(u);
// Who can edit events (Schedule and Event Details): directors, the general manager and the project manager
// Social posts: the editors above plus anyone with the Social role (approve, edit captions, libraries)
export const canEditSocial = u => canEditEvents(u) || (u?.roles || []).some(r => /^social$/i.test(r));
// The same three people edit the website content (Content → Website)
export const canEditSite = u => canEditEvents(u);
export const canEditEvents = u => !!u && (u.director || ['manager', 'projects'].includes(String(u.type || '').toLowerCase()));

// group 'more' sits under a divider in the sidebar. Labels follow the redesign (Today, Publish, Business,
// People); routes stay the same for now.
const ITEMS = [
  { key: 'home', href: '/ops', label: 'Today', who: () => true },
  { key: 'events', href: '/ops/events', label: 'Events', who: () => true },
  { key: 'content', href: '/ops/content', label: 'Publish', who: isStaff },
  { key: 'insights', href: '/ops/insights', label: 'Business', who: u => !!u?.director },
  { key: 'team', href: '/ops/team', label: 'People', who: isStaff, group: 'more' },
  { key: 'admin', href: '/ops/admin', label: 'Admin', who: u => !!u?.director, group: 'more' },
];

export const navFor = u => ITEMS.filter(i => i.who(u));
