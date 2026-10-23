import { Command, Interaction } from 'detritus-client';

import { deleteGuildMusicQueue, fetchGuildMusic } from '../../../api';
import { displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'music.queue.remove';

export interface CommandArgs {
  // starting at 1, like the queue shows them
  positions: Array<number>,
}

export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { language, translate } = await getTranslator(context);

  if (!context.guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  // positions to ids, the api removes by id so a queue that changed in between doesn't remove the wrong ones
  const music = await fetchGuildMusic(context, context.guildId);
  const itemIds = music.queue.filter((item) => args.positions.includes(item.position)).map((item) => item.id);
  if (!itemIds.length) {
    return displayReply(context, {description: translate('music_queue_remove.no_tracks_at_positions')});
  }
  const { deleted } = await deleteGuildMusicQueue(context, context.guildId, {itemIds});
  return displayReply(context, {description: translate('music_queue_remove.removed', {count: deleted.toLocaleString(language)})});
}
