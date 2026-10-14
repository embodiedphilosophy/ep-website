import CourseLP, { JACOB, tiersFor } from '@/components/CourseLP';
import { getSite } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: "The Inner Saboteur: A Tantric Approach to Shadow Work — Pay What You Can — Embodied Philosophy",
  description: "A 2.5-hour on-demand workshop with Jacob Kyle reimagining shadow work through Pratyabhijñā philosophy, with a portable three-movement practice from the Trika lineage. Pay what you can.",
  openGraph: { title: "The Inner Saboteur: A Tantric Approach to Shadow Work", description: "A 2.5-hour on-demand workshop with Jacob Kyle reimagining shadow work through Pratyabhijñā philosophy, with a portable three-movement practice from the Trika lineage. Pay what you can.", images: ["https://cdn.lugc.link/fd937ecc-d9ca-422e-ad93-07fcdc42ab34/-/preview/1200x1200/-/format/png/"] },
};

const COURSE = {
  "title": "The Inner Saboteur",
  "lede": "A Tantric approach to shadow work. Reimagine the inner critic through the lens of Pratyabhijñā, and leave with a portable three-movement practice from the Trika lineage.",
  "facts": "2.5-hour workshop · a practice to keep · start any time",
  "hero": "https://cdn.lugc.link/fd937ecc-d9ca-422e-ad93-07fcdc42ab34/-/preview/1000x1000/-/format/auto/",
  "heroAlt": "Hilma af Klint, Group IX/SUW, The Swan, No. 9",
  "frame": "terra",
  "kind": "workshop",
  "stat": [
    "3",
    "Movements of a practice you’ll keep"
  ],
  "intro": [
    "The “inner critic” is a familiar figure: the part that withholds, defers, betrays the work just as it nears completion. The inherited frame for working with it is depth psychology, inspired by Carl Jung, in which shadow is disowned material to be recovered, heard and metabolized back into a more whole self. It is a powerful frame, and it has done real work for contemplative communities.",
    "But it carries an ontology the Recognition tradition does not share: a fragmented self whose scattered pieces must be reassembled. Pratyabhijñā, the philosophy of recognition developed by Utpaladeva and Abhinavagupta in 10th–11th century Kashmir, begins elsewhere. There is no fragmentation to repair, because the consciousness showing up as the saboteur is the same consciousness doing the looking."
  ],
  "ask": "The saboteur is not a part of you. It is one of the shapes the whole of you is currently performing.",
  "outcomesTitle": "Beyond integration: a Tantric reframing of the shadow",
  "outcomes": [
    [
      "A different self",
      "Why the Pratyabhijñā tradition rejects the fragmentation model of self behind most contemporary shadow work."
    ],
    [
      "Saṅkoca",
      "The Trika understanding of contraction, and how the saboteur arises as a shape of your own śakti."
    ],
    [
      "Anusandhāna",
      "Continuous reflective tracing: the cognitive operation by which recognition occurs."
    ],
    [
      "Bhairavī-mudrā",
      "The classical practice of outward gaze and inward attention, applied to disowned material."
    ],
    [
      "Recognition, not integration",
      "How to tell the two apart, and why the difference matters in practice."
    ],
    [
      "A practice to keep",
      "A five-to-seven-minute, three-movement practice from the Vijñāna Bhairava and the wider Trika lineage."
    ]
  ],
  "modulesTitle": "The workshop agenda",
  "modulesEyebrow": "Workshop agenda",
  "modulesLink": "See the agenda",
  "modules": [
    [
      "Opening frame",
      "What Kind of Shadow Work Is This?",
      "What the Pratyabhijñā tradition offers, and does not offer, to contemporary work with a fragmented self."
    ],
    [
      "Lecture 1 · 45 min",
      "The Ontology of Recognition",
      "Utpaladeva and Abhinavagupta on cit, vimarśa and śakti, and why the saboteur is already a form of self-aware consciousness."
    ],
    [
      "Lecture 2 · 45 min",
      "Saṅkoca & the Shapes of Contraction",
      "How the same awareness that recognizes itself also performs the operation of self-limitation, and what this means for the figures that arise from it."
    ],
    [
      "Practice · 30 min",
      "A Three-Movement Sequence from the Trika Lineage",
      "Sthāna-vicāra (localization), bhairavī-mudrā (outward gaze, inward attention) and anusandhāna (the recognition itself), with debrief between each."
    ],
    [
      "Closing · 30 min",
      "Recognition in Daily Life",
      "Q&A and conversation: carrying the practice into the moments when the saboteur arises."
    ]
  ],
  "deep": {
    "eyebrow": "A practice of recognition",
    "title": "Recognize what was never fragmented",
    "body": [
      "This is not a workshop on managing the saboteur, nor a substitute for therapy. The Pratyabhijñā tradition holds that there is no part of you that is not already, in some mode, knowing itself, and that the work is not to bring awareness to the contracted figure but to recognize the awareness of it as always already itself.",
      "So how does this help with what arrives as the “inner saboteur”? You’ll leave with a five-to-seven-minute practice for when a saboteur episode arises in daily life: not a technique for managing it, but a practice of recognizing what the saboteur already is, and what it has to say beneath the noise."
    ],
    "art": [
      "https://cdn.lugc.link/4c5b665a-ebff-4bd8-bbdc-42868fe7f7d9/-/preview/900x900/-/format/auto/",
      "Odilon Redon, The Crying Spider"
    ]
  },
  "teachers": [JACOB],
  "includes": [
    "2.5-hour workshop with Jacob Kyle",
    "Two lectures on Pratyabhijñā and saṅkoca",
    "A guided three-movement Trika practice",
    "Q&A and conversation",
    "Lifetime access, at your own pace"
  ],
  "value": "$249",
  "faq": [
    [
      "Is this therapy?",
      "No. It is a philosophical and contemplative workshop, not a substitute for therapy. It offers a different frame for shadow work and a practice drawn from the tradition itself."
    ],
    [
      "Do I need to know Kashmir Śaivism?",
      "No. The workshop introduces the key ideas of Pratyabhijñā from the ground up, and every Sanskrit term is explained."
    ],
    [
      "How does the on-demand format work?",
      "You get immediate access to the full recorded workshop. Watch at your own pace; access does not expire."
    ]
  ],
  "close": [
    "pratyabhijñā",
    "Recognize what was never fragmented.",
    "A Tantric approach to shadow work."
  ],
  "tiers": tiersFor(79, 147)
};

export default async function Page() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return <CourseLP c={COURSE} checkout={checkout} />;
}
