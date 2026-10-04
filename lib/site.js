// One place for links, prices and numbers used across the site.
// Later this can also be read from the EP master spreadsheet.
export const site = {
  links: {
    signIn: 'https://school.embodiedphilosophy.com/login',
    wisdomJoin: 'https://school.embodiedphilosophy.com/offers/wisdom-school', // TODO: real Kajabi offer URL
    wisdomCatalog: 'https://school.embodiedphilosophy.com/library',          // TODO
    sadhanaYear: 'https://school.embodiedphilosophy.com/offers/sadhana-year', // TODO
    sadhanaSemester: 'https://school.embodiedphilosophy.com/offers/sadhana-semester', // TODO
    quiz: 'https://practice-report.vercel.app', // TODO: confirm production URL of the quiz
    tarkaSubstack: '#', // TODO
    tarkaPrint: '#',    // TODO
    podcast: { spotify: '#', apple: '#', youtube: '#', rss: '#' }, // TODO
    social: { instagram: '#', youtube: '#', facebook: '#', spotify: '#' }, // TODO
  },
  prices: {
    wisdomYear: '$297',
    sadhanaYear: '$1,497',
    sadhanaSemesterFrom: '$497',
  },
  stats: [
    { n: '85,000+', l: 'In the community' },
    { n: '1,000+', l: 'Hours of teaching' },
    { n: '100+', l: 'Live practitioners' },
    { n: '2015', l: 'Teaching since' },
    { n: '9', l: 'Issues of Tarka' }, // TODO: confirm
  ],
  sadhanaTheme: 'Heart of Recognition',
};
