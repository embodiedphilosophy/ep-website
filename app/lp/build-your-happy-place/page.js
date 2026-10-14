import CourseLP, { JACOB, tiersFor } from '@/components/CourseLP';
import { getSite } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: "Build Your Happy Place: A Workshop on Creating Personal Altars — Pay What You Can — Embodied Philosophy",
  description: "A 4-hour on-demand workshop with Jacob Kyle on building a personal altar from Hindu, Buddhist and Gnostic traditions, with a householder’s prāṇa-pratiṣṭhā. Pay what you can.",
  openGraph: { title: "Build Your Happy Place: A Workshop on Creating Personal Altars", description: "A 4-hour on-demand workshop with Jacob Kyle on building a personal altar from Hindu, Buddhist and Gnostic traditions, with a householder’s prāṇa-pratiṣṭhā. Pay what you can.", images: ["https://cdn.lugc.link/7a5053ea-5526-487e-808d-e57c1d1ab538/-/preview/1200x1200/-/format/png/"] },
};

const COURSE = {
  "title": "Build Your Happy Place",
  "lede": "A workshop on creating personal altars. Traditional forms and contemporary practice from Hindu, Buddhist and Gnostic sources, so you can create a sacred center for your own practice.",
  "facts": "4-hour workshop · start any time",
  "hero": "https://cdn.lugc.link/7a5053ea-5526-487e-808d-e57c1d1ab538/-/preview/1000x1000/-/format/auto/",
  "heroAlt": "A collage of bronze deity images against a vermilion ground",
  "frame": "terra",
  "kind": "workshop",
  "stat": [
    "3",
    "Altar traditions: Hindu, Buddhist & Gnostic"
  ],
  "intro": [
    "Sooner or later, meditators and spiritual seekers become interested in building an altar as a center of gravity for their practice. While an altar is often a matter of personal preference, there are traditional arrangements in the contemplative traditions worth knowing.",
    "In this practical workshop we explore traditional and contemporary approaches to altar-making: the meaning and history of the Smārta Hindu arrangement, how Buddhist practitioners organize their spaces for meditation, and a simplified <i>prāṇa-pratiṣṭhā</i>, appropriate for householders, that imbues your sacred images (<i>mūrtis</i>) with prāṇa, the divine life force."
  ],
  "ask": "Awaken your sacred space with tradition and creativity.",
  "outcomesTitle": "Create a meaningful center for your practice",
  "outcomes": [
    [
      "The elements of an altar",
      "The fundamental elements and symbolism of traditional altar arrangements."
    ],
    [
      "The Smārta format",
      "Specific insight into the Smārta Hindu altar and its meaning."
    ],
    [
      "Buddhist principles",
      "How Buddhist altars are organized, and their contemplative purpose."
    ],
    [
      "Choosing sacred objects",
      "How to select and arrange sacred objects and imagery, from classical iconography on."
    ],
    [
      "Enlivening your images",
      "A householder’s prāṇa-pratiṣṭhā to bring your images to life."
    ],
    [
      "Caring for the space",
      "Adapting traditional formats to modern homes, seasonal altars, and energetically cleansing and refreshing your space."
    ]
  ],
  "modulesTitle": "The workshop agenda",
  "modulesEyebrow": "Workshop agenda",
  "modulesLink": "See the agenda",
  "modules": [
    [
      "Part 1",
      "Working with a Contemplative Altar",
      ""
    ],
    [
      "Part 2",
      "Hindu, Buddhist & Gnostic Altar Formats & Meanings",
      ""
    ],
    [
      "Part 3",
      "Selecting & Enlivening Your Sacred Images",
      ""
    ],
    [
      "Part 4",
      "Caring for an Altar Space & Other Supportive Practices",
      ""
    ],
    [
      "Part 5",
      "Ancient to Modern: Traditional & Contemporary Thoughts on Altars",
      ""
    ]
  ],
  "band": "https://cdn.lugc.link/a5f82ed3-69cf-419d-977a-53c362ef44b1/-/preview/1600x1600/-/format/auto/",
  "teachers": [JACOB],
  "includes": [
    "4-hour workshop with Jacob Kyle",
    "A householder’s prāṇa-pratiṣṭhā practice",
    "Hindu, Buddhist and Gnostic altar formats",
    "Lifetime access, at your own pace"
  ],
  "value": "$249",
  "faq": [
    [
      "Do I need an altar or special objects already?",
      "No. Whether you are building your first altar or refining one you have, the workshop starts from the basics and helps you honor both tradition and your own intuition."
    ],
    [
      "How does the on-demand format work?",
      "You get immediate access to the full recorded workshop. Watch at your own pace; access does not expire."
    ]
  ],
  "close": [
    "",
    "Build your happy place.",
    "Infuse your practice with sacred imagery."
  ],
  "tiers": tiersFor(47, 97)
};

export default async function Page() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return <CourseLP c={COURSE} checkout={checkout} />;
}
