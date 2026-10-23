import { Markup } from 'detritus-client/lib/utils';

import { RestResponsesRaw } from '../../../api/types';
import { displayDetailsLine } from '../../../utils';


// a link's file name, from its path (the converted file is always `music.ogg`), its host when the path has none
export function musicItemFileName(item: RestResponsesRaw.GuildMusicQueueItem): string {
  try {
    const url = new URL(item.url);
    const segment = url.pathname.split('/').filter(Boolean).pop();
    let name = url.hostname;
    if (segment) {
      try {
        name = decodeURIComponent(segment);
      } catch {
        name = segment;
      }
    }
    return name.slice(0, 100);
  } catch {
    return item.url.slice(0, 100);
  }
}

// `artist - title`, or a link's file name in a codestring (no markdown from it) linking to it
export function musicItemTitle(item: RestResponsesRaw.GuildMusicQueueItem): string {
  if (item.source === 'url' || !item.track) {
    return Markup.url(Markup.codestring(musicItemFileName(item)), `<${item.url}>`);
  }
  const { artist, title } = item.track;
  return Markup.escape.all((artist) ? `${artist} - ${title}` : title);
}

export function musicItemLine(item: RestResponsesRaw.GuildMusicQueueItem, prefix: string, time: null | string): string {
  return displayDetailsLine([`${prefix} ${musicItemTitle(item)}`, time && Markup.codestring(time), `<@${item.user_id}>`]);
}
