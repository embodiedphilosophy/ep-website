// Everything a student reads about the day's five limbs. Editorial content: edit freely, it never touches the
// maths in engine.js. These descriptions are first drafts and will get an editorial pass.
export const TITHI = [
  ['Pratipadā', 'First day of the fortnight. A joyful (nandā) day for fresh intentions.'],
  ['Dvitīyā', 'A day of well-being (bhadrā): steady and supportive.'],
  ['Tṛtīyā', 'A day of victory (jayā), good for effort that needs to win through.'],
  ['Caturthī', 'An empty (riktā) day, sacred to Gaṇeśa. Better for clearing obstacles than beginning.'],
  ['Pañcamī', 'A full (pūrṇā) day, favourable for learning and bringing things to completion.'],
  ['Ṣaṣṭhī', 'A joyful (nandā) day, traditionally linked to Skanda.'],
  ['Saptamī', 'A day of well-being (bhadrā), traditionally linked to the Sun.'],
  ['Aṣṭamī', 'A day of victory (jayā), sacred to the Goddess.'],
  ['Navamī', 'An empty (riktā) day. Good for letting go; not for beginnings.'],
  ['Daśamī', 'A full (pūrṇā) day, auspicious for undertakings.'],
  ['Ekādaśī', 'A joyful (nandā) day, the classic day for fasting and devotion.'],
  ['Dvādaśī', 'A day of well-being (bhadrā); the Ekādaśī fast is broken this morning.'],
  ['Trayodaśī', 'A day of victory (jayā); its evening twilight (pradoṣa) is sacred to Śiva.'],
  ['Caturdaśī', 'An empty (riktā) day, sacred to Śiva.'],
  ['Pūrṇimā', 'Full moon. A day for worship, gratitude and observance.'],
];
export const AMAVASYA = ['Amāvāsyā', 'New moon. A quiet day for ancestors, rest and inward practice.'];

// Sunday first (0), as in JavaScript's getUTCDay
export const VARA = [
  ['Ravivāra', 'Sunday', 'The Sun’s day: vitality, clarity and purpose.'],
  ['Somavāra', 'Monday', 'The Moon’s day: feeling, nourishment and devotion.'],
  ['Maṅgalavāra', 'Tuesday', 'Mars’s day: courage, energy and decisive action.'],
  ['Budhavāra', 'Wednesday', 'Mercury’s day: study, speech and communication.'],
  ['Guruvāra', 'Thursday', 'Jupiter’s day: teachers, wisdom and generosity.'],
  ['Śukravāra', 'Friday', 'Venus’s day: beauty, art, love and pleasure.'],
  ['Śanivāra', 'Saturday', 'Saturn’s day: discipline, patience and service.'],
];

