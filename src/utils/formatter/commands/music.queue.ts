import { Command, Interaction } from 'detritus-client';

import { fetchGuildMusic } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { DisplayPayload, Paginator, chunkArray, displayDetails, displayDetailsLine, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { musicItemTitle, musicNowPlaying } from './music.shared';


export const RESULTS_PER_PAGE = 10;

export const COMMAND_ID = 'music.queue';

export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { language, translate } = await getTranslator(context);

  if (!context.guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const music = await fetchGuildMusic(context, context.guildId);
  if (!music.current && !music.queue.length) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  const current = music.current;
  const player = (current) ? await VoiceNode.getPlayer(context.guildId) : null;
  const fetchedAt = Date.now();

  // links that haven't been converted yet have no duration, so the total is at least this long
  const queueDuration = music.queue.reduce((total, item) => total + ((item.track) ? item.track.duration : 0), 0);
  const queueDurationText = formatTime(queueDuration) + ((music.queue.some((item) => !item.track)) ? '+' : '');

  const pages = chunkArray<RestResponsesRaw.GuildMusicQueueItem>(music.queue, RESULTS_PER_PAGE);
  const pageLimit = Math.max(pages.length, 1);
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (pageNumber) => {
      const payload: DisplayPayload = {title: translate('music_queue.title')};

      // what's playing stays on top of every page
      let nowPlaying: null | string = null;
      if (current) {
        nowPlaying = displayDetails([
          `**${musicItemTitle(current)}**`,
          musicNowPlaying(current, player, fetchedAt, [
            (player && player.paused) ? translate('music_info.paused') : null,
            translate('music_queue.requested_by', {user: `<@${current.user_id}>`}),
          ]),
        ]);
        payload.thumbnail = (current.track && current.track.thumbnail) || null;
      }

      const items = pages[pageNumber - 1] || [];
      const upNext = (items.length) ? items.map((item) => displayDetails([
        `\`${item.position}.\` ${musicItemTitle(item)}`,
        displayDetailsLine([(item.track) ? formatTime(item.track.duration) : null, `<@${item.user_id}>`], true),
      ])) : [translate('music_queue.empty')];

      payload.description = [
        nowPlaying,
        displayDetails([`**${translate('music_queue.up_next')}**`, ...upNext]),
      ].filter(Boolean).join('\n\n');

      payload.footer = displayDetailsLine([
        (pageLimit !== 1) ? translate('common.page_of', {page: pageNumber, total: pageLimit}) : null,
        (music.queue.length) ? translate('music_queue.queued', {count: music.queue.length.toLocaleString(language)}) : null,
        (music.queue.length) ? translate('music_queue.total', {duration: queueDurationText}) : null,
      ]);

      return {display: payload};
    },
  });
  return await paginator.start();
}
