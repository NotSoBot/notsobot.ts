import { Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { RestResponsesRaw } from '../../../api/types';
import { MusicLoopModes } from '../../../constants';
import { DisplayPayload, displayDetails, displayDetailsLine, displayLinks, formatTime } from '../../../utils';
import { Translator } from '../../i18n';


// the api's queue limit, the most positions a range can name
const MAX_QUEUE_POSITION = 500;

// removing other people's tracks and the queue's settings (taking turns): manage server, or a role with "notsomusic" in
// its name (anyone can remove what they queued)
export function canManageMusic(member?: null | Structures.Member): boolean {
  if (!member) {
    return false;
  }
  if (member.isOwner || member.can(Permissions.MANAGE_GUILD)) {
    return true;
  }
  for (let [, role] of member.roles) {
    if (role && role.name.toLowerCase().includes('notsomusic')) {
      return true;
    }
  }
  return false;
}

// `2`, `1 3 5`, `1,3,5` or ranges like `5-20`, anything that isn't a positive number (or a range of them) is left out
export function musicQueuePositions(value: string): Array<number> {
  const positions = new Set<number>();
  for (let part of value.split(/[\s,]+/).filter(Boolean)) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = Math.max(Math.min(parseInt(range[1]), parseInt(range[2])), 1);
      const end = Math.min(Math.max(parseInt(range[1]), parseInt(range[2])), MAX_QUEUE_POSITION);
      for (let x = start; x <= end; x++) {
        positions.add(x);
      }
    } else {
      const x = parseInt(part);
      if (Number.isSafeInteger(x) && 0 < x) {
        positions.add(x);
      }
    }
  }
  return Array.from(positions);
}

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

// a response's title: `artist - title` linking to its service page, a link's file name (its converted title is always
// `music.ogg`) linking to it
export function musicItemDisplayTitle(item: RestResponsesRaw.GuildMusicQueueItem): Partial<DisplayPayload> {
  const url = (/^https?:\/\//.test(item.url)) ? item.url : null;
  if (item.source === 'url' || !item.track) {
    return {title: Markup.codestring(musicItemFileName(item)), url};
  }
  const { artist, title } = item.track;
  return {title: (artist) ? `${artist} - ${title}` : title, url};
}

// where an item shows in the queue: what's playing is #1, the next one #2. The api's positions start the queue at 1 with
// the playing item at 0, so without one playing the queue starts at #1
export function musicItemPosition(music: {current: null | RestResponsesRaw.GuildMusicQueueItem}, item: RestResponsesRaw.GuildMusicQueueItem): number {
  return (music.current) ? item.position + 1 : item.position;
}

// the queued items at the positions someone typed (as shown, #1 is what's playing and isn't in the queue)
export function musicItemsAtPositions(music: RestResponsesRaw.FetchGuildMusic, positions: Array<number>): Array<RestResponsesRaw.GuildMusicQueueItem> {
  return music.queue.filter((item) => positions.includes(musicItemPosition(music, item)));
}

// the queue only says when a track was queued once it's been there this long (most are minutes old)
export const MUSIC_QUEUED_AT_AFTER = 60 * 60 * 1000;

// when it was queued, a discord timestamp reading `3 days ago` (in their language, it stays up to date). Only once it's
// been queued longer than `after` (milliseconds)
export function musicItemQueuedAt(item: RestResponsesRaw.GuildMusicQueueItem, after: number = 0): null | string {
  if (!item.created || Date.now() - item.created < after) {
    return null;
  }
  return `<t:${Math.floor(item.created / 1000)}:R>`;
}

// a converted link's file on cdn.nsb.gg (the api only gives a link's, once it's converted). Where it's from is the
// title's link already
export function musicItemLinks(item: RestResponsesRaw.GuildMusicQueueItem): string {
  return displayLinks([['File', item.track && item.track.url]]);
}

// `from {name}` for a track queued with an album/playlist, nothing otherwise (the name is only a label, `batch_id` tells
// them apart)
export function musicItemBatchText(translate: Translator['translate'], item: RestResponsesRaw.GuildMusicQueueItem): null | string {
  if (!item.batch_id) {
    return null;
  }
  return translate('music_queue.from_batch', {name: Markup.escape.all(item.batch_name || translate('music_play.collection'))});
}

// the queue's loop as a detail, nothing when it's off
export function musicLoopText(translate: Translator['translate'], loop?: MusicLoopModes | null): null | string {
  switch (loop) {
    case MusicLoopModes.TRACK: return translate('music_loop.track');
    case MusicLoopModes.QUEUE: return translate('music_loop.queue');
  }
  return null;
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
