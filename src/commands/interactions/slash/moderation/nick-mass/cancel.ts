import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import ServerExecutionsStore from '../../../../../stores/serverexecutions';
import { I18n, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'cancel';

export class ModerationNickMassCancelCommand extends BaseInteractionCommandOption {
  description = 'Cancel an ongoing mass nickname change';
  descriptionLocalizations = I18n.localizations('commands.moderation.nick_mass.cancel.description');
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.nick_mass.cancel.name');

  constructor() {
    super({
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Interaction.InteractionContext) {
    const isExecuting = ServerExecutionsStore.getOrCreate(context.guildId!);
    if (isExecuting.nick) {
      isExecuting.nick = false;
      return editOrReply(context, 'Canceled mass nickname changes');
    }
    return editOrReply(context, 'Mass nickname isn\'t ongoing right now');
  }
}
