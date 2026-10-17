// Thank-you pages for the Meta-ad lead magnets. The Kit landing pages (go.embodiedphilosophy.com)
// redirect here after a sign-up, and this page reports the Lead to Meta (pixel + Conversions API).
// Add a new lead magnet by adding an entry and pointing its Kit landing page's redirect at /thanks/<slug>.
export const THANKS = {
  '4-pathways': {
    contentName: '4 Pathways of Tantrik Practice',
    title: 'Your four lectures are on their way',
    deliver: 'We’ve just emailed you a link to the full video series. It should arrive within a few minutes, from Jacob Kyle at Embodied Philosophy.',
    image: '/holyman-tigers.webp',
    imageAlt: 'Kalighat painting of a holy man seated with two tigers',
    next: {
      eyebrow: 'When you’re ready to go deeper',
      text: 'The four pathways are the backbone of Sādhana School, our year-long training in non-dual Tantrik practice, taught live in four seasons.',
      label: 'Explore Sādhana School',
      href: '/sadhana-school',
    },
  },
  '12-darshanas': {
    contentName: 'The Indian Darśanas: 12 Schools',
    title: 'Your guide is on its way',
    deliver: 'We’ve just emailed you The Indian Darśanas as a PDF. It should arrive within a few minutes, from Jacob Kyle at Embodied Philosophy.',
    image: '/mirror.webp',
    imageAlt: 'Kalighat painting of a woman gazing into a mirror',
    next: {
      eyebrow: 'Keep studying',
      text: 'Wisdom School is our membership for thinking practitioners: a year of live teachings on yoga philosophy and the contemplative traditions, plus Meditation Mondays.',
      label: 'Explore Wisdom School',
      href: '/wisdom-school',
    },
  },
};
