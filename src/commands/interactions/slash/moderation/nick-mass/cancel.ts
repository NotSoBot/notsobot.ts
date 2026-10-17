import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import ServerExecutionsStore from '../../../../../stores/serverexecutions';
import { I18n, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'cancel';

export class ModerationNickMassCancelCommand extends BaseInteractionCommandOption {
  description = 'Cancel an ongoing mass nickname change';
  descriptionLocalizations = I18n.localizations('commands.moderation.nick_mass.cancel.description');
  metadata = {
    id: 'moderation.nick.mass.cancel',
  };
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
      return displayReply(context, {description: 'Canceled mass nickname changes'});
    }
    return displayReply(context, {description: 'Mass nickname isn\'t ongoing right now'});
  }
}
