import { Command, Interaction, Structures } from 'detritus-client';

import { deleteGuildMusicQueue } from '../../../api';
import { displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'music.queue.remove.all';

export interface CommandArgs {
  // only this user's queued tracks
  from?: null | Structures.Member | Structures.User,
}

export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { language, translate } = await getTranslator(context);

  if (!context.guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const { deleted } = await deleteGuildMusicQueue(context, context.guildId, {userId: (args.from) ? args.from.id : undefined});
  return displayReply(context, {description: translate('music_queue_remove.removed', {count: deleted.toLocaleString(language)})});
}
