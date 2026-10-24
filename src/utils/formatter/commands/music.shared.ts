import { Markup } from 'detritus-client/lib/utils';

import { RestResponsesRaw } from '../../../api/types';
import { displayDetails, displayDetailsLine, formatTime } from '../../../utils';


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

// where the player is now, from a `VoiceNode.getPlayer` fetched at `fetchedAt` (paginator pages get shown well after
// it was fetched, so a playing track's position keeps moving from it), never past the track's end
export function musicPlayerPosition(player: any, fetchedAt: number, duration: number): number {
  if (!player) {
    return 0;
  }
  const elapsed = (player.paused) ? 0 : Date.now() - fetchedAt;
  return Math.max(Math.min(player.position + elapsed, duration), 0);
}

const PROGRESS_BAR_LENGTH = 12;

// `1:23` ▬▬▬🔘▬▬▬▬▬▬▬▬ `5:20`
export function musicProgressBar(position: number, duration: number): string {
  const ratio = (duration) ? Math.min(position / duration, 1) : 0;
  const knob = Math.round(ratio * (PROGRESS_BAR_LENGTH - 1));
  const bar = '▬'.repeat(knob) + '🔘' + '▬'.repeat(PROGRESS_BAR_LENGTH - 1 - knob);
  return `${Markup.codestring(formatTime(position))} ${bar} ${Markup.codestring(formatTime(duration))}`;
}

// what's playing in `music queue` and `music info`: its progress bar, then small details (paused, who requested it...)
export function musicNowPlaying(
  item: RestResponsesRaw.GuildMusicQueueItem,
  player: any,
  fetchedAt: number,
  details: Array<null | string>,
): string {
  const duration = (item.track) ? item.track.duration : 0;
  return displayDetails([
    (duration) ? musicProgressBar(musicPlayerPosition(player, fetchedAt, duration), duration) : null,
    displayDetailsLine(details, true),
  ]);
}