export const NAKSHATRA = [
  ['Aśvinī', '“Horsewoman,” ruled by the Aśvins, the divine physicians. Swift beginnings and healing.'],
  ['Bharaṇī', '“The bearer,” ruled by Yama. Holding, restraint and transformation.'],
  ['Kṛttikā', 'The Pleiades, ruled by Agni. Purifying fire and sharp discernment.'],
  ['Rohiṇī', '“The red one,” ruled by Prajāpati. Growth, fertility and beauty.'],
  ['Mṛgaśiras', '“The deer’s head,” ruled by Soma. Seeking and gentle curiosity.'],
  ['Ārdrā', '“The moist one,” ruled by Rudra. Storm, release and renewal.'],
  ['Punarvasu', '“Good again,” ruled by Aditi. Return and restoration.'],
  ['Puṣya', '“The nourisher,” ruled by Bṛhaspati. Nourishment and wise counsel.'],
  ['Āśleṣā', '“The embrace,” ruled by the serpents. Coiled energy and penetrating insight.'],
  ['Maghā', '“The mighty,” ruled by the ancestors. Lineage and honour.'],
  ['Pūrva Phalgunī', 'Ruled by Bhaga, god of delight. Pleasure, rest and affection.'],
  ['Uttara Phalgunī', 'Ruled by Aryaman, god of friendship. Loyalty and agreements.'],
  ['Hasta', '“The hand,” ruled by Savitṛ. Skill, craft and dexterity.'],
  ['Citrā', '“The brilliant,” ruled by Tvaṣṭṛ, the divine artisan. Making beautiful things.'],
  ['Svātī', '“The independent,” ruled by Vāyu, the wind. Movement and freedom.'],
  ['Viśākhā', '“Two-branched,” ruled by Indra and Agni. Determined pursuit of a goal.'],
  ['Anurādhā', 'Ruled by Mitra, god of friendship. Devotion and cooperation.'],
  ['Jyeṣṭhā', '“The eldest,” ruled by Indra. Protection and responsibility.'],
  ['Mūla', '“The root,” ruled by Nirṛti. Getting to the root of things.'],
  ['Pūrvāṣāḍhā', '“The earlier invincible,” ruled by the Waters. Cleansing, renewal and conviction.'],
  ['Uttarāṣāḍhā', '“The later invincible,” ruled by the All-Gods. Steady, lasting victory.'],
  ['Śravaṇa', '“Hearing,” ruled by Viṣṇu. Listening, learning and receptivity.'],
  ['Dhaniṣṭhā', '“Most wealthy,” ruled by the Vasus. Abundance, rhythm and music.'],
  ['Śatabhiṣaj', '“A hundred healers,” ruled by Varuṇa. Healing and solitude.'],
  ['Pūrva Bhādrapadā', 'Ruled by the One-Footed Goat. Intensity and fiery transformation.'],
  ['Uttara Bhādrapadā', 'Ruled by the Serpent of the Deep. Depth, stillness and wisdom.'],
  ['Revatī', '“The prosperous,” ruled by Pūṣan, guardian of travellers. Safe passage and completion.'],
];

export const YOGA = [
  ['Viṣkambha', '“The bolt.” Things may feel blocked; persist gently.'],
  ['Prīti', '“Affection.” Warmth and goodwill come easily.'],
  ['Āyuṣmān', '“Long life.” Good for health and lasting efforts.'],
  ['Saubhāgya', '“Good fortune.” A favourable, lucky tone.'],
  ['Śobhana', '“Splendour.” Good for celebration and beauty.'],
  ['Atigaṇḍa', '“Great danger.” A tense tone; move carefully.'],
  ['Sukarman', '“Good action.” Favours wholehearted, virtuous effort.'],
  ['Dhṛti', '“Steadfastness.” Good for commitment and endurance.'],
  ['Śūla', '“The spear.” A sharp tone; avoid conflict.'],
  ['Gaṇḍa', '“The knot.” Complications are likely; keep things simple.'],
  ['Vṛddhi', '“Growth.” Good for anything you want to increase.'],
  ['Dhruva', '“Fixed.” Good for foundations and long-term commitments.'],
  ['Vyāghāta', '“The blow.” Friction is likely; choose patience.'],
  ['Harṣaṇa', '“Delight.” A cheerful, buoyant tone.'],
  ['Vajra', '“The thunderbolt.” Forceful and sharp; not for new beginnings.'],
  ['Siddhi', '“Accomplishment.” Efforts tend to succeed.'],
  ['Vyatīpāta', '“Calamity.” Traditionally avoided; good for prayer and charity.'],
  ['Varīyas', '“Excellence.” Comfort and ease.'],
  ['Parigha', '“The iron bar.” Obstacles; finish rather than start.'],
  ['Śiva', '“Auspicious.” Good for worship and practice.'],
  ['Siddha', '“Accomplished.” Favourable for learning and spiritual practice.'],
  ['Sādhya', '“Achievable.” Steady effort pays off.'],
  ['Śubha', '“Auspicious.” A generally favourable tone.'],
  ['Śukla', '“Bright.” Clarity and purity.'],
  ['Brahma', '“The expansive.” Good for study and sacred work.'],
  ['Indra', '“Sovereign.” Good for leadership and responsibility.'],
  ['Vaidhṛti', '“Disunion.” Traditionally avoided for beginnings; stay inward.'],
];

