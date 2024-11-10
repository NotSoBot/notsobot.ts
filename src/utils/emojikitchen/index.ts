import { Endpoints } from '../../api';

import { EmojiKitchen } from './constants';

export { EmojiKitchen };



export function codepointsToUrl(value1: string, value2: string): null | string {
  const id = [value1, value2].map((x) => {
    const parts = x.split('-').map((v) => {
      return (v.startsWith('u') ? v : `u${v}`);
    });
    return parts.join('-');
  }).sort().join('_');
  return (EmojiKitchen as any)[id] || null;;
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
