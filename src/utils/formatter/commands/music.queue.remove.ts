import { Command, Interaction } from 'detritus-client';

import { deleteGuildMusicQueue, fetchGuildMusic } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { canManageOthersMusic, musicItemsAtPositions } from './music.shared';

export { musicQueuePositions } from './music.shared';


export const COMMAND_ID = 'music.queue.remove';

export interface CommandArgs {
  // starting at 1, like the queue shows them
  positions: Array<number>,
}

// anyone can remove what they queued, other people's need manage server or the dj role with dj mode on
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { language, translate } = await getTranslator(context);

  if (!context.guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  // positions (as shown, #1 is what's playing) to ids, the api removes by id so a queue that changed in between doesn't
  // remove the wrong ones
  const music = await fetchGuildMusic(context, context.guildId);
  const items = musicItemsAtPositions(music, args.positions);
  if (!items.length) {
    return displayReply(context, {description: translate('music_queue_remove.no_tracks_at_positions')});
  }
  if (items.some((item) => item.user_id !== context.userId) && !canManageOthersMusic(context.member, music)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_queue_remove.not_yours')}`});
  }
  const { deleted } = await deleteGuildMusicQueue(context, context.guildId, {itemIds: items.map((item) => item.id)});
  return displayReply(context, {description: translate('music_queue_remove.removed', {count: deleted.toLocaleString(language)})});
}
