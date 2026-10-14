import { Endpoints } from '../../api';

import { EmojiKitchen } from './constants';

export { EmojiKitchen };



// the kitchen keys keep fe0f (`u2764-ufe0f_u2615`) but twemoji urls drop it unless the emoji has a zwj, so ~8.6k combos
// never matched. both sides get compared without fe0f instead (no two keys collide once it's removed)
function normalizeCodepoint(value: string): string {
  return value.toLowerCase().split('-').map((v) => {
    return (v.startsWith('u') ? v : `u${v}`);
  }).filter((v) => v !== 'ufe0f').join('-');
}

function normalizeId(value1: string, value2: string): string {
  return [value1, value2].map(normalizeCodepoint).sort().join('_');
}

let normalizedKitchen: Map<string, string> | null = null;

function getNormalizedKitchen(): Map<string, string> {
  if (!normalizedKitchen) {
    normalizedKitchen = new Map();
    for (let key in EmojiKitchen) {
      const [ value1, value2 ] = key.split('_');
      normalizedKitchen.set(normalizeId(value1, value2), (EmojiKitchen as any)[key]);
    }
  }
  return normalizedKitchen;
}

export function codepointsToUrl(value1: string, value2: string): null | string {
  return getNormalizedKitchen().get(normalizeId(value1, value2)) || null;
}


export function twemojiUrlToCodepoint(url: string): null | string {
  if (url.startsWith(Endpoints.CUSTOM.TWEMOJI_SVG_BASE)) {
    const parsed = new URL(url);
    const codepointFromParams = parsed.searchParams.get('codepoint');
    if (codepointFromParams && 4 <= codepointFromParams.length) {
      return codepointFromParams;
    }
    return url.split('/').pop()!.split('.').shift()!;
  }
  return null;
}
