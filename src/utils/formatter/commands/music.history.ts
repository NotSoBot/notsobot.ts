import { Command, Interaction } from 'detritus-client';

import { fetchGuildMusicHistory } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { DisplayPayload, Paginator, chunkArray, displayDetails, displayDetailsLine, displayReply, formatTime } from '../../../utils';
import { getTranslator } from '../../i18n';

import { musicItemTitle } from './music.shared';


// tracks per page
const RESULTS_PER_PAGE = 10;

export const COMMAND_ID = 'music.history';

// what the server's music played, newest first (the api keeps the last 100): who queued each one, when it played and how
// many times it looped
export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { language, translate } = await getTranslator(context);

  const guildId = context.guildId;
  const items = (guildId) ? (await fetchGuildMusicHistory(context, guildId)).items : [];
  if (!items.length) {
    return displayReply(context, {description: translate('music_history.empty')});
  }

  const entryText = (item: RestResponsesRaw.GuildMusicHistoryItem, index: number): string => {
    const duration = (item.track) ? item.track.duration : 0;
    return displayDetails([
      `\`${index + 1}.\` ${musicItemTitle(item)}`,
      displayDetailsLine([
        (duration) ? formatTime(duration) : null,
        // the track loop: how many times and about how long, the last play could have been skipped partway
        (1 < item.plays) ? translate('music_history.looped', {
          count: item.plays.toLocaleString(language),
          duration: (duration) ? formatTime(duration * item.plays) : '?',
        }) : null,
        `<@${item.user_id}>`,
        `<t:${Math.floor(item.played / 1000)}:R>`,
      ], true),
    ]);
  };

  const pages = chunkArray(items.map(entryText), RESULTS_PER_PAGE);
  const pageDisplay = (pageNumber: number): DisplayPayload => {
    return {
      description: (pages[pageNumber - 1] || []).join('\n'),
      footer: (pages.length !== 1) ? translate('common.page_of', {page: pageNumber, total: pages.length}) : null,
      header: translate('music_history.title'),
    };
  };
  const paginator = new Paginator(context, {
    pageLimit: pages.length,
    onPage: (pageNumber) => ({display: pageDisplay(pageNumber)}),
  });
  return await paginator.start();
}
