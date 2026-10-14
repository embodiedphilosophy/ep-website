import CourseLP, { JACOB, tiersFor } from '@/components/CourseLP';
import { getSite } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: "Subtle Alignment: A Methodology for the Philosophy-Informed Yoga Teacher — Pay What You Can — Embodied Philosophy",
  description: "A 4-hour on-demand workshop for yoga teachers with Jacob Kyle: teach from thematic depth and reclaim yoga’s orientation toward liberation. Pay what you can.",
  openGraph: { title: "Subtle Alignment: A Methodology for the Philosophy-Informed Yoga Teacher", description: "A 4-hour on-demand workshop for yoga teachers with Jacob Kyle: teach from thematic depth and reclaim yoga’s orientation toward liberation. Pay what you can.", images: ["https://cdn.lugc.link/b78d34af-91b9-4d6f-9ea9-46e09e76b85e/-/preview/1200x1200/-/format/png/"] },
};

const COURSE = {
  "eyebrow": "On demand · For yoga teachers · Pay what you can",
  "title": "Subtle Alignment",
  "lede": "A methodology for the philosophy-informed yoga teacher. Reclaim the full depth of what yoga offers: not just stress relief, but liberation.",
  "facts": "4-hour workshop · 8 core themes · start any time",
  "hero": "https://cdn.lugc.link/b78d34af-91b9-4d6f-9ea9-46e09e76b85e/-/preview/1000x1000/-/format/auto/",
  "heroAlt": "A collage of a yogi in a seated pose framed by a golden circle",
  "kind": "workshop",
  "stat": [
    "8",
    "Themes for teaching with depth"
  ],
  "intro": [
    "Yoga teaching methodologies have evolved to prioritize inclusivity, safety and responsiveness to students’ lived experience, bringing important awareness to contemporary classrooms. Yet many of these approaches have also narrowed the vision of yoga, reducing it to a secular practice of emotional healing, identity affirmation or social virtue.",
    "In the process, yoga’s guiding intention as a path of liberation (<i>mokṣa</i>), freedom from conditioned identity, egoic contraction and existential suffering, has often been sidelined. Many pedagogies teach us to manage symptoms, but not to inquire into the roots of perception or the nature of Self.",
    "<b>Subtle Liberation-Based Teaching</b> (SLBT) integrates inclusivity, discernment and depth without compromising yoga’s highest purpose. It invites teachers into a refined relationship with language, alignment, presence and inner freedom: what we call subtle alignment. This workshop is a portion of Embodied Philosophy’s yoga teacher training, available on its own."
  ],
  "ask": "Your method is your message.",
  "outcomesTitle": "Teach with depth, clarity and subtlety",
  "outcomes": [
    [
      "See the limits",
      "Recognize how contemporary teaching trends can unconsciously limit yoga’s liberatory potential."
    ],
    [
      "Reframe your classes",
      "Orient around inner freedom rather than identity reinforcement or therapeutic performance."
    ],
    [
      "Refine your cues",
      "Use alignment cues for energetic coherence and self-inquiry, not aesthetic perfection."
    ],
    [
      "Teach philosophy as experience",
      "Translate key teachings into direct experience through sequencing, language and presence."
    ],
    [
      "Hold space wisely",
      "Develop consent, support and relational teaching without scripts, and hold emotional intensity without turning practice into therapy."
    ],
    [
      "Embody mokṣa",
      "Make liberation the felt orientation of your teaching, not just an idea."
    ]
  ],
  "modulesTitle": "Eight core themes",
  "modulesEyebrow": "What we explore",
  "modulesLink": "See the eight themes",
  "modules": [
    [
      "Theme 1",
      "From Spiritual Bypassing to Bypassing Spirit",
      "How teaching can fall into extremes: avoiding hard truths under “love and light,” or becoming so psychological or biomechanical that the sacred is edited out. A balanced methodology honors depth without dogma."
    ],
    [
      "Theme 2",
      "The Powers & Pitfalls of a “Trauma-Informed” Approach",
      "Sensitivity to trauma is vital, but a standardized framework can reduce students to diagnostic categories. How to be trauma-respectful: grounded in presence, discernment and nuance."
    ],
    [
      "Theme 3",
      "Philosophy in Class without Preaching",
      "Weave philosophy into class as a living inquiry, through metaphor, story, language and timing, so the teachings are felt rather than merely heard."
    ],
    [
      "Theme 4",
      "From “Authentic Yoga” to Subtle Alignment",
      "Rather than a romanticized, singular “authentic” yoga, subtle alignment in body, breath, intention and relationship offers a more generative model that honors multiplicity and context."
    ],
    [
      "Theme 5",
      "A Deeper Kind of Alignment",
      "Clear, effective, inclusive cues that honor both anatomical function and inner experience; aesthetic versus functional alignment; adjustments that empower rather than correct."
    ],
    [
      "Theme 6",
      "Observational Intelligence & Adaptive Teaching",
      "Teaching begins with seeing. Read the room, observe diverse bodies in motion, and respond with options that center student agency and awareness."
    ],
    [
      "Theme 7",
      "The Power of Language",
      "From minimalist directive cueing to poetic, metaphorical guidance: language that lands, resonates and supports embodiment."
    ],
    [
      "Theme 8",
      "Presence & Pedagogical Flow",
      "The subtle artistry of holding space: timing, tone and relational presence. Teaching becomes a meditation in motion."
    ]
  ],
  "deep": {
    "eyebrow": "The method behind the magic",
    "title": "The more insidious appropriation is what we remove",
    "body": [
      "Teaching yoga is far more than guiding bodies through shapes or delivering polished instructions. It is a subtle art that draws on philosophical insight, somatic intelligence, intuitive observation and refined language, in service of the awakening of awareness.",
      "We also offer a reframing of a common critique of modern postural yoga: cultural appropriation. The more insidious form of appropriation is not what one wears or says from another culture, but what one removes: the erasure of yoga’s liberative spirituality. When yoga is stripped of its soteriological depth and reduced to fitness, performance or emotional self-help, it is no longer a living tradition but a borrowed aesthetic.",
      "Whether you’re a new teacher or a seasoned educator, this workshop is an invitation to remember that when your methodology is aligned with yoga’s deeper truths, every class becomes a site of remembrance, inquiry and awakening."
    ],
    "art": [
      "https://cdn.lugc.link/4c064778-137e-40e9-95ce-0184a65991c5/-/preview/900x900/-/format/auto/",
      "Teach not only to soothe and pacify, but to liberate."
    ]
  },
  "teachers": [JACOB],
  "includes": [
    "4-hour lecture and seminar with Jacob Kyle",
    "Eight core themes of Subtle Liberation-Based Teaching",
    "Part of Embodied Philosophy’s yoga teacher training",
    "Lifetime access, at your own pace"
  ],
  "value": "$249",
  "faq": [
    [
      "Is this only for yoga teachers?",
      "It’s written for yoga teachers, educators and facilitators, but any serious practitioner interested in how yoga is taught, and what it is for, will get a great deal from it."
    ],
    [
      "How does the on-demand format work?",
      "You get immediate access to the full recorded workshop. Watch at your own pace; access does not expire."
    ]
  ],
  "close": [
    "mokṣa",
    "Teach not only to soothe, but to liberate.",
    "A half-day workshop on subtle alignment."
  ],
  "tiers": tiersFor(79, 147)
};

export default async function Page() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return <CourseLP c={COURSE} checkout={checkout} />;
}
