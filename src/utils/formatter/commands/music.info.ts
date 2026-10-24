import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { DisplayPayload, Paginator, displayDetails, displayDetailsLine, displayLinks, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { musicItemFileName, musicNowPlaying } from './music.shared';


export const COMMAND_ID = 'music.info';

export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { language, translate } = await getTranslator(context);

  const guildId = context.guildId;
  const guild = (guildId) ? VoiceNode.guilds.get(guildId) : undefined;
  const music = (guildId && guild) ? await fetchGuildMusic(context, guildId) : null;
  const current = music && music.current;
  if (!guild || !music || !current || !current.track) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  const player = await VoiceNode.getPlayer(guildId!);
  const fetchedAt = Date.now();
  const connected = !!player && player.connected;

  // `artist - title` like `music queue`, a link's file name (its converted title is always `music.ogg`) linking to it
  const itemTitle = (item: RestResponsesRaw.GuildMusicQueueItem): Partial<DisplayPayload> => {
    if (item.source === 'url' || !item.track) {
      return {title: Markup.codestring(musicItemFileName(item)), url: item.url};
    }
    const { artist, title } = item.track;
    return {title: (artist) ? `${artist} - ${title}` : title};
  };
  // a converted link's file on cdn.nsb.gg, and where it's from (an opus.rip track's service page)
  const itemLinks = (item: RestResponsesRaw.GuildMusicQueueItem): string => {
    return displayLinks([['File', item.track && item.track.url], ['Source', /^https?:\/\//.test(item.url) ? item.url : null]]);
  };

  // the first page is what's playing, then a page for each queued item
  const items = [current, ...music.queue];
  const pageLimit = items.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (pageNumber) => {
      const item = items[pageNumber - 1];
      const payload: DisplayPayload = {
        ...itemTitle(item),
        footer: (pageLimit !== 1) ? translate('common.page_of', {page: pageNumber, total: pageLimit}) : null,
        thumbnail: (item.track && item.track.thumbnail) || null,
      };

      const requestedBy = translate('music_queue.requested_by', {user: `<@${item.user_id}>`});
      if (item === current) {
        // the same as what's playing in `music queue`, with where it's playing
        payload.description = displayDetails([
          musicNowPlaying(current, player, fetchedAt, [
            (player && player.paused) ? translate('music_info.paused') : null,
            // disconnected, it's only paused until someone resumes it in their channel
            (!connected && !guild.disconnected) ? translate('music_info.connecting') : null,
            requestedBy,
            (guild.channelId && !guild.disconnected) ? `<#${guild.channelId}>` : null,
            (connected && 0 <= player.ping) ? translate('music_info.ping', {ping: player.ping}) : null,
          ]),
          itemLinks(current),
        ]);
      } else {
        payload.description = displayDetails([
          displayDetailsLine([
            (item.track) ? Markup.codestring(formatTime(item.track.duration)) : null,
            translate('music_info.in_queue', {position: item.position.toLocaleString(language)}),
          ]),
          displayDetailsLine([requestedBy], true),
          itemLinks(item),
        ]);
      }

      return {display: payload};
    },
  });
  return await paginator.start();
}
