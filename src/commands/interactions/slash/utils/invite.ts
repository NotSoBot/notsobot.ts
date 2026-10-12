import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'invite';

export class UtilsInviteCommand extends BaseInteractionCommandOption {
  description = 'Get the link to invite NotSoBot';
  descriptionLocalizations = I18n.localizations('commands.utils.invite.description');
  metadata = {
    id: Formatter.Commands.UtilsInvite.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.utils.invite.name');

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.UtilsInvite.createMessage(context);
  }
}
