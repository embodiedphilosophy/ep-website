import CourseLP, { JACOB, tiersFor } from '@/components/CourseLP';
import { getSite } from '@/lib/content';
import lp from './lp';

export const revalidate = 300;
export const metadata = {
  title: "Śiva Sūtras: Opening to Absolute Consciousness — Pay What You Can — Embodied Philosophy",
  description: "A four-module on-demand course with Jacob Kyle on the Śiva Sūtras, the founding text of Kashmir Śaivism, plus three bonus lectures. Pay what you can.",
  openGraph: { title: "Śiva Sūtras: Opening to Absolute Consciousness", description: "A four-module on-demand course with Jacob Kyle on the Śiva Sūtras, the founding text of Kashmir Śaivism, plus three bonus lectures. Pay what you can.", images: ["https://cdn.lugc.link/f82b3fdb-a9b8-4833-8745-e0417944c5ab/-/preview/1200x1200/-/format/png/"] },
};

const COURSE = {
  "title": "Śiva Sūtras",
  "lede": "Opening to Absolute Consciousness. A four-module course on the founding text of Kashmir Śaivism, and a view of reality that makes contemplative practice make sense.",
  "facts": "4 modules · 3 bonus lectures · start any time",
  "hero": "https://cdn.lugc.link/f82b3fdb-a9b8-4833-8745-e0417944c5ab/-/preview/1000x1000/-/format/auto/",
  "heroAlt": "A bronze Śiva Naṭarāja dancing within a ring of flames",
  "frame": "pine",
  "stat": [
    "77",
    "Sūtras revealed to Vasugupta"
  ],
  "intro": [
    "The text broadly considered the founding scripture of Kashmir Śaivism is the <i>Śiva Sūtras</i>. Composed by Vasugupta and regarded by the tradition as a “revealed” text, or <i>āgama</i>, it is one of the great foundational texts of yoga philosophy.",
    "This course is for modern practitioners looking for a context of knowledge that situates the experience of individuality within a larger picture of reality. The <i>Śiva Sūtras</i> offer an inspiring account of how to cultivate meaning in this lifetime, one that resists being reduced either to religious doctrine or to the cosmic meaninglessness of a relativistic worldview."
  ],
  "ask": "From fragmentation to integration: forge a connection between the microcosm and the macrocosm.",
  "outcomesTitle": "A view of reality that makes practice make sense",
  "outcomes": [
    [
      "Study the founding text",
      "Explore the Śiva Sūtras as a foundational text of yoga philosophy, and why it may be the most central text of all."
    ],
    [
      "Learn the cosmology",
      "How Reality organizes itself in the emanationist cosmology of Śaiva Tantra, compared with other accounts of how reality works."
    ],
    [
      "Meet the philosophers",
      "The key non-dual thinkers, where they overlapped and diverged, and how the Tantric traditions relate to the Pratyabhijñā."
    ],
    [
      "Practice the yoga",
      "The central yoga practices of the tradition behind the Sūtras: mantra recitation and meditation."
    ],
    [
      "Bring it home",
      "How non-dual Tantric teaching applies to modern householder life."
    ],
    [
      "Begin memorizing",
      "Recite the Śiva Sūtras over two weeks and begin carrying them with you in practice."
    ]
  ],
  "modulesTitle": "Four modules through the third chapter",
  "modulesLink": "See the four modules",
  "modules": [
    [
      "Module 1",
      "The Metaphysics of the Śiva Sūtras",
      "The non-dual philosophy of Kashmir Śaivism and its fundamental principles: the 36 tattvas, and the conception of mind (citta) as the “I-maker” (ahaṃkāra), the pre-egoic awareness space (buddhi), and the mind that meets the world (manas). We begin with the early verses of the third chapter."
    ],
    [
      "Module 2",
      "The Cosmic Dance",
      "Reality as the “dancer” through the image of Śiva as Naṭarāja. How the Sūtras’ practices cultivate the experience of oneself as a refined aesthete (sahṛdaya), the four esoteric practices of dissolution that correspond to the limbs of aṣṭāṅga yoga, and the so-called yogic superpowers."
    ],
    [
      "Module 3",
      "Reality as the Word",
      "The four levels of the Word and the methodology of “melting” particular to the Tantric path. The highest Word is the vibratory fabric of Reality itself; our speech is its contraction. Speech, mantra and vibration as gateways to Tantric fulfilment."
    ],
    [
      "Module 4",
      "Illusion & the Cloaks that Bind Us",
      "The kañcukas that occlude our understanding of the ultimate, and the three malas that arise from the sense of being nothing more than an individual. Māyā, which in the Śaiva-Śākta tradition is not unreal but an expression of śakti, the power of Consciousness."
    ]
  ],
  "band": "https://cdn.lugc.link/28938c4a-7952-4e2c-9488-b1d8992f2aa7/-/preview/1600x1600/-/format/auto/",
  "bonusTitle": "Three more lectures on Tantra and Śiva",
  "bonus": [
    [
      "The Promise of Tantra",
      "Pandit Rajmani Tigunait",
      "Tantra demolishes the wall between mundane and spiritual experience. On the firm foundation of unitary consciousness, its practices offer both bhoga (pleasure) and mokṣa (liberation), here and now."
    ],
    [
      "The Pathway to Freedom",
      "Swami Khecaranatha",
      "The non-dual understanding of kuṇḍalinī as both the individuated expression of the Divine and the means to liberation, and the dynamic relationship between Consciousness and energy at the heart of Tantric practice."
    ],
    [
      "The Glance of Shiva",
      "Mary Reilly Nichols",
      "Mary’s personal encounters with Śiva over 40 years, woven with myths, poet-saints and scripture, and how Śiva symbolism holds Tantric keys of liberation for seekers of every background."
    ]
  ],
  "teachers": [JACOB],
  "includes": [
    "4 pre-recorded modules with Jacob Kyle",
    "Mantra recitation and meditation practice",
    "Bonus: The Promise of Tantra, with Pandit Rajmani Tigunait",
    "Bonus: The Pathway to Freedom, with Swami Khecaranatha",
    "Bonus: The Glance of Shiva, with Mary Reilly Nichols",
    "Lifetime access, at your own pace"
  ],
  "value": "$149",
  "faq": [
    [
      "Do I need to know Sanskrit or Kashmir Śaivism?",
      "No. Every Sanskrit term is translated and explained, and the course builds the philosophy from the ground up. Longtime students will find plenty of depth."
    ],
    [
      "How does the on-demand format work?",
      "You get immediate access to all four modules and the three bonus lectures. Watch at your own pace; there are no live sessions and access does not expire."
    ]
  ],
  "close": [
    "śivo ’ham",
    "Open to absolute consciousness.",
    "Four modules on the founding text of Kashmir Śaivism."
  ],
  "tiers": tiersFor(47, 97)
};

export default async function Page() {
  const site = await getSite();
  const checkout = site.links[lp.checkoutKey] || lp.checkout;
  return <CourseLP c={COURSE} checkout={checkout} />;
}
