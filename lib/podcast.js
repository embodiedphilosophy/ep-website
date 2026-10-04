const placeholder = [
  { num: '214', title: 'On Kuṇḍalinī, Embodiment & the Subtle Body', guest: 'with Dr. Christopher Wallis', duration: '1:03:52', url: '#' },
  { num: '213', title: 'The Ethics of Loving-Kindness', guest: 'with Sharon Salzberg', duration: '58 min', url: '#' },
  { num: '212', title: 'What the Yoga Sūtras Actually Say', guest: 'with Edwin Bryant', duration: '1h 12m', url: '#' },
  { num: '211', title: 'Grief, Ritual & the Sacred', guest: 'with Francis Weller', duration: '1h 04m', url: '#' },
  { num: '210', title: 'Tantra Beyond the Headlines', guest: 'with Hareesh Wallis', duration: '1h 09m', url: '#' },
];

const tag = (xml, t) => {
  const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
};

export async function getEpisodes(limit = 5) {
  const url = process.env.CHITHEADS_RSS_URL;
  if (!url) return placeholder.slice(0, limit);
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const xml = await res.text();
    const items = xml.split('<item>').slice(1, limit + 1);
    return items.map(it => ({
      num: tag(it, 'itunes:episode'),
      title: tag(it, 'title'),
      guest: '',
      duration: tag(it, 'itunes:duration'),
      url: tag(it, 'link'),
    }));
  } catch (e) {
    console.error('Podcast RSS fetch failed', e);
    return placeholder.slice(0, limit);
  }
}