export const KARANA_MOVABLE = [
  ['Bava', 'Strong and stable; good for lasting work.'],
  ['Bālava', 'Gentle; good for study, devotion and care.'],
  ['Kaulava', 'Friendly; good for relationships and connection.'],
  ['Taitila', 'Bright; good for home, craft and comfort.'],
  ['Gara', 'Earthy; good for planting, building and steady work.'],
  ['Vaṇija', 'Trade; good for exchange and negotiation.'],
  ['Viṣṭi', 'Also called Bhadrā. Obstructive: continue what’s begun, don’t start new things.'],
];
export const KARANA_FIXED = {
  0: ['Kiṃstughna', 'Opens the new lunar month; good for worship and fresh starts.'],
  57: ['Śakuni', 'Heavy; better for counsel and remedies than beginnings.'],
  58: ['Catuṣpada', 'Heavy; better for honouring ancestors than beginnings.'],
  59: ['Nāga', 'Heavy and fixed; avoid beginnings.'],
};
export const karanaOf = i => KARANA_FIXED[i] || KARANA_MOVABLE[(i - 1) % 7];
export const tithiOf = i => (i === 29 ? AMAVASYA : TITHI[i % 15]);

// The Moon's sign (sidereal)
export const RASHI = ['Meṣa', 'Vṛṣabha', 'Mithuna', 'Karka', 'Siṃha', 'Kanyā', 'Tulā', 'Vṛścika', 'Dhanu', 'Makara', 'Kumbha', 'Mīna'];
export const RASHI_EN = ['the Ram', 'the Bull', 'the Twins', 'the Crab', 'the Lion', 'the Maiden', 'the Scales', 'the Scorpion', 'the Archer', 'the Sea-Goat', 'the Water-Bearer', 'the Fish'];

// A tithi's name and one line, led by its day in the fortnight
export function tithiText(i) {
  const [name, desc] = tithiOf(i);
  let lead = '';
  if (i < 14) lead = `Day ${i + 1} of the waxing moon. `;
  else if (i > 14 && i < 29) lead = `Day ${i - 14} of the waning moon. `;
  return { name, desc: lead + (i === 28 ? 'An empty (riktā) day, sacred to Śiva: the monthly Śivarātri.' : desc) };
}

// The "How to read this" explainer, shown verbatim in the panel
export const ABOUT = {
  title: 'The day’s five limbs',
  intro: [
    'In the Indian calendar, every day has its own character. It’s described by five “limbs” (<em>pañca</em> means five, <em>aṅga</em> means limb), which together make the <em>pañcāṅga</em>: the almanac traditionally consulted each morning.',
    'It doesn’t predict what will happen to you. It describes the quality of the day, so you can let your practice meet it.',
  ],
  limbsTitle: 'The five limbs',
  limbs: [
    ['Tithi', 'The lunar day: one of 30 steps in the Moon’s cycle from new to full and back again.'],
    ['Vāra', 'The weekday, each one ruled by a planet. Our own weekday names come from the same idea.'],
    ['Nakṣatra', 'The lunar mansion: one of 27 star groups the Moon passes through, each with its own deity and mood.'],
    ['Yoga', 'The combined tone of the Sun and Moon together, one of 27.'],
    ['Karaṇa', 'Half a lunar day. It shows when to begin something and when to hold off.'],
  ],
  readTitle: 'How to read it',
  read: [
    'Start with the tithi and the karaṇa: together they tell you whether the day favours beginnings or carrying on. Let the nakṣatra and yoga colour your intention for the day.',
    'The limbs change at different times, so a day can shift character partway through. Traditionally the day begins at sunrise, so the reading is taken at sunrise where you are.',
    'Indian astronomy uses the star-based (sidereal) zodiac, so the Moon’s sign here may differ from Western listings.',
  ],
};
