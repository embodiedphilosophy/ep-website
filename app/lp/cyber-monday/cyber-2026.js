// Cyber Monday 2026 — The Open Library
// Single source of truth for the /lp/cyber-monday page: dates, prices, links, copy.
// Every value marked TODO is an open decision or a link to look up in the existing site data.
// Keep this file data-only so next year's campaign is a copy + edit.


// All deadlines are US Eastern (EST, UTC-5 in late Nov / Dec). Stored as UTC instants.
export const dates = {
  earlyAccessOpens: '2026-11-27T05:00:00Z', // Fri Nov 27, 00:00 ET — members via emailed link
  publicLaunch: '2026-11-30T05:00:00Z',     // Mon Nov 30, 00:00 ET — TODO confirm (or 12:00 ET with Meditation Monday)
  plusAndArchiveClose: '2026-12-03T04:59:59Z', // Wed Dec 2, 11:59:59pm ET
  openLibraryClose: '2026-12-07T04:59:59Z',    // Sun Dec 6, 11:59:59pm ET
};

export const campaign = {
  slug: 'cyber-monday',
  path: '/lp/cyber-monday',
  title: 'The Open Library — Cyber Week at Embodied Philosophy',
  description:
    'For one week, every Embodied Philosophy course opens on a pay-what-you-can basis. Certificates and past Sādhana School seasons at Cyber prices.',
  utmCampaign: 'cyber-2026',
  regularCoursePrice: 97,
};

// ---------- Tier 1 — The Open Library ----------
export const pwyc = {
  suggested: [null, null, null], // TODO: three amounts matching the PWYC ad tiers; index 1 is pre-selected
  suggestedLabels: ['Supported', 'Most give this', 'Sustaining'],
  minimum: null, // TODO
  meditationPassAddOn: { regular: 99, cyber: null }, // TODO: Cyber price; see HANDOFF.md §6.4
};

// `courseId` must match the id/slug the existing Course Library data uses, so title, teacher, hours,
// description, course art and the PWYC Kit product URL are read from there — not retyped here.
// `motif` is the Cyber Week illustration shown on the card (the course's own art is used in the modal).
export const featuredCourses = [
  { courseId: 'TODO-shiva-sutras', title: 'Śiva Sūtras', topic: 'Kashmir Śaivism', motif: 'eye' },
  { courseId: 'TODO-body-of-sadhana', title: 'Body of Sādhana', topic: 'Classical Yoga', motif: 'lotus' },
  { courseId: 'TODO-hamsa-sadhana', title: '21-Day Haṃsa Sādhana', topic: 'Meditation', motif: 'swan-waves' },
  { courseId: 'TODO-tibetan-book-of-the-dead', title: 'The Tibetan Book of the Dead', topic: 'Buddhism', motif: 'moon' },
  { courseId: 'TODO-subtle-alignment', title: 'Subtle Alignment', topic: 'Classical Yoga', motif: 'mandala' },
  { courseId: 'TODO-inner-saboteur', title: 'The Inner Saboteur', topic: 'Meditation', motif: 'sun-face' },
];
// "See every course": every Course Library item flagged pay-what-you-can, minus the featured six.
// Known members: Personal Altar, 5-Day Chakras Immersion, Build Your Happy Place, Vedic Philosophy. TODO full list.
// Exclude anything in the trauma / somatics / psychedelic pathways (2026 rule).
export const libraryExcludeTopics = ['Trauma', 'Somatics', 'Psychedelics'];

// ---------- Tier 2 — Certificates through Wisdom School Plus ----------
export const certificates = {
  single: { regular: 297, cyber: 147 }, // TODO confirm
  titles: ['Yoga Philosophy', 'Awakened Body', 'Buddhist Psychology', 'Embodied Yoga Therapy'],
  // TODO: Circle paywall URL for each certificate AT THE CYBER PRICE (a separate paywall/price, not a code)
  singleCheckout: {
    'Yoga Philosophy': 'https://ss.embodiedphilosophy.com/checkout/cyber26-yoga-philosophy-certificate',
    'Awakened Body': 'https://ss.embodiedphilosophy.com/checkout/cyber26-awakened-body-certificate',
    'Buddhist Psychology': 'https://ss.embodiedphilosophy.com/checkout/cyber26-buddhist-psychology-certificate',
    'Embodied Yoga Therapy': 'https://ss.embodiedphilosophy.com/checkout/cyber26-embodied-yoga-therapy-certificate',
  },
  plus: {
    regular: 497,
    cyberFirstYear: 297, // TODO confirm
    checkout: 'https://ss.embodiedphilosophy.com/checkout/cyber26-wisdom-school-plus', // Plus annual Circle paywall with the $297 first-year price
    includes: [
      'All four certificate programs',
      'Every Learning Pathway',
      'Yoga Alliance CE certificates',
      'The Attention Project 2027',
      'Meditation Mondays, live each week',
    ],
    valueLine: 'Four certificates worth $1,188 at regular price, for the regular price of one.',
  },
  memberUpgrade: { price: null, checkout: 'TODO' }, // TODO
  ceNote:
    'Most EP courses count toward Yoga Alliance continuing-education hours. CE certificates are issued automatically as you complete each pathway.',
};

