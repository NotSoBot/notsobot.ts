import { Command, Interaction } from 'detritus-client';

import { editGuildMusic, fetchGuildMusic } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { displayDetails, displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { canManageMusic } from './music.shared';


export const COMMAND_ID = 'music.fair';

export interface CommandArgs {
  // null shows it
  enabled: boolean | null,
}

// a server setting (off by default): the queue takes turns between who queued instead of going in the order it was
// queued. Changing it needs manage server or a notsomusic role, like removing other people's tracks
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  let enabled: boolean;
  if (args.enabled === null) {
    enabled = (await fetchGuildMusic(context, guildId)).fair_queue;
  } else {
    if (!canManageMusic(context.member)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.no_permission')}`});
    }
    enabled = (await editGuildMusic(context, guildId, {fairQueue: args.enabled})).fair_queue;
  }
  return displayReply(context, {
    description: displayDetails([
      translate((enabled) ? 'music_fair.on' : 'music_fair.off'),
      (enabled) ? `-# ${translate('music_fair.explanation')}` : null,
    ]),
  });
}
