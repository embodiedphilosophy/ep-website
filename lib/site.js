// One place for links, prices and numbers used across the site.
// Later this can also be read from the EP master spreadsheet.
export const site = {
  links: {
    signIn: 'https://www.embodiedphilosophy.org/login', // backup only: the live link is Site Links & Prices (sign_in)
    signInWisdom: 'https://school.embodiedphilosophy.com/sign_in', // Wisdom School + Meditation Mondays (Uscreen)
    signInSadhana: 'https://ss.embodiedphilosophy.com/sign_in', // Sādhana School (Circle)
    wisdomJoin: 'https://www.embodiedphilosophy.org/offers/LFHZPXMS',
    meditationMonthly: 'https://www.embodiedphilosophy.org/offers/mSnX5fRv',
    meditationYearly: 'https://www.embodiedphilosophy.org/offers/PsssgQcb',
    wisdomMonthly: '',
    wisdomPlusJoin: '',
    wisdomPlusMonthly: '',
    ceJoin: '',
    wisdomCatalog: 'https://www.embodiedphilosophy.org/library', // backup only: the live link is Site Links & Prices (catalog)
    // These are backups for when the calendar sheet can't be read. The live links are edited in the dashboard
    // (Content → Website → Links & prices). Kajabi and Uscreen are being retired: point new links at Circle.
    sadhanaYear: 'https://enroll.embodiedphilosophy.com/sadhana-school',
    sadhanaSemester: 'https://enroll.embodiedphilosophy.com/sadhana-school',
    quiz: 'https://report.embodiedphilosophy.com/',
    tarkaSubstack: 'https://www.tarkajournal.com',
    tarkaPrint: 'https://www.tarkajournal.com',
    podcast: { spreaker: 'https://www.spreaker.com/podcast/chitheads-with-jacob-kyle-embodied-philosophy--6230267', spotify: 'https://open.spotify.com/show/2A3WSjzEWIeOyrcB3FD3PJ', apple: 'https://podcasts.apple.com/us/podcast/chitheads-with-jacob-kyle-embodied-philosophy/id1046733414', youtube: 'https://www.youtube.com/playlist?list=PL4C_iHX_BB5GednlKTbjhCy9IQ90n9niL', rss: 'https://www.spreaker.com/show/6230267/episodes/feed' },
    social: { instagram: 'https://www.instagram.com/embodiedphilosophy', youtube: 'https://www.youtube.com/channel/UC_yvYg_NrI74IviUUjUEWiQ', facebook: 'https://www.facebook.com/embodiedphilosophy', spotify: 'https://open.spotify.com/show/2A3WSjzEWIeOyrcB3FD3PJ' },
    privacy: 'https://www.iubenda.com/privacy-policy/47854771',
    terms: 'https://www.iubenda.com/terms-and-conditions/47854771',
  },
  prices: {
    dropin: '$14.99',
    ce: '',
    schoolSeat: '$110', schoolLecture: '$600', schoolLicense: '$4,000', schoolMinSeats: '8',
    meditationMonthly: '$9.99',
    meditationYearly: '$99',
    wisdomMonthly: '$29',
    wisdomPlusYear: '$497',
    wisdomPlusMonthly: '$49',
    wisdomYear: '$297',
    sadhanaYear: '$1,497',
    sadhanaSemesterFrom: '$497',
  },
  stats: [
    { n: '100,000+', l: 'In the community' },
    { n: '650+', l: 'Hours of teaching' },
    { n: '100+', l: 'Live practitioners' },
    { n: '2015', l: 'Teaching since' },
    { n: '9', l: 'Issues of Tarka' },
  ],
  sadhanaTheme: 'The Path of Recognition',
  libraryHours: '650+',
};