// ---------- Tier 3 — Sādhana School Archive ----------
export const archive = {
  prices: {
    season: { regular: 497, cyber: 197 },
    retreat: { regular: 797, cyber: 297 },
    fullYear: { cyber: 497 },
  },
  credit: { cap: 197, deadline: 'TODO January date' }, // TODO confirm both
  currentYear: { title: 'The Path of Recognition', years: '2026–27', href: '/sadhana-school' },
  years: [
    {
      label: '2024–25',
      subtitle: null,
      fullYearCheckout: 'TODO',
      seasons: [
        { season: 'Fall 2024', title: 'Spiritual Technology', line: 'A pluralistic odyssey through yoga philosophy.', text: null, kind: 'season', motif: 'mandala', checkout: 'TODO' },
        { season: 'Winter 2025', title: 'The Logic of Prāṇa', line: 'TODO one-line theme', text: null, kind: 'season', motif: 'resonance', checkout: 'TODO' },
        { season: 'Spring 2025', title: 'Rasa Theory', line: 'TODO one-line theme', text: null, kind: 'season', motif: 'sun-face', checkout: 'TODO' },
        // TODO name: 2025 Cyber page says "Kuṇḍalinī & Radical Yogic Embodiment"; the 2025–26 enrolment page says "Kuṇḍalinī & Subtle Embodiment Retreat" (Jul 10–16, 2025)
        { season: 'Summer retreat 2025', title: 'Kuṇḍalinī & Radical Yogic Embodiment', line: 'Online retreat recordings.', text: null, kind: 'retreat', motif: 'lotus', checkout: 'TODO' },
      ],
    },
    {
      label: '2025–26',
      subtitle: 'Ancient Texts, Living Paths',
      fullYearCheckout: 'TODO',
      // TODO: season mapping — the enrolment page lists four sādhanas but only names Fall, Winter, Spring
      seasons: [
        { season: 'Fall 2025', title: 'Invisible Life', line: 'Vibration, meditation and the cultivation of dynamic awareness.', text: 'Spanda Kārikās', kind: 'season', motif: 'resonance', checkout: 'TODO' },
        { season: 'Winter 2026', title: 'The Power of Speech', line: 'Language, vibration and the silent word within.', text: 'Parātriṃśikā Vivaraṇa', kind: 'season', motif: 'lotus', checkout: 'TODO' },
        { season: 'Spring 2026', title: 'The Third Eye', line: 'Perception and the subtle yoga of non-dual vision.', text: 'Netra Tantra', kind: 'season', motif: 'eye', checkout: 'TODO' },
        { season: 'TODO 2026', title: 'The Heart of the Yoginī', line: 'Embodying the cosmic maṇḍala of Śakti.', text: 'Yoginī Hṛdaya', kind: 'season', motif: 'sri-cakra', checkout: 'TODO' },
      ],
    },
  ],
};

// ---------- Social proof ----------
// Sources: enroll.embodiedphilosophy.com/sadhana-school and /wisdom-school (verbatim excerpts).
export const pullQuote = {
  text: 'Anybody who has an interest in expanding their awareness with a really, really experienced teacher: it would benefit them.',
  name: 'Ali Woozley',
  role: 'Sādhana School student',
};
export const testimonials = [
  { text: 'I loved the mixture between the intense practices and the rich theoretical knowledge!', name: 'Katherine', role: 'Sādhana School student' },
  { text: 'Thank you, Jacob, for your huge work and for bringing the teachings of yoga alive for me.', name: 'Jonah', role: 'Sādhana School student, Malawi' },
  { text: 'I can be in a relationship with this life and its source in a profound intimate way.', name: 'Turiya', role: 'Wisdom School member' },
];

