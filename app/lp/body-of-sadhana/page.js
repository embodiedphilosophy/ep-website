import CourseLP, { JACOB, tiersFor } from '@/components/CourseLP';
import { getSite } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: "Body of Sādhana: Seminar & Workshop — Pay What You Can — Embodied Philosophy",
  description: "A half-day on-demand seminar with Jacob Kyle on daily sādhana, chant, nyāsa and the yoga of vibration, with a Nāda Yoga workshop by Mary Reilly Nichols. Pay what you can.",
  openGraph: { title: "Body of Sādhana: Seminar & Workshop", description: "A half-day on-demand seminar with Jacob Kyle on daily sādhana, chant, nyāsa and the yoga of vibration, with a Nāda Yoga workshop by Mary Reilly Nichols. Pay what you can.", images: ["https://cdn.lugc.link/c5fdded1-3245-47dd-9563-4768cd82f9d3/-/preview/1200x1200/-/format/png/"] },
};

const COURSE = {
  "title": "Body of Sādhana",
  "lede": "From a body of stress to a body of sādhana. A half-day seminar on making daily practice the central pillar of your life, built on the yogic theory of sound and vibration.",
  "facts": "4-hour seminar · Nāda Yoga workshop · start any time",
  "hero": "https://cdn.lugc.link/c5fdded1-3245-47dd-9563-4768cd82f9d3/-/preview/1000x1000/-/format/auto/",
  "heroAlt": "A collage of a meditating figure before a Tibetan teacher, with eyes and Sanskrit script",
  "kind": "seminar",
  "stat": [
    "4",
    "Hours of study and practice"
  ],
  "intro": [
    "The world moves a mile a minute. A slow trickle of daily news has become a torrent of media all clamoring for our attention, and attention is an easily depleted natural resource. Give it away too often and our inner seasons turn inhospitable, our bodily home polluted by stress and anxiety.",
    "The faster we live, the more we put off the practices that keep us sane. Stepping off the householder hamster wheel for a few carefully curated moments every day is more important now than ever. But which form of meditation is right for me? What about the rituals before and after? And how do I fit it in when my day is already full?"
  ],
  "ask": "Transform meditation from an occasional practice into a central pillar of your life.",
  "outcomesTitle": "A cycle of practice, from the gross body to the subtle",
  "outcomes": [
    [
      "A daily cycle",
      "A sequence that moves from light postural yoga to the subtle body in meditation."
    ],
    [
      "The yoga of vibration",
      "The theory of sound and vibration (spanda) in yoga, and how it shapes practice."
    ],
    [
      "Sanskrit chants",
      "A sequence of chants you can bring into your own daily practice."
    ],
    [
      "Uccāra & nyāsa",
      "The “upward enunciation” of mantra, and the practice of placing mantras on the body."
    ],
    [
      "Nāda yoga",
      "The philosophy and science of the “inner sound,” with Mary Reilly Nichols."
    ],
    [
      "Integration",
      "A journaling and reflection exercise that helps integrate the experience of meditation."
    ]
  ],
  "modulesTitle": "The seminar, step by step",
  "modulesEyebrow": "Workshop outline",
  "modulesLink": "See the outline",
  "modules": [
    [
      "Part 1",
      "The Yogic Theory of Vibration (Spanda)",
      ""
    ],
    [
      "Part 2",
      "Japa Practice: A Sequence of Chants",
      ""
    ],
    [
      "Part 3",
      "Gross to Subtle Meditation Cycle",
      ""
    ],
    [
      "Part 4",
      "Creative Contemplation: Journaling & Reflection",
      ""
    ],
    [
      "Part 5",
      "Exploring Nāda Yoga, with Mary Reilly Nichols",
      "A one-hour talk and workshop on the theory and science of nāda yoga. Using simple postures, prāṇāyāma and guided meditation, we discern the “unstruck sound” in some of its sublime varieties: a connection to the vibrational substrate of reality you can return to at any time."
    ],
    [
      "Part 6",
      "Uccāra, Nyāsa & a Closing Intention Ceremony",
      ""
    ]
  ],
  "band": "https://cdn.lugc.link/cc8123fb-e590-4949-8dc3-5c41fdb724a7/-/preview/1600x1600/-/format/auto/",
  "teachers": [JACOB, {
  "name": "Mary Reilly Nichols",
  "role": "Guest teacher",
  "bio": [
    "A yoga and meditation teacher for over 40 years, Mary offers yoga instruction emphasizing breath awareness, with insights from neuroscience and evolutionary biology as well as the philosophy of the Upaniṣads, Advaita Vedānta and the Tantric methods of Kashmir Śaivism.",
    "Director of the Nalanda Institute’s yoga teacher training program, she has taught at Tibet House in New York City and the New York Open Center, and has been a keynote speaker at symposia sponsored by the Wonderstruck Webcast and Harvard Divinity School. Mary holds a BA in anthropology from Harvard University and completed five years of residency in meditation ashrams in India and the US."
  ]
}],
  "includes": [
    "About 4 hours of video, recorded live",
    "Special guest talk & workshop: Nāda Yoga, with Mary Reilly Nichols",
    "Chant, uccāra and nyāsa practices",
    "Journaling and reflection exercise",
    "Lifetime access, at your own pace"
  ],
  "value": "$249",
  "faq": [
    [
      "Do I need experience with meditation or chant?",
      "No. The seminar is designed for anyone who wants a steadier daily practice. Every chant and Sanskrit term is taught and explained."
    ],
    [
      "How does the on-demand format work?",
      "“Body of Sādhana” was recorded live and is now available to watch at your own pace. Access does not expire."
    ]
  ],
  "close": [
    "nāda",
    "Make practice the center of your day.",
    "A half-day seminar on the body of sādhana."
  ],
  "tiers": tiersFor(79, 147)
};

export default async function Page() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return <CourseLP c={COURSE} checkout={checkout} />;
}
