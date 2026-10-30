import { ART } from './art';

// Inline SVG from the Cyber Week art set. `suffix` makes the ids unique when the same sticker
// appears twice on a page (textPath references would otherwise collide). `attrs` goes on the <svg>.
export default function Art({ name, suffix = '', attrs = '' }) {
  let svg = ART[name];
  if (!svg) return null;
  if (suffix) {
    for (const id of new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]))) {
      svg = svg.split(`id="${id}"`).join(`id="${id}-${suffix}"`).split(`#${id}`).join(`#${id}-${suffix}`);
    }
  }
  svg = svg.replace('<svg ', `<svg ${attrs} `);
  return <span className="cm-art" dangerouslySetInnerHTML={{ __html: svg }} />;
}
