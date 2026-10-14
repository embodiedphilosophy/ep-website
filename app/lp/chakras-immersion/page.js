import CourseLP, { JACOB, tiersFor } from '@/components/CourseLP';
import { getSite } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: "5-Day Chakras Immersion — Pay What You Can — Embodied Philosophy",
  description: "Five on-demand sessions with Jacob Kyle on the five-chakra system of the Kubjikāmata Tantra: study and elemental meditation for earth, water, fire, air and space. Pay what you can.",
  openGraph: { title: "5-Day Chakras Immersion", description: "Five on-demand sessions with Jacob Kyle on the five-chakra system of the Kubjikāmata Tantra: study and elemental meditation for earth, water, fire, air and space. Pay what you can.", images: ["https://cdn.lugc.link/5d8e2265-b02f-4410-b306-6efd509c985c/-/preview/1200x1200/-/format/png/"] },
};

const COURSE = {
  "title": "5-Day Chakras Immersion",
  "lede": "Ground. Flow. Enflame. Inspire. Expand. Five days with an under-studied chakra system from the Kubjikāmata Tantra, a text of the divine feminine, through study and elemental meditation.",
  "facts": "5 sessions · PDF study guide · start any time",
  "hero": "https://cdn.lugc.link/5d8e2265-b02f-4410-b306-6efd509c985c/-/preview/1000x1000/-/format/auto/",
  "heroAlt": "A yogi seated in meditation with the chakras glowing along the spine",
  "kind": "immersion",
  "stat": [
    "5",
    "Elements, five chakras"
  ],
  "intro": [
    "The chakras are one of the most popular topics in the spiritual world, yet practices from the ancient yoga texts are hard to come by, and it can be hard to tell the ancient from the modern.",
    "In five days you’ll discover an ancient text about the divine feminine, the <i>Kubjikāmata Tantra</i>, explore a non-dual yogic philosophy, and use the five elements as tools to ground, flow, enflame, inspire and expand. Why the elements? Because developing tools to experience ourselves as part of nature has perhaps never been so timely."
  ],
  "ask": "Challenge yourself to align with elemental nature.",
  "outcomesTitle": "A more informed practice of the chakras",
  "outcomes": [
    [
      "Why so many systems?",
      "Why there have been so many chakra systems, and what that means for the “reality” of the chakras."
    ],
    [
      "Connect with the elements",
      "An ancient five-chakra system that has received very little attention in the modern spiritual world."
    ],
    [
      "Practices to keep",
      "A set of practices you can return to again and again, long after the five days."
    ],
    [
      "History & philosophy",
      "The history and philosophy behind the chakra systems, so you can speak about yoga’s complex history with care."
    ],
    [
      "Creativity & ease",
      "New modes of creativity and self-expression, and less stress."
    ],
    [
      "A deeper connection",
      "A more cohesive, interconnected sense of self."
    ]
  ],
  "modulesTitle": "Start each day with study & practice",
  "modulesEyebrow": "The five days",
  "modulesLink": "See the five days",
  "modules": [
    [
      "Day 1 · Earth",
      "Ground Yourself in the Creative Process",
      "In this five-chakra system the first chakra is visualized in the pelvis. Discover the philosophy behind chakra visualization in Tantric sources, then practice a visualized meditation on the element of earth."
    ],
    [
      "Day 2 · Water",
      "Flow with Competence & Flexibility",
      "The Kubjikāmata Tantra actually features two chakra systems. Why, and what that reveals about chakras as pragmatic tools for different meditative experiences. Then a meditation on water at the navel."
    ],
    [
      "Day 3 · Fire",
      "Enflame Awareness of the Cosmic Self in Your Heart",
      "Tantra maps the cosmos onto the body. Fire is the element of transformation; after studying its logic, we meditate on fire in the space of the heart."
    ],
    [
      "Day 4 · Air",
      "Breathe Life Into Your Work",
      "The five “breaths” (prāṇa) of the Upaniṣads as a way into the fourth chakra and the element of air, located at the throat."
    ],
    [
      "Day 5 · Ether",
      "Fly in the Sky of Consciousness",
      "Vibration as a form through which consciousness manifests, the philosophy of kuṇḍalinī, and the fifth and most esoteric element, visualized at or just above the crown."
    ]
  ],
  "deep": {
    "eyebrow": "The text",
    "title": "What is the Kubjikāmata Tantra?",
    "body": [
      "<i>Kubjikā</i> means the “coiled” or “crooked” one, and refers to the awakening energy of kuṇḍalinī: the power that “rises” from the base of the spine, piercing the chakras and animating the experience of yogic enlightenment.",
      "The <i>Kubjikāmata Tantra</i> is a fascinating source for grounding our understanding of the theory and practice of kuṇḍalinī-yoga, and for connecting with one of its chakra systems. Kubjikā is a goddess at once fierce and compassionate; for anyone inspired by the wisdom of the divine feminine, studying even a portion of this text is a rare opportunity."
    ]
  },
  "teachers": [JACOB],
  "includes": [
    "5 experiential sessions (study + meditation)",
    "PDF study guide",
    "Daily reflection prompts",
    "Lifetime access, at your own pace"
  ],
  "value": "$149",
  "faq": [
    [
      "Do I need experience with the chakras or meditation?",
      "No. Each day begins with study and moves into a guided visualization, so newcomers and experienced practitioners can both follow along."
    ],
    [
      "How does the on-demand format work?",
      "The five sessions were recorded live. Take one a day for five days, or go at whatever pace suits you; access does not expire."
    ]
  ],
  "close": [
    "",
    "Ground. Flow. Enflame. Inspire. Expand.",
    "Five days with the elements and an ancient chakra system."
  ],
  "tiers": tiersFor(47, 97)
};

export default async function Page() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return <CourseLP c={COURSE} checkout={checkout} />;
}
