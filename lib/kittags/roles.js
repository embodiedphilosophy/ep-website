// "One quick question" links in Kit emails: ?role=teacher or ?role=practitioner on any page of the site.
// The page reads the reader's Kit subscriber id from the link (Kit adds ck_subscriber_id when "Add subscriber
// ID to links" is on; an email can also pass it explicitly as &sid={{ subscriber.id }}) and tags them.
// Only these tags can ever be added this way.
export const ROLE_TAGS = {
  teacher: 'Role: Yoga teacher',
  practitioner: 'Role: Yoga practitioner',
};

export const roleTagName = role => ROLE_TAGS[String(role || '').trim().toLowerCase()] || null;

// Kit subscriber ids are positive integers
export const validSid = sid => /^\d{4,15}$/.test(String(sid || ''));