// ---------- Copy deck ----------
export const copy = {
  topBar: {
    live: 'Cyber Week: the Open Library is open',
    early: 'Members: early access to Cyber Week is open',
    libraryOnly: 'The Open Library is open until Sunday',
  },
  earlyBanner: { label: 'Early access for members', text: "You're seeing Cyber prices before Monday. Thank you for studying with us." },
  hero: {
    eyebrow: { live: 'Cyber Week · Nov 30 – Dec 6', early: 'Member early access · Nov 27 – Dec 6', evergreen: 'The Open Library' },
    headline: ['The whole library, ', 'at whatever you can give.'], // [roman, italic turn]
    body: 'For one week, every Embodied Philosophy course opens on a pay-what-you-can basis. Study the traditions, start a practice, and pay what is right for you.',
    primary: 'Enter the Open Library',
    secondary: 'See all three offers',
    proof: ['Every course is yours for good', 'Lives in your Circle dashboard', '30-day refunds on courses'],
  },
  navigator: [
    { n: '01', when: 'ALL WEEK', title: 'The Open Library', anchor: '#library', icon: 'open-library-book' },
    { n: '02', when: 'UNTIL WED', title: 'Certificate Programs', anchor: '#certificates', icon: 'certificate-seal' },
    { n: '03', when: 'UNTIL WED', title: 'Sādhana School Archive', anchor: '#archive', icon: 'archive-lotus' },
  ],
  tier1: {
    eyebrow: 'The Open Library',
    headline: ['Every course, ', 'pay what you can.'],
    body: 'Choose an amount that fits your life. Every course is yours for good, with recordings, readings and practices in your Circle dashboard.',
    pwycNote: 'The middle amount is what most students give. Same course, whatever you choose.',
    guarantee: '100% satisfaction guarantee. Any course or certificate, refunded within 30 days, no questions asked.',
  },
  tier2: {
    eyebrow: 'Certificate Programs',
    headline: ['One certificate, ', 'or all four.'],
    body: 'Take a single certificate for $147, or join Wisdom School Plus for $297 and get every certificate, every learning pathway and The Attention Project 2027.',
    ended: 'Cyber prices on certificates closed Wednesday, Dec 2. Every certificate is still available, and Wisdom School Plus includes all four.',
  },
  tier3: {
    eyebrow: 'The Sādhana School Archive',
    headline: ['Past seasons, ', 'a path into this one.'],
    body: "Practice with past seasons of Sādhana School from $197. What you spend counts toward joining this year's Path of Recognition.",
    credit: 'Every dollar you spend here, up to $197, comes off Winter 2027 or full-year enrolment.',
    ended: 'Archive prices closed Wednesday, Dec 2. Past seasons remain available at their regular price.',
    currentYearNote: 'The current year is never discounted here.',
  },
  howItWorks: {
    eyebrow: 'How it works',
    headline: ['Begin ', 'today.'],
    steps: [
      { title: 'Choose', body: 'A course from the Open Library, a certificate, or a past season of Sādhana School.' },
      { title: 'Pay', body: 'What you can, or the Cyber price. No codes to copy: every button opens a priced checkout.' },
      { title: 'Start in Circle', body: 'Sign in to your Circle dashboard and begin. Use Circle in a web browser for now, not the app.' },
    ],
  },
  closing: {
    eyebrow: 'Ends Dec 2 / Dec 6',
    headline: ['The library is open ', 'for one week.'],
    body: 'Certificate and Archive prices end Wednesday, Dec 2. The Open Library closes Sunday, Dec 6.',
    button: 'See the offers',
  },
  footer: ['Contemplative education for the whole human, ', 'without the inhuman cost.'],
};

export const faqs = [
  { q: 'How does pay what you can work?', a: 'Pick one of three suggested amounts, or type your own (minimum $[MIN]). Whatever you choose, you get the full course.' },
  { q: 'Do I keep access after Cyber Week?', a: 'Yes. Every course you buy this week is yours for good, with its recordings, readings and practices.' },
  { q: 'Where do my courses live?', a: 'In Circle. After checkout you land on your dashboard there. Please use Circle in a web browser for now, not the app.' },
  { q: 'What is the difference between one certificate and Wisdom School Plus?', a: 'One certificate ($147) unlocks a single program. Wisdom School Plus ($297 for the first year) includes all four certificates, every Learning Pathway, CE certificates, The Attention Project 2027 and Meditation Mondays.' },
  { q: 'I am already a Wisdom School member. Can I upgrade?', a: 'Yes. Use the upgrade link in your email, or sign in, to move to Plus for $[TBC].' },
  { q: 'How does the Archive credit toward Sādhana School work?', a: 'What you spend on the Archive, up to $197, is credited toward Winter 2027 or full-year Sādhana School enrolment until [January date].' },
  { q: 'Do courses count toward Yoga Alliance CE hours?', a: 'Most Embodied Philosophy courses count toward Yoga Alliance continuing-education hours.' },
  { q: 'What is the refund policy?', a: 'Courses and certificates: full refund within 30 days. Memberships: cancel any time before your next charge; memberships are not refunded.' },
];

// ---------- Added when building the page (not in the design handoff) ----------
// Where the "ended" cards and the evergreen state send people (regular pricing, no Cyber price).
export const endedLinks = {
  certificates: '/wisdom-school',
  plus: '/wisdom-school',
  archive: '/sadhana-school',
};
// Kit's checkout may not take a pre-filled amount. Leave null until it is confirmed; then set the
// query-string name Kit uses (e.g. 'amount') and the modal passes the chosen amount through.
export const kitAmountParam = null;
// Cookies set from the emailed links (visibility only; prices live on the checkouts).
export const cookies = { access: 'ep_cyber_access', member: 'ep_cyber_member', days: 7 };
